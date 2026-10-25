# OlahData — Platform Pengolah Data Kuesioner Skripsi Kuantitatif

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10-yellow?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15-green?logo=supabase)](https://supabase.com/)
[![Midtrans](https://img.shields.io/badge/Payment-Midtrans_Snap-navy)](https://midtrans.com/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2_AA%2FAAA-emerald)](design.md#6-standar-aksesibilitas--responsivitas-wcag--breakpoints)

> **OlahData** adalah web app pengolah data penelitian kuesioner skripsi kuantitatif (khususnya skala Likert) yang dirancang untuk mahasiswa tingkat akhir tanpa ketergantungan pada SPSS. Menghasilkan analisis kualitas data, uji validitas Pearson Product Moment, reliabilitas Cronbach's Alpha, uji asumsi klasik (normalitas residual Kolmogorov-Smirnov, multikolinearitas VIF/Tolerance, heteroskedastisitas Glejser), regresi linier berganda OLS, draf tabel Bab 4 format APA edisi ke-7, narasi pembahasan dengan penjaga angka (*Number Guard*), dan ekspor langsung ke Microsoft Word (`.docx`) & PDF.

---

## 📚 Dokumentasi Utama
- 🎨 **[Design System & UI Guidelines (`design.md`)](design.md)**: Token desain, tipografi Figtree, palet warna Meja Belajar Mahasiswa, tabel APA 7th, visualisasi residual Freedman-Diaconis & Normal P-P plot, serta kepatuhan WCAG 2.2 AA/AAA.
- 🏛️ **[Spesifikasi Arsitektur Sistem (`architecture.md`)](architecture.md)**: Topologi monorepo, pipeline komputasi deterministik OLS, integrasi Supabase RLS, alur webhook Midtrans, dan arsitektur deployment Cloudflare Pages & Google Cloud Run.
- 📐 **[Dokumentasi Rumus & Metode Statistik (`docs/statistik.md`)](docs/statistik.md)**: Formulasi matematis, konvensi SPSS, pembuktian OLS, dan batasan toleransi $< 0,001$ terhadap benchmark R/JASP.

---

## 🏛️ Prinsip Utama Produk

1. **Deterministik Matematis (Python OLS)**:
   Semua angka statistik dihitung oleh mesin deterministik Python (`numpy`, `scipy`, `statsmodels`). Model Bahasa (LLM) **tidak pernah** menghitung, mengoreksi, atau mengarang angka. Toleransi komputasi $< 0,001$ terhadap benchmark R dan JASP.
2. **Penjaga Angka (Number Guard)**:
   AI hanya menulis kalimat interpretasi akademis. Sebelum disajikan, narasi diperiksa oleh regex *Number Guard* terhadap payload angka tabel. Jika ada angka halusinasi, teks ditolak otomatis (*fail-closed*); hanya tabel yang ditampilkan tanpa teks halusinasi.
3. **Integritas Akademik & Imutabilitas Dataset**:
   Sistem tidak pernah membuat data responden palsu, mensimulasikan, atau mengimputasi jawaban. Dataset asli bersifat *immutable*; setiap pengeluaran responden pencilan membuat *derived version* baru dengan jejak audit alasan eksklusi.
4. **Satu Sumber Data Visualisasi & Ekspor**:
   Grafik di web (Gambar 4.1 Histogram & Gambar 4.2 Normal P-P Plot) dan berkas ekspor (`.docx` / PDF) menggunakan array data hasil hitung yang identik. Grafik ekspor dirender *off-screen* dengan tema cetak hitam-putih solid (#FFFFFF) pada resolusi minimal 2x *devicePixelRatio*.
5. **Format Jurnal Ilmiah (APA 7th & Format Indonesia)**:
   Tabel 3 garis horizontal tipis khas jurnal tanpa garis vertikal, angka rata kanan berformat bahasa Indonesia (`id-ID`: koma desimal, titik ribuan) menggunakan `tabular-nums`.

---

## 🏗️ Struktur Monorepo

```
olahdata/
├── apps/
│   └── web/                   # Next.js 16.4.3 (App Router) + React 19 + TypeScript + Tailwind CSS v4
│       ├── src/app/           # Rute Halaman Web & BFF Route Handlers
│       ├── src/components/    # Komponen UI (Navbar, APA Tables, Residual Charts, Checkout Modal)
│       ├── src/lib/           # Utilitas (Number Guard, Stats Engine, Docx APA, PDF Generator)
│       └── src/styles/        # Token Desain (tokens.css) & Global Styles (globals.css)
├── services/
│   └── stats/                 # Mesin Statistik Python 3.10 (FastAPI)
│       ├── engine/            # Modul kalkulasi (descriptive, validity, reliability, regression, assumptions)
│       ├── exporter/          # Pembuat dokumen APA Word (.docx) dan PDF (ReportLab)
│       └── tests/             # Pytest test suite dengan benchmark fixtures R/JASP (< 0.001)
├── supabase/
│   ├── migrations/            # Skema SQL berurutan (12 tabel, RLS, Storage Buckets)
│   └── seed.sql               # Seed data akun demo & proyek contoh
├── docs/                      # Dokumentasi teknis, audit UI responsif, dan metode statistik
├── design.md                  # Acuan resmi sistem desain antarmuka
├── architecture.md            # Acuan resmi arsitektur sistem
├── docker-compose.yml         # Orkestrasi kontainer lokal lengkap
├── .env.example               # Dokumentasi variabel lingkungan
└── .github/workflows/ci.yml   # Pipeline CI (Lint, Typecheck, Next.js build, Pytest)
```

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Prasyarat
- **Node.js**: v20.x atau lebih baru (`npm` v10+)
- **Python**: v3.10.x atau v3.11.x
- **Docker & Docker Compose** (opsional untuk menjalankan kontainer terpadu)

### Opsi 1: Menggunakan Docker Compose (Satu Perintah)
```bash
# Clone repositori
git clone https://github.com/olahdata/olahdata.git
cd olahdata

# Jalankan seluruh layanan
docker compose up --build
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Mesin Statistik FastAPI**: [http://localhost:8000](http://localhost:8000)
- **Dokumentasi OpenAPI/Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Opsi 2: Menjalankan Secara Native (Pengembangan Lokal)

#### 1. Konfigurasi Variabel Lingkungan
Salin template `.env.local.example` ke `apps/web/.env.local`:
```bash
cp .env.local.example apps/web/.env.local
```

Isi variabel penting:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
STATS_SERVICE_URL=http://127.0.0.1:8000
STATS_SERVICE_KEY=kunci-rahasia-internal-32-karakter
MIDTRANS_SERVER_KEY=SB-Mid-server-...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

#### 2. Jalankan Mesin Statistik Python (Terminal 1)
```bash
cd services/stats
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 3. Jalankan Frontend Next.js (Terminal 2)
```bash
cd apps/web
npm install
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

---

## 🧪 Menjalankan Pengujian Otomatis (Testing)

```bash
# 1. Jalankan pengujian statistik deterministik terhadap benchmark R/JASP (< 0.001)
pytest services/stats/tests/test_statistical_engine.py -v

# 2. Jalankan pengujian validasi Number Guard (Anti-Halusinasi AI)
npx tsx apps/web/src/lib/ai/__tests__/test-number-guard.ts

# 3. Jalankan typecheck & build Next.js
npm run build --prefix apps/web
```

---

## 💳 Pembayaran & Langganan (Midtrans)

- **Gateway**: Menggunakan **Midtrans Snap & Core API** (QRIS, Virtual Account BCA/Mandiri/BRI, kartu kredit).
- **Keamanan Webhook**: Endpoint `/api/webhooks/midtrans` memverifikasi tanda tangan kriptografis **HMAC SHA-512** secara idempoten di Supabase.
- **Tingkat Akses (Entitlements)**:
  - `free`: Analisis tanpa batas di layar web; ekspor Word/PDF disertai tanda air (*watermark*).
  - `monthly` & `thesis`: Ekspor bersih tanpa *watermark*, komputasi prioritas, dan berkas lampiran lengkap.

---

## 📄 Integritas Akademik & Pernyataan Penggunaan

OlahData adalah alat bantu hitung statistik deterministik, bukan joki skripsi atau generator data palsu. Platform ini menyediakan dokumen *Surat Pernyataan Penggunaan Alat Bantu Olah Data Akademik* yang dapat dilampirkan mahasiswa pada naskah skripsi mereka sebagai wujud transparansi metodologi ilmiah.

---

## 📄 Lisensi
Hak Cipta © 2026 OlahData. Seluruh hak cipta dilindungi undang-undang.
