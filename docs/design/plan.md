# Rencana Desain Antarmuka OlahData: Teman Belajar yang Pintar

**Versi:** 2.0  
**Status:** Disetujui untuk Pembangunan  
**Tema Visual:** Meja belajar mahasiswa yang rapi dan menyenangkan — kertas catatan, sapuan stabilo kuning, tempelan catatan, dan tinta pulpen.

---

## 1. Palet Warna Bernama & Nilai Hex

Warna dirancang untuk menghadirkan rasa tenang, ramah, dan jelas, menghapuskan ketakutan mahasiswa terhadap software statistik.

### A. Palet Mode Terang (Default)
| Nama Token | Nilai Hex | Peran & Penggunaan | Rasio Kontras |
| :--- | :--- | :--- | :--- |
| **Kertas Latar** (`--bg-paper`) | `#F6F8FC` | Latar belakang kanvas utama (putih kebiruan lembut, menenangkan mata). | Latar dasar |
| **Kertas Permukaan** (`--surface-paper`)| `#FFFFFF` | Permukaan lembar kerja, kartu, tabel, dan formulir. | 1.05:1 thd latar |
| **Teks Utama** (`--ink-text`) | `#243044` | Teks tubuh, judul tabel, label instruksi (abu-biru gelap berwibawa). | **11.5:1** (WCAG AAA) |
| **Biru Tinta Cerah** (`--ink-primary`) | `#2748D6` | Aksi utama, tombol selesai, dan tautan aktif. | **6.5:1** (WCAG AA) |
| **Kuning Stabilo** (`--highlighter-yellow`)| `#FFE14D` | **HANYA** untuk sorotan angka yang tersambung dan hal yang sedang dibaca. | Latar sorotan (Teks `#243044` kontras **9.2:1**) |
| **Mint Segar** (`--mint-success`) | `#BFEBD9` | Latar status uji lulus/valid (dipasangkan dengan teks gelap `#0E4331`). | **7.8:1** (WCAG AAA) |
| **Koral Hangat** (`--coral-warning`) | `#E8574F` | Peringatan asumsi, catatan koreksi dosen, dan galat data responden. | **4.9:1** (WCAG AA) |
| **Garis Lembut** (`--rule-subtle`) | `#E2E7F0` | Batas struktural antar-bagian data. Tanpa garis dekoratif. | 1.2:1 thd latar |

