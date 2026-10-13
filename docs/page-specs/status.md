# Spesifikasi Halaman: Status Layanan Sistem (`/status`)

**Rute:** `/status`  
**Kategori:** Publik & Keandalan Sistem  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Melihat kondisi kesehatan operasional server, mesin statistik Python, database, dan antrean analisis secara real-time berdasarkan hasil health check sungguhan.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang mengalami proses analisis agak lama, ingin memastikan apakah ada gangguan server atau masalah pada jaringan internet mereka sendiri.

## 3. Aksi Utama Tunggal & Jelas
**"Segarkan Status Sistem"** (Tombol sinkronisasi health check terbaru).

## 4. Isi Utama dengan Hierarki
1. **Lencana Status Keseluruhan:**
   - *Semua Sistem Beroperasi Normal* (Mint `#BFEBD9`, teks `#0E4331`), ATAU
   - *Sebagian Layanan Mengalami Kelambatan* (Koral `#E8574F`).
2. **Komponen Layanan Nyata (Bukan Angka Karangan):**
   - *Web App & CDN (Cloudflare Pages):* Status Operasional, latensi rata-rata.
   - *Basis Data & Autentikasi (Supabase PostgreSQL):* Status Operasional.
   - *Mesin Hitung Statistik (Python Worker):* Waktu respons kalkulasi rata-rata (mis. 0,42 s).
   - *Gateway Pembayaran (Midtrans):* Status Siaga Transaksi QRIS/VA.
3. **Riwayat Insiden & Pemeliharaan (30 Hari Terakhir):**
   - Transparan mencatat waktu pemeliharaan terjadwal dan penyelesaian insiden.
4. **Waktu Pembaruan Terakhir:** Timestamp id-ID waktu lokal Jakarta (`Asia/Jakarta`).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Baris komponen skeleton dengan indikator denyut shimmer.
* **Kosong:** Tampilan riwayat insiden jika tidak ada insiden ("Tidak ada insiden tercatat dalam 30 hari terakhir").
* **Galat:** Jika endpoint health check tidak merespons, tampilkan indikator offline *"Gagal menghubungi pemantau server"* dengan saran memeriksa koneksi internet.
* **Sukses:** Seluruh status komponen tampil dengan indikator bulat hijau mint.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Akses terbuka untuk umum.

## 6. Perilaku di Ponsel (360px Viewport)
* Setiap baris komponen layanan disajikan rapi dalam kartu mini dengan status di sebelah kanan.

## 7. Meta & Kopi
* **Judul Meta:** `Status Layanan & Kesehatan Sistem | OlahData`
* **Deskripsi Meta:** `Pantau status operasional mesin komputasi statistik, database, dan sistem OlahData secara real-time.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`systemStatus`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG menulis angka uptime 99,999% karangan tanpa pengukuran nyata.
* [x] Data bersumber langsung dari endpoint `/api/health` yang dapat diuji.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga  Panduan  Status [aktif]            [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| STATUS LAYANAN OLAHDATA                     [ Terakhir diperiksa: 20:45 WIB ]     |
| [v] SELURUH SISTEM BEROPERASI NORMAL (Mint)                                       |
|                                                                                   |
| KOMPONEN INFRASTRUKTUR:                                                           |
| Komponen                 | Status       | Waktu Respons | Catatan Operasional     |
| Antarmuka Web & CDN      | [ Operasional | 45 ms         | Cloudflare Global Edge  |
| Mesin Statistik Python   | [ Operasional | 420 ms        | FastAPI OLS & Scipy     |
| Basis Data & RLS         | [ Operasional | 88 ms         | Supabase PostgreSQL     |
| Layanan Pembayaran       | [ Operasional | Siaga         | Midtrans QRIS & VA      |
|                                                                                   |
| RIWAYAT GANGGUAN & PEMELIHARAAN (30 HARI TERAKHIR):                               |
| [v] Tidak ada gangguan layanan atau insiden yang tercatat.                        |
|                                                                                   |
| [ Segarkan Status Layanan ]                                                       |
+-----------------------------------------------------------------------------------+
```
