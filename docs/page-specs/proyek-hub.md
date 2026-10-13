# Spesifikasi Halaman: Detail Proyek & Komparasi Versi (`/app/proyek/[id]`, `/app/proyek/[id]/bandingkan`)

**Rute:** `/app/proyek/[id]`, `/app/proyek/[id]/bandingkan`  
**Kategori:** Aplikasi Utama  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Melihat ringkasan menyeluruh dari satu proyek skripsi (versi dataset yang diunggah, riwayat perbaikan data, uji statistik yang sudah selesai, lembar ekspor) serta membandingkan hasil uji sebelum vs sesudah pembersihan outlier.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang sedang bolak-balik merevisi data kuesioner atas masukan dosen pembimbing (misal *"coba buang responden 12 dan 45 yang nilainya ekstrem, lalu lihat apakah R Square-nya naik"*), dan butuh bukti perbandingan yang rapi tanpa kehilangan data asli.

## 3. Aksi Utama Tunggal & Jelas
**"Lanjut Analisis atau Buka Hasil Terakhir"** ATAU **"Bandingkan Versi Ini dengan Versi Sebelumnya"**.

## 4. Isi Utama dengan Hierarki
1. **Header Proyek:**
   - Judul Penelitian / Nama Proyek Skripsi.
   - Variabel Bebas (X) dan Terikat (Y) yang terpetakan.
   - Status Proyek (Terverifikasi / Ada Catatan Asumsi).
2. **Pohon Versi Dataset (Data Lineage & Audit Trail):**
   - *Versi 1 (Asli):* `kuesioner_mentah.xlsx` (120 responden, 18 butir).
   - *Versi 2 (Revisi):* Eksklusi 2 responden outlier (118 responden).
   - Setiap versi bersifat *immutable* (data asli tidak pernah ditimpa atau dihapus).
3. **Tab Pengujian yang Sudah Dijalankan:**
   - Uji Kualitas Data & Straight-lining.
   - Uji Validitas Butir & Reliabilitas Cronbach's Alpha.
   - Uji Asumsi Klasik (Normalitas, Multikolinearitas, Heteroskedastisitas).
   - Regresi Linier Berganda (Uji t, Uji F, $R^2$).
4. **Halaman Komparasi (`/bandingkan`):**
   - Perbandingan berdampingan: $R^2$ Versi 1 vs Versi 2, Sig. Uji F Versi 1 vs Versi 2, Butir Gugur sebelum vs sesudah.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka pohon versi dan kartu ringkasan hasil.
* **Kosong:** Jika proyek baru dibuat dan belum ada dataset yang diunggah, tampilkan tombol *"Unggah Berkas Kuesioner Pertama"*.
* **Galat:** Pesan galat jika ID proyek tidak ditemukan dengan tombol kembali ke `/app`.
* **Sukses:** Status versi dan seluruh hasil uji dapat diklik langsung.
* **Batas Paket:** Penanda jika batas versi dataset per proyek pada paket gratis tercapai.
* **Tanpa Izin:** Dialihkan ke `/masuk` dengan pesan ramah.

## 6. Perilaku di Ponsel (360px Viewport)
* Komparasi versi berubah dari layout 2 kolom (berdampingan) menjadi tab beralih (*toggle tab*) "Versi Asli" vs "Versi Revisi".

## 7. Meta & Kopi
* **Judul Meta:** `Detail Proyek & Riwayat Analisis Skripsi | OlahData`
* **Deskripsi Meta:** `Kelola dataset kuesioner, riwayat versi revisi dosen, dan komparasi hasil uji statistik skripsi.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`projectHub`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG ada tombol "Generate Responden Baru" atau "Simulasikan Nilai Otomatis".
* [x] Setiap versi data memiliki hash kriptografis jejak audit yang membuktikan keaslian data.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Meja Kerja  /  Proyek: Pengaruh Kepemimpinan thd Kinerja               |
+-----------------------------------------------------------------------------------+
| PROYEK SKRIPSI: PENGARUH KEPEMIMPINAN TERHADAP KINERJA KARYAWAN                   |
| 2 Variabel Bebas (X1, X2) -> 1 Variabel Terikat (Y) | Dosen Pembimbing: Terpetakan|
|                                                                                   |
| RIWAYAT VERSI DATASET (Tidak Saling Menimpa):                                     |
| [v] Versi 2 (Aktif): 118 Responden (Eksklusi R014, R082 outlier) [Bandingkan Versi|
| [ ] Versi 1 (Asli) : 120 Responden (Unggahan mentah 12 Okt 2026)                  |
|                                                                                   |
| RINGKASAN HASIL PENGUJIAN TERAKHIR:                                               |
| - Uji Validitas       : [ 18 dari 18 butir Valid ] (Mint)                         |
| - Uji Reliabilitas    : [ Alpha = 0,872 (Reliabel) ] (Mint)                       |
| - Asumsi Normalitas   : [ Sig = 0,200 > 0,05 (Normal) ] (Mint)                    |
| - Regresi Linier OLS  : [ R2 = 0,460 | F = 48,65 (Signifikan) ] (Mint)            |
|                                                                                   |
| [ Buka Lembar Hasil Lengkap (Tiga Lapis) -> ]       [ Ekspor Berkas Word (.docx) ]|
+-----------------------------------------------------------------------------------+
```
