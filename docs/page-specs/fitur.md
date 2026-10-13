# Spesifikasi Halaman: Fitur & Modul Pengujian Statistik (`/fitur`, `/fitur/[kelompok]`)

**Rute:** `/fitur`, `/fitur/validitas-reliabilitas`, `/fitur/asumsi-klasik`, `/fitur/regresi`, `/fitur/uji-beda`  
**Kategori:** Publik & Pemasaran  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Memahami pengujian statistik apa saja yang disediakan OlahData dan melihat contoh nyata format tabel Bab 4 serta interpretasinya sebelum mengunggah kuesioner sendiri.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa S1 tingkat akhir yang baru saja mendapat daftar uji dari dosen pembimbing (mis. *"kamu harus uji validitas, reliabilitas, asumsi klasik, dan regresi"*), merasa bingung membedakan rumus dan takut software yang dipakai tidak diakui saat sidang.

## 3. Aksi Utama Tunggal & Jelas
**"Coba Uji Ini dengan Data Contoh"** (Tombol tinta biru `#2748D6`, mengarahkan ke simulasi wizard analisis tanpa harus mendaftar terlebih dahulu).

## 4. Isi Utama dengan Hierarki
1. **Header Modul:** Nama kelompok uji dalam istilah skripsi Indonesia (bukan jargon abstrak laboratorium).
2. **Penjelasan Sederhana (Konsep 2 Menit):** Penjelasan santai tanpa rumus kalkulus yang menjawab: *"Mengapa dosen pembimbing meminta uji ini?"*.
3. **Contoh Tabel Bab 4 Baku Word:** Tabel standar APA 7th dari data contoh berlabel (`N = 120 Responden`) dengan tombol salin 1-klik.
4. **Teks Paragraf Bab 4:** Narasi resmi skripsi dengan angka tersambung kuning stabilo (`#FFE14D`).
5. **Daftar Kriteria Kelulusan Uji:** Nilai r-tabel, Cronbach's Alpha $\ge 0,60$, Sig. $< 0,05$, VIF $< 10$.
6. **Blok Solusi: "Jika tidak lolos?":** Solusi konkret jika data responden bermasalah.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka tabel 4 kolom dan blok paragraf teks abu-abu lembut tanpa pergeseran layout (CLS < 0,05).
* **Kosong:** N/A (halaman konten statis terkurasi; jika kategori tidak ditemukan, tampilkan daftar 4 kelompok uji alternatif).
* **Galat:** Pesan ramah jika koneksi putus saat memuat simulasi data contoh, dengan tombol *"Muat Ulang Halaman"*.
* **Sukses:** Halaman ter-render sempurna dengan tabel APA 7th interaktif dan angka stabilo tersambung.
* **Batas Paket:** Tanda centang jelas pada fitur yang termasuk dalam *Paket Gratis* vs *Paket Kilat/Semesteran*.
* **Tanpa Izin / Sesi Habis:** Halaman publik, selalu dapat diakses tanpa login.

## 6. Perilaku di Ponsel (360px Viewport)
* Tabel ilmiah dilengkapi *horizontal swipe indicator* dengan baris pertama tetap rapi.
* Tombol CTA *"Coba Uji Ini"* menempel di bagian bawah layar (*sticky bottom action bar*) dengan tinggi minimal 44px.

## 7. Meta & Kopi
* **Judul Meta:** `Uji [Nama Pengujian] Skripsi Kuantitatif — Contoh Tabel Bab 4 & Rumus | OlahData`
* **Deskripsi Meta:** `Pelajari cara uji [nama pengujian] kuesioner skripsi. Tabel baku APA 7th siap salin ke Word, dihitung mesin statistik deterministik tanpa SPSS.`
* **Kopi:** Diambil terpusat dari `src/lib/copy.ts` (`availableTests`, `glossary`, `actionGuidance`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas kartu fitur mengambang dengan ikon gradien neon.
* [x] Bebas klaim berlebihan ("Software AI Paling Canggih di Dunia").
* [x] Data contoh secara eksplisit berlabel: *"Data Contoh Berlabel — Bukan Data Pengguna Asli"*.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur [v]  Harga  Panduan                        [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| UJI VALIDITAS & RELIABILITAS INSTRUMEN                                            |
| Pastikan butir pertanyaan kuesionermu sah dan konsisten sebelum disebar luaskan.  |
|                                                                                   |
| [ Coba Uji Ini dengan Data Contoh (60 Detik) ]                                    |
|                                                                                   |
| TABEL CONTOH BAB 4 (Data Contoh: 120 Responden)               [Salin Tabel Word]  |
| Butir Pertanyaan | r Hitung  | r Tabel (df=118) | Sig. (p) | Simpulan             |
| X1.1             | ==0,782== | 0,179            | 0,000    | [Lulus Valid] (Mint) |
| X1.2             | ==0,694== | 0,179            | 0,000    | [Lulus Valid] (Mint) |
| Cronbach's Alpha | ==0,872== | Batas min: 0,60  | -        | [Reliabel] (Mint)    |
|                                                                                   |
| PENJELASAN UNTUK BAB 4 SKRIPSI:                                                   |
| "Berdasarkan hasil uji pada Tabel 4.1, seluruh butir pernyataan variabel X1       |
| memiliki nilai r hitung > ==0,179== dan nilai Cronbach's Alpha sebesar ==0,872==  |
| sehingga instrumen dinyatakan valid dan andal untuk pengujian hipotesis."         |
|                                                                                   |
| [?] Apa artinya r-hitung dan Cronbach's Alpha? (Buka Glosarium Awam)             |
+-----------------------------------------------------------------------------------+
```
