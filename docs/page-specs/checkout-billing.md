# Spesifikasi Halaman: Checkout, Kuitansi & Status Pembayaran (`/checkout`, `/app/tagihan`, `/app/tagihan/[id]`, `/pembayaran/status`)

**Rute:** `/checkout`, `/app/tagihan`, `/app/tagihan/[id]`, `/pembayaran/status`  
**Kategori:** Akun & Penagihan  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Menyelesaikan pembayaran paket skripsi menggunakan metode lokal Indonesia (QRIS / Virtual Account), memantau status transaksi secara real-time, dan mengunduh kuitansi resmi bertanda tangan digital untuk laporan biaya.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang membutuhkan akses fitur lengkap segera untuk mengejar jadwal bimbingan besok, ingin pembayaran yang langsung terkonfirmasi otomatis tanpa harus mengunggah bukti transfer manual, dan membutuhkan kuitansi resmi untuk orang tua atau program beasiswa.

## 3. Aksi Utama Tunggal & Jelas
- Pada `/checkout`: **"Lanjut Pembayaran dengan [Metode]"** (Tombol biru tinta).
- Pada `/pembayaran/status`: **"Buka Meja Kerja Skripsi Sekarang"** (setelah status lunas).
- Pada `/app/tagihan/[id]`: **"Cetak Kuitansi Resmi (.PDF)"**.

## 4. Isi Utama dengan Hierarki
1. **Halaman Checkout (`/checkout`):**
   - Ringkasan Pesanan: Nama paket, masa aktif, harga transparan tanpa PPN terselubung.
   - Pilihan Metode Pembayaran:
     - *QRIS (Rekomendasi - Instan):* Semua bank dan dompet digital (GoPay, ShopeePay, DANA, OVO, LinkAja).
     - *Virtual Account (Verifikasi Otomatis):* BCA, Mandiri, BRI, BNI, Permata.
   - Jaminan Keamanan: Transaksi diproses melalui gerbang pembayaran berlisensi Bank Indonesia (Midtrans).
2. **Status Pembayaran (`/pembayaran/status`):**
   - *Status Berhasil:* Animasi centang hijau mint, rincian nomor transaksi, tombol langsung kembali ke proyek skripsi.
   - *Status Menunggu:* Tampilan kode QRIS / nomor VA dengan batas waktu pembayaran (countdown 15 menit), tombol *"Cek Status Pembayaran Sekarang"*.
   - *Status Gagal / Kedaluwarsa:* Penjelasan ramah dengan tombol *"Coba Bayar Ulang"*.
3. **Riwayat Tagihan & Kuitansi (`/app/tagihan`, `/app/tagihan/[id]`):**
   - Tabel riwayat: Nomor Faktur (`INV-2026-XXXX`), Tanggal, Paket, Jumlah, Status (Lunas), Tombol Unduh Kuitansi.
   - Lembar Kuitansi Resmi: Kop faktur OlahData, stempel digital lunas, nama mahasiswa, rincian pembayaran, dan tanda tangan digital.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka rincian checkout dan QR code shimmer.
* **Kosong:** Pada riwayat tagihan pengguna gratis: *"Belum ada riwayat tagihan. Kamu saat ini menggunakan paket gratis."*
* **Galat:** Pesan kesalahan jika koneksi gateway pembayaran mengalami gangguan, dengan panduan tidak mendebit saldo ganda.
* **Sukses:** Status lunas langsung mengaktifkan fitur dan kuota tanpa perlu reload manual.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Dialihkan ke `/masuk`.

## 6. Perilaku di Ponsel (360px Viewport)
* QRIS dapat disimpan/tangkapan layar langsung dari ponsel; tombol *Salin Nomor Virtual Account* dilengkapi konfirmasi salin instan.

## 7. Meta & Kopi
* **Judul Meta:** `Pembayaran Paket & Kuitansi Resmi | OlahData`
* **Deskripsi Meta:** `Selesaikan pembayaran paket olah data skripsi via QRIS & Virtual Account serta unduh kuitansi resmi.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`billing`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG ada biaya tambahan tersembunyi yang tiba-tiba muncul di layar checkout (*hidden fees*).
* [x] Bebas biaya langganan berulang otomatis (*no auto-renew*).

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Meja Kerja  /  Checkout Pembayaran                                    |
+-----------------------------------------------------------------------------------+
| CHECKOUT PAKET KILAT 30 HARI                                                      |
| Pembayaran satu kali. Tanpa perpanjangan otomatis.                                |
|                                                                                   |
| 1. RINCIAN PESANAN:                                                               |
|    Paket Kilat (Masa Aktif 30 Hari Penuh)                     : Rp 49.000         |
|    Biaya Layanan & Pajak                                      : Rp      0 (Termasuk)
|    Total yang Dibayarkan                                      : Rp 49.000         |
|                                                                                   |
| 2. PILIH METODE PEMBAYARAN:                                                       |
|    (*) QRIS (GoPay, ShopeePay, DANA, OVO, BCA Mobile) - Konfirmasi Instan         |
|    ( ) BCA Virtual Account                                                        |
|    ( ) Mandiri Virtual Account                                                    |
|    ( ) BRI Virtual Account                                                        |
|                                                                                   |
| [ Lanjut Pembayaran (Rp 49.000) -> ]                                              |
|                                                                                   |
| Transaksi aman diproses oleh Midtrans (Berlisensi Bank Indonesia).                |
+-----------------------------------------------------------------------------------+
```
