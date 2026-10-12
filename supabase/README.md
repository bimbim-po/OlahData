# Panduan Arsitektur & Manajemen Database OlahData (Supabase + Postgres)

Dokumentasi ini menjelaskan konfigurasi, arsitektur keamanan, manajemen migrasi, dan pengujian untuk seluruh lapisan database aplikasi **OlahData** menggunakan **Supabase** dan **Postgres**.

---

## 1. Prinsip & Aturan Keras Database

1. **100% Row Level Security (RLS) Aktif**: Semua tabel di schema `public` memiliki RLS aktif. Akses default selalu **DITOLAK** (`RESTRICTIVE` by default). Tidak ada celah data bocor antar pengguna.
2. **Pemilik Sah (`auth.uid()`)**: Pengguna terautentikasi hanya dapat mengakses dan memanipulasi data miliknya sendiri. Tabel-tabel turunan (`datasets`, `constructs`, `dataset_columns`, `analysis_runs`, dll.) memvalidasi kepemilikan melalui fungsi `is_project_owner(project_id UUID) SECURITY DEFINER` dengan `search_path` terkunci.
3. **Immutabilitas Dataset Original**: Baris dataset bertipe `original` **TIDAK BISA DIUBAH ATAU DIHAPUS** oleh pengguna (`authenticated`). Setiap pembersihan data atau pembuangan outlier menghasilkan versi baru (`kind = 'derived'`) yang mencatat daftar baris tereksklusi (`excluded_rows INT[]`).
4. **Integritas Jawaban Kuesioner**: Tidak ada tabel, kolom, fungsi, atau trigger yang membuat, menyimulasikan, atau memodifikasi respon data mahasiswa.
5. **Isolasi Kunci `service_role`**: Pengguna browser **tidak pernah** memegang `service_role`. Operasi antrean statistik Python, webhook pembayaran Midtrans, dan pembaruan paket akun hanya dijalankan oleh server melalui `service_role`.
6. **Perlindungan Kolom Paket**: Kolom `plan` dan `plan_expires_at` pada tabel `profiles` dilindungi oleh trigger `protect_profile_plan()` di level database, sehingga pengguna tidak dapat meng-upgrade akunnya sendiri secara ilegal.

---

## 2. Struktur Migrasi (`supabase/migrations/`)

Seluruh migrasi bersifat idempoten, berurutan, dan terstruktur sesuai tahapan arsitektur:

| Berkas Migrasi | Deskripsi |
| :--- | :--- |
| `0001_enums_profiles.sql` | Inisialisasi enum (`plan_t`, `role_t`, `dataset_kind_t`, `run_status_t`, dll.), tabel `profiles`, trigger `set_updated_at`, trigger `handle_new_user` saat pendaftaran, dan trigger `protect_profile_plan`. |
| `0002_projects_datasets_constructs.sql` | Fungsi pembantu `is_project_owner`, tabel `projects`, tabel `datasets` (kebijakan & trigger immutabilitas), tabel `constructs`, dan tabel `dataset_columns`. |
| `0003_storage_buckets.sql` | Pembuatan bucket privat `datasets` (10 MB, filter MIME CSV/Excel) dan `exports` (15 MB, DOCX/PDF), serta kebijakan isolasi path `{user_id}/...`. |
| `0004_analysis_queue.sql` | Antrean worker `analysis_runs`, single source of truth `analysis_results`, narasi AI `explanations`, `exports`, serta fungsi antrean: `claim_next_run` (SKIP LOCKED), `complete_run`, `fail_run`, dan `requeue_stuck_runs`. |
| `0005_billing_audit_config.sql` | Tabel transaksi `subscriptions`, `payments` (Midtrans idempotency), `usage_counters`, konfigurasi kuota `plan_limits`, `app_config`, dan `audit_log` (tanpa data responden). |
| `0006_functions_retention_scheduling.sql` | Fungsi bisnis: `create_derived_dataset`, `check_plan_limit`, `purge_expired_data`, `expire_subscriptions`, dan penjadwalan `pg_cron`. |

---

## 3. Menjalankan di Lingkungan Lokal (Supabase CLI)

