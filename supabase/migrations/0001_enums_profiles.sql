-- 0001_enums_profiles.sql
-- Inisialisasi ekstensi, tipe data enum, fungsi utilitas timestamp,
-- tabel profil pengguna yang terhubung dengan Supabase Auth, serta trigger pencegah manipulasi paket.

-- 1. Ekstensi Kriptografi & UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Definisi Tipe Data Enum Terstandar
-- Menggunakan blok idempoten agar aman dieksekusi berulang kali.
DO $$ BEGIN
    CREATE TYPE plan_t AS ENUM ('free', 'monthly', 'thesis');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE role_t AS ENUM ('item', 'demografi', 'bebas', 'terikat', 'abaikan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE dataset_kind_t AS ENUM ('original', 'derived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE run_status_t AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE export_format_t AS ENUM ('docx', 'pdf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sub_status_t AS ENUM ('active', 'past_due', 'expired', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pay_status_t AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Fungsi Utilitas Pembaruan Timestamp (updated_at)
-- Mengapa: Memastikan jejak waktu pembaruan baris konsisten dan otomatis tanpa bergantung pada klien.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 4. Tabel Profil Pengguna (profiles)
-- Mengapa: Menyimpan atribut akademis mahasiswa (prodi, kampus) dan tingkatan langganan aktif,
-- terpisah dari data autentikasi sensitif auth.users demi kepatuhan prinsip least-privilege.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT,
    prodi TEXT,
    kampus TEXT,
    plan plan_t NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Profil akademis mahasiswa dan status tier langganan yang terikat dengan Supabase Auth.';
COMMENT ON COLUMN public.profiles.plan IS 'Tingkatan paket pengguna (free, monthly, thesis); hanya dapat dimutasi oleh service_role.';

-- Trigger otomatis untuk updated_at pada profiles
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Trigger Pembuatan Profil Otomatis saat Registrasi Pengguna Baru
-- Mengapa: Menjamin setiap akun yang terdaftar di auth.users selalu memiliki baris profil dengan paket dasar free.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, nama, prodi, kampus, plan, plan_expires_at)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nama',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            'Mahasiswa'
        ),
        COALESCE(NEW.raw_user_meta_data->>'prodi', 'Umum'),
        NEW.raw_user_meta_data->>'kampus',
        'free',
        NULL
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Pencegahan Manipulasi Kolom Paket (plan & plan_expires_at)
-- Mengapa: Memilih pola trigger daripada pemisahan tabel untuk menjaga ergonomi query dan performa
-- (tanpa beban JOIN tambahan pada setiap interaksi), sembari menjamin di level kernel Postgres
-- bahwa pengguna (role authenticated) tidak dapat meng-upgrade akunnya sendiri secara ilegal.
CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF (NEW.plan IS DISTINCT FROM OLD.plan) OR (NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at) THEN
            RAISE EXCEPTION 'Akses ditolak: Kolom plan dan plan_expires_at hanya dapat diperbarui oleh sistem (service_role).'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_plan ON public.profiles;
CREATE TRIGGER trg_protect_profile_plan
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_plan();

-- 7. Kebijakan Row Level Security (RLS) pada Tabel profiles
-- Aturan keras: RLS aktif, default ditolak.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mengapa: Pengguna hanya boleh melihat data profil milik diri sendiri demi kerahasiaan data mahasiswa.
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Mengapa: Pengguna boleh memperbarui nama, prodi, dan kampus milik sendiri. Kolom plan dilindungi oleh trigger.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Mengapa: Mengizinkan inisialisasi baris profil mandiri jika alur onboarding klien membutuhkannya.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
