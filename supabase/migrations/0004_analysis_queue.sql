-- 0004_analysis_queue.sql
-- Struktur antrean komputasi statistik dan penyimpanan hasil analisis deterministik:
-- analysis_runs (antrean worker), analysis_results (sumber kebenaran angka presisi tinggi),
-- explanations (narasi AI dengan penjaga angka), exports (metadata berkas Word/PDF),
-- serta fungsi antrean aman: claim_next_run, complete_run, fail_run, dan requeue_stuck_runs.

-- 1. Tabel Antrean Analisis (analysis_runs)
-- Mengapa: Mengelola antrean asynchronous komputasi statistik Python tanpa race condition.
CREATE TABLE IF NOT EXISTS public.analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE RESTRICT,
    tests TEXT[] NOT NULL DEFAULT '{}',
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    status run_status_t NOT NULL DEFAULT 'queued',
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    engine_version TEXT NOT NULL DEFAULT '1.0.0',
    error_code TEXT,
    error_message TEXT,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    attempts INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.analysis_runs IS 'Antrean tugas komputasi mesin statistik Python.';
COMMENT ON COLUMN public.analysis_runs.locked_by IS 'Pengenal instance worker yang sedang mengeksekusi analisis.';

-- Indeks khusus performa antrean (FIFO berdasarkan waktu pembuatan saat status queued)
CREATE INDEX IF NOT EXISTS idx_analysis_runs_queue ON public.analysis_runs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_project ON public.analysis_runs(project_id);

DROP TRIGGER IF EXISTS trg_analysis_runs_updated_at ON public.analysis_runs;
CREATE TRIGGER trg_analysis_runs_updated_at
    BEFORE UPDATE ON public.analysis_runs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Analysis Runs
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_runs_select_owner" ON public.analysis_runs;
CREATE POLICY "analysis_runs_select_owner"
    ON public.analysis_runs FOR SELECT
    USING (public.is_project_owner(project_id));

-- Pengguna hanya boleh memasukkan tugas dengan status awal 'queued'
DROP POLICY IF EXISTS "analysis_runs_insert_owner" ON public.analysis_runs;
CREATE POLICY "analysis_runs_insert_owner"
    ON public.analysis_runs FOR INSERT
    WITH CHECK (public.is_project_owner(project_id) AND status = 'queued');

-- Pengguna hanya boleh membatalkan tugas yang belum selesai menjadi 'canceled'
DROP POLICY IF EXISTS "analysis_runs_cancel_owner" ON public.analysis_runs;
CREATE POLICY "analysis_runs_cancel_owner"
    ON public.analysis_runs FOR UPDATE
    USING (public.is_project_owner(project_id) AND status IN ('queued', 'running'))
    WITH CHECK (public.is_project_owner(project_id) AND status = 'canceled');

-- 2. Tabel Hasil Analisis (analysis_results)
-- Mengapa: Menyimpan angka mentah presisi penuh (payload) sebagai single source of truth statistik,
-- dan representasi tabel Bab 4 berbahasa Indonesia (table_rows) terpisah dari teks narasi AI.
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
    test_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    table_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_analysis_results_run_test UNIQUE (run_id, test_key)
);

COMMENT ON TABLE public.analysis_results IS 'Hasil hitung deterministik mesin statistik Python. Single source of truth.';

CREATE INDEX IF NOT EXISTS idx_analysis_results_run ON public.analysis_results(run_id);

DROP TRIGGER IF EXISTS trg_analysis_results_updated_at ON public.analysis_results;
CREATE TRIGGER trg_analysis_results_updated_at
    BEFORE UPDATE ON public.analysis_results
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Analysis Results: Pengguna hanya boleh membaca; penulisan eksklusif oleh service_role
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_results_select_owner" ON public.analysis_results;
CREATE POLICY "analysis_results_select_owner"
    ON public.analysis_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analysis_runs r
        WHERE r.id = analysis_results.run_id
        AND public.is_project_owner(r.project_id)
    ));

-- 3. Tabel Penjelasan Akademik AI (explanations)
-- Mengapa: Menyimpan kalimat interpretasi yang dihasilkan LLM dari angka di tabel.
-- Memiliki pelacak guard_passed untuk memastikan angka yang dikutip valid dan tidak halusinasi.
CREATE TABLE IF NOT EXISTS public.explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES public.analysis_results(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    numbers_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1',
    guard_passed BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_explanations_result_version UNIQUE (result_id, prompt_version)
);

COMMENT ON TABLE public.explanations IS 'Interpretasi naratif AI yang diawasi oleh number guard.';

CREATE INDEX IF NOT EXISTS idx_explanations_result ON public.explanations(result_id);

DROP TRIGGER IF EXISTS trg_explanations_updated_at ON public.explanations;
CREATE TRIGGER trg_explanations_updated_at
    BEFORE UPDATE ON public.explanations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Explanations: Pengguna hanya boleh membaca; penulisan eksklusif oleh service_role
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "explanations_select_owner" ON public.explanations;
CREATE POLICY "explanations_select_owner"
    ON public.explanations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analysis_results res
        JOIN public.analysis_runs r ON r.id = res.run_id
        WHERE res.id = explanations.result_id
        AND public.is_project_owner(r.project_id)
    ));

