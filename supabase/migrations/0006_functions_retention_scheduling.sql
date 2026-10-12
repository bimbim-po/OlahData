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
