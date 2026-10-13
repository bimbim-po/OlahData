# Spesifikasi Halaman: Harga & FAQ Penagihan (`/harga`)

**Rute:** `/harga`  
**Kategori:** Publik & Pemasaran  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Membandingkan manfaat dan batasan masing-masing paket langganan secara transparan, memahami metode pembayaran lokal yang didukung, serta memperoleh kepastian garansi tanpa biaya tersembunyi.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang uang sakunya terbatas, takut terkena langganan berulang otomatis (*auto-renewal*) tanpa disadari, dan ingin tahu apakah paket yang dibeli cukup untuk menyelesaikan skripsi mereka sampai sidang.

## 3. Aksi Utama Tunggal & Jelas
**"Pilih Paket Ini"** pada kartu paket rekomendasi (*Paket Kilat 30 Hari* / *Paket Semesteran*).

## 4. Isi Utama dengan Hierarki
1. **Header & Pengantar Transparan:** Penjelasan bahwa OlahData mengenakan biaya untuk menutup biaya komputasi server dan pengembangan berkelanjutan, tanpa langganan jebakan.
2. **Kartu Tiga Paket:**
   - *Coba Gratis (Rp 0):* 1 proyek aktif, validitas & deskriptif, pratinjau tabel Bab 4.
   - *Paket Kilat 30 Hari (Rp 49.000, Sekali Bayar):* Seluruh uji statistik, regresi linier berganda, ekspor Word/PDF, masa aktif 30 hari tanpa tagihan otomatis.
   - *Paket Semesteran 6 Bulan (Rp 99.000, Sekali Bayar):* Cocok untuk masa bimbingan hingga revisi pasca-sidang, tanpa batasan proyek aktif.
3. **Tabel Matriks Perbandingan Fitur Detail:** Baris demi baris membandingkan batas baris responden, jenis uji, ekspor Word, jejak hitung formula, dan prioritas dukungan.
4. **FAQ Penagihan Khusus Mahasiswa:**
   - *"Apakah ini langganan yang otomatis memotong saldo setiap bulan?"* (Jawaban tegas: TIDAK, sistem menggunakan pembayaran satu kali via QRIS/VA).
   - *"Metode pembayaran apa saja yang tersedia?"* (QRIS semua e-wallet, GoPay, ShopeePay, Transfer VA BCA/Mandiri/BRI/BNI).
   - *"Bagaimana jika dosen meminta revisi setelah paket habis?"* (Proyek tetap tersimpan aman dan dapat dibuka kembali kapan saja).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Tiga kartu paket skeleton dengan tinggi seimbang dan shimmer lembut.
* **Kosong:** N/A (halaman statis).
* **Galat:** Penanganan ramah jika gagal memuat status diskon/promo server.
* **Sukses:** Penanda visual jelas pada paket yang sedang aktif jika pengguna sudah login.
* **Batas Paket:** Penjelasan lugas batas baris responden (misal 50 baris untuk gratis, 500 baris untuk kilat).
* **Tanpa Izin:** Bebas diakses publik.

## 6. Perilaku di Ponsel (360px Viewport)
* Tiga kartu bertumpuk vertikal dengan paket rekomendasi (*Paket Kilat*) diberi penanda border biru tinta (`#2748D6`).
* Tabel perbandingan fitur dilengkapi navigasi geser horizontal atau toggle akordeon.

## 7. Meta & Kopi
* **Judul Meta:** `Harga & Pilihan Paket Langganan Mahasiswa Skripsi | OlahData`
* **Deskripsi Meta:** `Tarif transparan mahasiswa untuk olah data kuesioner skripsi. Pembayaran satu kali via QRIS & Virtual Account tanpa perpanjangan otomatis.`
* **Kopi:** Diambil dari `src/lib/copy.ts` (`pricing`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Tanpa kartu harga dengan countdown timer palsu (*"Diskon berakhir dalam 10 menit"*).
* [x] Tanpa centang abu-abu samar yang menyembunyikan batasan paket.
* [x] Tanpa klaim testimoni fiktif dari mahasiswa palsu.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga [aktif]  Panduan                    [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| PILIHAN PAKET MEJA KERJA MAHASISWA                                                |
| Bayar satu kali saat butuh. Tanpa potongan otomatis bulanan, tanpa jebakan saldo. |
|                                                                                   |
| [ Coba Gratis ]             [ PAKET KILAT 30 HARI ]       [ PAKET SEMESTERAN ]    |
| Rp 0                        Rp 49.000                     Rp 99.000               |
| Untuk uji coba & validitas  Paling pas untuk Bab 4        Mendampingi s.d revisi  |
| - 1 Proyek aktif            - Proyek tak terbatas         - Proyek tak terbatas   |
| - Maks 50 responden         - Hingga 500 responden        - Hingga 1.000 resp     |
| - Uji Validitas & Reliab    - Seluruh Uji + Regresi OLS   - Seluruh Uji + ANOVA   |
| - Salin pratinjau           - Ekspor Word & PDF Baku      - Ekspor Word & PDF     |
| [ Mulai Gratis ]            [ Pilih Paket Kilat -> ]      [ Pilih Semesteran ]    |
|                                                                                   |
| PERBANDINGAN FITUR RINCI (Tabel Baku)                                             |
| Fitur                        | Gratis    | Kilat 30 Hari | Semesteran 6 Bulan     |
| Uji Validitas Pearson        | [v] Ada   | [v] Ada       | [v] Ada                |
| Uji Reliabilitas Cronbach    | [v] Ada   | [v] Ada       | [v] Ada                |
| Uji Asumsi Klasik (K-S, VIF) | [x] Tidak | [v] Ada       | [v] Ada                |
| Regresi Linier Berganda      | [x] Tidak | [v] Ada       | [v] Ada                |
| Ekspor File Word .docx       | [x] Tidak | [v] Ada       | [v] Ada                |
|                                                                                   |
| PERTANYAAN SEPUTAR PEMBAYARAN (FAQ):                                              |
| [?] Apakah saldo saya akan terpotong otomatis bulan depan? (TIDAK ADA AUTO DEBET) |
| [?] Bagaimana cara membayarnya? (QRIS, GoPay, OVO, ShopeePay, Virtual Account)    |
+-----------------------------------------------------------------------------------+
```