-- 4. Tabel Metadata Ekspor Berkas (exports)
-- Mengapa: Melacak berkas .docx dan .pdf yang siap diunduh mahasiswa beserta tanda air dan lampiran pernyataan.
CREATE TABLE IF NOT EXISTS public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
    format export_format_t NOT NULL,
    storage_path TEXT NOT NULL,
    include_declaration BOOLEAN NOT NULL DEFAULT TRUE,
    watermark BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.exports IS 'Catatan metadata dokumen ekspor (Word/PDF) hasil analisis.';

CREATE INDEX IF NOT EXISTS idx_exports_run ON public.exports(run_id);

DROP TRIGGER IF EXISTS trg_exports_updated_at ON public.exports;
CREATE TRIGGER trg_exports_updated_at
    BEFORE UPDATE ON public.exports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Exports: Pengguna hanya boleh membaca dokumen miliknya
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exports_select_owner" ON public.exports;
CREATE POLICY "exports_select_owner"
    ON public.exports FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analysis_runs r
        WHERE r.id = exports.run_id
        AND public.is_project_owner(r.project_id)
    ));

-- 5. Fungsi Antrean: claim_next_run
-- Mengapa: Mengambil satu baris antrean teratas berstatus queued secara atomik dengan FOR UPDATE SKIP LOCKED
-- untuk mencegah konkurensi ganda di antara beberapa worker Python paralel.
CREATE OR REPLACE FUNCTION public.claim_next_run(worker_id TEXT)
RETURNS SETOF public.analysis_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_run public.analysis_runs%ROWTYPE;
BEGIN
    SELECT * INTO v_run
    FROM public.analysis_runs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        UPDATE public.analysis_runs
        SET status = 'running',
            locked_at = NOW(),
            locked_by = worker_id,
            attempts = attempts + 1,
            started_at = COALESCE(started_at, NOW()),
            updated_at = NOW()
        WHERE id = v_run.id
        RETURNING * INTO v_run;

        RETURN NEXT v_run;
    END IF;

    RETURN;
END;
$$;

COMMENT ON FUNCTION public.claim_next_run(TEXT) IS 'Mengambil antrean analisis terdepan secara atomik tanpa benturan worker paralel.';
REVOKE EXECUTE ON FUNCTION public.claim_next_run(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_next_run(TEXT) TO service_role;

-- 6. Fungsi Antrean: complete_run
-- Mengapa: Pembaruan atomik ketika mesin statistik berhasil menyelesaikan semua pengujian.
CREATE OR REPLACE FUNCTION public.complete_run(p_run_id UUID, p_progress JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.analysis_runs
    SET status = 'succeeded',
        progress = p_progress,
        finished_at = NOW(),
        locked_at = NULL,
        locked_by = NULL,
        updated_at = NOW()
    WHERE id = p_run_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_run(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_run(UUID, JSONB) TO service_role;

-- 7. Fungsi Antrean: fail_run
-- Mengapa: Pembaruan atomik jika terjadi kegagalan kalkulasi deterministik pada worker.
CREATE OR REPLACE FUNCTION public.fail_run(p_run_id UUID, p_error_code TEXT, p_error_message TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.analysis_runs
    SET status = 'failed',
        error_code = p_error_code,
        error_message = p_error_message,
        finished_at = NOW(),
        locked_at = NULL,
        locked_by = NULL,
        updated_at = NOW()
    WHERE id = p_run_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fail_run(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_run(UUID, TEXT, TEXT) TO service_role;

-- 8. Fungsi Antrean: requeue_stuck_runs
-- Mengapa: Mengembalikan analisis yang macet (worker crash/network timeout) kembali ke antrean 'queued'
-- jika locked_at melebihi ambang batas, atau menandainya 'failed' jika telah melampaui batas percobaan.
CREATE OR REPLACE FUNCTION public.requeue_stuck_runs(
    timeout_minutes INT DEFAULT 10,
    max_attempts INT DEFAULT 3
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stuck_count INT := 0;
    v_threshold TIMESTAMPTZ;
BEGIN
    v_threshold := NOW() - (timeout_minutes || ' minutes')::INTERVAL;

    -- 1. Gagalkan run yang telah melampaui percobaan maksimum
    UPDATE public.analysis_runs
    SET status = 'failed',
        error_code = 'TIMEOUT_MAX_ATTEMPTS',
        error_message = 'Batas waktu analisis terlampaui setelah ' || attempts || ' percobaan.',
        finished_at = NOW(),
        locked_at = NULL,
        locked_by = NULL,
        updated_at = NOW()
    WHERE status = 'running'
      AND locked_at < v_threshold
      AND attempts >= max_attempts;

    -- 2. Kembalikan run yang masih dalam batas percobaan ke queued
    WITH requeued AS (
        UPDATE public.analysis_runs
        SET status = 'queued',
            locked_at = NULL,
            locked_by = NULL,
            updated_at = NOW()
        WHERE status = 'running'
          AND locked_at < v_threshold
          AND attempts < max_attempts
        RETURNING id
    )
    SELECT COUNT(*) INTO v_stuck_count FROM requeued;

    RETURN v_stuck_count;
END;
$$;

COMMENT ON FUNCTION public.requeue_stuck_runs(INT, INT) IS 'Memulihkan tugas analisis yang macet akibat worker timeout ke antrean queued.';
REVOKE EXECUTE ON FUNCTION public.requeue_stuck_runs(INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.requeue_stuck_runs(INT, INT) TO service_role;
