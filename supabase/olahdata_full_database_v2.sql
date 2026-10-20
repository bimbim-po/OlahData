-- =============================================================================
-- OLAHDATA DATABASE CONSOLIDATED FULL SCHEMA V2 (MIGRATIONS 0001 - 0010)
-- Target: Supabase Postgres 15+
-- Aturan Keras: RLS Ketat, Admin Hanya Metadata, Tanpa Manipulasi Data Responden
-- =============================================================================


-- >>>>> 0001_enums_profiles.sql <<<<<
-- 0001_enums_profiles.sql
-- Inisialisasi ekstensi, tipe data enum, fungsi utilitas timestamp,
-- tabel profil pengguna yang terhubung dengan Supabase Auth, serta trigger pencegah manipulasi paket.

-- 1. Ekstensi Kriptografi & UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Definisi Tipe Data Enum Terstandar
-- Menggunakan blok idempoten agar aman dieksekusi berulang kali.
DO $$ BEGIN
    CREATE TYPE plan_t AS ENUM ('free', 'monthly', 'thesis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE role_t AS ENUM ('item', 'demografi', 'bebas', 'terikat', 'abaikan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE dataset_kind_t AS ENUM ('original', 'derived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE run_status_t AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE export_format_t AS ENUM ('docx', 'pdf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sub_status_t AS ENUM ('active', 'past_due', 'expired', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pay_status_t AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Fungsi Utilitas Pembaruan Timestamp (updated_at)
-- Mengapa: Memastikan jejak waktu pembaruan baris konsisten dan otomatis tanpa bergantung pada klien.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 4. Tabel Profil Pengguna (profiles)
-- Mengapa: Menyimpan atribut akademis mahasiswa (prodi, kampus) dan tingkatan langganan aktif,
-- terpisah dari data autentikasi sensitif auth.users demi kepatuhan prinsip least-privilege.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT,
    prodi TEXT,
    kampus TEXT,
    plan plan_t NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Profil akademis mahasiswa dan status tier langganan yang terikat dengan Supabase Auth.';
COMMENT ON COLUMN public.profiles.plan IS 'Tingkatan paket pengguna (free, monthly, thesis); hanya dapat dimutasi oleh service_role.';

-- Trigger otomatis untuk updated_at pada profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Trigger Pembuatan Profil Otomatis saat Registrasi Pengguna Baru
-- Mengapa: Menjamin setiap akun yang terdaftar di auth.users selalu memiliki baris profil dengan paket dasar free.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, nama, prodi, kampus, plan, plan_expires_at)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nama',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            'Mahasiswa'
        ),
        COALESCE(NEW.raw_user_meta_data->>'prodi', 'Umum'),
        NEW.raw_user_meta_data->>'kampus',
        'free',
        NULL
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Pencegahan Manipulasi Kolom Paket (plan & plan_expires_at)
-- Mengapa: Memilih pola trigger daripada pemisahan tabel untuk menjaga ergonomi query dan performa
-- (tanpa beban JOIN tambahan pada setiap interaksi), sembari menjamin di level kernel Postgres
-- bahwa pengguna (role authenticated) tidak dapat meng-upgrade akunnya sendiri secara ilegal.
CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF (NEW.plan IS DISTINCT FROM OLD.plan) OR (NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at) THEN
            RAISE EXCEPTION 'Akses ditolak: Kolom plan dan plan_expires_at hanya dapat diperbarui oleh sistem (service_role).'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_plan ON public.profiles;
CREATE TRIGGER trg_protect_profile_plan
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_plan();

-- 7. Kebijakan Row Level Security (RLS) pada Tabel profiles
-- Aturan keras: RLS aktif, default ditolak.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mengapa: Pengguna hanya boleh melihat data profil milik diri sendiri demi kerahasiaan data mahasiswa.
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Mengapa: Pengguna boleh memperbarui nama, prodi, dan kampus milik sendiri. Kolom plan dilindungi oleh trigger.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Mengapa: Mengizinkan inisialisasi baris profil mandiri jika alur onboarding klien membutuhkannya.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- >>>>> 0002_projects_datasets_constructs.sql <<<<<
-- 0002_projects_datasets_constructs.sql
-- Struktur tabel inti penelitian: projects, datasets (immutable), constructs, dan dataset_columns.
-- Dilengkapi fungsi pembantu kepemilikan proyek yang aman dan berkinerja tinggi,
-- serta penegakan integritas data responden (dataset original tidak dapat diubah/dihapus pengguna).

-- 1. Fungsi Pembantu Kepemilikan Proyek (is_project_owner)
-- Mengapa: Memusatkan logika pemeriksaan izin pemilik proyek dengan SECURITY DEFINER dan search_path terkunci.
-- Menghilangkan subquery berulang yang lambat pada kebijakan RLS tabel-tabel anak.
CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id AND owner_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.is_project_owner(UUID) IS 'Memeriksa apakah pengguna yang terautentikasi adalah pemilik sah dari proyek tertentu.';

-- 2. Tabel Proyek Penelitian (projects)
-- Mengapa: Menampung wadah analisis skripsi kuantitatif mahasiswa.
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    judul TEXT NOT NULL,
    prodi TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Proyek penelitian skripsi milik mahasiswa.';
COMMENT ON COLUMN public.projects.owner_id IS 'ID pengguna pemilik proyek; terhubung langsung ke profiles.';

-- Indeks performa untuk query daftar proyek per pengguna
CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON public.projects(owner_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Projects: Pengguna hanya berhak mengelola proyek miliknya sendiri
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own"
    ON public.projects FOR SELECT
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own"
    ON public.projects FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own"
    ON public.projects FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own"
    ON public.projects FOR DELETE
    USING (owner_id = auth.uid());

-- 3. Tabel Dataset Penelitian (datasets)
-- Prinsip Keras: Dataset original bersumber dari kuesioner mahasiswa dan tidak boleh diubah.
-- Pembersihan data hanya menghasilkan versi turunan (kind = derived) dengan catatan excluded_rows.
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version INT NOT NULL,
    parent_dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
    kind dataset_kind_t NOT NULL DEFAULT 'original',
    storage_path TEXT NOT NULL,
    n_rows INT,
    n_cols INT,
    sha256 TEXT,
    excluded_rows INT[] NOT NULL DEFAULT '{}',
    exclusion_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_datasets_project_version UNIQUE (project_id, version)
);

COMMENT ON TABLE public.datasets IS 'Metadata versi dataset. Versi original bersifat immutable; perbaikan data dicatat sebagai derived version.';
COMMENT ON COLUMN public.datasets.excluded_rows IS 'Daftar nomor baris responden yang dikecualikan pada versi turunan ini.';

CREATE INDEX IF NOT EXISTS idx_datasets_project_version ON public.datasets(project_id, version);
CREATE INDEX IF NOT EXISTS idx_datasets_parent ON public.datasets(parent_dataset_id);

DROP TRIGGER IF EXISTS trg_datasets_updated_at ON public.datasets;
CREATE TRIGGER trg_datasets_updated_at
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger Perlindungan Immutabilitas Dataset Original
-- Mengapa: Memastikan bahwa meskipun ada panggilan query UPDATE atau DELETE langsung dari klien,
-- dataset bertipe original tetap dilindungi di level mesin database.
CREATE OR REPLACE FUNCTION public.prevent_original_dataset_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF TG_OP = 'UPDATE' AND OLD.kind = 'original' THEN
            RAISE EXCEPTION 'Akses ditolak: Dataset original bersifat immutable dan tidak boleh diubah. Buat versi turunan (derived).'
                USING ERRCODE = '42501';
        END IF;
        IF TG_OP = 'DELETE' AND OLD.kind = 'original' THEN
            RAISE EXCEPTION 'Akses ditolak: Dataset original bersifat permanen dan tidak dapat dihapus oleh pengguna.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_original_dataset_mutation ON public.datasets;
CREATE TRIGGER trg_prevent_original_dataset_mutation
    BEFORE UPDATE OR DELETE ON public.datasets
    FOR EACH ROW EXECUTE FUNCTION public.prevent_original_dataset_mutation();

-- RLS Datasets
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datasets_select_owner" ON public.datasets;
CREATE POLICY "datasets_select_owner"
    ON public.datasets FOR SELECT
    USING (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "datasets_insert_owner" ON public.datasets;
CREATE POLICY "datasets_insert_owner"
    ON public.datasets FOR INSERT
    WITH CHECK (public.is_project_owner(project_id));

-- Pengguna hanya boleh memperbarui dataset turunan miliknya (misal mengubah catatan eksklusi)
DROP POLICY IF EXISTS "datasets_update_derived_owner" ON public.datasets;
CREATE POLICY "datasets_update_derived_owner"
    ON public.datasets FOR UPDATE
    USING (public.is_project_owner(project_id) AND kind = 'derived')
    WITH CHECK (public.is_project_owner(project_id) AND kind = 'derived');

-- Pengguna hanya boleh menghapus dataset turunan miliknya; dataset original dilindungi
DROP POLICY IF EXISTS "datasets_delete_derived_owner" ON public.datasets;
CREATE POLICY "datasets_delete_derived_owner"
    ON public.datasets FOR DELETE
    USING (public.is_project_owner(project_id) AND kind = 'derived');

-- 4. Tabel Konstruk Penelitian (constructs)
-- Mengapa: Mengelompokkan butir-butir kuesioner skala Likert ke dalam variabel laten (mis. X1, X2, Y).
CREATE TABLE IF NOT EXISTS public.constructs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    item_columns TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.constructs IS 'Definisi variabel/konstruk penelitian yang menaungi butir indikator kuesioner.';

CREATE INDEX IF NOT EXISTS idx_constructs_project ON public.constructs(project_id);

DROP TRIGGER IF EXISTS trg_constructs_updated_at ON public.constructs;
CREATE TRIGGER trg_constructs_updated_at
    BEFORE UPDATE ON public.constructs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Constructs
ALTER TABLE public.constructs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constructs_select_owner" ON public.constructs;
CREATE POLICY "constructs_select_owner"
    ON public.constructs FOR SELECT
    USING (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "constructs_insert_owner" ON public.constructs;
CREATE POLICY "constructs_insert_owner"
    ON public.constructs FOR INSERT
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "constructs_update_owner" ON public.constructs;
CREATE POLICY "constructs_update_owner"
    ON public.constructs FOR UPDATE
    USING (public.is_project_owner(project_id))
    WITH CHECK (public.is_project_owner(project_id));

DROP POLICY IF EXISTS "constructs_delete_owner" ON public.constructs;
CREATE POLICY "constructs_delete_owner"
    ON public.constructs FOR DELETE
    USING (public.is_project_owner(project_id));

-- 5. Tabel Kolom Dataset (dataset_columns)
-- Mengapa: Memetakan peran setiap kolom (item indikator, demografi responden, variabel bebas, variabel terikat, atau abaikan).
CREATE TABLE IF NOT EXISTS public.dataset_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    inferred_type TEXT NOT NULL DEFAULT 'number',
    role role_t NOT NULL DEFAULT 'item',
    construct_id UUID REFERENCES public.constructs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.dataset_columns IS 'Definisi dan pemetaan peran statistik untuk setiap kolom dalam dataset.';

CREATE INDEX IF NOT EXISTS idx_dataset_columns_dataset ON public.dataset_columns(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_columns_construct ON public.dataset_columns(construct_id);

DROP TRIGGER IF EXISTS trg_dataset_columns_updated_at ON public.dataset_columns;
CREATE TRIGGER trg_dataset_columns_updated_at
    BEFORE UPDATE ON public.dataset_columns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Fungsi Pembantu Kepemilikan Dataset (is_dataset_owner)
CREATE OR REPLACE FUNCTION public.is_dataset_owner(p_dataset_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.datasets d
        JOIN public.projects p ON p.id = d.project_id
        WHERE d.id = p_dataset_id AND p.owner_id = auth.uid()
    );
$$;

-- RLS Dataset Columns
ALTER TABLE public.dataset_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dataset_columns_select_owner" ON public.dataset_columns;
CREATE POLICY "dataset_columns_select_owner"
    ON public.dataset_columns FOR SELECT
    USING (public.is_dataset_owner(dataset_id));

DROP POLICY IF EXISTS "dataset_columns_insert_owner" ON public.dataset_columns;
CREATE POLICY "dataset_columns_insert_owner"
    ON public.dataset_columns FOR INSERT
    WITH CHECK (public.is_dataset_owner(dataset_id));

DROP POLICY IF EXISTS "dataset_columns_update_owner" ON public.dataset_columns;
CREATE POLICY "dataset_columns_update_owner"
    ON public.dataset_columns FOR UPDATE
    USING (public.is_dataset_owner(dataset_id))
    WITH CHECK (public.is_dataset_owner(dataset_id));

DROP POLICY IF EXISTS "dataset_columns_delete_owner" ON public.dataset_columns;
CREATE POLICY "dataset_columns_delete_owner"
    ON public.dataset_columns FOR DELETE
    USING (public.is_dataset_owner(dataset_id));


-- >>>>> 0003_storage_buckets.sql <<<<<
-- 0003_storage_buckets.sql
-- Konfigurasi Storage Bucket privat dan kebijakan isolasi objek per pengguna.
-- Format path objek: {user_id}/{project_id}/{dataset_id}/{nama_berkas}

-- 1. Pembuatan Bucket Privat (datasets & exports)
-- Mengapa: Memastikan file penelitian tidak pernah dapat diakses publik tanpa autentikasi,
-- serta membatasi tipe MIME dan ukuran file demi keamanan server.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'datasets',
        'datasets',
        FALSE,
        10485760, -- 10 Megabytes
        ARRAY[
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/plain'
        ]
    ),
    (
        'exports',
        'exports',
        FALSE,
        15728640, -- 15 Megabytes
        ARRAY[
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ]
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Kebijakan RLS Storage Objects: Bucket datasets
-- Mengapa: Pengguna hanya boleh mengunggah dataset ke folder berawalan UUID miliknya sendiri: {user_id}/...
DROP POLICY IF EXISTS "storage_datasets_insert_own" ON storage.objects;
CREATE POLICY "storage_datasets_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Mengapa: Pengguna hanya boleh membaca file dataset di dalam foldernya sendiri.
DROP POLICY IF EXISTS "storage_datasets_select_own" ON storage.objects;
CREATE POLICY "storage_datasets_select_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Mengapa: Pengguna boleh memperbarui metadata file dataset di foldernya sendiri jika diperlukan.
DROP POLICY IF EXISTS "storage_datasets_update_own" ON storage.objects;
CREATE POLICY "storage_datasets_update_own"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Mengapa: Pengguna dapat menghapus objek dataset fisik miliknya sendiri saat proyek dihapus.
DROP POLICY IF EXISTS "storage_datasets_delete_own" ON storage.objects;
CREATE POLICY "storage_datasets_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Kebijakan RLS Storage Objects: Bucket exports
-- Mengapa: File Word/PDF hasil ekspor hanya dibuat dan diunggah oleh sistem backend (service_role).
-- Peran authenticated TIDAK memiliki izin INSERT/UPDATE langsung di bucket exports.

-- Mengapa: Pengguna hanya boleh membaca dan mengunduh berkas ekspor miliknya sendiri.
DROP POLICY IF EXISTS "storage_exports_select_own" ON storage.objects;
CREATE POLICY "storage_exports_select_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'exports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Mengapa: Pengguna dan sistem dapat menghapus arsip ekspor lama di foldernya sendiri.
DROP POLICY IF EXISTS "storage_exports_delete_own" ON storage.objects;
CREATE POLICY "storage_exports_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'exports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );


-- >>>>> 0004_analysis_queue.sql <<<<<
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


-- >>>>> 0005_billing_audit_config.sql <<<<<
-- 0005_billing_audit_config.sql
-- Struktur tabel penagihan, batas paket, konfigurasi retensi, dan jejak audit:
-- subscriptions, payments, usage_counters, plan_limits, app_config, dan audit_log.
-- Menegakkan kontrol ketat: data penagihan dan audit hanya dapat ditulis oleh service_role.

-- 1. Tabel Langganan Pengguna (subscriptions)
-- Mengapa: Menyimpan masa aktif paket bulanan / paket skripsi dari penyedia pembayaran (Midtrans).
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan plan_t NOT NULL DEFAULT 'free',
    status sub_status_t NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    provider TEXT NOT NULL DEFAULT 'midtrans',
    provider_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscriptions IS 'Status langganan pengguna; dimutasi secara eksklusif oleh webhook payment via service_role.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_ref ON public.subscriptions(provider_ref);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Subscriptions: Pengguna hanya boleh membaca; pembaruan hanya via service_role
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- 2. Tabel Transaksi Pembayaran (payments)
-- Mengapa: Mencatat riwayat pembayaran Midtrans. Idempoten berdasarkan provider_ref unik.
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_idr INT NOT NULL,
    status pay_status_t NOT NULL DEFAULT 'pending',
    provider_ref TEXT UNIQUE NOT NULL,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Riwayat tagihan dan verifikasi transaksi pembayaran Midtrans.';

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_ref);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Payments: Pengguna hanya boleh membaca tagihan miliknya; penulisan eksklusif oleh service_role
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
    ON public.payments FOR SELECT
    USING (user_id = auth.uid());

-- 3. Tabel Penghitung Penggunaan (usage_counters)
-- Mengapa: Membatasi kuota harian/bulanan (jumlah analisis, token AI, ekspor) sesuai tingkatan paket.
CREATE TABLE IF NOT EXISTS public.usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period DATE NOT NULL DEFAULT CURRENT_DATE,
    analyses_count INT NOT NULL DEFAULT 0,
    llm_tokens INT NOT NULL DEFAULT 0,
    exports_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usage_counters_user_period UNIQUE (user_id, period)
);

COMMENT ON TABLE public.usage_counters IS 'Penghitung penggunaan kuota analisis dan ekspor per pengguna per periode.';

CREATE INDEX IF NOT EXISTS idx_usage_counters_user_period ON public.usage_counters(user_id, period);

DROP TRIGGER IF EXISTS trg_usage_counters_updated_at ON public.usage_counters;
CREATE TRIGGER trg_usage_counters_updated_at
    BEFORE UPDATE ON public.usage_counters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Usage Counters: Pengguna hanya boleh melihat kuotanya sendiri
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_counters_select_own" ON public.usage_counters;
CREATE POLICY "usage_counters_select_own"
    ON public.usage_counters FOR SELECT
    USING (user_id = auth.uid());

-- 4. Tabel Konfigurasi Batas Paket (plan_limits)
-- Mengapa: Menyimpan batas kuota secara dinamis di database agar dapat diubah tanpa migrasi kode.
CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan plan_t NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (plan, key)
);

COMMENT ON TABLE public.plan_limits IS 'Definisi batas fitur per tier paket (kuota proyek, dataset, watermark).';

DROP TRIGGER IF EXISTS trg_plan_limits_updated_at ON public.plan_limits;
CREATE TRIGGER trg_plan_limits_updated_at
    BEFORE UPDATE ON public.plan_limits
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Plan Limits: Pengguna terautentikasi dapat membaca konfigurasi limit; penulisan oleh service_role
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_limits_select_auth" ON public.plan_limits;
CREATE POLICY "plan_limits_select_auth"
    ON public.plan_limits FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Isi konfigurasi default batas paket
INSERT INTO public.plan_limits (plan, key, value)
VALUES
    ('free', 'max_projects', '1'::jsonb),
    ('free', 'max_datasets_per_project', '1'::jsonb),
    ('free', 'watermark', 'true'::jsonb),
    ('free', 'allow_export', 'true'::jsonb),
    ('free', 'max_respondents', '200'::jsonb),
    ('free', 'monthly_analyses', '5'::jsonb),

    ('monthly', 'max_projects', '20'::jsonb),
    ('monthly', 'max_datasets_per_project', '10'::jsonb),
    ('monthly', 'watermark', 'false'::jsonb),
    ('monthly', 'allow_export', 'true'::jsonb),
    ('monthly', 'max_respondents', '5000'::jsonb),
    ('monthly', 'monthly_analyses', '100'::jsonb),

    ('thesis', 'max_projects', '50'::jsonb),
    ('thesis', 'max_datasets_per_project', '20'::jsonb),
    ('thesis', 'watermark', 'false'::jsonb),
    ('thesis', 'allow_export', 'true'::jsonb),
    ('thesis', 'max_respondents', '10000'::jsonb),
    ('thesis', 'monthly_analyses', '300'::jsonb)
ON CONFLICT (plan, key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Tabel Konfigurasi Sistem (app_config)
-- Mengapa: Pengaturan operasional aplikasi (masa retensi, batas timeout antrean) yang dapat disesuaikan.
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_config IS 'Konfigurasi global sistem OlahData.';

DROP TRIGGER IF EXISTS trg_app_config_updated_at ON public.app_config;
CREATE TRIGGER trg_app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS App Config: Dapat dibaca oleh pengguna terautentikasi; penulisan oleh service_role
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_select_auth" ON public.app_config;
CREATE POLICY "app_config_select_auth"
    ON public.app_config FOR SELECT
    USING (auth.role() = 'authenticated');

-- Nilai awal konfigurasi sistem
INSERT INTO public.app_config (key, value)
VALUES
    ('data_retention_days', '90'::jsonb),
    ('run_timeout_minutes', '10'::jsonb),
    ('max_run_attempts', '3'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. Tabel Jejak Audit Akademik (audit_log)
-- Aturan Keras: DILARANG menyimpan isi data responden kuesioner. Hanya menyimpan metadata kejadian.
-- Hanya service_role yang berhak menulis; pengguna hanya boleh membaca riwayat audit miliknya.
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Jejak audit integritas akademis dan tindakan pengguna tanpa memuat data responden.';

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);

-- RLS Audit Log: Pengguna hanya boleh membaca log miliknya sendiri; penulisan eksklusif oleh service_role
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_own" ON public.audit_log;
CREATE POLICY "audit_log_select_own"
    ON public.audit_log FOR SELECT
    USING (user_id = auth.uid());


-- >>>>> 0006_functions_retention_scheduling.sql <<<<<
-- 0006_functions_retention_scheduling.sql
-- Fungsi logika bisnis tingkat database:
-- 1. create_derived_dataset: Membuat dataset turunan dari eksklusi baris tanpa mengubah data asli.
-- 2. check_plan_limit: Memvalidasi kuota fitur berdasarkan tingkatan paket (plan_limits).
-- 3. purge_expired_data: Pembersihan dokumen ekspor dan dataset usang sesuai batas retensi.
-- 4. expire_subscriptions: Penurunan otomatis paket akun yang masa berlakunya telah habis.
-- 5. Penjadwalan cron otomatis (pg_cron) untuk pemeliharaan rutin.

-- 1. Fungsi create_derived_dataset
-- Mengapa: Memenuhi prinsip keras integritas data skripsi. Dataset original tidak pernah diubah;
-- setiap eliminasi responden (outlier/missing) membuat versi baru (derived) yang mereferensikan parent.
CREATE OR REPLACE FUNCTION public.create_derived_dataset(
    source_dataset_id UUID,
    p_excluded_rows INT[],
    p_note TEXT DEFAULT NULL
)
RETURNS public.datasets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_source public.datasets%ROWTYPE;
    v_new_version INT;
    v_new_dataset public.datasets%ROWTYPE;
    v_new_rows INT;
    v_excluded_count INT;
BEGIN
    -- 1. Ambil dataset sumber dan validasi hak milik proyek
    SELECT * INTO v_source
    FROM public.datasets
    WHERE id = source_dataset_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dataset sumber tidak ditemukan.' USING ERRCODE = 'P0002';
    END IF;

    IF NOT public.is_project_owner(v_source.project_id) THEN
        RAISE EXCEPTION 'Akses ditolak: Anda bukan pemilik sah dari proyek ini.' USING ERRCODE = '42501';
    END IF;

    -- 2. Hitung nomor versi berikutnya untuk proyek ini
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
    FROM public.datasets
    WHERE project_id = v_source.project_id;

    -- 3. Hitung jumlah baris efektif yang tersisa
    v_excluded_count := COALESCE(array_length(p_excluded_rows, 1), 0);
    v_new_rows := GREATEST(0, COALESCE(v_source.n_rows, 0) - v_excluded_count);

    -- 4. Buat record dataset turunan (derived)
    INSERT INTO public.datasets (
        project_id,
        version,
        parent_dataset_id,
        kind,
        storage_path,
        n_rows,
        n_cols,
        sha256,
        excluded_rows,
        exclusion_note
    )
    VALUES (
        v_source.project_id,
        v_new_version,
        v_source.id,
        'derived',
        v_source.storage_path, -- Mengacu pada berkas storage sumber; baris dikecualikan via filter
        v_new_rows,
        v_source.n_cols,
        v_source.sha256,
        COALESCE(p_excluded_rows, '{}'),
        p_note
    )
    RETURNING * INTO v_new_dataset;

    -- 5. Salin pemetaan kolom dari dataset sumber ke versi turunan baru
    INSERT INTO public.dataset_columns (
        dataset_id,
        position,
        name,
        inferred_type,
        role,
        construct_id
    )
    SELECT 
        v_new_dataset.id,
        col.position,
        col.name,
        col.inferred_type,
        col.role,
        col.construct_id
    FROM public.dataset_columns col
    WHERE col.dataset_id = v_source.id;

    -- 6. Catat riwayat ke audit log tanpa memuat isi jawaban kuesioner
    INSERT INTO public.audit_log (
        user_id,
        action,
        entity,
        entity_id,
        meta
    )
    VALUES (
        auth.uid(),
        'CREATE_DERIVED_DATASET',
        'datasets',
        v_new_dataset.id,
        jsonb_build_object(
            'project_id', v_source.project_id,
            'source_dataset_id', v_source.id,
            'version', v_new_version,
            'excluded_rows_count', v_excluded_count
        )
    );

    RETURN v_new_dataset;
END;
$$;

COMMENT ON FUNCTION public.create_derived_dataset(UUID, INT[], TEXT) IS 'Membuat versi dataset turunan dengan daftar baris yang dieksklusikan.';
GRANT EXECUTE ON FUNCTION public.create_derived_dataset(UUID, INT[], TEXT) TO authenticated, service_role;

-- 2. Fungsi check_plan_limit
-- Mengapa: Menerapkan batas kuota fitur berdasarkan tabel konfigurasi plan_limits.
CREATE OR REPLACE FUNCTION public.check_plan_limit(
    p_user_id UUID,
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_plan plan_t := 'free';
    v_max_projects INT;
    v_current_projects INT;
    v_max_datasets INT;
    v_current_datasets INT;
    v_monthly_analyses INT;
    v_current_analyses INT;
    v_watermark BOOLEAN;
BEGIN
    -- Ambil paket pengguna saat ini
    SELECT plan INTO v_user_plan
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_user_plan IS NULL THEN
        v_user_plan := 'free';
    END IF;

    -- Evaluasi berdasarkan aksi yang diminta
    IF p_action = 'create_project' THEN
        SELECT (value#>>'{}')::INT INTO v_max_projects
        FROM public.plan_limits
        WHERE plan = v_user_plan AND key = 'max_projects';

        SELECT COUNT(*) INTO v_current_projects
        FROM public.projects
        WHERE owner_id = p_user_id AND archived_at IS NULL;

        RETURN v_current_projects < COALESCE(v_max_projects, 1);

    ELSIF p_action = 'clean_export' THEN
        -- Mengecek apakah pengguna berhak ekspor tanpa tanda air (watermark = false)
        SELECT (value#>>'{}')::BOOLEAN INTO v_watermark
        FROM public.plan_limits
        WHERE plan = v_user_plan AND key = 'watermark';

        RETURN NOT COALESCE(v_watermark, TRUE);

    ELSIF p_action = 'run_analysis' THEN
        SELECT (value#>>'{}')::INT INTO v_monthly_analyses
        FROM public.plan_limits
        WHERE plan = v_user_plan AND key = 'monthly_analyses';

        SELECT COALESCE(SUM(analyses_count), 0) INTO v_current_analyses
        FROM public.usage_counters
        WHERE user_id = p_user_id
          AND period >= date_trunc('month', CURRENT_DATE)::DATE;

        RETURN v_current_analyses < COALESCE(v_monthly_analyses, 5);

    END IF;

    -- Default: izinkan aksi jika tidak ada batas khusus yang terdaftar
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.check_plan_limit(UUID, TEXT) IS 'Memverifikasi apakah kuota fitur pengguna mencukupi sesuai paketnya.';
GRANT EXECUTE ON FUNCTION public.check_plan_limit(UUID, TEXT) TO authenticated, service_role;

-- 3. Fungsi purge_expired_data
-- Mengapa: Membersihkan file ekspor sementara dan dataset kadaluwarsa sesuai retensi demi efisiensi storage.
CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_purged_exports INT := 0;
    v_retention_days INT := 90;
    v_threshold TIMESTAMPTZ;
BEGIN
    -- Ambil durasi retensi dari tabel app_config
    SELECT COALESCE((value#>>'{}')::INT, 90) INTO v_retention_days
    FROM public.app_config
    WHERE key = 'data_retention_days';

    v_threshold := NOW() - (v_retention_days || ' days')::INTERVAL;

    -- 1. Hapus dokumen ekspor yang masa berlakunya telah habis
    WITH deleted_exports AS (
        DELETE FROM public.exports
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_purged_exports FROM deleted_exports;

    -- 2. Catat aktivitas pembersihan ke audit_log
    IF v_purged_exports > 0 THEN
        INSERT INTO public.audit_log (
            action,
            entity,
            meta
        )
        VALUES (
            'PURGE_EXPIRED_DATA',
            'exports',
            jsonb_build_object(
                'purged_exports_count', v_purged_exports,
                'executed_at', NOW()
            )
        );
    END IF;

    RETURN v_purged_exports;
END;
$$;

COMMENT ON FUNCTION public.purge_expired_data() IS 'Menghapus dokumen ekspor sementara yang telah kadaluwarsa.';
REVOKE EXECUTE ON FUNCTION public.purge_expired_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_data() TO service_role;

-- 4. Fungsi expire_subscriptions
-- Mengapa: Menurunkan status paket langganan yang lewat jatuh tempo dan menurunkan akun ke paket free.
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_expired_count INT := 0;
    v_sub RECORD;
BEGIN
    -- Cari langganan yang sudah melewati tanggal akhir periode
    FOR v_sub IN
        SELECT id, user_id
        FROM public.subscriptions
        WHERE status = 'active'
          AND current_period_end IS NOT NULL
          AND current_period_end < NOW()
    LOOP
        -- Update status langganan menjadi expired
        UPDATE public.subscriptions
        SET status = 'expired',
            updated_at = NOW()
        WHERE id = v_sub.id;

        -- Jika pengguna tidak memiliki langganan aktif lainnya, turunkan profil ke free
        IF NOT EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE user_id = v_sub.user_id AND status = 'active' AND id <> v_sub.id
        ) THEN
            UPDATE public.profiles
            SET plan = 'free',
                plan_expires_at = NULL,
                updated_at = NOW()
            WHERE id = v_sub.user_id;
        END IF;

        v_expired_count := v_expired_count + 1;
    END LOOP;

    IF v_expired_count > 0 THEN
        INSERT INTO public.audit_log (
            action,
            entity,
            meta
        )
        VALUES (
            'EXPIRE_SUBSCRIPTIONS',
            'subscriptions',
            jsonb_build_object(
                'expired_count', v_expired_count,
                'executed_at', NOW()
            )
        );
    END IF;

    RETURN v_expired_count;
END;
$$;

COMMENT ON FUNCTION public.expire_subscriptions() IS 'Menonaktifkan langganan yang habis masa berlakunya dan menurunkan profil ke free.';
REVOKE EXECUTE ON FUNCTION public.expire_subscriptions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_subscriptions() TO service_role;

-- 5. Penjadwalan Pemeliharaan Otomatis via pg_cron (Jika ekstensi aktif di lingkungan hosting)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Periksa langganan kedaluwarsa setiap hari pukul 00:05
        PERFORM cron.schedule(
            'daily-expire-subscriptions',
            '5 0 * * *',
            'SELECT public.expire_subscriptions();'
        );
        -- Pembersihan data ekspor usang setiap hari Minggu pukul 02:00
        PERFORM cron.schedule(
            'weekly-purge-expired-data',
            '0 2 * * 0',
            'SELECT public.purge_expired_data();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;


-- >>>>> 0007_admin_analytics_audit.sql <<<<<
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


-- >>>>> 0008_waitlist_and_problem_reports.sql <<<<<
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


-- >>>>> 0009_storage_purge_queue_and_exports.sql <<<<<
-- =============================================================================
-- 0009_storage_purge_queue_and_exports.sql
-- Antrean pembersihan berkas fisik storage (storage_purge_queue)
-- dan penguncian privasi bucket exports (hanya Signed URL & pemilik).
-- =============================================================================

-- 1. Tabel Antrean Pembersihan Berkas Fisik (storage_purge_queue)
-- Menyimpan daftar path berkas di Supabase Storage yang dijadwalkan untuk dihapus permanen
-- oleh background worker via Storage API.
CREATE TABLE IF NOT EXISTS public.storage_purge_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'RETENTION_EXPIRED',
    scheduled_purge_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purged_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.storage_purge_queue IS 'Antrean berkas fisik storage yang dijadwalkan untuk dihapus lewat Storage API.';

-- Indeks antrean pembersihan
CREATE INDEX IF NOT EXISTS idx_purge_queue_status_scheduled ON public.storage_purge_queue (status, scheduled_purge_at);
CREATE INDEX IF NOT EXISTS idx_purge_queue_bucket_path ON public.storage_purge_queue (bucket_id, storage_path);

-- RLS: Hanya service_role yang berhak mengakses tabel antrean ini
ALTER TABLE public.storage_purge_queue ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.storage_purge_queue TO service_role;

-- 2. Fungsi Pembantu untuk Memasukkan Berkas ke Antrean Purge
CREATE OR REPLACE FUNCTION public.enqueue_storage_purge(
    p_bucket_id TEXT,
    p_storage_path TEXT,
    p_reason TEXT DEFAULT 'MANUAL_OR_EXPIRED',
    p_delay_hours INT DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.storage_purge_queue (
        bucket_id,
        storage_path,
        reason,
        scheduled_purge_at,
        status
    )
    VALUES (
        p_bucket_id,
        p_storage_path,
        p_reason,
        NOW() + (p_delay_hours || ' hours')::INTERVAL,
        'pending'
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.enqueue_storage_purge(TEXT, TEXT, TEXT, INT) IS 'Mendaftarkan berkas fisik storage ke dalam antrean pembersihan terjadwal.';
REVOKE EXECUTE ON FUNCTION public.enqueue_storage_purge(TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_storage_purge(TEXT, TEXT, TEXT, INT) TO authenticated, service_role;

-- 3. Trigger Otomatis saat Dokumen Ekspor Kadaluwarsa atau Dihapus
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

-- 4. Penguncian Bucket 'exports' (Privat & Signed URL Only)
-- Pastikan bucket exports berstatus privat (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    false,
    20971520, -- 20 MB maks
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

-- Kebijakan RLS Storage:
-- Pengguna hanya dapat membaca berkas ekspor miliknya sendiri (jalur format: {user_id}/{filename})
DO $$ BEGIN
    DROP POLICY IF EXISTS "exports_owner_read" ON storage.objects;
    CREATE POLICY "exports_owner_read"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
            bucket_id = 'exports' AND
            (auth.uid())::text = (storage.foldername(name))[1]
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "exports_owner_insert" ON storage.objects;
    CREATE POLICY "exports_owner_insert"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'exports' AND
            (auth.uid())::text = (storage.foldername(name))[1]
        );
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- >>>>> 0010_security_hardening_and_pdp.sql <<<<<
-- =============================================================================
-- 0010_security_hardening_and_pdp.sql
-- Pengerasan keamanan sistem, isolasi privasi admin (hanya metadata),
-- dan fungsi pemenuhan hak penghapusan akun mandiri selaras UU PDP (UU No. 27/2022).
-- =============================================================================

-- 1. Fungsi Validasi Admin dengan Whitelist Email Terverifikasi
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_email TEXT;
    v_verified BOOLEAN;
BEGIN
    v_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
    v_verified := COALESCE(
        (auth.jwt() ->> 'email_verified')::BOOLEAN,
        (auth.jwt() -> 'user_metadata' ->> 'email_verified')::BOOLEAN,
        FALSE
    );

    -- Hanya email yang tercantum secara eksplisit dalam whitelist yang diizinkan
    IF v_email IN ('bimdarmawa2@gmail.com', 'vrimae23@gmail.com') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.is_admin_user() IS 'Memvalidasi apakah pengguna saat ini adalah pemilik/admin sah OlahData.';
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, service_role;

-- 2. View Khusus Admin: Hanya Metadata Proyek, Tanpa Data Responden
-- Admin hanya dapat melihat ringkasan performa dan kesehatan sistem,
-- tidak pernah memiliki akses ke isi jawaban mentah kuesioner mahasiswa.
CREATE OR REPLACE VIEW public.v_admin_projects_safe AS
SELECT 
    p.id AS project_id,
    p.owner_id,
    p.title,
    p.created_at,
    p.updated_at,
    p.archived_at,
    prof.nama AS owner_nama,
    prof.email AS owner_email,
    prof.kampus AS owner_kampus,
    prof.plan AS owner_plan,
    (SELECT COUNT(*) FROM public.datasets d WHERE d.project_id = p.id) AS total_datasets,
    (SELECT MAX(d.n_rows) FROM public.datasets d WHERE d.project_id = p.id) AS respondent_count,
    (SELECT COUNT(*) FROM public.analysis_runs r WHERE r.project_id = p.id) AS total_runs
FROM public.projects p
JOIN public.profiles prof ON prof.id = p.owner_id;

COMMENT ON VIEW public.v_admin_projects_safe IS 'Tampilan administratif aman: hanya memuat metadata proyek tanpa eksposur data tanggapan responden.';

-- 3. Prosedur Pemenuhan Hak Penghapusan Akun & Data (UU PDP)
-- Mahasiswa berhak menghapus seluruh jejak data penelitian dan akun mereka secara mandiri.
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

    -- Validasi hak eksekusi: hanya pemilik akun yang bersangkutan atau admin/service_role
    IF v_caller IS DISTINCT FROM target_user_id AND NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki hak untuk menghapus akun ini.' USING ERRCODE = '42501';
    END IF;

    -- 1. Masukkan semua berkas dataset fisik pengguna ke antrean pembersihan storage
    FOR v_ds IN 
        SELECT d.storage_path 
        FROM public.datasets d 
        JOIN public.projects p ON p.id = d.project_id 
        WHERE p.owner_id = target_user_id AND d.storage_path IS NOT NULL AND d.storage_path != ''
    LOOP
        PERFORM public.enqueue_storage_purge('datasets', v_ds.storage_path, 'USER_ACCOUNT_DELETED', 0);
        v_enqueued_files := v_enqueued_files + 1;
    END LOOP;

    -- 2. Masukkan semua berkas ekspor fisik ke antrean pembersihan
    FOR v_exp IN 
        SELECT e.storage_path 
        FROM public.exports e 
        WHERE e.user_id = target_user_id AND e.storage_path IS NOT NULL AND e.storage_path != ''
    LOOP
        PERFORM public.enqueue_storage_purge('exports', v_exp.storage_path, 'USER_ACCOUNT_DELETED', 0);
        v_enqueued_files := v_enqueued_files + 1;
    END LOOP;

    -- 3. Hapus data relasional di database (terikat onDelete Cascade dari projects/profiles)
    DELETE FROM public.projects WHERE owner_id = target_user_id;
    DELETE FROM public.exports WHERE user_id = target_user_id;
    DELETE FROM public.subscriptions WHERE user_id = target_user_id;
    DELETE FROM public.payments WHERE user_id = target_user_id;
    DELETE FROM public.usage_counters WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 4. Catat peristiwa ke audit log (tanpa menyimpan data pribadi)
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

COMMENT ON FUNCTION public.delete_user_account_and_data(UUID) IS 'Menghapus permanen seluruh proyek, dataset, hasil, dan profil pengguna selaras UU PDP.';
GRANT EXECUTE ON FUNCTION public.delete_user_account_and_data(UUID) TO authenticated, service_role;
