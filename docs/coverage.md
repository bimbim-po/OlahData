# Peta Kelengkapan Fitur & Keadaan Halaman OlahData (Coverage Map)

**Status:** Pre-Ready Audit & Tracking  
**Prinsip Desain:** Teman Belajar yang Pintar (Figtree, Kertas, Tinta Pulpen, Kuning Stabilo, Tiga Lapis Hasil, Tanpa Trik AI)  
**Keadaan Wajib (6 State):** (1) Memuat [Skeleton], (2) Kosong [Ajakan Bertindak], (3) Galat [Solutif], (4) Sukses [Konfirmasi Lugas], (5) Batas Paket [Edukatif & Lembut], (6) Tanpa Izin / Sesi Kedaluwarsa.

---

## 1. Tabel Matriks Kelengkapan Fitur

| # | Fitur & Kemampuan | Halaman / Komponen | Keadaan yang Didukung | Status | Catatan & Rencana Pembangunan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. PUBLIK & PEMASARAN** | | | | | |
| 1 | Beranda Publik & Demo Hidup | `/(marketing)/page.tsx` | Memuat, Sukses | **ADA** | Sudah ada demo hidup terhubung stabilo kuning, perlu dipastikan 6-state teruji. |
| 2 | Ikhtisar Seluruh Fitur | `/(marketing)/fitur/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Halaman pusat penjelasan fitur dan alur 4 tahap analisis skripsi. |
| 3 | Uji Validitas & Reliabilitas | `/(marketing)/fitur/validitas-reliabilitas/page.tsx` | Memuat, Sukses | **BELUM ADA** | Penjelasan Pearson & Cronbach Alpha, tabel contoh APA 7th berlabel, CTA coba. |
| 4 | Uji Asumsi Klasik | `/(marketing)/fitur/asumsi-klasik/page.tsx` | Memuat, Sukses | **BELUM ADA** | Normalitas K-S, Multikolinearitas VIF, Heteroskedastisitas Glejser. |
| 5 | Regresi Linier Berganda | `/(marketing)/fitur/regresi/page.tsx` | Memuat, Sukses | **BELUM ADA** | Uji F simultan, uji t parsial, R², persamaan OLS dan interpretasi Bab 4. |
| 6 | Uji Beda & ANOVA | `/(marketing)/fitur/uji-beda/page.tsx` | Memuat, Sukses | **BELUM ADA** | Independent t-test & One-Way ANOVA untuk komparasi kelompok. |
| 7 | Harga & FAQ Penagihan | `/(marketing)/harga/page.tsx` | Memuat, Sukses | **KURANG** | Perlu perbandingan matriks fitur detail, garansi, & FAQ penagihan/metode bayar. |
| 8 | Kampus & Kemitraan Prodi | `/(marketing)/kampus/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Form kontak kemitraan lab/fakultas tanpa klaim kerja sama sepihak. |
| 9 | Panduan Belajar Statistik | `/(marketing)/panduan/page.tsx` | Memuat, Sukses, Kosong | **BELUM ADA** | Artikel cara membaca output statistik skripsi berlabel DRAF terbuka. |
| 10 | Pusat Bantuan & FAQ | `/(marketing)/bantuan/page.tsx` | Memuat, Sukses, Kosong, Galat | **BELUM ADA** | Kategori bantuan teknis, unggah data, panduan bab 4, dan pencarian instan. |
| 11 | Kontak & Dukungan | `/(marketing)/kontak/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Form kirim pesan/pertanyaan teknis dengan estimasi balasan manusiawi. |
| 12 | Tentang OlahData | `/(marketing)/tentang/page.tsx` | Memuat, Sukses | **BELUM ADA** | Latar belakang produk: kegelisahan mahasiswa skripsi & komitmen integritas. |
| 13 | Catatan Rilis (Changelog) | `/(marketing)/changelog/page.tsx` | Memuat, Sukses, Kosong | **BELUM ADA** | Riwayat pembaruan sistem statistik dan perbaikan antarmuka secara transparan. |
| 14 | Status Layanan Sistem | `/(marketing)/status/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Menampilkan status operasional komponen nyata (API, Database, Mesin Hitung). |
| 15 | Keamanan & Privasi Data | `/(marketing)/keamanan/page.tsx` | Memuat, Sukses | **BELUM ADA** | Penjelasan lugas: isolasi data responden, masa simpan, enkripsi, tanpa AI training. |
| 16 | Syarat Layanan | `/(marketing)/syarat/page.tsx` | Sukses | **ADA** | Berlabel DRAF menunggu tinjauan hukum resmi. |
| 17 | Kebijakan Privasi | `/(marketing)/privasi/page.tsx` | Sukses | **ADA** | Berlabel DRAF menunggu tinjauan hukum resmi. |
| 18 | Pernyataan Penggunaan Alat | `/(marketing)/pernyataan-penggunaan/page.tsx` | Sukses | **ADA** | Format baku lampiran skripsi pernyataan penggunaan alat statistik. |
| 19 | Penanganan Error 404 & 500 | `not-found.tsx`, `error.tsx`, `global-error.tsx` | Galat, Tanpa Izin | **KURANG** | Butuh halaman ramah mahasiswa dengan navigasi penyelamat. |
| **B. AUTENTIKASI & AWAL PEMAKAIAN** | | | | | |
| 20 | Pendaftaran Akun | `/(auth)/daftar/page.tsx` | Memuat, Sukses, Galat | **ADA** | Form daftar mahasiswa, validasi input sebaris, tautan syarat. |
| 21 | Masuk Akun | `/(auth)/masuk/page.tsx` | Memuat, Sukses, Galat | **ADA** | Form masuk email & kata sandi, opsi Google Auth, ingat saya. |
| 22 | Lupa Kata Sandi | `/(auth)/lupa-sandi/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Input email untuk menerima tautan atur ulang sandi aman. |
| 23 | Atur Ulang Kata Sandi | `/(auth)/atur-ulang-sandi/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Form sandi baru dengan indikator kekuatan kata sandi. |
| 24 | Verifikasi Email | `/(auth)/verifikasi-email/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Status menunggu konfirmasi email mahasiswa setelah pendaftaran. |
| 25 | Kirim Ulang Verifikasi | `/(auth)/verifikasi-email/kirim-ulang/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Tindakan cepat jika email konfirmasi tidak kunjung sampai di inbox/spam. |
| 26 | Tautan Kedaluwarsa | `/(auth)/tautan-kedaluwarsa/page.tsx` | Galat | **BELUM ADA** | Penjelasan ramah jika token reset atau verifikasi sudah melewati batas waktu. |
| 27 | Onboarding Pemakai Baru | `/onboarding/page.tsx` | Memuat, Sukses, Batal | **BELUM ADA** | Pemilihan peran, jurusan/prodi, dan opsi instan mencoba data contoh skripsi. |
| **C. APLIKASI UTAMA (MAHASISWA)** | | | | | |
| 28 | Beranda Meja Kerja | `/app/page.tsx` | Memuat, Kosong, Sukses | **ADA** | Ringkasan proyek, status revisi, CTA lanjut proyek terakhir. |
| 29 | Ringkasan Detail Proyek | `/app/proyek/[id]/page.tsx` | Memuat, Kosong, Sukses, Galat | **KURANG** | Hub proyek: riwayat dataset, versi perbaikan, pengujian yang telah selesai. |
| 30 | Wizard Unggah & Validasi | `/app/proyek/baru/page.tsx` | Memuat, Sukses, Galat, Batas | **ADA** | Unggah XLSX/CSV, validasi 4 aturan data Likert, batas baris paket. |
| 31 | Pemetaan & Konfigurasi Uji | `/app/proyek/[id]/analisis/page.tsx` | Memuat, Sukses, Galat | **ADA** | Pemetaan indikator ke variabel X/Y, pemilihan jenis uji statistik. |
| 32 | Hasil Analisis 3 Lapis | `/app/proyek/[id]/hasil/page.tsx` | Memuat, Sukses, Galat, Batas | **ADA** | Lapis 1 (Intinya), Lapis 2 (Tabel APA), Lapis 3 (Bab 4 AI terverifikasi). |
| 33 | Komparasi Versi Dataset | `/app/proyek/[id]/bandingkan/page.tsx` | Memuat, Kosong, Sukses | **BELUM ADA** | Membandingkan output sebelum & sesudah eksklusi outlier/revisi data. |
| 34 | Pusat Riwayat Ekspor | `/app/ekspor/page.tsx` | Memuat, Kosong, Sukses | **BELUM ADA** | Daftar riwayat unduhan berkas Word, PDF, dan dataset terverifikasi. |
| 35 | Kotak Notifikasi Sistem | `/app/notifikasi/page.tsx` | Memuat, Kosong, Sukses | **BELUM ADA** | Pemberitahuan status analisis, pengingat paket, dan pembaruan sistem. |
| 36 | Pencarian Global (Ctrl+K) | `GlobalSearchCommand` | Memuat, Kosong, Sukses | **BELUM ADA** | Command palette untuk navigasi cepat antar proyek dan modul uji. |
| 37 | Pintasan Keyboard & Bantuan | `/app/pintasan/page.tsx` & Dialog | Sukses | **BELUM ADA** | Daftar shortcut keyboard (Word copy, navigasi layer, mode malam). |
| **D. AKUN & PENAGIHAN** | | | | | |
| 38 | Profil Pengguna | `/app/pengaturan/page.tsx` | Memuat, Sukses, Galat | **KURANG** | Nama, universitas, program studi, preferensi tampilan dan notifikasi. |
| 39 | Keamanan & Sesi Akun | `/app/pengaturan/keamanan/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Ganti password, daftar sesi aktif, dan MFA opsional. |
| 40 | Langganan & Pemakaian Kuota | `/app/langganan/page.tsx` | Memuat, Sukses, Batas Paket | **KURANG** | Visualisasi kuota baris/proyek yang manusiawi, rincian masa aktif. |
| 41 | Ganti Paket / Upgrade | `/app/langganan/ganti-paket/page.tsx` | Memuat, Sukses | **BELUM ADA** | Pemilihan paket Kilat/Semesteran dengan kalkulasi prarata yang adil. |
| 42 | Halaman Checkout Pembayaran | `/checkout/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Pemilihan metode Midtrans (QRIS, GoPay, Mandiri/BCA/BRI VA). |
| 43 | Riwayat Tagihan & Kuitansi | `/app/tagihan/page.tsx` | Memuat, Kosong, Sukses | **BELUM ADA** | Daftar faktur langganan dan tombol unduh kuitansi resmi bertanda tangan. |
| 44 | Detail Kuitansi Pembayaran | `/app/tagihan/[id]/page.tsx` | Memuat, Sukses, Galat | **BELUM ADA** | Tampilan kuitansi formal siap cetak PDF untuk reimburse kampus/orang tua. |
| 45 | Status Transaksi Pembayaran | `/pembayaran/status/page.tsx` | Memuat, Sukses, Galat, Pending| **BELUM ADA** | Konfirmasi real-time: Pembayaran Berhasil, Menunggu Transfer, atau Kedaluwarsa. |
| 46 | Alur Pembatalan Langganan | `/app/langganan/batal/page.tsx` | Memuat, Sukses, Konfirmasi | **BELUM ADA** | Alur pembatalan tenang, survei alasan, tanpa manipulasi dark pattern. |
| 47 | Ekspor Seluruh Data Saya | `/app/pengaturan/data-saya/page.tsx` | Memuat, Sukses | **BELUM ADA** | Unduh seluruh arsip data akun, proyek, dan log analisis dalam format ZIP. |
| 48 | Hapus Akun & Data Pribadi | `/app/pengaturan/hapus-akun/page.tsx` | Memuat, Sukses, Konfirmasi | **BELUM ADA** | Ketik konfirmasi permanen; penghapusan data instan dan pembatalan otomatis. |
| **E. DASHBOARD SUPER ADMIN** | | | | | |
| 49 | Overview Super Admin | `/admin/page.tsx` | Memuat, Sukses, Tanpa Izin | **ADA** | Metrik tipografis, sparkline, item butuh tindakan, log metadata terkini. |
| 50 | Daftar Pelanggan & Detail | `/admin/pelanggan/page.tsx` | Memuat, Sukses, Kosong | **ADA** | Metadata agregat pelanggan (tanpa data isi responden). |
| 51 | Pemantauan Langganan & MRR | `/admin/langganan/page.tsx` | Memuat, Sukses | **ADA** | Rincian langganan aktif, churn, dan konversi pembayaran. |
| 52 | Aktivitas Mesin Statistik | `/admin/aktivitas/page.tsx` | Memuat, Sukses | **ADA** | Durasi komputasi, jenis uji, status error deterministik. |
| 53 | Kesehatan Sistem & Layanan | `/admin/sistem/page.tsx` | Memuat, Sukses, Galat | **ADA** | Uptime, memori, CPU worker Python, kuota Supabase & Cloudflare. |
| 54 | Estimasi Biaya Infrastruktur | `/admin/biaya/page.tsx` | Memuat, Sukses | **ADA** | Estimasi biaya bulanan server, margin produk, rincian resource. |
| 55 | Audit Log Admin | `/admin/audit/page.tsx` | Memuat, Sukses | **ADA** | Log tindakan admin tak-terhapus (who, what, reason, timestamp, IP). |
| **F. EMAIL TRANSAKSIONAL & PREVIEW** | | | | | |
| 56 | Template 8 Email Transaksional | `src/lib/email/templates/` | Sukses | **BELUM ADA** | HTML responsif + Text polos (Verifikasi, Reset Sandi, Selamat Datang, Tagihan, dll). |
| 57 | Halaman Pratinjau Email Dev | `/dev/email/page.tsx` | Sukses | **BELUM ADA** | Katalog interaktif pengujian tampilan email di desktop & ponsel (dev only). |
| **G. KATALOG KOMPONEN DEV** | | | | | |
| 58 | Katalog Komponen & Status | `/dev/komponen/page.tsx` | Sukses | **BELUM ADA** | Menampilkan seluruh token, tombol, tabel, dialog, badge, dan 6 keadaannya. |

---

## 2. Ringkasan Status

- **ADA:** 18 Fitur (Komponen inti pengujian, beranda, alur wizard, admin, legal dasar).
- **KURANG:** 5 Fitur (Harga matriks FAQ, error boundaries, detail proyek hub, pengaturan akun profil, langganan kuota manusiawi).
- **BELUM ADA:** 35 Fitur (Halaman fitur per kelompok uji, kampus, panduan statistik, pusat bantuan, kontak, tentang, status layanan, changelog, auth lengkap [lupa sandi/verifikasi/onboarding], komparasi dataset, ekspor terpusat, notifikasi, pencarian global Ctrl+K, pintasan keyboard, checkout & kuitansi penagihan, hapus akun/ekspor data saya, email transaksional & preview dev, katalog komponen `/dev/komponen`).
