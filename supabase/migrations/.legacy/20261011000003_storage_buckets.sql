-- 20261011000003_storage_buckets.sql
-- Private Storage Buckets for raw datasets and generated exports

-- Insert storage buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('datasets', 'datasets', false, 10485760, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
    ('exports', 'exports', false, 15728640, ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Users can only upload, download, and delete files inside their own user ID folder
-- Pattern: {user_id}/{project_id}/{filename}

CREATE POLICY "Users can upload datasets to own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own datasets"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own datasets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'datasets' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read own exports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'exports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Service and user can delete exports"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'exports' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
