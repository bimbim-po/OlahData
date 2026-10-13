# Spesifikasi Halaman: Kemitraan Kampus & Program Studi (`/kampus`)

**Rute:** `/kampus`  
**Kategori:** Publik & Kemitraan Akademik  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Menyediakan informasi dan formulir kontak bagi dosen, koordinator skripsi, atau pimpinan program studi yang ingin menyediakan lisensi laboratorium OlahData bagi mahasiswa bimbingan mereka.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Dosen pembimbing atau kepala lab komputasi yang lelah melihat mahasiswa memakai software bajakan bermasalah atau salah rumus, dan ingin solusi institusi yang legal, beretika, dan berstandar ilmiah.

## 3. Aksi Utama Tunggal & Jelas
**"Kirim Pengajuan Kemitraan Kampus"** (Formulir kontak resmi program studi/fakultas).

## 4. Isi Utama dengan Hierarki
1. **Pernyataan Kejujuran:** *Tidak menampilkan logo kampus mana pun yang belum menandatangani kerja sama resmi* (aturan kejujuran produk).
2. **Nilai Manfaat untuk Program Studi:**
   - Standarisasi format tabel Bab 4 sesuai kaidah ilmiah APA 7th.
   - Peniadaan pembajakan software statistik komersial di lingkungan kampus.
   - Audit trail dan template Pernyataan Penggunaan Alat untuk integritas skripsi.
   - Menghilangkan friksi teknis sehingga mahasiswa fokus pada metodologi dan substansi riset.
3. **Formulir Pengajuan Kemitraan:**
   - Nama Dosen / Perwakilan Institusi.
   - Nama Perguruan Tinggi & Program Studi.
   - Email Institusi (akhiran `.ac.id`).
   - Estimasi Jumlah Mahasiswa Skripsi per Semester.
   - Kebutuhan Khusus / Pesan.
4. **Waktu Respons:** Janji tanggapan dalam 2 hari kerja oleh tim teknis OlahData.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka formulir dan blok info kemitraan.
* **Kosong:** N/A.
* **Galat:** Validasi sebaris jika email institusi tidak valid atau pesan kosong.
* **Sukses:** Notifikasi hijau mint *"Pesan kemitraanmu telah kami terima. Tim kami akan menghubungi melalui email institusi."*
* **Batas Paket:** N/A.
* **Tanpa Izin:** Akses terbuka untuk umum.

## 6. Perilaku di Ponsel (360px Viewport)
* Formulir satu kolom dengan padding nyaman dan tombol submit lebar penuh.

## 7. Meta & Kopi
* **Judul Meta:** `Kemitraan Laboratorium & Program Studi Skripsi | OlahData`
* **Deskripsi Meta:** `Solusi olah data statistik kuesioner resmi dan berintegritas untuk program studi dan fakultas perguruan tinggi di Indonesia.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`campus`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG menampilkan deretan logo kampus ternama tanpa perjanjian legal tertulis.
* [x] DILARANG menulis klaim testimoni fiktif dekan atau dosen.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga  Panduan  Kampus [aktif]            [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| KEMITRAAN INSTITUSI & PROGRAM STUDI                                               |
| Fasilitasi mahasiswa tingkat akhir dengan alat olah data kuesioner yang legal,    |
| berintegritas akademik, dan terstandarisasi APA 7th.                             |
|                                                                                   |
| FORMULIR PENGAJUAN LISENSI LABORATORIUM:                                          |
| Nama Lengkap Dosen / Koordinator : [ Dr. Budi Santoso, S.E., M.Si.              ] |
| Nama Perguruan Tinggi            : [ Universitas Negeri ...                     ] |
| Fakultas / Program Studi         : [ Manajemen / Psikologi                      ] |
| Email Institusi (.ac.id)         : [ budi@kampus.ac.id                          ] |
| Perkiraan Jumlah Mahasiswa       : [ 100 - 250 Mahasiswa per Semester [v]       ] |
| Kebutuhan Tambahan               : [ Ingin pengenalan format Bab 4 untuk lab... ] |
|                                                                                   |
| [ Kirim Pengajuan Lisensi Kampus -> ]                                             |
|                                                                                   |
| CATATAN INTEGRITAS:                                                               |
| OlahData tidak memanipulasi data responden. Seluruh angka dihitung deterministik. |
+-----------------------------------------------------------------------------------+
```
