-- =============================================================================
-- OLAHDATA RLS & SECURITY VERIFICATION SUITE (STANDALONE SQL)
-- Eksekusi langsung di Supabase SQL Editor untuk memverifikasi isolasi data.
-- =============================================================================

DO $$
DECLARE
    v_unprotected_tables INT;
    v_user_a UUID := '00000000-0000-0000-0000-000000000001';
    v_user_b UUID := '00000000-0000-0000-0000-000000000002';
    v_test_count INT;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'MEMULAI VERIFIKASI KEAMANAN & ROW LEVEL SECURITY (RLS)';
    RAISE NOTICE '=======================================================';

    -- -------------------------------------------------------------------------
    -- TEST 1: Verifikasi Seluruh Tabel Publik Memiliki RLS Aktif
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_unprotected_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity;

    IF v_unprotected_tables > 0 THEN
        RAISE EXCEPTION 'TEST 1 GAGAL: Ditemukan % tabel tanpa perlindungan RLS!', v_unprotected_tables;
    ELSE
        RAISE NOTICE '✓ TEST 1 LOLOS: Seluruh tabel publik (100%%) memiliki RLS AKTIF.';
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 2: Isolasi Proyek & Dataset Antar Pengguna (User A vs User B)
    -- -------------------------------------------------------------------------
    -- Simulasikan User A
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

    -- User A tidak boleh membaca proyek milik User B
    SELECT COUNT(*) INTO v_test_count
    FROM public.projects
    WHERE owner_id = v_user_b;

    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 2 GAGAL: User A dapat melihat % proyek milik User B!', v_test_count;
    ELSE
        RAISE NOTICE '✓ TEST 2 LOLOS: User A terisolasi penuh, 0 proyek User B dapat dibaca.';
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 3: User A Tidak Bisa Membaca Dataset Milik User B
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_test_count
    FROM public.datasets d
    JOIN public.projects p ON p.id = d.project_id
    WHERE p.owner_id = v_user_b;

    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 3 GAGAL: User A dapat melihat dataset milik User B!';
    ELSE
        RAISE NOTICE '✓ TEST 3 LOLOS: Dataset responden User B terlindungi dari User A.';
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 4: Anonimitas (Peran anon) Dilarang Membaca Tabel Pengguna
    -- -------------------------------------------------------------------------
    EXECUTE 'SET LOCAL ROLE anon';
    PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);

    -- Coba baca projects
    SELECT COUNT(*) INTO v_test_count FROM public.projects;
    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 4 GAGAL: Pengguna anonim dapat membaca tabel projects!';
    END IF;

    -- Coba baca profiles
    SELECT COUNT(*) INTO v_test_count FROM public.profiles;
    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 4 GAGAL: Pengguna anonim dapat membaca tabel profiles!';
    END IF;

    -- Coba baca datasets
    SELECT COUNT(*) INTO v_test_count FROM public.datasets;
    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 4 GAGAL: Pengguna anonim dapat membaca tabel datasets!';
    END IF;

    RAISE NOTICE '✓ TEST 4 LOLOS: Pengguna anonim diblokir 100%% dari membaca tabel pengguna.';

    -- -------------------------------------------------------------------------
    -- TEST 5: Anonimitas Diizinkan Menulis ke Waitlist (Dengan Validasi Email)
    -- -------------------------------------------------------------------------
    BEGIN
        INSERT INTO public.waitlist (name, email, plan, university)
        VALUES ('Penguji Beta Anonim', 'penguji.beta@kampus.ac.id', 'monthly', 'Universitas Indonesia');
        RAISE NOTICE '✓ TEST 5 LOLOS: Pengguna anonim berhasil mendaftar ke waitlist.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST 5 GAGAL: Pengguna anonim gagal menyisipkan data waitlist: %', SQLERRM;
    END;

    -- -------------------------------------------------------------------------
    -- TEST 6: Anonimitas DILARANG Membaca Data Waitlist
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_test_count FROM public.waitlist;
    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 6 GAGAL: Pengguna anonim dapat membaca baris waitlist (% baris terbaca)!', v_test_count;
    ELSE
        RAISE NOTICE '✓ TEST 6 LOLOS: Data waitlist tertutup rapat dari pembacaan anonim.';
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 7: Anonimitas Diizinkan Menulis ke Problem Reports, Dilarang Membaca
    -- -------------------------------------------------------------------------
    BEGIN
        INSERT INTO public.problem_reports (report_id, email, subject, description)
        VALUES ('RPT-TEST-001', 'pelapor@kampus.ac.id', 'Uji Lapor', 'Deskripsi pengujian sistem keamanan otomatis.');
        RAISE NOTICE '✓ TEST 7a LOLOS: Pengguna anonim berhasil mengirim tiket laporan masalah.';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'TEST 7a GAGAL: Pengguna anonim gagal mengirim problem_reports: %', SQLERRM;
    END;

    SELECT COUNT(*) INTO v_test_count FROM public.problem_reports;
    IF v_test_count > 0 THEN
        RAISE EXCEPTION 'TEST 7b GAGAL: Pengguna anonim dapat membaca baris problem_reports!';
    ELSE
        RAISE NOTICE '✓ TEST 7b LOLOS: Tiket problem_reports tidak dapat diintip oleh publik/anonim.';
    END IF;

    -- -------------------------------------------------------------------------
    -- TEST 8: Isolasi Admin Khusus Email Whitelist
    -- -------------------------------------------------------------------------
    -- Simulasikan pengguna biasa yang mencoba mengakses is_admin_user()
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims', '{"email": "mahasiswa.biasa@kampus.ac.id", "role": "authenticated"}', true);

    IF public.is_admin_user() THEN
        RAISE EXCEPTION 'TEST 8 GAGAL: Mahasiswa biasa diakui sebagai admin!';
    END IF;

    -- Simulasikan pemilik sah (bimdarmawa2@gmail.com)
    PERFORM set_config('request.jwt.claims', '{"email": "bimdarmawa2@gmail.com", "role": "authenticated", "email_verified": true}', true);

    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'TEST 8 GAGAL: Admin sah (bimdarmawa2@gmail.com) gagal divalidasi!';
    ELSE
        RAISE NOTICE '✓ TEST 8 LOLOS: Fungsi is_admin_user membatasi hak istimewa secara presisi.';
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SELURUH 8 PENGUJIAN KEAMANAN & RLS BERHASIL LOLOS 100%%!';
    RAISE NOTICE '=======================================================';
END;
$$;
