-- =============================================================================
-- OLAHDATA DATABASE SCHEMA ALIGNMENT & COMPLETE PATCH (2026)
-- Target Instance: https://muxzjegpxjamasprgdrs.supabase.co
-- Cara Pakai: Salin (Copy) seluruh isi skrip ini ke Supabase Dashboard > SQL Editor > Klik Run.
-- Skrip ini 100% IDEMPOTEN (aman dijalankan berulang kali tanpa merusak data).
-- =============================================================================

-- 1. Perluas Enum role_t agar Mendukung Variabel Mediasi dan Moderasi
DO $$ BEGIN
    ALTER TYPE public.role_t ADD VALUE IF NOT EXISTS 'mediasi';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.role_t ADD VALUE IF NOT EXISTS 'moderasi';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.role_t ADD VALUE IF NOT EXISTS 'mediator';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE public.role_t ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Tambahkan Kolom 'role' pada public.constructs
-- Mengapa: Dalam Regresi Linier Berganda, Path Analysis (Uji Sobel), dan MRA Moderasi,
-- peran variabel (independent, dependent, mediator, moderator) melekat pada KONSTRUK.
ALTER TABLE public.constructs 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'independent';

COMMENT ON COLUMN public.constructs.role IS 'Peran statistik konstruk: independent (X), dependent (Y), mediator (Z/M), moderator (Z/Mod).';

-- 3. Tabel Daftar Tunggu Aktivasi Paket (public.waitlist)
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Mahasiswa',
    email TEXT NOT NULL,
    phone TEXT,
    university TEXT,
    plan plan_t NOT NULL DEFAULT 'monthly',
    project_id TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.waitlist IS 'Daftar tunggu aktivasi paket skripsi/bulanan dari mahasiswa.';

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist (created_at DESC);

DROP TRIGGER IF EXISTS trg_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER trg_waitlist_updated_at
    BEFORE UPDATE ON public.waitlist
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_insert_anon_and_auth" ON public.waitlist;
CREATE POLICY "waitlist_insert_anon_and_auth"
    ON public.waitlist FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(email) >= 5 AND
        email LIKE '%@%.%'
    );

DROP POLICY IF EXISTS "waitlist_select_admin_only" ON public.waitlist;
CREATE POLICY "waitlist_select_admin_only"
    ON public.waitlist FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

DROP POLICY IF EXISTS "waitlist_update_admin_only" ON public.waitlist;
CREATE POLICY "waitlist_update_admin_only"
    ON public.waitlist FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

GRANT ALL ON public.waitlist TO service_role;
GRANT INSERT ON public.waitlist TO anon, authenticated;

-- 4. Tabel Laporan Masalah Teknis (public.problem_reports)
CREATE TABLE IF NOT EXISTS public.problem_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'Umum',
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    diagnostic_code TEXT,
    project_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.problem_reports IS 'Laporan kendala teknis dan pertanyaan mahasiswa tanpa data kuesioner.';

CREATE INDEX IF NOT EXISTS idx_problem_reports_report_id ON public.problem_reports (report_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_email ON public.problem_reports (email);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports (status);

DROP TRIGGER IF EXISTS trg_problem_reports_updated_at ON public.problem_reports;
CREATE TRIGGER trg_problem_reports_updated_at
    BEFORE UPDATE ON public.problem_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "problem_reports_insert_anon_and_auth" ON public.problem_reports;
CREATE POLICY "problem_reports_insert_anon_and_auth"
    ON public.problem_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(email) >= 5 AND
        email LIKE '%@%.%'
    );

DROP POLICY IF EXISTS "problem_reports_select_admin_only" ON public.problem_reports;
CREATE POLICY "problem_reports_select_admin_only"
    ON public.problem_reports FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

DROP POLICY IF EXISTS "problem_reports_update_admin_only" ON public.problem_reports;
CREATE POLICY "problem_reports_update_admin_only"
    ON public.problem_reports FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

GRANT ALL ON public.problem_reports TO service_role;
GRANT INSERT ON public.problem_reports TO anon, authenticated;

