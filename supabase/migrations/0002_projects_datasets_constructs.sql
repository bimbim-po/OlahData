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
