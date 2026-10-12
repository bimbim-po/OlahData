# Panduan Deployment & Arsitektur Produksi OlahData

Dokumen ini menjelaskan arsitektur produksi, rekomendasi pemilihan penyedia container bagi pengembang tunggal (solopreneur), serta petunjuk langkah demi langkah menjalankan sistem secara lokal maupun di lingkungan produksi.

---

## 1. Pilihan Hosting Container untuk Pengembang Tunggal

Bagi pengembang tunggal atau tim kecil yang mengelola web app berbasis langganan dengan beban kerja kalkulasi statistik intermiten (hanya aktif saat pengguna menekan tombol "Jalankan Analisis" atau "Ekspor"), pilihan host container yang paling efisien adalah:

### **Pilihan Utama: Google Cloud Run (Serverless Container)**

#### Alasan Pemilihan:
1. **Biaya Rp 0 Saat Menganggur (Scale-to-Zero)**: Mesin statistik Python tidak perlu menyala 24/7 jika belum ada pengguna yang melakukan analisis. Cloud Run secara otomatis menurunkan alokasi CPU ke nol saat tidak ada permintaan.
2. **Kapasitas Komputasi Kuat**: Menyediakan hingga 8 vCPU dan 32 GB RAM per kontainer saat melakukan operasi matriks OLS dan perenderan PDF/Word berukuran besar.
3. **Gratis 2 Juta Permintaan/Bulan**: Kuota gratis bulanan (*free tier*) Google Cloud sangat memadai untuk tahap peluncuran dan validasi pasar tanpa memerlukan biaya awal yang besar.
4. **Keamanan Jaringan**: Layanan FastAPI hanya menerima panggilan masuk dari Route Handler Next.js menggunakan header rahasia `X-Service-Key`.
5. **HTTPS & Domain Kustom Otomatis**: Sertifikat TLS/SSL dikelola penuh tanpa konfigurasi Nginx manual.

### **Pilihan Alternatif: Railway / Render**
- Jika menginginkan penyedia PaaS dengan pengalaman *git-push to deploy* yang sangat instan dan terintegrasi dengan database Postgres.

---

## 2. Cara Menjalankan Secara Lokal (Local Development)

Semua komponen dapat dijalankan di komputer lokal tanpa memerlukan kartu kredit:

### A. Menggunakan Docker Compose (Satu Perintah)
Pastikan Docker Desktop aktif di komputer Anda:
```bash
docker compose up --build
```
Layanan akan berjalan pada:
- **Next.js Web**: `http://localhost:3000`
- **FastAPI Stats Service**: `http://localhost:8000` (Swagger docs di `http://localhost:8000/docs`)

### B. Menjalankan Langsung Tanpa Docker (Native Host)

1. **Jalankan Mesin Statistik Python**:
   ```bash
   cd services/stats
   pip install -r requirements.txt
   uvicorn main:app --port 8000 --reload
   ```

2. **Jalankan Frontend & BFF Next.js**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

---

## 3. Menjalankan Test Suite Otomatis

Verifikasi toleransi statistik deterministik ($< 0,001$) terhadap benchmark R/JASP:
```bash
# Uji unit mesin statistik Python
pytest services/stats/tests/test_statistical_engine.py -v

# Uji verifikasi Number Guard
npx tsx apps/web/src/lib/ai/__tests__/test-number-guard.ts
```

---

## 4. Konfigurasi Produksi

### Variabel Lingkungan Penting (`.env`)
| Variabel | Deskripsi | Nilai Contoh |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Domain publik aplikasi web | `https://olahdata.id` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci rahasia admin Supabase | `eyJhbGciOi...` |
| `STATS_SERVICE_URL` | URL privat layanan FastAPI | `https://stats-engine-xyz.run.app` |
| `STATS_SERVICE_KEY` | Token rahasia otentikasi internal | Kunci acak 32 karakter |
| `MIDTRANS_SERVER_KEY` | Kunci server pembayaran Midtrans | `Mid-server-xyz` |
| `MIDTRANS_IS_PRODUCTION` | Flag mode produksi Midtrans | `true` |

---

## 5. Alur Pembayaran & Webhook Midtrans

1. Pengguna memilih paket di halaman `/langganan`.
2. Next.js memanggil `/api/billing/checkout` yang membuat transaksi via Midtrans Snap API (atau faktur perpanjangan manual dengan QRIS / Virtual Account).
3. Setelah pembayaran diselesaikan oleh pengguna, Midtrans mengirimkan notifikasi POST ke `https://olahdata.id/api/webhooks/midtrans`.
4. Webhook memverifikasi tanda tangan SHA-512:
   $$\text{Hash} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
5. Jika valid, status langganan pengguna diperbarui secara idempoten di database Supabase dan watermark pada dokumen ekspor otomatis dinonaktifkan.