-- 5. Upgrade Skema Tabel Antrean Pembersihan Storage (public.storage_purge_queue)
-- Di database saat ini, storage_purge_queue masih menggunakan skema 4 kolom lama (id int8, bucket, path, created_at).
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS bucket_id TEXT;
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT 'RETENTION_EXPIRED';
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS scheduled_purge_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ;
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
ALTER TABLE public.storage_purge_queue ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_purge_queue_status_scheduled ON public.storage_purge_queue (status, scheduled_purge_at);
CREATE INDEX IF NOT EXISTS idx_purge_queue_bucket_path ON public.storage_purge_queue (bucket_id, storage_path);

ALTER TABLE public.storage_purge_queue ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.storage_purge_queue TO service_role;

-- 6. Fungsi RPC enqueue_storage_purge & Trigger Penghapusan Berkas Ekspor
CREATE OR REPLACE FUNCTION public.enqueue_storage_purge(
    p_bucket_id TEXT,
    p_storage_path TEXT,
    p_reason TEXT DEFAULT 'MANUAL_OR_EXPIRED',
    p_delay_hours INT DEFAULT 0
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id TEXT;
BEGIN
    INSERT INTO public.storage_purge_queue (
        bucket,
        path,
        bucket_id,
        storage_path,
        reason,
        scheduled_purge_at,
        status
    )
    VALUES (
        p_bucket_id,
        p_storage_path,
        p_bucket_id,
        p_storage_path,
        p_reason,
        NOW() + (p_delay_hours || ' hours')::INTERVAL,
        'pending'
    )
    RETURNING id::TEXT INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_storage_purge(TEXT, TEXT, TEXT, INT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_export_deleted_enqueue_purge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.storage_path IS NOT NULL AND OLD.storage_path != '' THEN
        PERFORM public.enqueue_storage_purge(
            'exports',
            OLD.storage_path,
            'EXPORT_RECORD_DELETED',
            0
        );
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_exports_before_delete ON public.exports;
CREATE TRIGGER trg_exports_before_delete
    BEFORE DELETE ON public.exports
    FOR EACH ROW EXECUTE FUNCTION public.trg_export_deleted_enqueue_purge();

-- 7. Perbaikan Izin Insert Analitik pada public.app_events (Anon & Authenticated)
DROP POLICY IF EXISTS "app_events_insert" ON public.app_events;
CREATE POLICY "app_events_insert"
    ON public.app_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

GRANT INSERT ON public.app_events TO anon, authenticated;

-- 8. Fungsi Validasi Admin & Sinkronisasi Akun Owner di public.admin_users
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_email TEXT;
BEGIN
    v_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
    IF v_email IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com') THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

INSERT INTO public.admin_users (user_id, email, role, mfa_required, is_active)
SELECT id, email, 'owner'::public.admin_role_t, FALSE, TRUE
FROM auth.users
WHERE LOWER(email) IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
ON CONFLICT (user_id) DO UPDATE SET
    role = 'owner',
    is_active = TRUE,
    updated_at = NOW();

-- 9. Perbaikan View v_admin_projects_safe (Menggunakan p.judul dan LEFT JOIN auth.users)
CREATE OR REPLACE VIEW public.v_admin_projects_safe AS
SELECT 
    p.id AS project_id,
    p.owner_id,
    p.judul AS project_title,
    p.created_at,
    p.updated_at,
    p.archived_at,
    prof.nama AS owner_nama,
    u.email AS owner_email,
    prof.kampus AS owner_kampus,
    prof.plan AS owner_plan,
    (SELECT COUNT(*) FROM public.datasets d WHERE d.project_id = p.id) AS total_datasets,
    (SELECT MAX(d.n_rows) FROM public.datasets d WHERE d.project_id = p.id) AS respondent_count,
    (SELECT COUNT(*) FROM public.analysis_runs r WHERE r.project_id = p.id) AS total_runs
FROM public.projects p
JOIN public.profiles prof ON prof.id = p.owner_id
LEFT JOIN auth.users u ON u.id = prof.id;

COMMENT ON VIEW public.v_admin_projects_safe IS 'Tampilan administratif aman: hanya memuat metadata proyek tanpa data kuesioner.';

-- 10. Prosedur Penghapusan Akun & Data Mandiri (UU PDP No. 27/2022)
CREATE OR REPLACE FUNCTION public.delete_user_account_and_data(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage, pg_temp
AS $$
DECLARE
    v_caller UUID;
    v_ds RECORD;
    v_exp RECORD;
    v_enqueued_files INT := 0;
BEGIN
    v_caller := auth.uid();

    IF v_caller IS DISTINCT FROM target_user_id AND NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki hak untuk menghapus akun ini.' USING ERRCODE = '42501';
    END IF;

    -- Masukkan berkas dataset fisik ke antrean pembersihan storage
    FOR v_ds IN 
        SELECT d.storage_path 
        FROM public.datasets d 
        JOIN public.projects p ON p.id = d.project_id 
        WHERE p.owner_id = target_user_id AND d.storage_path IS NOT NULL AND d.storage_path != ''
    LOOP
        PERFORM public.enqueue_storage_purge('datasets', v_ds.storage_path, 'USER_ACCOUNT_DELETED', 0);
        v_enqueued_files := v_enqueued_files + 1;
    END LOOP;

    -- Masukkan berkas ekspor fisik ke antrean pembersihan storage via run_id -> project_id
    FOR v_exp IN 
        SELECT e.storage_path 
        FROM public.exports e
        JOIN public.analysis_runs r ON r.id = e.run_id
        JOIN public.projects p ON p.id = r.project_id
        WHERE p.owner_id = target_user_id AND e.storage_path IS NOT NULL AND e.storage_path != ''
    LOOP
        PERFORM public.enqueue_storage_purge('exports', v_exp.storage_path, 'USER_ACCOUNT_DELETED', 0);
        v_enqueued_files := v_enqueued_files + 1;
    END LOOP;

    -- Hapus entri relasional di database
    DELETE FROM public.projects WHERE owner_id = target_user_id;
    DELETE FROM public.subscriptions WHERE user_id = target_user_id;
    DELETE FROM public.payments WHERE user_id = target_user_id;
    DELETE FROM public.usage_counters WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- Catat jejak audit non-PII
    INSERT INTO public.audit_log (
        action,
        entity,
        meta
    )
    VALUES (
        'USER_ACCOUNT_PERMANENTLY_DELETED',
        'profiles',
        jsonb_build_object(
            'deleted_user_id', target_user_id,
            'enqueued_storage_files', v_enqueued_files,
            'timestamp', NOW()
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Seluruh data proyek, dataset, dan akun profil berhasil dihapus permanen.',
        'enqueued_storage_files', v_enqueued_files
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account_and_data(UUID) TO authenticated, service_role;

-- 11. Sinkronisasi Kuota Paket Anti-Account Sharing pada public.plan_limits
INSERT INTO public.plan_limits (plan, key, value)
VALUES
    ('free', 'max_projects', '1'::jsonb),
    ('free', 'max_respondents', '150'::jsonb),
    ('free', 'max_items', '30'::jsonb),
    ('free', 'max_datasets_per_project', '1'::jsonb),
    ('free', 'watermark', 'true'::jsonb),
    ('free', 'allow_export', 'true'::jsonb),
    ('free', 'monthly_analyses', '5'::jsonb),

    ('monthly', 'max_projects', '1'::jsonb),
    ('monthly', 'max_respondents', '500'::jsonb),
    ('monthly', 'max_items', '150'::jsonb),
    ('monthly', 'max_datasets_per_project', '1'::jsonb),
    ('monthly', 'watermark', 'false'::jsonb),
    ('monthly', 'allow_export', 'true'::jsonb),
    ('monthly', 'monthly_analyses', '100'::jsonb),

    ('thesis', 'max_projects', '3'::jsonb),
    ('thesis', 'max_respondents', '2500'::jsonb),
    ('thesis', 'max_items', '9999'::jsonb),
    ('thesis', 'max_datasets_per_project', '5'::jsonb),
    ('thesis', 'watermark', 'false'::jsonb),
    ('thesis', 'allow_export', 'true'::jsonb),
    ('thesis', 'monthly_analyses', '300'::jsonb)
ON CONFLICT (plan, key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Muat ulang schema cache PostgREST agar tabel & kolom baru langsung dikenali API
NOTIFY pgrst, 'reload schema';
