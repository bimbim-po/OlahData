-- supabase/tests/04_plan_limits_retention.sql
-- Pengujian pgTAP untuk batas kuota fitur (plan_limits),
-- pembersihan data kedaluwarsa (retensi), dan masa aktif langganan.

BEGIN;
SELECT plan(6);

SET LOCAL ROLE service_role;

-- 1. Uji Validasi Batas Paket: check_plan_limit
-- User B (Siti Rahma) berada pada paket 'free' (maksimal 1 proyek).
-- Siti sudah memiliki 1 proyek (Proyek 44444444).
SELECT is(
    public.check_plan_limit('00000000-0000-0000-0000-000000000002'::UUID, 'create_project'),
    FALSE,
    'check_plan_limit MENOLAK penambahan proyek baru untuk pengguna paket gratis yang telah mencapai batas'
);

-- User A (Budi Santoso) berada pada paket 'monthly' (maksimal 20 proyek).
-- Budi memiliki 3 proyek.
SELECT is(
    public.check_plan_limit('00000000-0000-0000-0000-000000000001'::UUID, 'create_project'),
    TRUE,
    'check_plan_limit MENGIZINKAN penambahan proyek untuk pengguna paket monthly'
);

-- 2. Uji Pembersihan Dokumen Ekspor Kedaluwarsa: purge_expired_data
-- Buat 1 ekspor yang sudah kedaluwarsa dan 1 ekspor yang masih aktif
INSERT INTO public.exports (id, run_id, format, storage_path, expires_at)
VALUES
    (
        'e1111111-1111-1111-1111-111111111111',
        'r1111111-1111-1111-1111-111111111111',
        'docx',
        'exports/expired_draft.docx',
        NOW() - INTERVAL '1 day'
    ),
    (
        'e2222222-2222-2222-2222-222222222222',
        'r1111111-1111-1111-1111-111111111111',
        'pdf',
        'exports/active_report.pdf',
        NOW() + INTERVAL '7 days'
    );

SELECT is(
    public.purge_expired_data(),
    1,
    'purge_expired_data berhasil menghapus tepat 1 berkas ekspor kedaluwarsa'
);

-- Dokumen yang belum kedaluwarsa harus tetap utuh
SELECT is(
    (SELECT COUNT(*)::INT FROM public.exports WHERE id = 'e2222222-2222-2222-2222-222222222222'),
    1,
    'Berkas ekspor aktif tetap utuh dan tidak terhapus'
);

-- 3. Uji Kedaluwarsa Langganan: expire_subscriptions
-- Buat langganan contoh yang masa aktifnya telah terlampaui
INSERT INTO public.subscriptions (id, user_id, plan, status, current_period_end, provider, provider_ref)
VALUES (
    's9999999-9999-9999-9999-999999999999',
    '00000000-0000-0000-0000-000000000002',
    'monthly',
    'active',
    NOW() - INTERVAL '2 hours',
    'midtrans',
    'sub_expired_test_001'
);

SELECT is(
    public.expire_subscriptions(),
    1,
    'expire_subscriptions berhasil menandai langganan yang lewat jatuh tempo'
);

-- Status langganan harus menjadi expired
SELECT is(
    (SELECT status FROM public.subscriptions WHERE id = 's9999999-9999-9999-9999-999999999999'),
    'expired'::sub_status_t,
    'Status langganan berubah menjadi expired'
);

SELECT * FROM finish();
ROLLBACK;
