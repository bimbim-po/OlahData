-- supabase/tests/01_rls_security.sql
-- Pengujian pgTAP untuk verifikasi Row Level Security (RLS) dan isolasi data per pengguna.
-- Dapat dijalankan via `supabase test db`.

BEGIN;
SELECT plan(15);

-- 1. Verifikasi Setiap Tabel di Schema public Memiliki RLS Aktif
-- Gagal jika ada tabel publik tanpa perlindungan relrowsecurity
SELECT ok(
    NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND NOT c.relrowsecurity
    ),
    'Semua tabel dalam schema public wajib memiliki Row Level Security (RLS) AKTIF'
);

-- 2. Verifikasi Isolasi Proyek: User A vs User B
-- Simulasikan peran sebagai User A (Budi Santoso: 00000000-0000-0000-0000-000000000001)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- User A hanya boleh melihat proyek miliknya (3 proyek), bukan proyek User B (Proyek 44444444)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.projects WHERE id = '44444444-4444-4444-4444-444444444444'),
    0,
    'User A TIDAK BISA membaca proyek milik User B'
);

-- Percobaan User A memperbarui proyek User B harus berdampak 0 baris
UPDATE public.projects
SET judul = 'Injeksi Judul Ilegal'
WHERE id = '44444444-4444-4444-4444-444444444444';

SELECT is(
    (SELECT judul FROM public.projects WHERE id = '44444444-4444-4444-4444-444444444444'),
    NULL,
    'User A TIDAK BISA memperbarui proyek milik User B'
);

-- Percobaan User A menghapus proyek User B harus berdampak 0 baris
DELETE FROM public.projects
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Beralih ke peran User B untuk memastikan datanya tetap utuh
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';
SELECT is(
    (SELECT COUNT(*)::INT FROM public.projects WHERE id = '44444444-4444-4444-4444-444444444444'),
    1,
    'Data proyek User B tetap utuh dan tidak terhapus oleh User A'
);

-- 3. Verifikasi Isolasi Dataset & Hasil Analisis
-- Kembali sebagai User B, coba akses dataset milik User A (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.datasets WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    0,
    'User B TIDAK BISA membaca dataset milik User A'
);

SELECT is(
    (SELECT COUNT(*)::INT FROM public.analysis_results WHERE id = 'res11111-1111-1111-1111-111111111111'),
    0,
    'User B TIDAK BISA membaca hasil analisis milik User A'
);

SELECT is(
    (SELECT COUNT(*)::INT FROM public.explanations WHERE id = 'exp11111-1111-1111-1111-111111111111'),
    0,
    'User B TIDAK BISA membaca narasi AI milik User A'
);

-- 4. Perlindungan Kolom profiles.plan dari Modifikasi Pengguna
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

-- Percobaan User B meng-upgrade paketnya sendiri dari 'free' ke 'monthly' harus diblokir oleh trigger
SELECT throws_ok(
    $$ UPDATE public.profiles SET plan = 'monthly' WHERE id = '00000000-0000-0000-0000-000000000002' $$,
    '42501',
    NULL,
    'Pengguna TIDAK BISA mengubah kolom profiles.plan secara mandiri (diblokir trigger)'
);

-- Pengguna tetap diizinkan memperbarui data wajar (nama, prodi) miliknya sendiri
PREPARE update_profile_safe AS
    UPDATE public.profiles SET prodi = 'Akuntansi Keuangan' WHERE id = '00000000-0000-0000-0000-000000000002';
SELECT lives_ok('update_profile_safe', 'Pengguna DAPAT memperbarui prodi profil miliknya sendiri');

-- 5. Perlindungan Tabel Penagihan & Keuangan (Subscriptions & Payments)
-- Pengguna tidak boleh menulis atau memanipulasi riwayat tagihan
SELECT throws_ok(
    $$ INSERT INTO public.subscriptions (user_id, plan, status) VALUES ('00000000-0000-0000-0000-000000000002', 'thesis', 'active') $$,
    NULL,
    NULL,
    'Pengguna TIDAK BISA menyisipkan baris subscriptions langsung'
);

SELECT throws_ok(
    $$ INSERT INTO public.payments (user_id, amount_idr, status, provider_ref) VALUES ('00000000-0000-0000-0000-000000000002', 0, 'paid', 'fake_pay_01') $$,
    NULL,
    NULL,
    'Pengguna TIDAK BISA menyisipkan pembayaran fiktif ke payments'
);

-- Pengguna tidak boleh memanipulasi angka analisis deterministik di analysis_results
SELECT throws_ok(
    $$ UPDATE public.analysis_results SET payload = '{"fake": true}'::jsonb WHERE id = 'res11111-1111-1111-1111-111111111111' $$,
    NULL,
    NULL,
    'Pengguna TIDAK BISA mengubah angka hasil hitung di analysis_results'
);

-- Pengguna tidak boleh menyisipkan log audit langsung
SELECT throws_ok(
    $$ INSERT INTO public.audit_log (user_id, action, entity) VALUES ('00000000-0000-0000-0000-000000000002', 'FAKE_AUDIT', 'projects') $$,
    NULL,
    NULL,
    'Pengguna TIDAK BISA menulis langsung ke audit_log'
);

-- 6. Isolasi Objek Storage
-- User B mencoba mengakses berkas di folder User A pada storage.objects
SELECT is(
    (SELECT COUNT(*)::INT FROM storage.objects WHERE bucket_id = 'datasets' AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'),
    0,
    'User B TIDAK BISA melihat objek storage di folder User A'
);

SELECT * FROM finish();
ROLLBACK;
