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
