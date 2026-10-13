# Spesifikasi Halaman: Onboarding Mahasiswa Baru (`/onboarding`)

**Rute:** `/onboarding`  
**Kategori:** Autentikasi & Awal Pemakaian  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Menyesuaikan profil penelitian (jurusan/program studi dan jenis skala kuesioner) dalam 3 pertanyaan ringkas, atau langsung melompat mencoba data contoh skripsi dalam 60 detik.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang baru selesai mendaftar akun, ingin cepat melihat apakah web app ini cocok untuk skripsinya tanpa dipersulit survei panjang.

## 3. Aksi Utama Tunggal & Jelas
**"Mulai dengan Data Contoh (60 Detik)"** ATAU **"Buka Meja Kerja Kosong"** (dilengkapi tombol *"Lewati untuk Sekarang"* di pojok kanan atas).

## 4. Isi Utama dengan Hierarki
1. **Langkah 1: Peran & Jenjang:**
   - Mahasiswa S1 Skripsi (default) / Mahasiswa S2 Tesis / Dosen Pembimbing / Peneliti.
2. **Langkah 2: Rumpun Program Studi:**
   - Manajemen & Bisnis / Psikologi / Pendidikan & Keguruan / Ilmu Komunikasi / Ilmu Sosial & Politik / Kesehatan Masyarakat.
3. **Langkah 3: Status Data Saat Ini:**
   - *Sudah punya data kuesioner Excel/CSV* (Arahkan ke unggah).
   - *Baru menyusun kuesioner / ingin coba data simulasi* (Arahkan ke proyek contoh berlabel).
4. **Opsi Lewati Kapan Saja:** Tombol teks *"Lewati pengaturan ini dan langsung ke meja kerja"* di sudut atas.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Pilihan kartu skeleton dengan animasi lembut.
* **Kosong:** N/A.
* **Galat:** Pesan galat jika penyimpanan profil awal gagal tersimpan di local storage/database.
* **Sukses:** Animasi transisi mulus ke `/app` atau `/app/proyek/sample/analisis`.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Dialihkan ke `/masuk` jika belum memiliki sesi aktif.

## 6. Perilaku di Ponsel (360px Viewport)
* Opsi radio-card vertikal dengan target sentuh &ge; 48px.

## 7. Meta & Kopi
* **Judul Meta:** `Selamat Datang di OlahData — Siapkan Meja Kerjamu`
* **Deskripsi Meta:** `Personalisasi meja kerja statistik kuesioner skripsi sesuai jurusan dan desain penelitianmu.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`onboarding`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG mewajibkan mengisi 10 formulir membosankan sebelum pengguna bisa melihat produk.
* [x] Wajib ada tombol *"Lewati"* yang mudah diakses.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]                                                  [ Lewati Pengaturan ] |
+-----------------------------------------------------------------------------------+
| SELAMAT DATANG! MARI SIAPKAN MEJA KERJA SKRIPSIMU                                 |
| 3 pertanyaan singkat agar kami bisa menyesuaikan rekomendasi tabel Bab 4 untukmu. |
|                                                                                   |
| 1. Apa program studi skripsimu?                                                   |
|    (*) Manajemen & Bisnis    ( ) Psikologi    ( ) Ilmu Pendidikan                 |
|    ( ) Ilmu Komunikasi       ( ) Ilmu Sosial  ( ) Lainnya                         |
|                                                                                   |
| 2. Apa tahap pengumpulan datamu saat ini?                                         |
|    ( ) Sudah menyebarkan kuesioner dan punya file Excel (.xlsx / .csv)            |
|    (*) Ingin mencoba simulasi data contoh dulu (Rekomendasi - 60 Detik)            |
|                                                                                   |
| [ Mulai dengan Data Contoh (60 Detik) -> ]     [ Unggah File Saya Sendiri ]       |
+-----------------------------------------------------------------------------------+
```
