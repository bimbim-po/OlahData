-- 0005_billing_audit_config.sql
-- Struktur tabel penagihan, batas paket, konfigurasi retensi, dan jejak audit:
-- subscriptions, payments, usage_counters, plan_limits, app_config, dan audit_log.
-- Menegakkan kontrol ketat: data penagihan dan audit hanya dapat ditulis oleh service_role.

-- 1. Tabel Langganan Pengguna (subscriptions)
-- Mengapa: Menyimpan masa aktif paket bulanan / paket skripsi dari penyedia pembayaran (Midtrans).
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan plan_t NOT NULL DEFAULT 'free',
    status sub_status_t NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    provider TEXT NOT NULL DEFAULT 'midtrans',
    provider_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.subscriptions IS 'Status langganan pengguna; dimutasi secara eksklusif oleh webhook payment via service_role.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_ref ON public.subscriptions(provider_ref);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Subscriptions: Pengguna hanya boleh membaca; pembaruan hanya via service_role
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- 2. Tabel Transaksi Pembayaran (payments)
-- Mengapa: Mencatat riwayat pembayaran Midtrans. Idempoten berdasarkan provider_ref unik.
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_idr INT NOT NULL,
    status pay_status_t NOT NULL DEFAULT 'pending',
    provider_ref TEXT UNIQUE NOT NULL,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Riwayat tagihan dan verifikasi transaksi pembayaran Midtrans.';

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider_ref);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Payments: Pengguna hanya boleh membaca tagihan miliknya; penulisan eksklusif oleh service_role
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
    ON public.payments FOR SELECT
    USING (user_id = auth.uid());

-- 3. Tabel Penghitung Penggunaan (usage_counters)
-- Mengapa: Membatasi kuota harian/bulanan (jumlah analisis, token AI, ekspor) sesuai tingkatan paket.
CREATE TABLE IF NOT EXISTS public.usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period DATE NOT NULL DEFAULT CURRENT_DATE,
    analyses_count INT NOT NULL DEFAULT 0,
    llm_tokens INT NOT NULL DEFAULT 0,
    exports_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_usage_counters_user_period UNIQUE (user_id, period)
);

COMMENT ON TABLE public.usage_counters IS 'Penghitung penggunaan kuota analisis dan ekspor per pengguna per periode.';

CREATE INDEX IF NOT EXISTS idx_usage_counters_user_period ON public.usage_counters(user_id, period);

DROP TRIGGER IF EXISTS trg_usage_counters_updated_at ON public.usage_counters;
CREATE TRIGGER trg_usage_counters_updated_at
    BEFORE UPDATE ON public.usage_counters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Usage Counters: Pengguna hanya boleh melihat kuotanya sendiri
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usage_counters_select_own" ON public.usage_counters;
CREATE POLICY "usage_counters_select_own"
    ON public.usage_counters FOR SELECT
    USING (user_id = auth.uid());

-- 4. Tabel Konfigurasi Batas Paket (plan_limits)
-- Mengapa: Menyimpan batas kuota secara dinamis di database agar dapat diubah tanpa migrasi kode.
CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan plan_t NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (plan, key)
);

COMMENT ON TABLE public.plan_limits IS 'Definisi batas fitur per tier paket (kuota proyek, dataset, watermark).';

DROP TRIGGER IF EXISTS trg_plan_limits_updated_at ON public.plan_limits;
CREATE TRIGGER trg_plan_limits_updated_at
    BEFORE UPDATE ON public.plan_limits
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Plan Limits: Pengguna terautentikasi dapat membaca konfigurasi limit; penulisan oleh service_role
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_limits_select_auth" ON public.plan_limits;
CREATE POLICY "plan_limits_select_auth"
    ON public.plan_limits FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Isi konfigurasi default batas paket
INSERT INTO public.plan_limits (plan, key, value)
VALUES
    ('free', 'max_projects', '1'::jsonb),
    ('free', 'max_datasets_per_project', '1'::jsonb),
    ('free', 'watermark', 'true'::jsonb),
    ('free', 'allow_export', 'true'::jsonb),
    ('free', 'max_respondents', '200'::jsonb),
    ('free', 'monthly_analyses', '5'::jsonb),

    ('monthly', 'max_projects', '20'::jsonb),
    ('monthly', 'max_datasets_per_project', '10'::jsonb),
    ('monthly', 'watermark', 'false'::jsonb),
    ('monthly', 'allow_export', 'true'::jsonb),
    ('monthly', 'max_respondents', '5000'::jsonb),
    ('monthly', 'monthly_analyses', '100'::jsonb),

    ('thesis', 'max_projects', '50'::jsonb),
    ('thesis', 'max_datasets_per_project', '20'::jsonb),
    ('thesis', 'watermark', 'false'::jsonb),
    ('thesis', 'allow_export', 'true'::jsonb),
    ('thesis', 'max_respondents', '10000'::jsonb),
    ('thesis', 'monthly_analyses', '300'::jsonb)
ON CONFLICT (plan, key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Tabel Konfigurasi Sistem (app_config)
-- Mengapa: Pengaturan operasional aplikasi (masa retensi, batas timeout antrean) yang dapat disesuaikan.
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_config IS 'Konfigurasi global sistem OlahData.';

DROP TRIGGER IF EXISTS trg_app_config_updated_at ON public.app_config;
CREATE TRIGGER trg_app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS App Config: Dapat dibaca oleh pengguna terautentikasi; penulisan oleh service_role
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_config_select_auth" ON public.app_config;
CREATE POLICY "app_config_select_auth"
    ON public.app_config FOR SELECT
    USING (auth.role() = 'authenticated');

-- Nilai awal konfigurasi sistem
INSERT INTO public.app_config (key, value)
VALUES
    ('data_retention_days', '90'::jsonb),
    ('run_timeout_minutes', '10'::jsonb),
    ('max_run_attempts', '3'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. Tabel Jejak Audit Akademik (audit_log)
-- Aturan Keras: DILARANG menyimpan isi data responden kuesioner. Hanya menyimpan metadata kejadian.
-- Hanya service_role yang berhak menulis; pengguna hanya boleh membaca riwayat audit miliknya.
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Jejak audit integritas akademis dan tindakan pengguna tanpa memuat data responden.';

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);

-- RLS Audit Log: Pengguna hanya boleh membaca log miliknya sendiri; penulisan eksklusif oleh service_role
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_own" ON public.audit_log;
CREATE POLICY "audit_log_select_own"
    ON public.audit_log FOR SELECT
    USING (user_id = auth.uid());
