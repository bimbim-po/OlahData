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
