# Spesifikasi Halaman: Pusat Bantuan & Panduan Pemecahan Masalah (`/bantuan`)

**Rute:** `/bantuan`  
**Kategori:** Publik & Dukungan Pengguna  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Menemukan jawaban cepat atas kendala teknis (format file Excel, data tidak lolos uji, arti angka, atau kendala pembayaran) secara mandiri dalam hitungan detik.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang sedang terhenti pekerjaannya di malam hari, panik karena tenggat besok pagi, dan butuh petunjuk jelas tanpa harus menunggu balasan email berjam-jam.

## 3. Aksi Utama Tunggal & Jelas
**"Cari Bantuan atau Masalah..."** (Kolom input pencarian instan yang memfilter artikel pertanyaan secara real-time).

## 4. Isi Utama dengan Hierarki
1. **Input Pencarian Cepat:** Pencarian kata kunci (mis. *"outlier"*, *"format excel"*, *"gagal bayar"*, *"r-tabel"*).
2. **Kategori Masalah Skripsi:**
   - *Format File & Unggah:* Cara merapikan tabulasi kuesioner dari Google Form.
   - *Uji Validitas & Reliabilitas:* Arti butir gugur dan cara menaikkan Cronbach's Alpha.
   - *Asumsi Klasik & Solusi:* Cara mengatasi normalitas residual dan heteroskedastisitas.
   - *Ekspor & Salin Word:* Menempel tabel APA 7th agar tidak berantakan di Microsoft Word.
   - *Akun & Pembayaran:* Konfirmasi status QRIS dan pengunduhan kuitansi.
3. **Daftar Pertanyaan Populer:** 5 pertanyaan yang paling sering diajukan mahasiswa tingkat akhir.
4. **Jalur Bantuan Lanjutan:** Jika belum terjawab, sediakan tautan langsung ke halaman `/kontak` dengan perkiraan respons jujur (1x24 jam kerja).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Bar pencarian skeleton dan 4 kartu kategori shimmer.
* **Kosong:** Saat kata kunci pencarian tidak menghasilkan artikel, tampilkan ilustrasi hangat bertuliskan *"Pertanyaan belum ditemukan. Hubungi tim dukungan kami di sini"* beserta tombol ke `/kontak`.
* **Galat:** Pesan kesalahan koneksi saat memuat indeks artikel dengan opsi coba lagi.
* **Sukses:** Daftar kategori dan artikel akordeon dapat dibuka-tutup dengan halus.
* **Batas Paket:** N/A (pusat bantuan terbuka untuk semua pengguna).
* **Tanpa Izin:** Bebas diakses publik.

## 6. Perilaku di Ponsel (360px Viewport)
* Kotak pencarian berada di atas dan mudah dijangkau jempol.
* Akordeon FAQ memiliki target sentuh &ge; 44px dengan teks terbaca nyaman (16px).

## 7. Meta & Kopi
* **Judul Meta:** `Pusat Bantuan & Solusi Kendala Olah Data Skripsi | OlahData`
* **Deskripsi Meta:** `Panduan lengkap penyelesaian kendala format tabulasi Excel, uji asumsi klasik, dan ekspor tabel Bab 4 untuk mahasiswa.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`helpCenter`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas bot chat palsu di pojok layar yang berpura-pura menjadi agen online (contoh AI trope klise).
* [x] Bebas artikel panjang berbahasa Inggris tanpa relevansi kurikulum skripsi Indonesia.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga  Panduan  Bantuan [aktif]           [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| PUSAT BANTUAN OLAHDATA                                                            |
| Apa kendala yang sedang kamu hadapi dalam mengolah data kuesionermu?              |
|                                                                                   |
| [ Cari kendala... (contoh: format excel, outlier, r tabel, gagal bayar)         ] |
|                                                                                   |
| KATEGORI BANTUAN:                                                                 |
| [ Format File & Unggah ]    [ Uji Validitas & Reliabel ] [ Asumsi Klasik ]        |
| Menyiapkan data kuesioner   Mengatasi butir gugur        Normalitas & Multikol    |
|                                                                                   |
| PERTANYAAN POPULER MAHASISWA:                                                     |
| [>] Bagaimana cara menyiapkan format Excel dari hasil Google Forms?               |
| [>] Kenapa nilai signifikansi (Sig.) saya 0,000? Apakah data saya salah?         |
| [>] Mengapa tabel Word berantakan saat saya tempel (paste)?                       |
| [>] Apakah data responden saya aman dan tidak akan bocor ke publik?               |
|                                                                                   |
| Belum menemukan jawaban? [ Hubungi Tim Dukungan Kami -> ]                         |
+-----------------------------------------------------------------------------------+
```
