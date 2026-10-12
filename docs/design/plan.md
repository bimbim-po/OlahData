# Rencana Desain Antarmuka OlahData: Meja Kerja Skripsi

**Versi:** 1.0  
**Status:** Disetujui untuk Implementasi  
**Tema Visual:** Meja kerja skripsi: kertas dingin, tinta pulpen biru, coretan revisi dosen, dan keluaran statistik presisi.

---

## 1. Palet Warna Bernama (Tabel Nilai Hex & Rasio Kontras)

Palet dirancang berdasarkan analogi fisik meja kerja mahasiswa: lembar kuesioner dan kertas kalkulasi putih kebiruan, tinta pulpen biru untuk tulisan utama dan korelasi angka, coretan pena merah dosen khusus untuk peringatan asumsi yang dilanggar, serta hijau daun tua untuk tanda kelulusan uji.

### A. Palet Mode Terang (Default)
| Nama Token | Nilai Hex | Peran & Penggunaan | Rasio Kontras thd Latar |
| :--- | :--- | :--- | :--- |
| **Kertas Latar** (`--bg-paper`) | `#F5F7FA` | Latar belakang kanvas aplikasi (putih kebiruan dingin, bukan krem hangat). | Latar dasar |
| **Kertas Permukaan** (`--surface-paper`) | `#FFFFFF` | Permukaan lembar data, tabel hasil, kartu formulir, dan panel navigasi. | 1.06:1 thd latar |
| **Tinta Teks** (`--ink-text`) | `#243044` | Teks tubuh utama, judul tabel, label instruksi (abu-biru gelap berwibawa). | **11.8:1** (Lolos WCAG AAA) |
| **Tinta Pulpen Biru** (`--ink-primary`) | `#1F3FA6` | Aksi utama, tautan, dan sorotan angka yang tersambung (*connected numbers*). | **8.1:1** (Lolos WCAG AAA) |
| **Tinta Sorotan** (`--ink-highlight`) | `#E8EDFC` | Latar sorotan sel tabel dan token angka di paragraf saat kursor diarahkan. | 1.2:1 thd putih |
| **Coretan Revisi** (`--red-revision`) | `#C23B2E` | Peringatan asumsi klasik dilanggar, galat data, dan status gugur (merah pena dosen). | **5.7:1** (Lolos WCAG AA) |
| **Hijau Lulus** (`--green-valid`) | `#2D6B57` | Status uji valid, reliabel, atau hipotesis diterima (hijau tua tenang). | **5.9:1** (Lolos WCAG AA) |
| **Garis Informasi** (`--rule-border`) | `#D5DAE3` | Batas struktural tabel APA dan pemisah kolom informasi. Tanpa garis dekoratif. | 1.3:1 thd latar |

