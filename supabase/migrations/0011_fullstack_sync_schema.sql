-- =============================================================================
-- 0011_fullstack_sync_schema.sql
-- Sinkronisasi Ujung-ke-Ujung (Prinsip S1-S5):
-- 1. Penambahan atribut is_sample dan validasi judul pada projects
-- 2. Tabel row_exclusions untuk pencatatan eksklusi baris per dataset
-- 3. Tabel notes (project_id, section_id, text, version, updated_at) dengan OCC
-- 4. Kolom audit run nyata (dataset_hash, n_used, n_excluded, idempotency_key, results_ref) pada analysis_runs
-- 5. Kolom project_id dan title_snapshot pada exports
-- 6. Fungsi kanonik compute_effective_n (S2) dan migrasi pembersihan log dummy (Masalah 4)
-- =============================================================================

-- 1. Fungsi Kanonik Server untuk Menghitung N Efektif (Prinsip S2)
CREATE OR REPLACE FUNCTION public.compute_effective_n(
    p_row_count INT,
    p_excluded_count INT
)
RETURNS INT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT GREATEST(0, COALESCE(p_row_count, 0) - GREATEST(0, COALESCE(p_excluded_count, 0)));
$$;

COMMENT ON FUNCTION public.compute_effective_n(INT, INT) IS 'Prinsip S2: Satu fungsi kanonik server untuk menghitung N = row_count - excluded_count.';
GRANT EXECUTE ON FUNCTION public.compute_effective_n(INT, INT) TO authenticated, service_role, anon;

-- 2. Pembaruan Tabel projects (is_sample & validasi panjang judul)
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;

DO $$ BEGIN
    ALTER TABLE public.projects
        ADD CONSTRAINT chk_projects_judul_length
        CHECK (char_length(btrim(judul)) BETWEEN 5 AND 250) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Pembaruan Tabel datasets (content_hash & column_meta)
ALTER TABLE public.datasets
    ADD COLUMN IF NOT EXISTS content_hash TEXT,
    ADD COLUMN IF NOT EXISTS column_meta JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.datasets
SET content_hash = sha256
WHERE content_hash IS NULL AND sha256 IS NOT NULL;

-- 4. Tabel Eksklusi Baris Responden (row_exclusions)
CREATE TABLE IF NOT EXISTS public.row_exclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    row_index INT NOT NULL CHECK (row_index >= 0),
    reason TEXT NOT NULL DEFAULT 'Anomali data responden',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_row_exclusions_dataset_row UNIQUE (dataset_id, row_index)
);

COMMENT ON TABLE public.row_exclusions IS 'Daftar indeks baris responden yang dikecualikan per dataset dan proyek (Prinsip S2).';

CREATE INDEX IF NOT EXISTS idx_row_exclusions_project ON public.row_exclusions(project_id);
CREATE INDEX IF NOT EXISTS idx_row_exclusions_dataset ON public.row_exclusions(dataset_id);

ALTER TABLE public.row_exclusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "row_exclusions_select_owner" ON public.row_exclusions;
CREATE POLICY "row_exclusions_select_owner"
    ON public.row_exclusions FOR SELECT
    USING (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "row_exclusions_insert_owner" ON public.row_exclusions;
CREATE POLICY "row_exclusions_insert_owner"
    ON public.row_exclusions FOR INSERT
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "row_exclusions_update_owner" ON public.row_exclusions;
CREATE POLICY "row_exclusions_update_owner"
    ON public.row_exclusions FOR UPDATE
    USING (public.is_project_owner(project_id))
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "row_exclusions_delete_owner" ON public.row_exclusions;
CREATE POLICY "row_exclusions_delete_owner"
    ON public.row_exclusions FOR DELETE
    USING (public.is_project_owner(project_id));

-- 5. Tabel Catatan Teori & Pembahasan Bab 4 (notes) dengan Optimistic Concurrency Control (version)
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    section_id TEXT NOT NULL CHECK (char_length(btrim(section_id)) > 0),
    text TEXT NOT NULL DEFAULT '' CHECK (char_length(text) <= 20000),
    version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notes_project_section UNIQUE (project_id, section_id)
);

COMMENT ON TABLE public.notes IS 'Catatan teori dan kerangka pembahasan akademik Bab 4 per seksi dengan pengendalian konkurensi (version).';

CREATE INDEX IF NOT EXISTS idx_notes_project_section ON public.notes(project_id, section_id);

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.notes;
CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_select_owner" ON public.notes;
CREATE POLICY "notes_select_owner"
    ON public.notes FOR SELECT
    USING (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "notes_insert_owner" ON public.notes;
CREATE POLICY "notes_insert_owner"
    ON public.notes FOR INSERT
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "notes_update_owner" ON public.notes;
CREATE POLICY "notes_update_owner"
    ON public.notes FOR UPDATE
    USING (public.is_project_owner(project_id))
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "notes_delete_owner" ON public.notes;
CREATE POLICY "notes_delete_owner"
    ON public.notes FOR DELETE
    USING (public.is_project_owner(project_id));

-- 6. Pembaruan Tabel analysis_runs (Audit Trail Nyata & Idempotency Key)
ALTER TABLE public.analysis_runs
    ADD COLUMN IF NOT EXISTS dataset_hash TEXT,
    ADD COLUMN IF NOT EXISTS n_used INT,
    ADD COLUMN IF NOT EXISTS n_excluded INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS results_ref TEXT,
    ADD COLUMN IF NOT EXISTS duration_ms INT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_runs_idempotency
    ON public.analysis_runs(project_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- Perbarui RLS analysis_runs agar pemilik proyek dapat mencatat run sinkron maupun asinkron
DROP POLICY IF EXISTS "analysis_runs_insert_owner" ON public.analysis_runs;
CREATE POLICY "analysis_runs_insert_owner"
    ON public.analysis_runs FOR INSERT
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "analysis_runs_update_owner" ON public.analysis_runs;
CREATE POLICY "analysis_runs_update_owner"
    ON public.analysis_runs FOR UPDATE
    USING (public.is_project_owner(project_id))
    WITH CHECK (public.is_project_owner(project_id));

-- 7. Pembaruan Tabel exports (project_id & title_snapshot)
ALTER TABLE public.exports
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS title_snapshot TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_exports_project ON public.exports(project_id);

DROP POLICY IF EXISTS "exports_insert_owner" ON public.exports;
CREATE POLICY "exports_insert_owner"
    ON public.exports FOR INSERT
    WITH CHECK (
        (project_id IS NOT NULL AND public.is_project_owner(project_id))
        OR EXISTS (
            SELECT 1 FROM public.analysis_runs r
            WHERE r.id = exports.run_id
            AND public.is_project_owner(r.project_id)
        )
    );

-- 8. Migrasi Satu Kali Idempoten: Hapus Log Analisis Dummy / Yatim (Masalah 4)
DELETE FROM public.analysis_runs
WHERE project_id IS NULL
   OR dataset_id IS NULL
   OR error_code = 'DUMMY_SEED';
