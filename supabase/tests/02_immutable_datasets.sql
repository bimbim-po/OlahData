-- supabase/tests/02_immutable_datasets.sql
-- Pengujian pgTAP untuk memverifikasi immutabilitas dataset original
-- dan fungsi create_derived_dataset untuk pembersihan data kuesioner.

BEGIN;
SELECT plan(6);

-- Set identitas sebagai User A (pemilik Proyek 1 dan Dataset aaaaaaaa)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

-- 1. Uji Larangan Memperbarui Dataset Original
SELECT throws_ok(
    $$ UPDATE public.datasets SET n_rows = 999 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
    '42501',
    NULL,
    'Dataset original DITOLAK saat dicoba di-UPDATE oleh pengguna (immutable)'
);

-- 2. Uji Larangan Menghapus Dataset Original
SELECT throws_ok(
    $$ DELETE FROM public.datasets WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
    '42501',
    NULL,
    'Dataset original DITOLAK saat dicoba di-DELETE oleh pengguna (permanen)'
);

-- 3. Uji Pembuatan Dataset Derived via create_derived_dataset
-- Mengecualikan 5 baris responden {10, 20, 30, 40, 50} dari dataset awal (120 baris)
DO $$
DECLARE
    v_derived public.datasets;
BEGIN
    v_derived := public.create_derived_dataset(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
        ARRAY[10, 20, 30, 40, 50],
        'Uji eksklusi 5 baris responden outlier'
    );
END $$;

-- Periksa apakah versi turunan baru berhasil dibuat dengan nomor versi increment (v3)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.datasets WHERE project_id = '11111111-1111-1111-1111-111111111111' AND kind = 'derived' AND version = 3),
    1,
    'Fungsi create_derived_dataset berhasil membuat versi 3 (derived)'
);

-- Periksa jumlah baris yang tersisa (120 - 5 = 115 baris)
SELECT is(
    (SELECT n_rows FROM public.datasets WHERE project_id = '11111111-1111-1111-1111-111111111111' AND version = 3),
    115,
    'Jumlah baris efektif pada versi turunan dihitung akurat (115 baris tersisa)'
);

-- Periksa apakah kolom dataset disalin dengan lengkap ke versi turunan baru
SELECT is(
    (SELECT COUNT(*)::INT FROM public.dataset_columns WHERE dataset_id = (SELECT id FROM public.datasets WHERE project_id = '11111111-1111-1111-1111-111111111111' AND version = 3)),
    21,
    'Seluruh pemetaan 21 kolom disalin ke versi derived baru'
);

-- 4. Pengguna dapat memperbarui catatan eksklusi pada dataset derived miliknya
PREPARE update_derived_note AS
    UPDATE public.datasets SET exclusion_note = 'Catatan revisi' WHERE project_id = '11111111-1111-1111-1111-111111111111' AND version = 3;
SELECT lives_ok('update_derived_note', 'Pengguna DAPAT memperbarui catatan pada dataset derived');

SELECT * FROM finish();
ROLLBACK;
