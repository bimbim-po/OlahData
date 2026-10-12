# OlahData — Platform Pengolah Data Penelitian Kuantitatif (Skala Likert)

Web app spesialis analisis data skripsi kuantitatif untuk mahasiswa tingkat akhir tanpa SPSS. Menghasilkan laporan kualitas data, uji validitas Pearson Product Moment, reliabilitas Cronbach's Alpha, uji asumsi klasik (normalitas residual Kolmogorov-Smirnov, multikolinearitas VIF/Tolerance, heteroskedastisitas Glejser), regresi linier berganda OLS, draf tabel Bab 4 format APA edisi ke-7, narasi penjelasan akademis dengan penjaga angka (*Number Guard*), dan ekspor langsung ke Word (.docx) & PDF.

---

## 🏛️ Prinsip Utama Produk

1. **Deterministik Matematis (Python OLS)**:
   Semua angka statistik dihitung oleh mesin kode deterministik Python (`numpy`, `scipy`, `statsmodels`). Model Bahasa (LLM) **tidak pernah** menghitung, mengoreksi, atau mengarang angka. Toleransi komputasi $< 0,001$ terhadap benchmark R dan JASP.
2. **Penjaga Angka (Number Guard)**:
   AI hanya menulis kalimat interpretasi akademis. Sebelum disajikan, narasi diperiksa oleh regex *Number Guard* terhadap payload angka tabel. Jika ada angka halusinasi, teks ditolak dan dibuat ulang otomatis (maksimal 2x); jika gagal, hanya tabel yang ditampilkan tanpa teks.
3. **Integritas Akademik & Imutabilitas Dataset**:
   Sistem tidak pernah membuat data responden palsu, mensimulasikan, atau mengimputasi jawaban. Dataset asli bersifat *immutable* (tidak dapat diubah); setiap penghapusan baris membuat *derived version* baru dengan jejak audit alasan eksklusi.
4. **Jejak Hitung & Surat Pernyataan**:
   Setiap analisis menyimpan jejak hitung lengkap (versi mesin, parameter, waktu) dan menyediakan templat *Surat Pernyataan Penggunaan Alat Bantu Olah Data Akademik* untuk dilampirkan ke skripsi.
5. **Format Jurnal Ilmiah (APA 7th)**:
   Tabel 3 garis horizontal tipis khas jurnal tanpa garis vertikal, angka rata kanan berformat bahasa Indonesia (`id-ID`: koma desimal, titik ribuan).

---

## 🏗️ Struktur Monorepo

```
olahdata/
├── apps/
│   └── web/                   # Next.js 16.4 (App Router) + React 19 + TypeScript + Tailwind CSS
│       ├── src/app/api/       # Next.js BFF Route Handlers (REST API bertipe)
│       ├── src/lib/api/       # Kontrak TypeScript API terpadu
│       ├── src/lib/ai/        # Layanan Penjelasan AI & Number Guard
│       └── src/lib/supabase/  # Client Supabase Server & Admin
├── services/
│   └── stats/                 # Mesin Statistik Python 3.10 (FastAPI)
│       ├── engine/            # Modul kalkulasi (descriptive, validity, reliability, regression, assumptions)
│       ├── exporter/          # Pembuat dokumen APA Word (.docx) dan PDF (ReportLab)
│       └── tests/             # Pytest test suite dengan benchmark fixtures R/JASP (< 0.001)
├── supabase/
│   ├── migrations/            # 3 migrasi SQL berurutan (12 tabel, RLS, Storage Buckets)
│   └── seed.sql               # Seed data akun demo & proyek contoh
├── docs/
│   ├── statistik.md           # Dokumentasi rumus matematis, konvensi SPSS & APA
│   └── deployment.md          # Panduan hosting container Cloud Run & solopreneur
├── docker-compose.yml         # Orkestrasi kontainer lokal lengkap
├── .env.example               # Dokumentasi variabel lingkungan
└── .github/workflows/ci.yml   # Pipeline CI (Lint, Typecheck, Next.js build, Pytest)
```

---

## 🚀 Panduan Menjalankan Lokal

### Cara 1: Menggunakan Docker Compose (Direkomendasikan)
```bash
docker compose up --build
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Mesin Statistik FastAPI**: [http://localhost:8000](http://localhost:8000)
- **Dokumentasi OpenAPI/Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Cara 2: Menjalankan Langsung di Komputer (Native)

#### 1. Jalankan Mesin Statistik Python:
```bash
cd services/stats
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Jalankan Frontend Web:
```bash
cd apps/web
npm install
npm run dev
```

---

## 🧪 Menjalankan Pengujian (Testing)

```bash
# 1. Jalankan pengujian statistik deterministik (Pytest)
pytest services/stats/tests/test_statistical_engine.py -v

# 2. Jalankan pengujian Number Guard
npx tsx apps/web/src/lib/ai/__tests__/test-number-guard.ts

# 3. Build & Typecheck Next.js
npm run build --prefix apps/web
```

---

## 💳 Pembayaran & Langganan (Midtrans)

- Menggunakan **Midtrans Snap / Core API** dengan mode perpanjangan manual: tagihan bulanan berisi tautan bayar (QRIS / Virtual Account) + pengingat WhatsApp-ready.
- Webhook `/api/webhooks/midtrans` memverifikasi tanda tangan kriptografis **SHA-512** dan memperbarui status secara idempoten di database.
- Pengguna paket `free` mendapatkan hasil lengkap di layar dengan tanda air (*watermark*) pada berkas ekspor; paket `monthly` dan `thesis` menghasilkan ekspor bersih tanpa watermark.