### B. Palet Mode Gelap (Meja Kerja Malam)
| Nama Token | Nilai Hex | Peran & Penggunaan |
| :--- | :--- | :--- |
| **Kertas Gelap Latar** (`--bg-paper`) | `#0F141C` | Latar kanvas gelap biru-arang (bukan hitam pekat #000000). |
| **Permukaan Gelap** (`--surface-paper`) | `#17202E` | Permukaan panel dan lembar kerja malam. |
| **Tinta Gelap Teks** (`--ink-text`) | `#E1E7F0` | Teks tubuh terang kontras tinggi yang nyaman di mata lelah. |
| **Tinta Pulpen Malam** (`--ink-primary`)| `#5379E8` | Aksi utama dan sorotan angka pada mode malam. |
| **Tinta Sorotan Malam** (`--ink-highlight`)| `#213054` | Latar sorotan sel aktif pada mode malam. |
| **Coretan Revisi Malam** (`--red-revision`)| `#E05D50` | Peringatan dan indikator galat mode malam. |
| **Hijau Lulus Malam** (`--green-valid`)| `#4E9B80` | Indikator valid mode malam. |
| **Garis Gelap** (`--rule-border`)| `#253347` | Garis pemisah data mode malam. |

---

## 2. Tipografi & Skala Tipe

### A. Pemilihan Keluarga Font
* **Font Sans Tunggal:** `Public Sans` (Google Font via `next/font/google`).
  * **Alasan Pemilihan:** 
    1. Dirancang untuk tata letak administratif dan formulir teknis dengan penekanan pada keterbacaan data yang padat.
    2. Mendukung fitur angka tabular (`font-feature-settings: "tnum" 1`) dengan metrik lebar angka monospaced yang sangat rapi untuk desimal Indonesia (berkoma).
    3. Proporsional dan hemat ruang vertikal di layar ponsel 360px tanpa memotong teks header tabel.
    4. Menyingkirkan klise AI: menghapus `Fraunces` (serif teatrikal) dan `Plus Jakarta Sans` (sans SaaS generik).
* **Font Monospace Khusus Jejak Hitung:** `JetBrains Mono` / `ui-monospace`.
  * Hanya digunakan untuk formula matematika statistik, derajat kebebasan ($df$), rumus regresi, dan penelusuran kalkulasi teknis.

### B. Skala Tipe Terukur
1. **Mikro / Kode Formula:** `12px` (line-height `16px`, tracking `0.01em`)
2. **Data Sel Tabel & Keterangan:** `13px` (line-height `18px`, `font-variant-numeric: tabular-nums`)
3. **Teks Bacaan / Paragraf Interpretasi:** `15px` (line-height `24px`, batas panjang baris `< 72 karakter`)
4. **Header Kolom & Sub-judul:** `17px` (line-height `24px`, bobot `600`)
5. **Judul Modul / Halaman Analisis:** `22px` (line-height `28px`, bobot `700`)
6. **Angka Metrik Utama:** `32px` (line-height `36px`, bobot `700`, tabular)

---

## 3. Sketsa Tata Letak (ASCII) & Deskripsi Satu Kalimat

### A. Beranda (Landing Page)
* **Deskripsi Satu Kalimat:** Meja kerja interaktif di atas lipatan layar yang langsung menampilkan simulasi data kuesioner nyata di sebelah kiri dan tabel Bab 4 beranotasi di sebelah kanan tanpa hero simetris hampa.
```text
+-----------------------------------------------------------------------------------+
|  [OlahData]  Panduan   Harga                        [Masuk]  [Buka Meja Kerja]    |
+-----------------------------------------------------------------------------------+
| MEJA KERJA SKRIPSI                                                                |
| Olah Data Kuesioner Skripsi Langsung Jadi Tabel Bab 4                             |
| Bukan tebakan AI: setiap angka dihitung rumus statistik dan tersambung ke selnya. |
|                                                                                   |
| +------------------------------------+------------------------------------------+ |
| | CONTOH DATA KUESIONER (Excel/CSV)  | KELUARAN BAB 4 SIAP SALIN (APA 7th)     | |
| | Resp | X1.1 | X1.2 | X1.3 | Total  | Tabel 4.12 Hasil Uji Regresi Linier      | |
| | R001 |   4  |   5  |   4  |  13    | Var     | B      | t       | Sig.  | Keter | |
| | R002 |   3  |   4  |   3  |  10    | Konst   | 2,410  | 3,124   | 0,002 | Sig.  | |
| | R003 |   5  |   5  |   5  |  15    | Motivasi| [0,482]| [4,819] | 0,000 | Sig.  | |
| |                                    +------------------------------------------+ |
| | [ Drag berkas kuesionermu ke sini ]| "Nilai t-hitung variabel Motivasi adalah | |
| | Format .xlsx, .csv (Maks 15 MB)    |  [4,819] > 1,984 (t-tabel) dengan nilai  | |
| |                                    |  sig. 0,000 < 0,05. Hal ini membuktikan  | |
| | [Mulai Analisis Gratis ->]         |  pengaruh signifikan terhadap Kinerja."  | |
| +------------------------------------+------------------------------------------+ |
|                                                                                   |
| ALUR KERJA: 1. Unggah Kuesioner -> 2. Tentukan Variabel -> 3. Tabel & Jejak Hitung|
+-----------------------------------------------------------------------------------+
```

---

### B. Wizard Alur Analisis (Proyek Baru & Pemetaan Variabel)
* **Deskripsi Satu Kalimat:** Alur linear tiga tahap yang tenang memandu validasi data kuesioner dan pemetaan konstruk seperti memeriksa lembar koding instrumen skripsi.
```text
+-----------------------------------------------------------------------------------+
| Proyek: Pengaruh Stres Kerja terhadap Kinerja Karyawan     [Tahap 2 dari 3: Peta] |
+-----------------------------------------------------------------------------------+
|  [1. Berkas Kuesioner: OK (120 baris)] ---> ( 2. Pemetaan Variabel ) ---> 3. Uji |
+-----------------------------------------------------------------------------------+
|                                                                                   |
| DAFTAR ITEM KUESIONER TERDETEKSI (24 Kolom)     KONSTRUK PENELITIAN               |
|                                                                                   |
| [x] X1_01: "Beban kerja harian terasa berat"   +-- KONSTRUK X1: Stres Kerja (Bebas)
| [x] X1_02: "Waktu istirahat kurang memadai"    |   Item terpilih: 6 item          |
| [x] X1_03: "Tuntutan target kerja berlebih"    |   Skala: Likert 1-5              |
| [ ] Demografi: Usia responden (Abaikan)        +----------------------------------+
|                                                +-- KONSTRUK Y: Kinerja (Terikat)  |
| [ + Tambah Konstruk Penelitian ]               |   Item terpilih: 8 item          |
|                                                +----------------------------------+
|                                                                                   |
|                                                    [Kembali]   [Lanjut ke Uji ->] |
+-----------------------------------------------------------------------------------+
```

---

### C. Halaman Hasil Analisis (Tiga Kolom ala SPSS)
* **Deskripsi Satu Kalimat:** Tata letak tiga kolom bergaya perangkat statistik profesional dengan navigasi pohon uji di sisi kiri, lembar tabel APA dan narasi angka tersambung di tengah, serta panel jejak hitung formula di sisi kanan.
```text
+-----------------------------------------------------------------------------------+
| Proyek: Pengaruh Stres Kerja   [Salin Seluruh Bab 4]  [Unduh Docx]   [Cetak PDF]  |
+-----------------------------------------------------------------------------------+
| POHON UJI STATISTIK   | TABEL & INTERPRETASI SKRIPSI       | JEJAK HITUNG (AUDIT) |
|                       |                                    |                      |
| v Uji Kualitas Data   | Tabel 4.8 Hasil Uji Reliabilitas   | Parameter Formula:   |
|   - Validitas X1      | Variabel | Alpha | Batas | Keter   | Alpha Cronbach:      |
|   - Validitas Y       | X1 Stres | 0,842 | 0,600 | Reliabel| r_k = [k/(k-1)] *    |
|   * Reliabilitas      | Y Kinerj | 0,791 | 0,600 | Reliabel|       [1 - S(si2)/s2]|
|                       |                                    |                      |
| > Asumsi Klasik       | [Salin Format Word]                | Nilai Komponen:      |
|   - Normalitas (K-S)  |                                    | - k (item) = 6       |
|   - Multikolinearitas | Penjelasan Naratif Bab 4:          | - Jumlah var item:   |
|   - Heteroskedastis   | Berdasarkan Tabel 4.8 di atas,     |   S(si2) = 4,21      |
|                       | instrumen variabel Stres Kerja (X1)| - Varians total:     |
| v Uji Hipotesis       | memiliki nilai Cronbach's Alpha    |   s2 = 18,45         |
|   - Regresi Linier    | sebesar [0,842]. Karena nilai      |                      |
|   - Uji t Parsial     | tersebut lebih besar dari nilai    | Kesimpulan Rumus:    |
|   - Uji F Simultan    | batas kritis 0,600, maka seluruh   | 0,842 > 0,600        |
|   - Koefisien Det (R2)| butir pertanyaan dinyatakan valid. | (Memenuhi syarat)    |
|                       |                                    |                      |
+-----------------------+------------------------------------+----------------------+
```

---

### D. Ringkasan Admin (Dashboard Super Admin)
* **Deskripsi Satu Kalimat:** Lembar pemantauan operasional padat berbasis tabel baris berkepadatan tinggi dengan indikator tren dan status kesehatan sistem tanpa kartu ikonik generik.
```text
+-----------------------------------------------------------------------------------+
| ADMIN OLAHDATA / RINGKASAN OPERASIONAL                  [30 Hari Terakhir] [MFA v]|
+-----------------------------------------------------------------------------------+
| RINGKASAN METRIK UTAMA (DENSE TYPOGRAPHY ROW)                                     |
| MRR: Rp 8.450.000 (▲ 14%) | Pelanggan Aktif: 214 | Sukses Run: 98,6% | Margin: 89%|
+-----------------------------------------------------------------------------------+
| STATUS KESEHATAN SISTEM & ANTREAN ENGINE                                          |
| Engine Python: AKTIF (4 worker) | Antrean: 0 queued | Rata-rata Durasi: 1,84s     |
| LLM API Token: Rp 412.000 (Aman) | DB Storage: 4,2 GB / 10 GB (42%)               |
+-----------------------------------------------------------------------------------+
| PERLU PERHATIAN SEGERA (2 Item)                                                   |
| [!] 2 Percobaan Uji Gagal (Kode ERR_SINGULAR_MATRIX: data kuesioner konstan)      |
| [i] 1 Pelanggan mengajukan tiket bantuan terkait pemetaan konstruk               |
+-----------------------------------------------------------------------------------+
| LOG AKTIVITAS SISTEM TERKINI (Metadata Saja - Privasi Aman)                       |
| Waktu    | Pengguna (Hash) | Jenis Uji        | Status  | Durasi | Aksi           |
| 20:41:02 | usr_92a1        | Regresi Berganda | Berhasil| 1,42 s | [Detail Meta]  |
| 20:38:15 | usr_33b8        | Uji Normalitas   | Berhasil| 0,88 s | [Detail Meta]  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Prinsip Desain & Komponen Inti

1. **Prinsip Meja Kerja Kertas (No Fake Decorations):**
   * Sudut batas tegas: radius `0px` untuk sel dan batas tabel; `4px` untuk tombol, kotak input, dan badge; `6px` maksimal untuk panel dialog.
   * Tidak ada efek bayangan tebal (`shadow-xl` dilarang, hanya `border` garis tegas).
   * Tidak ada gradien warna-warni (purple/cyan gradients diharamkan).
2. **Keterhubungan Angka Dua Arah (*Bi-Directional Connected Numbers*):**
   * Setiap angka dalam narasi Bab 4 dihubungkan secara dinamis ke sel tabel sumbernya.
   * Saat kursor berada di atas angka di narasi, sel sumber menyala dalam latar biru tinta lembut (`#E8EDFC`) dengan batas pulpen biru (`#1F3FA6`), dan sebaliknya.
   * Mendukung fokus keyboard (`Tab` dan tombol panah) serta ketukan di layar sentuh ponsel (360px).
3. **Pena Koreksi Revisi Dosen:**
   * Warna merah (`#C23B2E`) digunakan **hanya** untuk peringatan metodologis: asumsi normalitas tidak terpenuhi, adanya multikolinearitas tinggi ($VIF > 10$), atau korelasi item tidak valid ($r < r_{tabel}$).
   * Peringatan wajib menyertakan arahan perbaikan nyata (misal: "Pertimbangkan transformasi data Log10 atau keluarkan responden outlier baris 42").
4. **Kamus Bahasa & Nada Bicara:**
   * Konsisten memanggil pengguna dengan kata ganti **"kamu"**.
   * Nada bicara seperti asisten laboratorium statistik senior: tenang, presisi, mendidik, dan tidak hiperbolis.
   * Tanpa tanda seru (!), tanpa emoji di dalam konten teknis, tanpa istilah AI buzzword ("Ajaib", "Revolusioner", "Didukung AI").

---

## 5. Tinjauan Rencana Mandiri (Anti-Default Review)

Setiap keputusan desain diuji secara kritis terhadap kecenderungan bawaan (*default AI tropes*):

| Elemen Desain | Pilihan Bawaan AI / SaaS Generik | Keputusan Kita (Diganti) | Mengapa Diganti? (Alasan Kritis) |
| :--- | :--- | :--- | :--- |
| **Warna Latar** | Krem hangat `#FAF8F4` atau abu-abu netral Tailwind `#F3F4F6`. | Kertas dingin `#F5F7FA` + putih murni `#FFFFFF`. | Mahasiswa mengolah lembar data kalkulasi. Latar dingin memberi kontras jernih dan rasa ketepatan matematika. |
| **Warna Primer** | Indigo / Violet SaaS `#6366F1` atau Hijau Pinus `#1F6F5C`. | Tinta pulpen biru `#1F3FA6`. | Biru pulpen adalah warna tinta fisik mahasiswa saat mengisi lembar bimbingan skripsi. Menciptakan asosiasi langsung ke meja kerja. |
| **Warna Aksen Error** | Oranye hangat atau merah cerah Tailwind `#EF4444`. | Merah pena dosen `#C23B2E`. | Mahasiswa Indonesia memiliki trauma emosional sekaligus fokus tinggi terhadap coretan pena merah dosen pembimbing. |
| **Tipografi** | Inter, Plus Jakarta Sans, atau Fraunces serif. | `Public Sans` tunggal + tabular nums wajib. | Tabel Bab 4 membutuhkan angka desimal yang lurus vertikal. Fraunces terasa pretensius; Public Sans bekerja presisi. |
| **Hero Landing** | Teks tengah simetris + 2 tombol + bento cards. | Split-screen meja kerja interaktif di atas lipatan layar. | Pengguna ingin melihat kepastian bentuk tabel Bab 4 detik pertama mereka membuka web, bukan membaca slogan hampa. |
| **Label AI** | Ikon `Sparkles` + badge "Ditulis oleh AI". | Label "Kaidah Pelaporan Bab 4" + nomor rumus. | Dosen pembimbing menolak skripsi berbau AI generatif. Menampilkan dasar rumus meningkatkan kredibilitas di ruang sidang. |
| **Dashboard Admin** | 12 kartu KPI berjejer dengan panah hijau seragam. | Satu baris ringkasan metrik tipografis padat + tabel audit. | Super admin membutuhkan pemindaian cepat atas kesehatan operasional tanpa membuang ruang layar. |
| **Radius Sudut** | Sudut membulat modern `rounded-xl` (12-16px). | Sudut tajam/terukur (0–4px). | Dokumen akademik formal tidak menggunakan sudut membulat balon. |
