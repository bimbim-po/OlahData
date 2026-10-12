-- 0007_admin_analytics_audit.sql
-- Migrasi Penambahan Dashboard Super Admin (Owner):
-- 1. admin_users (peran owner, support, viewer; kontrol MFA)
-- 2. app_events (pelacakan analitik metadata murni tanpa data responden)
-- 3. admin_audit_log (log audit tindakan admin yang immutable dan wajib alasan)
-- 4. support_notes (catatan internal dukungan pelanggan)
-- 5. is_test flag pada profiles (pengecualian akun uji dari seluruh metrik)
-- 6. View analitik agregat (v_daily_signups, v_daily_active_users, v_mrr, v_funnel, v_run_health, v_llm_cost, v_guard_stats, v_retention_cohort)

-- 1. Definisi Tipe Data Enum Peran Admin
DO $$ BEGIN
    CREATE TYPE admin_role_t AS ENUM ('owner', 'support', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tambahkan Kolom is_test pada profiles
-- Mengapa: Memungkinkan penandaan akun uji agar tidak mencemari kalkulasi metrik pendapatan dan konversi.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN public.profiles.is_test IS 'Menandai akun demo/uji internal agar diabaikan dalam kalkulasi metrik bisnis.';

-- 3. Tabel admin_users
-- Mengapa: Menyimpan daftar administrator terverifikasi dengan kontrol peran berbasis database.
-- Hanya dimutasi oleh service_role server berdasarkan pencocokan ADMIN_EMAILS.
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role admin_role_t NOT NULL DEFAULT 'viewer',
    mfa_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_users IS 'Daftar pengguna dengan hak akses administratif; disinkronkan oleh server dari ADMIN_EMAILS.';

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS admin_users: Ditutup dari akses publik / anon; pengguna biasa tidak dapat membaca
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_self" ON public.admin_users;
CREATE POLICY "admin_users_select_self"
    ON public.admin_users FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Fungsi Pembantu Status Admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = p_user_id AND is_active = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_role(p_user_id UUID DEFAULT auth.uid())
RETURNS admin_role_t
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
    SELECT role FROM public.admin_users
    WHERE user_id = p_user_id AND is_active = TRUE
    LIMIT 1;
$$;

-- 5. Tabel app_events (Analitik Produk Mandiri)
-- Aturan Keras: props HANYA METADATA (n_rows, tests, durasi, kode galat); tidak pernah isi data responden.
CREATE TABLE IF NOT EXISTS public.app_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    props JSONB NOT NULL DEFAULT '{}'::jsonb,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_events IS 'Log analitik produk internal (metadata saja; tidak memuat data responden).';

-- Indeks performa untuk agregasi aktivitas dan pencarian rentang waktu
CREATE INDEX IF NOT EXISTS idx_app_events_event_created ON public.app_events(event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_user_created ON public.app_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_created ON public.app_events(created_at DESC);

-- Trigger Pencegahan Injeksi Isi Data Responden ke dalam app_events.props
CREATE OR REPLACE FUNCTION public.validate_app_event_privacy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    forbidden_keys TEXT[] := ARRAY['data', 'rows', 'values', 'text', 'cells', 'answers', 'responses', 'records', 'dataset_content', 'preview'];
    k TEXT;
BEGIN
    FOREACH k IN ARRAY forbidden_keys LOOP
        IF NEW.props ? k THEN
            RAISE EXCEPTION 'Pelanggaran Privasi: app_events tidak boleh memuat kunci %', k
                USING ERRCODE = '22023';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_app_event_privacy ON public.app_events;
CREATE TRIGGER trg_validate_app_event_privacy
    BEFORE INSERT OR UPDATE ON public.app_events
    FOR EACH ROW EXECUTE FUNCTION public.validate_app_event_privacy();

-- RLS app_events: Pengguna authenticated boleh memasukkan event aktivitasnya sendiri
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_events_insert" ON public.app_events;
CREATE POLICY "app_events_insert"
    ON public.app_events FOR INSERT
    WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- 6. Tabel admin_audit_log (Audit Tindakan Administratif yang Immutable)
-- Mengapa: Setiap mutasi admin wajib menyertakan alasan jelas, IP, dan snapshot before/after.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    before JSONB,
    after JSONB,
    reason TEXT NOT NULL,
    ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_audit_log IS 'Jejak audit permanen tindakan admin (wajib alasan, immutable).';

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON public.admin_audit_log(entity, entity_id);

-- RLS admin_audit_log: Hanya dapat dibaca/ditulis oleh server (service_role); tidak ada UPDATE/DELETE dari manapun
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. Tabel support_notes (Catatan Internal Pelanggan)
CREATE TABLE IF NOT EXISTS public.support_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.support_notes IS 'Catatan tiket dan riwayat bantuan internal per pelanggan.';

CREATE INDEX IF NOT EXISTS idx_support_notes_user ON public.support_notes(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_support_notes_updated_at ON public.support_notes;
CREATE TRIGGER trg_support_notes_updated_at
    BEFORE UPDATE ON public.support_notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.support_notes ENABLE ROW LEVEL SECURITY;

-- 8. Fungsi Retensi app_events
CREATE OR REPLACE FUNCTION public.purge_app_events(retention_days INT DEFAULT 180)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_purged INT := 0;
BEGIN
    WITH deleted AS (
        DELETE FROM public.app_events
        WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_purged FROM deleted;
    RETURN v_purged;
END;
$$;

-- 9. Views Agregat untuk Metrik Bisnis & Kesehatan Sistem
-- Mengapa: Mempercepat komputasi dasbor tanpa pemindaian penuh berkali-kali.

-- A. Pendaftar Harian (v_daily_signups) - Mengecualikan akun uji
CREATE OR REPLACE VIEW public.v_daily_signups AS
SELECT 
    DATE(p.created_at AT TIME ZONE 'Asia/Jakarta') AS date_wib,
    COUNT(*) AS signups_count,
    COUNT(*) FILTER (WHERE p.plan = 'free') AS free_signups,
    COUNT(*) FILTER (WHERE p.plan IN ('monthly', 'thesis')) AS paid_signups
FROM public.profiles p
WHERE p.is_test = FALSE
GROUP BY 1
ORDER BY 1 DESC;

-- B. Pengguna Aktif Harian (v_daily_active_users) - DAU
CREATE OR REPLACE VIEW public.v_daily_active_users AS
SELECT 
    DATE(e.created_at AT TIME ZONE 'Asia/Jakarta') AS date_wib,
    COUNT(DISTINCT e.user_id) AS dau_count
FROM public.app_events e
JOIN public.profiles p ON p.id = e.user_id
WHERE e.user_id IS NOT NULL 
  AND p.is_test = FALSE
GROUP BY 1
ORDER BY 1 DESC;

-- C. Monthly Recurring Revenue (v_mrr)
CREATE OR REPLACE VIEW public.v_mrr AS
SELECT 
    COUNT(*) FILTER (WHERE s.plan = 'monthly' AND s.status = 'active') AS active_monthly_subs,
    COUNT(*) FILTER (WHERE s.plan = 'thesis' AND s.status = 'active') AS active_thesis_subs,
    -- Paket bulanan Rp39.000, paket skripsi 3 bulan Rp99.000 (~Rp33.000/bln)
    (COUNT(*) FILTER (WHERE s.plan = 'monthly' AND s.status = 'active') * 39000) +
    (COUNT(*) FILTER (WHERE s.plan = 'thesis' AND s.status = 'active') * 33000) AS mrr_idr,
    COALESCE(SUM(pay.amount_idr) FILTER (WHERE pay.status = 'paid' AND pay.created_at >= NOW() - INTERVAL '30 days'), 0) AS total_revenue_30d
FROM public.subscriptions s
JOIN public.profiles p ON p.id = s.user_id
LEFT JOIN public.payments pay ON pay.user_id = s.user_id
WHERE p.is_test = FALSE;

-- D. Funnel Konversi Aktivasi (v_funnel)
CREATE OR REPLACE VIEW public.v_funnel AS
WITH user_stages AS (
    SELECT 
        p.id AS user_id,
        TRUE AS has_signup,
        EXISTS (SELECT 1 FROM public.projects pr WHERE pr.owner_id = p.id) AS has_project,
        EXISTS (SELECT 1 FROM public.projects pr JOIN public.datasets d ON d.project_id = pr.id WHERE pr.owner_id = p.id) AS has_dataset,
        EXISTS (SELECT 1 FROM public.projects pr JOIN public.analysis_runs r ON r.project_id = pr.id WHERE pr.owner_id = p.id AND r.status = 'succeeded') AS has_analysis_success,
        EXISTS (SELECT 1 FROM public.payments pay WHERE pay.user_id = p.id AND pay.status = 'paid') AS has_paid
    FROM public.profiles p
    WHERE p.is_test = FALSE
)
SELECT 
    COUNT(*) AS total_signups,
    COUNT(*) FILTER (WHERE has_project) AS total_created_project,
    COUNT(*) FILTER (WHERE has_dataset) AS total_uploaded_dataset,
    COUNT(*) FILTER (WHERE has_analysis_success) AS total_analyzed_success,
    COUNT(*) FILTER (WHERE has_paid) AS total_paid
FROM user_stages;

-- E. Kesehatan Antrean dan Mesin Statistik (v_run_health)
CREATE OR REPLACE VIEW public.v_run_health AS
SELECT 
    COUNT(*) AS total_runs_7d,
    COUNT(*) FILTER (WHERE status = 'queued') AS queued_count,
    COUNT(*) FILTER (WHERE status = 'running') AS running_count,
    COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded_count,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
    COUNT(*) FILTER (WHERE status = 'canceled') AS canceled_count,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
        2
    ) AS failure_rate_pct,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) FILTER (WHERE status = 'succeeded')::NUMERIC,
        2
    ) AS avg_duration_seconds
FROM public.analysis_runs
WHERE created_at >= NOW() - INTERVAL '7 days';

-- F. Biaya Token LLM & Estimasi Pengeluaran (v_llm_cost)
-- Biaya Gemini 2.5 Flash / Pro rata-rata: ~$0.0001 per 1k token (~Rp1.6 per 1k token)
CREATE OR REPLACE VIEW public.v_llm_cost AS
SELECT 
    DATE(u.period AT TIME ZONE 'Asia/Jakarta') AS date_wib,
    SUM(u.llm_tokens) AS total_tokens,
    ROUND(SUM(u.llm_tokens) * 0.0016, 2) AS estimated_cost_idr,
    COUNT(DISTINCT u.user_id) AS active_users_llm
FROM public.usage_counters u
JOIN public.profiles p ON p.id = u.user_id
WHERE p.is_test = FALSE
GROUP BY 1
ORDER BY 1 DESC;

-- G. Statistik Number Guard (v_guard_stats)
CREATE OR REPLACE VIEW public.v_guard_stats AS
SELECT 
    COUNT(*) AS total_explanations,
    COUNT(*) FILTER (WHERE guard_passed = TRUE) AS passed_count,
    COUNT(*) FILTER (WHERE guard_passed = FALSE) AS rejected_count,
    ROUND(
        (COUNT(*) FILTER (WHERE guard_passed = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        2
    ) AS pass_rate_pct,
    ROUND(AVG(attempts)::NUMERIC, 2) AS avg_attempts
FROM public.explanations
WHERE created_at >= NOW() - INTERVAL '30 days';

-- H. Kohort Retensi Mingguan (v_retention_cohort)
CREATE OR REPLACE VIEW public.v_retention_cohort AS
WITH user_cohort AS (
    SELECT 
        p.id AS user_id,
        DATE_TRUNC('week', p.created_at AT TIME ZONE 'Asia/Jakarta')::DATE AS cohort_week
    FROM public.profiles p
    WHERE p.is_test = FALSE
),
activity_weeks AS (
    SELECT 
        e.user_id,
        DATE_TRUNC('week', e.created_at AT TIME ZONE 'Asia/Jakarta')::DATE AS active_week
    FROM public.app_events e
    WHERE e.user_id IS NOT NULL
    GROUP BY 1, 2
)
SELECT 
    c.cohort_week,
    COUNT(DISTINCT c.user_id) AS cohort_size,
    COUNT(DISTINCT a.user_id) FILTER (WHERE a.active_week = c.cohort_week) AS week_0_active,
    COUNT(DISTINCT a.user_id) FILTER (WHERE a.active_week = c.cohort_week + INTERVAL '7 days') AS week_1_active,
    COUNT(DISTINCT a.user_id) FILTER (WHERE a.active_week = c.cohort_week + INTERVAL '14 days') AS week_2_active,
    COUNT(DISTINCT a.user_id) FILTER (WHERE a.active_week = c.cohort_week + INTERVAL '21 days') AS week_3_active
FROM user_cohort c
LEFT JOIN activity_weeks a ON a.user_id = c.user_id
GROUP BY 1
ORDER BY 1 DESC;
