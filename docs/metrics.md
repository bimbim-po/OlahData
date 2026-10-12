# Definisi Metrik Bisnis & Operasional — OlahData Super Admin

Dokumen ini mendefinisikan rumus perhitungan, asumsi, kriteria penyaringan, dan batasan privasi untuk seluruh metrik analitik pada **Console Super Admin OlahData**.

---

## 1. Prinsip Utama Pengukuran

1. **Privasi Absolut (Zero Respondent Data)**: Tidak ada metrik yang membaca, menghitung, atau mengekspos isi data responden kuesioner. Seluruh analitik berbasis **metadata teknis** (jumlah baris/kolom, jenis uji, status eksekusi, token LLM, dan transaksi pembayaran).
2. **Penyaringan Akun Pengujian (`is_test = true`)**: Seluruh metrik pendapatan, konversi, dan pengguna aktif secara otomatis mengecualikan akun internal owner (`bimdarmawa2@gmail.com`, `vrimae23@gmail.com`) dan akun bertanda `profiles.is_test = TRUE` agar tidak mendistorsi data bisnis riil.
3. **Auditability**: Setiap angka agregat dapat ditelusuri ke tampilan database (`views`) yang idempoten dan deterministik.

---

## 2. Metrik Pendapatan (Revenue & Unit Economics)

### 2.1. MRR (Monthly Recurring Revenue)
* **Definisi**: Perkiraan pendapatan berulang per bulan dari pelanggan aktif.
* **Rumus**:
  $$\text{MRR} = \sum (\text{Harga Paket Bulanan} \times N_{\text{bulanan}}) + \sum \left(\frac{\text{Harga Paket Skripsi}}{3} \times N_{\text{skripsi aktif}}\right)$$
* **Harga Default**:
  - Paket Bulanan (`monthly`): Rp 49.000 / bulan.
  - Paket Skripsi (`thesis`, 3 bulan akses): Rp 99.000 (diamortisasi menjadi Rp 33.000 / bulan selama masa aktif 90 hari).
* **Penanganan Perpanjangan Manual**:
  Jika pengguna menggunakan metode transfer/Snap manual tanpa potongan otomatis (auto-debit), langganan yang melewati batas `current_period_end` memiliki masa tenggang 3 hari (*grace period*) sebelum status berubah menjadi `past_due` atau `expired` dan dikeluarkan dari perhitungan MRR.

### 2.2. ARPU (Average Revenue Per User)
* **Definisi**: Rata-rata pendapatan dari seluruh pengguna berbayar aktif pada periode berjalan.
* **Rumus**:
  $$\text{ARPU} = \frac{\text{Pendapatan Total Periode}}{\text{Jumlah Pengguna Berbayar Aktif Periode Tersebut}}$$

### 2.3. Churn Rate Bulanan
* **Definisi**: Persentase pelanggan berbayar yang tidak memperpanjang langganannya pada bulan tertentu.
* **Rumus**:
  $$\text{Churn Rate} = \frac{\text{Langganan yang Kedaluwarsa/Batal dalam 30 Hari}}{\text{Total Langganan Aktif di Awal Periode 30 Hari}} \times 100\%$$

---

## 3. Metrik Pertumbuhan Pengguna (Growth & Engagement)

### 3.1. Pengguna Aktif (DAU, WAU, MAU)
* **Definisi**: Jumlah pengguna unik (non-test) yang melakukan setidaknya satu aktivitas produk bermakna pada rentang waktu terkait:
  - Mengunggah dataset baru (`dataset_uploaded`)
  - Menjalankan antrean analisis statistik (`analysis_run`)
  - Mengunduh hasil ekspor Word/PDF (`report_exported`)
  - Membuka halaman proyek penelitian dengan sesi terautentikasi
* **Rentang**:
  - **DAU (Daily Active Users)**: Unik per 24 jam terakhir (UTC/WIB).
  - **WAU (Weekly Active Users)**: Unik per 7 hari terakhir.
  - **MAU (Monthly Active Users)**: Unik per 30 hari terakhir.
* **Rasio Stickiness**:
  $$\text{Stickiness} = \frac{\text{DAU}}{\text{MAU}} \times 100\%$$

### 3.2. Funnel Aktivasi Mahasiswa (Activation Funnel)
Tahapan konversi pengguna dari pendaftaran hingga nilai akhir produk:

