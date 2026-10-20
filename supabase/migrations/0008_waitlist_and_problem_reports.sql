-- =============================================================================
-- 0008_waitlist_and_problem_reports.sql
-- Inisialisasi tabel daftar tunggu (waitlist) dan laporan masalah (problem_reports)
-- Kepatuhan Privasi: Tanpa data responden, RLS ketat, anon hanya bisa INSERT.
-- =============================================================================

-- 1. Tabel Daftar Tunggu (waitlist)
-- Menyimpan calon pengguna yang ingin aktivasi paket saat sistem berjalan tanpa payment gateway.
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

COMMENT ON TABLE public.waitlist IS 'Daftar tunggu aktivasi paket skripsi/bulanan tanpa payment gateway.';
COMMENT ON COLUMN public.waitlist.email IS 'Alamat email pemohon aktivasi; divalidasi formatnya.';

-- Indeks untuk pencarian cepat dan pencegahan duplikasi massal
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist (created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER trg_waitlist_updated_at
    BEFORE UPDATE ON public.waitlist
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS untuk public.waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anonim dan pengguna terautentikasi dapat mendaftar (INSERT)
CREATE POLICY "waitlist_insert_anon_and_auth"
    ON public.waitlist
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(email) >= 5 AND
        email LIKE '%@%.%'
    );

-- Anonim DILARANG KERAS membaca, memperbarui, atau menghapus data waitlist
CREATE POLICY "waitlist_select_admin_only"
    ON public.waitlist
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

CREATE POLICY "waitlist_update_admin_only"
    ON public.waitlist
    FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

-- 2. Tabel Laporan Masalah (problem_reports)
-- Menyimpan laporan kendala teknis atau pertanyaan mahasiswa tanpa memuat data responden kuesioner.
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

COMMENT ON TABLE public.problem_reports IS 'Laporan kendala teknis dan pertanyaan pengguna. Mutlak bebas dari data responden kuesioner.';

-- Indeks
CREATE INDEX IF NOT EXISTS idx_problem_reports_report_id ON public.problem_reports (report_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_email ON public.problem_reports (email);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports (status);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_problem_reports_updated_at ON public.problem_reports;
CREATE TRIGGER trg_problem_reports_updated_at
    BEFORE UPDATE ON public.problem_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS untuk public.problem_reports
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- Anonim dan terautentikasi dapat mengirim laporan kendala (INSERT)
CREATE POLICY "problem_reports_insert_anon_and_auth"
    ON public.problem_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(description) >= 5 AND
        length(email) >= 5 AND
        email LIKE '%@%.%'
    );

-- Hanya admin yang dapat melihat dan menangani seluruh laporan masalah
CREATE POLICY "problem_reports_select_admin_only"
    ON public.problem_reports
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

CREATE POLICY "problem_reports_update_admin_only"
    ON public.problem_reports
    FOR UPDATE
    TO authenticated
    USING (
        auth.jwt() ->> 'email' IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com')
    );

-- Akses penuh untuk service_role
GRANT ALL ON public.waitlist TO service_role;
GRANT ALL ON public.problem_reports TO service_role;