### Prasyarat:
- [Docker Desktop](https://www.docker.com/) terinstal dan berjalan.
- [Node.js](https://nodejs.org/) versi 18+.

### Perintah Utama:
```bash
# 1. Jalankan stack lokal Supabase (Postgres, Auth, Storage, Studio)
npx supabase start

# 2. Reset database dari nol dan aplikasikan semua migrasi + data seed
npx supabase db reset

# 3. Jalankan rangkaian pengujian otomatis (pgTAP)
npx supabase test db

# 4. Hasilkan definisi tipe TypeScript untuk Next.js
npm run gen-types
# atau
node scripts/gen-types.mjs
```

Setelah `supabase start` berhasil dijalankan, Supabase Studio dapat diakses di browser pada:
`http://127.0.0.1:54323`

---

## 4. Pengaturan Manual di Supabase Cloud Dashboard

Beberapa konfigurasi keamanan dan integrasi penyedia pihak ketiga harus diatur langsung melalui Dashboard Supabase:

### A. Autentikasi & URL Redirect
1. Buka **Authentication -> URL Configuration**:
   - **Site URL**: `https://olah-data.pages.dev` (atau `http://localhost:3000` saat pengujian lokal).
   - **Redirect URLs**:
     - `https://olah-data.pages.dev/**`
     - `http://localhost:3000/**`
     - `http://127.0.0.1:3000/**`

### B. Penyedia Google OAuth (Login dengan Akun Kampus)
1. Buka **Authentication -> Providers -> Google**:
   - Aktifkan toggle **Enable Google Provider**.
   - Masukkan **Client ID** dan **Client Secret** dari Google Cloud Console.
   - Salin **Callback URL (for OAuth)**:
     `https://<project-ref>.supabase.co/auth/v1/callback`
   - Daftarkan URL callback tersebut di Google Cloud Console pada bagian **Authorized redirect URIs**.

### C. Templat Email Bahasa Indonesia
Buka **Authentication -> Email Templates**:
- **Konfirmasi Pendaftaran (Confirm Signup)**:
  - *Subjek*: `Konfirmasi Pendaftaran Akun OlahData`
  - *Konten*:
    ```html
    <h2>Selamat Datang di OlahData</h2>
    <p>Halo,</p>
    <p>Terima kasih telah mendaftar. Klik tautan berikut untuk mengaktifkan akun penelitian Anda:</p>
    <p><a href="{{ .ConfirmationURL }}">Konfirmasi Alamat Email Saya</a></p>
    <p>Jika Anda tidak merasa mendaftar di OlahData, abaikan email ini.</p>
    ```
- **Reset Kata Sandi (Reset Password)**:
  - *Subjek*: `Permintaan Pemulihan Kata Sandi Akun OlahData`
  - *Konten*:
    ```html
    <h2>Pemulihan Kata Sandi</h2>
    <p>Halo,</p>
    <p>Klik tautan di bawah ini untuk mengatur ulang kata sandi akun Anda:</p>
    <p><a href="{{ .ConfirmationURL }}">Atur Ulang Kata Sandi</a></p>
    ```

---

## 5. Cara Deploy Migrasi ke Proyek Cloud

```bash
# 1. Login ke akun Supabase via CLI
npx supabase login

# 2. Tautkan proyek lokal dengan proyek cloud
npx supabase link --project-ref <PROJECT_REFERENCE_ID>

# 3. Terapkan migrasi ke cloud database
npx supabase db push

# 4. Verifikasi status sinkronisasi
npx supabase migration list
```

---

## 6. Matriks Keamanan & Hak Akses (RLS)

| Tabel / Objek | Peran `anon` | Peran `authenticated` | Peran `service_role` (Server Only) |
| :--- | :--- | :--- | :--- |
| `profiles` | Tolak | SELECT / UPDATE milik sendiri (kolom `plan` dilindungi trigger) | Akses Penuh |
| `projects` | Tolak | CRUD milik sendiri (`owner_id = auth.uid()`) | Akses Penuh |
| `datasets` | Tolak | SELECT (milik sendiri), UPDATE/DELETE hanya pada `derived` | Akses Penuh |
| `constructs` | Tolak | CRUD milik sendiri (melalui relasi proyek) | Akses Penuh |
| `dataset_columns` | Tolak | CRUD milik sendiri (melalui relasi dataset) | Akses Penuh |
| `analysis_runs` | Tolak | SELECT, INSERT (`status = 'queued'`), UPDATE (`status = 'canceled'`) | Mengklaim & mengeksekusi antrean |
| `analysis_results` | Tolak | SELECT milik sendiri (Read-only) | Menulis angka deterministik |
| `explanations` | Tolak | SELECT milik sendiri (Read-only) | Menulis narasi dari LLM |
| `exports` | Tolak | SELECT milik sendiri (Read-only) | Mengunggah & mencatat berkas Word/PDF |
| `subscriptions` | Tolak | SELECT milik sendiri (Read-only) | Mutasi status dari webhook Midtrans |
| `payments` | Tolak | SELECT milik sendiri (Read-only) | Rekonsiliasi transaksi pembayaran |
| `usage_counters` | Tolak | SELECT milik sendiri (Read-only) | Perhitungan kuota otomatis |
| `plan_limits` | Tolak | SELECT (membaca kuota paket) | Mengubah limit sistem |
| `app_config` | Tolak | SELECT (membaca konfigurasi umum) | Mengubah konfigurasi retensi |
| `audit_log` | Tolak | SELECT milik sendiri (Read-only) | Menulis jejak audit akademis |
| **Storage: datasets** | Tolak | CRUD di folder `{user_id}/...` (maks 10 MB, CSV/XLSX) | Akses Penuh |
| **Storage: exports** | Tolak | SELECT/DELETE di folder `{user_id}/...` | INSERT berkas Word/PDF |