1. **Sign-up**: Akun berhasil dibuat dan email terverifikasi (`auth.users.email_confirmed_at IS NOT NULL`).
2. **Proyek Pertama**: Pengguna membuat proyek penelitian perdana (`projects_created >= 1`).
3. **Unggah Dataset**: Pengguna berhasil mengunggah file kuesioner `.xlsx`/`.csv` pertama yang lolos validasi struktur kolom (`datasets_count >= 1`).
4. **Analisis Berhasil**: Setidaknya 1 antrean analisis statistik berhasil dihitung oleh mesin Python (`analysis_runs.status = 'succeeded'`).
5. **Ekspor / Berlangganan**: Pengguna mengunduh laporan skripsi APA atau meningkatkan ke paket berbayar (`monthly` / `thesis`).

Tingkat drop-off dihitung pada setiap transisi:
$$\text{Drop-off Rate}_{i \to i+1} = \frac{N_i - N_{i+1}}{N_i} \times 100\%$$

---

## 4. Metrik Keandalan Sistem & Mesin Statistik (Health & Quality)

### 4.1. Tingkat Keberhasilan Analisis (Run Success Rate)
* **Rumus**:
  $$\text{Success Rate} = \frac{N_{\text{runs succeeded}}}{N_{\text{runs total (succeeded + failed)}}} \times 100\%$$
* **Target SLO**: $\ge 98.5\%$ keberhasilan pada percobaan pertama.
* **Penyebab Kegagalan Umum**:
  - `SINGULAR_MATRIX`: Matriks kovarians tidak dapat dibalik (kolom bernilai konstan atau korelasi sempurna antar item).
  - `INSUFFICIENT_SAMPLE`: Jumlah responden lebih sedikit daripada jumlah variabel bebas.
  - `TIMEOUT`: Kalkulasi melebihi batas 10 menit (misal: bootstrap > 5.000 iterasi).

### 4.2. Rasio Lolos Penjaga Angka (Number Guard Pass Rate)
* **Definisi**: Persentase penjelasan naratif AI yang lolos verifikasi angka deterministik pada percobaan pertama.
* **Aturan Keras**:
  Setiap angka pada teks LLM harus dicocokkan dengan angka hasil hitung Python ($r$, $t$, $F$, $p$, Cronbach's Alpha, $R^2$).
  - Percobaan 1: Jika terdapat halusinasi angka $\to$ ditolak & regenerate dengan prompt teguran.
  - Percobaan 2: Jika masih memuat angka asing $\to$ tampilkan tabel murni tanpa teks narasi LLM.
* **Target SLO**: $\ge 92\%$ pass rate pada percobaan pertama.

---

## 5. Estimasi Biaya & Margin Kotor (Cost & Unit Economics)

### 5.1. Biaya Token LLM Naratif
* **Formula Estimasi**:
  $$\text{Biaya LLM} = \frac{\text{Token Input}}{1.000.000} \times \text{Tarif Input} + \frac{\text{Token Output}}{1.000.000} \times \text{Tarif Output}$$
* **Asumsi Default**:
  - Model: Google Gemini 1.5 Flash (atau setara).
  - Tarif Input: \$0.075 per 1M token ($\approx$ Rp 1.200 per 1M token).
  - Tarif Output: \$0.30 per 1M token ($\approx$ Rp 4.800 per 1M token).
  - Rata-rata token per run analisis lengkap: ~2.500 prompt token + ~1.200 completion token ($\approx$ Rp 9 per run).

### 5.2. Biaya Infrastruktur Bulanan
* **Komponen Tetap**:
  - Supabase Pro Tier: \$25 / bulan ($\approx$ Rp 400.000).
  - VPS / Container Python Stats Engine: Rp 150.000 / bulan.
  - Frontend Hosting (Cloudflare Pages / Vercel Pro): Rp 0 – Rp 320.000.
* **Komponen Variabel**:
  - Gateway Pembayaran Midtrans: Rp 4.000 / transaksi QRIS/GoPay, atau 1,5% fee transaksi kartu.

### 5.3. Margin Kotor (Gross Margin)
* **Rumus**:
  $$\text{Margin Kotor} = \frac{\text{Pendapatan Kotor} - (\text{Biaya Token} + \text{Biaya Payment Gateway} + \text{Biaya Server})}{\text{Pendapatan Kotor}} \times 100\%$$
* **Target Produk**: $\ge 75\%$ margin kotor pada skala 100+ pelanggan aktif.

---

## 6. Audit Trail & WORM Policy

Setiap perubahan administratif pada batas paket, konfigurasi sistem, atau status langganan pengguna wajib:
1. Menyertakan parameter `reason` dengan panjang minimal 5 karakter.
2. Menyimpan snapshot `before` dan `after` dalam format JSONB.
3. Dicatat ke tabel `public.admin_audit_log` yang dilindungi hak akses **WORM (Write Once, Read Many)**: tidak ada hak `UPDATE` maupun `DELETE` bagi peran apa pun di database aplikasi.
