-- supabase/seed.sql
-- Data awal untuk lingkungan pengujian dan pengembangan lokal.
-- Menyediakan 2 pengguna contoh, 4 proyek dengan status berbeda,
-- 1 dataset kuesioner skala Likert (120 responden x 18 butir indikator),
-- serta pemetaan konstruk dan hasil analisis deterministik.

-- 1. Inisialisasi Akun Auth Pengguna Contoh (User A & User B)
-- Menggunakan pgcrypto untuk hash kata sandi deterministik yang aman
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'budi.santoso@ui.ac.id',
        crypt('Mahasiswa2026!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"nama":"Budi Santoso","prodi":"Manajemen","kampus":"Universitas Indonesia"}'::jsonb,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'siti.rahma@ugm.ac.id',
        crypt('Mahasiswa2026!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"nama":"Siti Rahma","prodi":"Akuntansi","kampus":"Universitas Gadjah Mada"}'::jsonb,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 2. Profil Mahasiswa
-- User A: Langganan bulanan aktif
-- User B: Paket gratis (free)
INSERT INTO public.profiles (id, nama, prodi, kampus, plan, plan_expires_at)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'Budi Santoso',
        'Manajemen',
        'Universitas Indonesia',
        'monthly',
        NOW() + INTERVAL '30 days'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Siti Rahma',
        'Akuntansi',
        'Universitas Gadjah Mada',
        'free',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    prodi = EXCLUDED.prodi,
    kampus = EXCLUDED.kampus,
    plan = EXCLUDED.plan,
    plan_expires_at = EXCLUDED.plan_expires_at;

-- 3. Proyek Penelitian Contoh
INSERT INTO public.projects (id, owner_id, judul, prodi, status, archived_at)
VALUES
    -- Proyek Milik User A (Budi Santoso)
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000001',
        'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan (Data Contoh)',
        'Manajemen Pemasaran',
        'completed',
        NULL
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000001',
        'Analisis Faktor Keputusan Pembelian Produk Ramah Lingkungan',
        'Manajemen Pemasaran',
        'draft',
        NULL
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000001',
        'Pengaruh Disiplin dan Kompensasi terhadap Kinerja Karyawan',
        'Manajemen SDM',
        'queued',
        NULL
    ),
    -- Proyek Milik User B (Siti Rahma) - Untuk Verifikasi Isolasi RLS
    (
        '44444444-4444-4444-4444-444444444444',
        '00000000-0000-0000-0000-000000000002',
        'Pengaruh Transparansi Laporan Keuangan terhadap Kepercayaan Publik',
        'Akuntansi Sektor Publik',
        'draft',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    judul = EXCLUDED.judul,
    status = EXCLUDED.status;

-- 4. Dataset Contoh: 120 Responden x 18 Butir Indikator Skala Likert
-- Dataset Original Proyek 1
INSERT INTO public.datasets (
    id,
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
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        1,
        NULL,
        'original',
        '00000000-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/v1_original.csv',
        120,
        21,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        '{}',
        'Dataset awal kuesioner skala Likert (120 responden, 18 butir indikator + 3 demografi)'
    ),
    -- Dataset Derived (Hasil Pembersihan Data)
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        2,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'derived',
        '00000000-0000-0000-0000-000000000001/11111111-1111-1111-1111-111111111111/v1_original.csv',
        117,
        21,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        '{45, 78, 112}',
        'Eksklusi 3 baris responden outlier berdasarkan uji Z-Score'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Variabel / Konstruk Penelitian
INSERT INTO public.constructs (id, project_id, name, item_columns)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'Kualitas Layanan (X1)',
        ARRAY['KL_1', 'KL_2', 'KL_3', 'KL_4', 'KL_5', 'KL_6']
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Kepuasan Pelanggan (X2)',
        ARRAY['KP_1', 'KP_2', 'KP_3', 'KP_4', 'KP_5', 'KP_6']
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'Loyalitas Pelanggan (Y)',
        ARRAY['LP_1', 'LP_2', 'LP_3', 'LP_4', 'LP_5', 'LP_6']
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Pemetaan Kolom Dataset (dataset_columns)
INSERT INTO public.dataset_columns (dataset_id, position, name, inferred_type, role, construct_id)
VALUES
    -- Kolom Demografi
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'ID_Responden', 'string', 'abaikan', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Jenis_Kelamin', 'string', 'demografi', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Usia', 'number', 'demografi', NULL),
    -- Indikator X1
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'KL_1', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'KL_2', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, 'KL_3', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, 'KL_4', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 'KL_5', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 9, 'KL_6', 'number', 'item', 'c1111111-1111-1111-1111-111111111111'),
    -- Indikator X2
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10, 'KP_1', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 11, 'KP_2', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12, 'KP_3', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 13, 'KP_4', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 14, 'KP_5', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 15, 'KP_6', 'number', 'item', 'c2222222-2222-2222-2222-222222222222'),
    -- Indikator Y
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 16, 'LP_1', 'number', 'item', 'c3333333-3333-3333-3333-333333333333'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 17, 'LP_2', 'number', 'item', 'c3333333-3333-3333-3333-333333333333'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 18, 'LP_3', 'number', 'item', 'c3333333-3333-3333-3333-333333333333'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 19, 'LP_4', 'number', 'item', 'c3333333-3333-3333-3333-333333333333'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 20, 'LP_5', 'number', 'item', 'c3333333-3333-3333-3333-333333333333'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 21, 'LP_6', 'number', 'item', 'c3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Salin kolom ke dataset turunan bbbbbbbb
INSERT INTO public.dataset_columns (dataset_id, position, name, inferred_type, role, construct_id)
SELECT 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', position, name, inferred_type, role, construct_id
FROM public.dataset_columns
WHERE dataset_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ON CONFLICT (id) DO NOTHING;

