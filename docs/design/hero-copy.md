# Rencana Kopi Beranda & Koreografi 5 Detik Pertama (OlahData)

**Peran:** Creative Technologist + Product Designer  
**Target:** Dalam 5 detik pertama pengunjung (1) mengerti produk ini apa, (2) merasa ini dibuat serius dan rapi, (3) ingin menyentuh sesuatu, dan (4) tahu langkah pertamanya.  
**Prinsip:** Mengesankan berarti jelas, cepat, dan terasa pintar — bukan ramai atau berisik.

---

## 1. Tiga Opsi Kopi Beranda (Hero Copy)

### Opsi A (Fokus Metodologis & Kepastian Akademik)
* **Judul:** Olah data kuesionermu. Dapatkan tabel Bab 4 dan kalimat penjelas yang siap kamu pertahankan saat sidang.
* **Sub-kalimat:** Dihitung oleh rumus statistik baku, bukan AI. Angka di kalimat penjelas tersambung langsung ke sel asalnya. Datamu tidak diubah.
* **Tombol Utama:** Coba dengan data contoh (60 Detik)
* **Tombol Sekunder:** Unggah data kuesioner sendiri
* **Catatan Mikro:** Gratis 1 proyek • Tanpa daftar • Format baku APA 7th

### Opsi B (Fokus Ketenangan Mental & Mengurangi Stres Skripsi)
* **Judul:** Dari tabulasi Excel ke naskah Bab 4 tanpa pusing rumus dan SPSS.
* **Sub-kalimat:** Masukkan data kuesioner skala Likert, peroleh tabel validitas, reliabilitas, dan regresi lengkap dengan penjelasannya. Angka dihitung program, bukan perkiraan AI.
* **Tombol Utama:** Buka demo data contoh
* **Tombol Sekunder:** Mulai dengan data sendiri
* **Catatan Mikro:** Data responden diisolasi privat • Hasil dilengkapi jejak hitung

### Opsi C (Fokus Aksi Nyata & Kejelasan Bahasa Indonesia — **TERPILIH**)
* **Judul:** Unggah data kuesionermu. Dapatkan tabel Bab 4 dan penjelasan yang bisa kamu jelaskan sendiri.
* **Sub-kalimat:** Angka dihitung program dengan rumus statistik baku, bukan AI. Setiap angka di naskah tersambung ke sel asalnya agar kamu paham saat bimbingan.
* **Tombol Utama:** Coba dengan data contoh
* **Tombol Sekunder:** Unggah berkas sendiri
* **Catatan Mikro:** Data responden aman &bull; Tanpa manipulasi &bull; Selesai dalam hitungan menit

---

## 2. Mengapa Memilih Opsi C? (Tinjauan Kritis & Anti-Default)

Jika kita menguji Opsi A dan B dengan pertanyaan: *"Apakah kalimat ini bisa dipakai oleh software statistik apa pun (SPSS, JASP, SmartPLS, atau SaaS AI generik)?"*

1. **Opsi A** masih terdengar agak kaku dan berorientasi "ketakutan sidang". Kata *"siap kamu pertahankan"* menambah beban psikologis mahasiswa yang sudah cemas.
2. **Opsi B** menyebut nama merk lain ("tanpa SPSS") yang merupakan pola klise copywriting SaaS murah, dan terasa reaktif alih-alih percaya diri dengan kekuatannya sendiri.
3. **Opsi C** langsung menyatakan **pekerjaan nyata yang diselesaikan** (*"Unggah data... dapatkan tabel Bab 4 dan penjelasan"*), dan menyentuh kebutuhan emosional terdalam mahasiswa: **"bisa kamu jelaskan sendiri saat bimbingan"**.
   - Ini membedakan OlahData dari AI joki naskah (yang membuat mahasiswa tidak paham apa yang tertulis).
   - Menegaskan prinsip inti: *"Angka dihitung program dengan rumus statistik baku, bukan AI"*.
   - Tombol utama *"Coba dengan data contoh"* adalah ajakan langsung beraksi tanpa komitmen dan tanpa rasa takut salah.

---

## 3. Sketsa Koreografi 5 Detik Pertama (Desktop 1280x720)

Layout Desktop: **Dua Kolom**, tinggi total muat tepat dalam satu viewport tanpa menggulir pada 1280x720.
- **Kiri (45%)**: Judul, sub-kalimat, tombol utama & sekunder, catatan mikro.
- **Kanan (55%)**: Komponen `LiveDemo` (lembar data kuesioner -> transformasi tabel -> penjelasan tersambung).

