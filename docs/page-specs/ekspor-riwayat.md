# Spesifikasi Halaman: Pusat Riwayat Ekspor & Unduhan (`/app/ekspor`)

**Rute:** `/app/ekspor`  
**Kategori:** Aplikasi Utama  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Melihat daftar seluruh berkas naskah Word (.docx), PDF laporan statistik, dan lembar lampiran pernyataan alat yang pernah diekspor, serta mengunduh ulang tanpa perlu menghitung ulang.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang berkas Word hasil unduhan sebelumnya terhapus atau tertimpa revisi, atau yang sedang mencetak lampiran skripsi di rental komputer kampus.

## 3. Aksi Utama Tunggal & Jelas
**"Unduh Berkas Ini Lagi"** (Tombol unduh instan ke browser).

## 4. Isi Utama dengan Hierarki
1. **Daftar Berkas Terunduh (Tabel Rapi):**
   - Nama Berkas & Format (`Laporan_Bab4_Regresi_v2.docx`, `Lampiran_Pernyataan_Alat.pdf`).
   - Judul Proyek & Versi Dataset Asal.
   - Tanggal & Waktu Ekspor.
   - Ukuran Berkas (mis. 245 KB).
   - Tombol Tindakan: *Unduh Ulang*, *Salin Clipboard*, *Hapus Riwayat*.
2. **Pusat Templat Lampiran Skripsi:**
   - Template 1: *Lembar Pernyataan Penggunaan Alat Analisis Data Statistik*.
   - Template 2: *Tabel Tabulasi Mentah Responden untuk Lampiran*.
   - Template 3: *Jejak Hitung Rumus Baku (Traceability Audit Trail)*.
3. **Catatan Integritas:** Pengingat bahwa berkas ekspor Word berisi tabel APA 7th yang dapat diedit langsung menggunakan font skripsi kampus (mis. Times New Roman 12 pt).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Baris tabel riwayat ekspor shimmer.
* **Kosong:** Pesan tenang: *"Kamu belum mengekspor berkas apa pun. Buka hasil pengujianmu dan klik tombol Ekspor Word."* beserta tautan ke `/app`.
* **Galat:** Pesan galat jika berkas generator gagal menyusun blob dokumen.
* **Sukses:** Unduhan otomatis berjalan langsung di peramban.
* **Batas Paket:** Tanda gembok lembut jika fitur ekspor PDF penuh memerlukan *Paket Kilat/Semesteran*.
* **Tanpa Izin:** Dialihkan ke `/masuk`.

## 6. Perilaku di Ponsel (360px Viewport)
* Tabel berubah menjadi kartu riwayat per berkas dengan tombol unduh minimal 44px.

## 7. Meta & Kopi
* **Judul Meta:** `Pusat Riwayat Ekspor & Berkas Skripsi | OlahData`
* **Deskripsi Meta:** `Kelola dan unduh ulang naskah tabel Bab 4 Word dan lembar lampiran skripsi yang telah diolah.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`exportHistory`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas tautan unduh palsu atau iklan pop-up (contoh SaaS tidak beretika).

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Meja Kerja  /  Pusat Ekspor & Unduhan                                 |
+-----------------------------------------------------------------------------------+
| PUSAT EKSPOR & RIWAYAT UNDUHAN BERKAS                                             |
| Seluruh tabel Bab 4 dan lembar lampiran skripsi yang pernah kamu unduh.           |
|                                                                                   |
| RIWAYAT UNDUHAN TERAKHIR:                                                         |
| Nama Berkas                     | Proyek Asal       | Waktu Ekspor  | Aksi        |
| Laporan_Bab4_Regresi_v2.docx    | Pengaruh Motivasi | 12 Okt, 21:04 | [Unduh]     |
| Lampiran_Pernyataan_Alat.pdf    | Pengaruh Motivasi | 12 Okt, 21:08 | [Unduh]     |
| Tabel_Uji_Validitas_APA.docx    | Kepuasan Pasien   | 10 Okt, 14:20 | [Unduh]     |
|                                                                                   |
| TEMPLAT LAMPIRAN SKRIPSI RESMI:                                                   |
| [ Salin Templat Pernyataan Penggunaan Alat ke Clipboard ]                         |
| Format teks baku yang siap kamu tempel di lembar lampiran akhir skripsimu.        |
+-----------------------------------------------------------------------------------+
```