### B. Palet Mode Gelap (Meja Belajar Malam)
| Nama Token | Nilai Hex | Peran & Penggunaan |
| :--- | :--- | :--- |
| **Kertas Gelap Latar** (`--bg-paper`) | `#0E131F` | Latar biru-gelap malam (bukan hitam pekat #000000). |
| **Permukaan Gelap** (`--surface-paper`)| `#161E2E` | Permukaan kartu dan lembar tabel malam. |
| **Teks Gelap** (`--ink-text`) | `#E3E8F2` | Teks tubuh terang kontras tinggi yang nyaman di mata lelah. |
| **Tinta Biru Terang** (`--ink-primary`)| `#5D7BFA` | Tombol aksi utama pada mode malam. |
| **Stabilo Malam** (`--highlighter-yellow`)| `#FFE14D` | Tetap stabilo kuning dengan teks `#0E131F` di atasnya agar terbaca jelas. |
| **Mint Malam** (`--mint-success`) | `#1D4738` | Latar status lulus dengan teks `#A8F0D0`. |
| **Koral Malam** (`--coral-warning`) | `#5C201C` | Latar peringatan dengan teks `#FFA8A3`. |
| **Garis Gelap** (`--rule-subtle`) | `#222D42` | Batas struktural mode malam. |

---

## 2. Tipografi & Ukuran Teks

* **Keluarga Font Utama:** **`Figtree`** (Google Font via `next/font/google`).
  * **Alasan Pemilihan:**
    1. Dirancang untuk kejelasan maksimal dan keramahan visual. Bentuk kurva geometrisnya hangat dan terbuka, menghilangkan kesan software laboratorium yang mengintimidasi.
    2. Mendukung set karakter bahasa Indonesia lengkap dan fitur angka tabular (`font-variant-numeric: tabular-nums`).
    3. Sangat terbaca pada layar ponsel 360px dengan tinggi x-height yang proporsional.
* **Keluarga Font Monospace:** `JetBrains Mono` (khusus untuk rumus dan bagian cara menghitung).
* **Ukuran Teks & Ritme Vertikal:**
  * Isi bacaan & instruksi: **`16px`** (tinggi baris `26px` / `1.625`), panjang baris maksimal **68 karakter**.
  * Judul langkah / modul: **`20–24px`** (bobot `700`, rata kiri).
  * Angka data tabel: **`14–15px`** (angka tabular `tabular-nums`).
  * Catatan mikro: **`12–13px`**.

---

## 3. Bentuk (Radius Bertingkat & Tanpa Bayangan Bawaan)

Bentuk dibuat lembut dan bertingkat menurut peran fungsionalnya:
* **Tabel:** `6px` (`--radius-table`) — mempertahankan ketegasan baris data.
* **Input & Tombol Interaktif:** `10px` (`--radius-interactive`) — nyaman ditekan jari di ponsel (target sentuh &ge; 44px).
* **Dialog, Panel & Kartu:** `16px` (`--radius-card`) — memberi kesan tempelan catatan belajar yang rapi.
* **Tanpa Bayangan Abu Bawaan:** Membedakan bidang melalui perbedaan kontras latar belakang lembar kerja (`#F6F8FC` vs `#FFFFFF`), bukan efek drop shadow tebal.

---

## 4. Tata Letak (Deskripsi Satu Kalimat + Sketsa ASCII)

### A. Beranda (Landing Page)
* **Deskripsi:** Buka langsung dengan hal paling khas: judul rata kiri yang singkat, diikuti demo hidup yang dapat disentuh berisi tabel hasil nyata (data contoh berlabel) dan kalimat penjelas dengan angka tersorot stabilo kuning.
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Panduan   Harga                                  [Masuk]  [Mulai Coba]|
+-----------------------------------------------------------------------------------+
| Olah data kuesioner skripsimu langsung jadi tabel Bab 4                           |
| Tanpa SPSS, tanpa rumus rumit. Angka dihitung pasti dan tersambung ke naskahmu.   |
| [ Coba dengan Data Contoh (60 Detik) ]   [ Unggah Kuesionermu Sendiri ]           |
|                                                                                   |
| +-------------------------------------------------------------------------------+ |
| | DEMO LANGSUNG: KELUARAN BAB 4 DENGAN ANGKA TERSAMBUNG                         | |
| | [Data Contoh Berlabel: Kualitas Layanan & Kepuasan - 117 Responden]           | |
| |                                                                               | |
| | Tabel 4.12 Hasil Uji Regresi Linier Berganda                                  | |
| | Variabel         | B      | Std. Error | t Hitung  | Sig.  | Simpulan         | |
| | (Konstanta)      | 4,120  | 1,250      | 3,296     | 0,001 | Signifikan       | |
| | Motivasi (X1)    | [0,385]| 0,078      | [4,936]   | 0,000 | Signifikan       | |
| |                                                                               | |
| | INTINYA:                                                                      | |
| | Motivasi kerja terbukti meningkatkan kinerja secara nyata (t = 4,936, p<0,05).| |
| |                                                                               | |
| | PENJELASAN BAB 4:                                                             | |
| | "Nilai t hitung variabel Motivasi adalah ==4,936== > 1,984 dengan signifikansi| |
| |  ==0,000== < 0,05. Hal ini membuktikan pengaruh positif yang signifikan."     | |
| |                                                                               | |
| | (Sentuh angka bersorot stabilo untuk melihat sel asalnya di tabel)            | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

### B. Wizard Alur Analisis (Satu Kolom yang Dipandu)
* **Deskripsi:** Satu layar satu keputusan; di desktop terdapat rel kemajuan tipis di sebelah kiri dan konten bacaan maksimal 720px, sementara di ponsel aksi utama menempel di bagian bawah layar.
```text
+-----------------------------------------------------------------------------------+
| KAMU DI SINI:      | PERIKSA DATA KUESIONER                                       |
|                    |                                                              |
| [v] 1. Unggah data | Kami menemukan 120 baris responden dan 18 kolom pertanyaan.  |
| [*] 2. Cek data    | Semua jawaban berada pada rentang skala Likert 1-5.          |
| [ ] 3. Pilih uji   |                                                              |
| [ ] 4. Hasil       | [v] Tidak ada data kosong (missing value)                    |
|                    | [v] Tidak ada skor di luar batas skala                       |
|                    |                                                              |
|                    | [ Ringkasan 120 baris responden siap diproses ]              |
|                    |                                                              |
|                    | [ Lanjut: Petakan Variabel -> ]                              |
|                    +--------------------------------------------------------------+
|                    | (Di ponsel: tombol aksi ini menempel di bar bawah layar)     |
+-----------------------------------------------------------------------------------+
```

---

### C. Halaman Hasil: Tiga Lapis Penjelasan
* **Deskripsi:** Setiap hasil uji disajikan bertahap dalam tiga lapis: intinya (satu kalimat sederhana), tabel siap salin ke Word, dan teks akademik untuk Bab 4, dilengkapi tombol "Apa artinya?" dan blok "Perlu dilakukan apa?".
```text
+-----------------------------------------------------------------------------------+
| Hasil Analisis Skripsi: Pengaruh Motivasi terhadap Kinerja   [Salin Semua] [Ekspor]
+-----------------------------------------------------------------------------------+
| 1. LAPIS PERTAMA: INTINYA                                                         |
| [Alat ukurmu konsisten: nilai Cronbach's Alpha 0,872, jauh di atas batas 0,70.]   |
|                                                                                   |
| 2. LAPIS KEDUA: TABEL AKADEMIK                                                    |
| Tabel 4.8 Hasil Uji Reliabilitas Instrumen                   [Salin untuk Word]   |
| Konstruk Variabel | Jumlah Butir | Cronbach's Alpha | Status                      |
| Motivasi (X1)     | 8            | ==0,872==        | [Lulus Reliabel]            |
| Kinerja (Y)       | 10           | ==0,815==        | [Lulus Reliabel]            |
|                                                                                   |
| [?] Apa artinya Cronbach's Alpha? (Klik untuk penjelasan santai tanpa rumus)      |
|                                                                                   |
| 3. LAPIS KETIGA: TEKS UNTUK BAB 4                                                 |
| Ditulis AI dari angka di tabel:                                  [Salin Teks]     |
| "Berdasarkan Tabel 4.8, variabel Motivasi memiliki nilai Cronbach's Alpha sebesar |
| ==0,872==. Karena nilai tersebut lebih besar dari 0,70, instrumen dinyatakan..."  |
|                                                                                   |
| [v] Lihat cara menghitungnya (Jejak hitung formula untuk yang ingin memeriksa)    |
+-----------------------------------------------------------------------------------+
```

---

### D. Ringkasan Admin
* **Deskripsi:** Tabel operasional lebih dulu dan padat tanpa deretan kartu KPI berikon, dengan warna koral khusus untuk item yang memerlukan tindakan.
```text
+-----------------------------------------------------------------------------------+
| ADMIN OLAHDATA                                       [30 Hari] [Mode Privasi: OK] |
+-----------------------------------------------------------------------------------+
| RINGKASAN TIPOGRAFIS:                                                             |
| MRR: Rp 8.450.000 (▲ 14%) | Pelanggan: 214 | Mesin Sukses: 98,6% | Margin: 89%   |
+-----------------------------------------------------------------------------------+
| BUTUH TINDAKAN KAMU SEGERA (Koral):                                               |
| [!] 2 pengujian gagal (Kode ERR_SINGULAR_MATRIX: data kuesioner konstan)          |
| [i] 1 pertanyaan pengguna terkait pemetaan konstruk                               |
+-----------------------------------------------------------------------------------+
| LOG AKTIVITAS TERKINI (Tabel Metadata Padat - Privasi Aman)                       |
| Waktu    | Pengguna | Jenis Uji        | Status  | Durasi | Metadata              |
| 20:41:02 | usr_92a1 | Regresi Berganda | Sukses  | 1,42 s | N=120, 18 kolom       |
| 20:38:15 | usr_33b8 | Uji Normalitas   | Sukses  | 0,88 s | N=95, K-S test        |
+-----------------------------------------------------------------------------------+
```

---

## 5. Tinjauan Mandiri (Anti-Default Review)

| Elemen Desain | Pilihan Bawaan AI / Template Umum | Pilihan Teman Belajar (Baru) | Mengapa Diganti? |
| :--- | :--- | :--- | :--- |
| **Warna Sorotan** | Latar biru pudar atau amber pudar. | **Kuning Stabilo `#FFE14D`** | Mahasiswa secara intuitif menandai catatan penting dengan stabilo kuning. Ini langsung memandu mata ke angka kunci. |
| **Status Lulus** | Hijau gelap kaku `#2D6B57`. | **Mint Segar `#BFEBD9`** | Memberikan rasa lega dan aman, seperti centang hijau kakak tingkat di lembar revisi. |
| **Radius Sudut** | 0px kaku koran atau 8px seragam. | **Bertingkat: 6px, 10px, 16px** | Memberikan kelembutan visual tanpa mengorbankan kerapian tabel. |
| **Font** | Public Sans (agak kaku administratif). | **`Figtree`** | Font yang sangat ramah, hangat, dan mudah dibaca tanpa melelahkan mata mahasiswa cemas. |
| **Struktur Hasil**| Langsung menyajikan tabel angka. | **Tiga Lapis Bertahap** | Mahasiswa butuh tahu "Intinya" dulu sebelum melihat detail tabel dan teks Bab 4. |
| **Istilah Teknis**| Dibiarkan tanpa keterangan. | **Tombol "Apa artinya?"** | Menjawab pertanyaan mahasiswa di tempat tanpa membuat mereka merasa bodoh. |
| **Peringatan Galat**| Pesan peringatan pasif. | **Blok "Perlu dilakukan apa?"** | Memberi solusi langkah konkret yang bisa langsung dikerjakan. |