```text
+-----------------------------------------------------------------------------------------------------------------+
| [OlahData]  Panduan   Harga                                                                [Masuk]  [Mulai Coba]|
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                                 |
| KIRI (0,0s Langsung Terbaca Penuh):                 KANAN (Transformasi Koreografi 0,3s - 5,0s):                |
|                                                                                                                 |
| [Kertas Kerja Mahasiswa]                            +---------------------------------------------------------+ |
|                                                     | [Data contoh: Kuesioner Kepuasan (N=120)]  [Lewati >>]  | |
| Unggah data kuesionermu.                            |---------------------------------------------------------| |
| Dapatkan tabel Bab 4 dan penjelasan                 | DETIK 0,3 - 1,5s: DATA KUESIONER MENTAH                 | |
| yang bisa kamu jelaskan sendiri.                    | Resp | X1.1 | X1.2 | X1.3 | Total X1                      | |
|                                                     | R01  |  4   |  5   |  4   |   13                          | |
| Angka dihitung program dengan rumus                 | R02  |  3   |  3   |  3   |   09    [Stabilo Kuning       | |
| statistik baku, bukan AI. Setiap angka              | R03  |  5   |  5   |  5   |   15     menyapu kolom X1]    | |
| di naskah tersambung ke sel asalnya.                |---------------------------------------------------------| |
|                                                     | DETIK 1,5 - 3,0s: TABEL HASIL MUNCUL                    | |
| [ Coba dengan data contoh ]  [ Unggah sendiri ]     | Tabel 4.8 Hasil Reliabilitas [Dihitung oleh program]    | |
|                                                     | Konstruk     | Butir | Cronbach Alpha | Status          | |
| (•) Data responden aman  (•) Tanpa manipulasi       | Kualitas (X) | 3     | === 0,872 ===  | [Lulus Reliabel]| |
|                                                     |---------------------------------------------------------| |
|                                                     | DETIK 3,0 - 4,2s: DUA KALIMAT PENJELAS TERSAMBUNG       | |
|                                                     | "Variabel Kualitas memiliki nilai Cronbach's Alpha      | |
|                                                     |  sebesar ==0,872== > 0,70. Instrumen terbukti reliabel."| |
|                                                     |           \___________________/ (garis hubung halus)    | |
|                                                     |---------------------------------------------------------| |
|                                                     | DETIK 4,2 - 5,0s: KOREOGRAFI BERHENTI -> INTERAKTIF     | |
|                                                     | [*] Sentuh angkanya untuk menelusuri sel asal  [Putar]  | |
|                                                     +---------------------------------------------------------+ |
|                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 4. Sketsa Koreografi 5 Detik Pertama (Ponsel 360x640)

Layout Mobile: **Satu Kolom Vertikal**.
- Pada 360x640, judul, kalimat penjelas, dan tombol utama **Coba dengan data contoh** langsung terlihat di paruh atas layar (*above the fold*) tanpa harus menggulir.
- Demo berada tepat di bawah tombol dan mulai berjalan otomatis saat terlihat (*IntersectionObserver*).

```text
+---------------------------------------------------+
| [OlahData]                                [Masuk] |
+---------------------------------------------------+
| Unggah data kuesionermu.                          |
| Dapatkan tabel Bab 4 dan                          |
| penjelasan yang bisa kamu                         |
| jelaskan sendiri.                                 |
|                                                   |
| Angka dihitung program dengan rumus               |
| statistik baku, bukan AI.                         |
|                                                   |
| [ Coba dengan data contoh (60 Detik) ]            | -> Tombol 48px thumb-friendly
| [ Unggah kuesioner sendiri ]                      |    langsung terlihat di 360x640
|                                                   |
| ------------------------------------------------- |
| [Data contoh: Kuesioner (N=120)]       [Lewati >] |
|                                                   |
| TABEL HASIL RELIABILITAS [Dihitung program]       |
| Konstruk    | Butir | Cronbach Alpha | Status     |
| Kualitas X1 | 3     | == 0,872 ==    | [Reliabel] |
|                                                   |
| PENJELASAN BAB 4:                                 |
| "Nilai Cronbach's Alpha sebesar ==0,872== > 0,70. |
|  Instrumen dinyatakan reliabel."                  |
|                                                   |
| [i] Sentuh angka 0,872 untuk melihat sel asal     |
| [↻ Putar ulang demo]                              |
+---------------------------------------------------+
```

---

## 5. Rincian Detik demi Detik

| Waktu | Peristiwa di Antarmuka | Kondisi Aksesibilitas & Kinerja |
| :--- | :--- | :--- |
| **0,0 – 0,3 s** | HTML & CSS dasar selesai dirender. Judul, sub-kalimat, dan tombol utama langsung tampak jelas tanpa jeda animasi. | LCP < 1,5 s tercapai. Tidak ada layout shift (CLS = 0). |
| **0,3 – 1,5 s** | Di area demo, lembar matriks data responden kuesioner (6 baris × 5 kolom) tersaji. Sapuan stabilo kuning (`#FFE14D`) melintasi kolom X1. | Warna teks di atas stabilo tetap gelap `#243044` (kontras 9.2:1 AAA). |
| **1,5 – 3,0 s** | Baris tabel reliabilitas muncul berurutan secara halus. Angka tercetak dalam format Indonesia (`0,872`). Lencana *\"Dihitung oleh program\"* menyertai tabel. | Baris tabel menggunakan markup HTML `<table>` semantik (bisa dibaca screen reader). |
| **3,0 – 4,2 s** | Kotak teks penjelasan Bab 4 muncul. Angka `0,872` disorot stabilo kuning dan garis halus visual menghubungkannya dengan sel tabel. | Navigasi keyboard (Tab / Enter) dapat langsung fokus ke angka. |
| **4,2 – 5,0 s** | Gerakan berhenti penuh. Teks mikro *\"Sentuh angkanya\"* muncul. Sentuhan/hover kini interaktif dua arah. Tombol *\"Putar ulang\"* kecil muncul. | Menghormati `sessionStorage`: tidak mengulang jika pengunjung kembali di sesi yang sama. |
| **Reduced Motion**| Seluruh tahap transisi dilewati: keadaan akhir 5,0s langsung ditampilkan secara statis sejak 0,0s. | Mematuhi `prefers-reduced-motion: reduce`. |
