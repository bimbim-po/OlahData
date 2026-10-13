# Spesifikasi Halaman: Panduan Belajar Statistik Skripsi (`/panduan`)

**Rute:** `/panduan`  
**Kategori:** Publik & Edukasi Akademik  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Membaca artikel panduan praktis dan terpercaya mengenai cara memahami output statistik skripsi, agar mahasiswa siap menjawab pertanyaan dosen saat bimbingan dan sidang.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang tidak memiliki latar belakang ilmu statistik murni, cemas menghadapi pertanyaan penguji seperti *"Apa maksud dari nilai t-hitung ini?"*, dan butuh penjelasan bahasa manusia yang masuk akal.

## 3. Aksi Utama Tunggal & Jelas
**"Baca Panduan Membaca Output Bab 4"** (Navigasi membaca artikel dan mencoba data simulasinya).

## 4. Isi Utama dengan Hierarki
1. **Lencana Status Draf Akademik:** Label jelas *"DRAF AKADEMIK — Disusun berdasarkan konvensi skripsi S1 di Indonesia (Sugiyono, Ghozali, Azwar)"*.
2. **Daftar Modul Bacaan Mandiri:**
   - *Membedakan r-hitung vs r-tabel:* Kapan butir kuesioner sah dipakai.
   - *Kunci Cronbach's Alpha:* Apa beda reliabilitas 0,60 vs 0,70.
   - *Memahami Nilai Signifikansi (Sig. / p-value):* Mengapa angka 0,000 bukan berarti salah.
   - *Membaca Uji t (Parsial) & Uji F (Simultan):* Cara menjelaskan pengaruh variabel X terhadap Y di depan penguji.
   - *Koefisien Determinasi ($R^2$):* Menjelaskan seberapa besar kontribusi variabel bebas.
3. **Struktur Setiap Artikel:**
   - Pertanyaan Sidang yang Sering Muncul.
   - Jawaban Ringkas (1 Paragraf untuk Dihafal).
   - Penjelasan Lengkap dengan Logika Sehari-hari.
   - Contoh Potongan Tabel Bab 4 Berlabel Contoh.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka artikel teks dengan lebar kolom optimal (< 68 karakter).
* **Kosong:** Tampilan jika filter kategori artikel tidak menemukan topik.
* **Galat:** Pesan kesalahan pemuatan artikel dengan opsi unduh draf offline.
* **Sukses:** Artikel ditampilkan dengan tipografi Figtree nyaman dibaca dan blok kutipan akademis.
* **Batas Paket:** Bebas diakses tanpa batas oleh semua mahasiswa.
* **Tanpa Izin:** Akses terbuka tanpa autentikasi.

## 6. Perilaku di Ponsel (360px Viewport)
* Indeks daftar isi di bagian atas dapat diciutkan (*collapsible table of contents*).
* Ukuran teks 16px dengan line-height 1.625 yang tidak membuat mata lelah.

## 7. Meta & Kopi
* **Judul Meta:** `Panduan Membaca Output Statistik Skripsi S1 | OlahData`
* **Deskripsi Meta:** `Belajar membaca tabel hasil regresi, reliabilitas, dan uji t untuk persiapan sidang skripsi. Bahasa sederhana tanpa rumus rumit.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`learningGuide`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas artikel hasil generate AI tanpa referensi rujukan ilmiah.
* [x] Setiap artikel secara transparan mencantumkan buku rujukan statistik yang diakui di kampus Indonesia.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga  Panduan [aktif]  Bantuan           [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| PANDUAN BELAJAR: MEMBACA OUTPUT SKRIPSI             [ DRAF AKADEMIK TERBUKA ]     |
| Pahami makna angka statistikmu agar tenang dan percaya diri saat ujian sidang.    |
|                                                                                   |
| DAFTAR ARTIKEL PANDUAN:                                                           |
| 1. Cara Menjawab Pertanyaan: "Apa Maksud Nilai Sig. 0,000?"                       |
|    Dosen sering menguji apakah mahasiswa paham konsep probabilitas kesalahan.     |
|                                                                                   |
| 2. Perbedaan Uji t (Parsial) dan Uji F (Simultan) dalam 2 Menit                   |
|    Kapan membuktikan pengaruh masing-masing, dan kapan pengaruh bersama-sama.     |
|                                                                                   |
| 3. Mengapa Nilai Cronbach's Alpha di Bawah 0,60 Bermasalah?                       |
|    Solusi praktis menggunakan kolom Alpha If Item Deleted tanpa panik.            |
|                                                                                   |
| +-------------------------------------------------------------------------------+ |
| | CONTOH PERTANYAAN SIDANG:                                                     | |
| | "Saudara, kenapa nilai F hitung Anda signifikan tetapi t hitung X1 tidak?"    | |
| | JAWABAN SINGKAT UNTUK SIDANG:                                                 | |
| | "Izin menjawab Bapak/Ibu Penguji. Secara simultan seluruh variabel bebas     | |
| | memiliki keterkaitan bersama, namun secara parsial variabel X1 memiliki       | |
| | varians unik yang belum cukup membuktikan pengaruh langsung terhadap Y..."    | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```
