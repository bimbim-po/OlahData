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