-- 7. Antrean dan Hasil Analisis
INSERT INTO public.analysis_runs (
    id,
    project_id,
    dataset_id,
    tests,
    params,
    status,
    progress,
    engine_version,
    started_at,
    finished_at
)
VALUES
    (
        'r1111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        ARRAY['descriptive', 'validity', 'reliability', 'normality', 'multicollinearity', 'heteroscedasticity', 'f_test', 't_test', 'determination'],
        '{"confidence_level": 0.95}'::jsonb,
        'succeeded',
        '{"completed_tests": 9, "total_tests": 9}'::jsonb,
        '1.0.0',
        NOW() - INTERVAL '5 minutes',
        NOW() - INTERVAL '4 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- Hasil Uji Reliabilitas
INSERT INTO public.analysis_results (
    id,
    run_id,
    test_key,
    payload,
    table_rows,
    warnings
)
VALUES
    (
        'res11111-1111-1111-1111-111111111111',
        'r1111111-1111-1111-1111-111111111111',
        'reliability',
        '{"cronbach_alpha": {"X1": 0.884, "X2": 0.852, "Y": 0.912}, "n_items": 18, "threshold": 0.70}'::jsonb,
        '[{"variabel": "Kualitas Layanan (X1)", "cronbach_alpha": "0,884", "status": "Reliabel", "keterangan": "Tinggi (> 0,70)"}, {"variabel": "Kepuasan Pelanggan (X2)", "cronbach_alpha": "0,852", "status": "Reliabel", "keterangan": "Tinggi (> 0,70)"}, {"variabel": "Loyalitas Pelanggan (Y)", "cronbach_alpha": "0,912", "status": "Reliabel", "keterangan": "Sangat Tinggi (> 0,70)"}]'::jsonb,
        '[]'::jsonb
    )
ON CONFLICT (id) DO NOTHING;

-- Penjelasan Akademik AI
INSERT INTO public.explanations (
    id,
    result_id,
    text,
    numbers_used,
    model,
    prompt_version,
    guard_passed,
    attempts
)
VALUES
    (
        'exp11111-1111-1111-1111-111111111111',
        'res11111-1111-1111-1111-111111111111',
        'Berdasarkan hasil uji reliabilitas instrumen dengan koefisien Cronbach''s Alpha, variabel Kualitas Layanan (X1) memiliki nilai 0,884, Kepuasan Pelanggan (X2) sebesar 0,852, dan Loyalitas Pelanggan (Y) sebesar 0,912. Seluruh variabel memiliki nilai di atas ambang batas 0,70, sehingga seluruh butir kuesioner dinyatakan reliabel dan dapat diandalkan untuk pengujian hipotesis.',
        '["0.884", "0.852", "0.912", "0.70"]'::jsonb,
        'gemini-2.5-pro',
        'v1',
        TRUE,
        1
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Langganan dan Transaksi Midtrans
INSERT INTO public.subscriptions (
    id,
    user_id,
    plan,
    status,
    current_period_end,
    provider,
    provider_ref
)
VALUES
    (
        's1111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000001',
        'monthly',
        'active',
        NOW() + INTERVAL '30 days',
        'midtrans',
        'sub_order_budi_001'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (
    id,
    user_id,
    amount_idr,
    status,
    provider_ref,
    raw,
    paid_at
)
VALUES
    (
        'p1111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000001',
        39000,
        'paid',
        'pay_midtrans_budi_001',
        '{"transaction_status": "settlement", "payment_type": "gopay"}'::jsonb,
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Jejak Audit Awal
INSERT INTO public.audit_log (user_id, action, entity, entity_id, meta)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'UPLOAD_DATASET',
        'datasets',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '{"filename": "kuesioner_layanan_120.csv", "rows": 120, "columns": 21}'::jsonb
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'RUN_ANALYSIS',
        'analysis_runs',
        'r1111111-1111-1111-1111-111111111111',
        '{"engine_version": "1.0.0", "tests_count": 9}'::jsonb
    );
