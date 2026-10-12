# Audit Desain Antarmuka OlahData (Sebelum Perombakan)

**Tanggal Audit:** 12 Oktober 2026  
**Penilai:** Design Lead & Frontend Engineer  
**Metodologi:** Pengambilan 60 tangkapan layar Playwright pada resolusi 360px (mobile), 768px (tablet), dan 1280px (desktop) untuk mode terang dan gelap, tersimpan di folder `docs/design/before/`. Audit kode sumber memeriksa implementasi CSS tokens, tipografi, struktur tata letak komponen, dan salinan teks (copywriting).

---

## 1. Ringkasan Eksekutif

Antarmuka OlahData saat ini memiliki pondasi fungsional dan teknis yang kuat (mesin statistik deterministik, isolasi data privat, ekspor tabel tab-separated). Namun, dari sudut pandang pengalaman visual dan identitas produk, antarmuka ini mengidap **sindrom tampilan produk AI/SaaS formulaik**. 

Pengguna sasaran kita adalah **mahasiswa tingkat akhir Indonesia** yang sedang tertekan oleh tenggat revisi skripsi dan ketakutan menghadapi pertanyaan metodologi dari dosen pembimbing. Yang mereka butuhkan bukan "dashboard SaaS modern dengan efek berkilau", melainkan **meja kerja skripsi yang tenang, presisi, berwibawa, dan dapat dibuktikan kebenarannya selangkah demi selangkah**.

---

## 2. Temuan Tanda Khas Tampilan Buatan AI (Daftar Larangan)

### A. Tipografi Malas & Pemilihan Font Klise
* **Keluarga Font Terlarang:**
  * Berkas: `apps/web/src/app/layout.tsx` (baris 2, 8–18, 36)
  * Kode mengimpor `Fraunces` dan `Plus_Jakarta_Sans` dari `next/font/google`.
  * `Fraunces` adalah display serif dengan kontras tinggi yang sering dijadikan jalan pintas oleh generator AI untuk menampilkan kesan "editorial/akademik artifisial". Pada teks label dan heading teknis, font ini terasa teatrikal dan tidak mencerminkan perangkat kerja kuantitatif.
  * `Plus_Jakarta_Sans` adalah font sans bawaan yang sangat umum digunakan ribuan startup AI/fintech di Indonesia, membuat produk kehilangan kekhasan visual.
* **Penggunaan Font Serif di Komponen Teknis:**
  * Berkas: `apps/web/src/components/explanation-box.tsx` (baris 115)
  * Judul interpretasi menggunakan `font-serif text-sm sm:text-base`. Komponen analisis teknis seharusnya menggunakan sans struktural yang jelas, bukan serif dekoratif.
  * Berkas: `apps/web/src/app/admin/page.tsx` (baris 15)
  * Judul dashboard admin `Ringkasan Eksekutif` memakai `font-serif`. Area internal admin instrumen operasi tidak cocok memakai serif editorial.
* **Ketidakhadiran Angka Tabular (`tnum`) yang Konsisten:**
  * Berkas: `apps/web/src/components/result-table.tsx` (baris 173, 224)
  * Tabel hanya menetapkan `tabular-nums` pada sel dengan `col.align === 'right'`. Header tabel dan sel tengah/kiri tidak memiliki penegakan angka tabular di tingkat token tipografi dasar, menyebabkan ketidaksejajaran visual ketika angka desimal diuji pada berbagai ukuran layar.
* **Panjang Baris Teks yang Tidak Terkendali:**
  * Di beberapa penjelas hasil dan kartu panduan, lebar kontainer teks melampaui 80–90 karakter per baris pada layar desktop, melanggar batas kenyamanan membaca akademis (< 75 karakter).

---

### B. Palet Generik & Nilai Token Hangat yang Salah Sasaran
* **Warna Latar Hangat (Bone/Krem):**
  * Berkas: `apps/web/src/app/globals.css` (baris 6, 17)
  * Nilai `--color-bone: #FAF8F4;` dan `--background: #FAF8F4;`.
  * Latar krem hangat ini menciptakan kesan blog santai atau kafe buku, bukan kertas kalkulasi statistik dingin yang jernih. Mahasiswa kuantitatif membutuhkan nuansa kertas kerja putih kebiruan dingin (`#F5F7FA`) dengan permukaan tabel putih murni (`#FFFFFF`).
* **Warna Aksen Terakota/Batu Bata:**
  * Berkas: `apps/web/src/app/globals.css` (baris 13, 31)
  * Nilai `--color-brick: #B3412E;` sebagai destructive/peringatan. Warna ini terlalu cokelat/kemerahan hangat, alih-alih merah pena revisi dosen (`#C23B2E`) yang tegas dan langsung dikenali mahasiswa Indonesia.
* **Border Radius Seragam 0.5rem (8px):**
  * Berkas: `apps/web/src/app/globals.css` (baris 38)
  * Nilai `--radius: 0.5rem;` diterapkan merata ke seluruh elemen mulai dari tombol, kartu, hingga kotak dialog. Sudut membulat 8px yang seragam adalah ciri khas template Tailwind SaaS generik. Dokumen skripsi dan kertas kerja statistik seharusnya memiliki sudut lebih tegas (0–2px untuk sel tabel dan panel, 4px untuk input/tombol, 8px maksimal untuk modal dialog).
* **Mode Gelap Hitam Pekat Tanpa Atmosfer Kertas:**
  * Berkas: `apps/web/src/app/globals.css` (baris 50–52)
  * Nilai `--background: #141618;` dan `--card: #1C1E21;`. Mode gelap ini menyerupai IDE kode generik, bukan meja kerja malam mahasiswa dengan kontras tinta dan kertas yang tenang.

---

### C. Komposisi Formulaik AI pada Beranda & Pemasaran
* **Hero Section Tengah Simetris Klasik AI:**
  * Berkas: `apps/web/src/app/(marketing)/page.tsx` (baris 41–76)
  * Struktur:
    1. Pill badge mengambang di atas judul: `rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5` dengan ikon buku kecil (baris 43–46).
    2. Judul besar di tengah `max-w-5xl mx-auto text-center font-serif text-3xl sm:text-5xl lg:text-6xl` (baris 49–51).
    3. Paragraf sub-judul di tengah `max-w-3xl mx-auto` (baris 54–56).
    4. Dua tombol sejajar di tengah dengan panah `ArrowRight` (baris 59–76).
  * Komposisi ini adalah pola persis yang diproduksi oleh generator landing page AI (seperti v0, Lovable, Tailwind UI templates). Tidak ada demonstrasi kerja nyata di atas lipatan layar (*above the fold*).
* **Baris Trust Badges Menggantung:**
  * Berkas: `apps/web/src/app/(marketing)/page.tsx` (baris 79–92)
  * Empat poin bukti akademis ditempatkan berjejer dengan pemisah garis tipis: "Formula Pasti", "Format APA 7th", "Jejak Hitung", "Privasi Data". Format ini pasif dan tidak memperlihatkan keunggulan interaktif produk.
* **Bagian Alur 4 Langkah dengan Kartu Identik:**
  * Berkas: `apps/web/src/app/(marketing)/page.tsx` (baris 98–136)
  * Eyebrow badge huruf kapital `uppercase tracking-wider font-semibold: Alur Riset`.
  * Grid 4 kartu dengan angka besar transparan `01`, `02`, `03`, `04` di pojok kiri atas dan ikon di dalam kotak persegi membulat `rounded-lg bg-primary/10 p-2`. Ini adalah pola kartu fitur SaaS AI yang paling klise.

---

### D. Ikonografi AI & Klise "Sparkles / Magic"
* **Ikon Bintang Berkilau (Sparkles):**
  * Berkas: `apps/web/src/components/explanation-box.tsx` (baris 5, 114, 125)
  * Penggunaan ikon `Sparkles` untuk menandai penjelasan naratif.
  * Badge `variant="ai"` dengan teks "Ditulis oleh AI".
  * Penggunaan ikon bintang berkilau dan label AI justru menurunkan kepercayaan mahasiswa dan dosen pembimbing. Di mata akademisi, "tulisan AI" berkonotasi fabrikasi dan halusinasi. Yang seharusnya ditekankan adalah **narasi interpretasi baku berbasis kaidah pelaporan Bab 4 skripsi**.

---

### E. Dashboard Admin: Grid 12 Kartu KPI Identik
* **Kloning Kartu Metrik:**
  * Berkas: `apps/web/src/app/admin/page.tsx` (baris 24–37)
  * Menampilkan 12 buah komponen `KpiCard` berjejer dalam grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.
  * Setiap kartu memiliki ikon kecil di pojok kanan atas, angka tebal di tengah, dan persentase perubahan hijau dengan panah ke atas.
  * Pola ini menghabiskan ruang vertikal dan tidak memberikan hierarki informasi bagi owner/super admin. Metrik kesehatan utama (pendapatan, kegagalan perhitungan, pengguna aktif) tenggelam di antara angka-angka sekunder.

---

### F. Salinan Teks (Copywriting): Inkonsistensi & Nada Bicara
* **Campuran Panggilan "Anda" dan Ketidakkonsistenan:**
  * Berkas: `apps/web/src/lib/copy.ts` (baris 32, 37, 77, 81, 93)
  * Teks menggunakan kata ganti "Anda" secara kaku ("respons kuesioner Anda", "kebutuhan skripsi Anda"), sementara di beberapa instruksi dan pesan toast menggunakan nada yang berbeda.
  * Sesuai arahan baru, panggilan harus konsisten **"kamu"**—hangat, bersahabat, namun tetap berwibawa layaknya asisten lab metodologi senior yang mendampingi mahasiswa.
* **Istilah yang Berganti-ganti:**
  * Kadang disebut "File Excel", kadang "Berkas", kadang "Data", kadang "Dataset".
  * Diperlukan standarisasi kosakata baku:
    * File yang diunggah = "Berkas data"
    * Entitas data yang diproses = "Dataset"
    * Baris kuesioner = "Data responden"
    * Kategori instrumen = "Variabel" & "Konstruk"

---

### G. Interaktivitas Angka & Narasi yang Belum Maksimal
* **Keterhubungan Angka Belum Dua Arah Secara Sempurna:**
  * Berkas: `apps/web/src/components/explanation-box.tsx` dan `apps/web/src/components/result-table.tsx`
  * Hubungan hover angka saat ini hanya bekerja melalui event mouse sederhana (`onHoverNumber`, `onHoverCell`). Belum ada dukungan navigasi fokus keyboard (`focus-visible`), belum ada perlakuan khusus untuk ketukan layar sentuh ponsel (tap to inspect), dan sorotan visual masih mengandalkan warna primer kuning-amber yang pudar (`bg-primary/15`), bukan aksen biru tinta pulpen yang kontras dan jelas.

---

## 3. Yang Sudah Baik (Pertahankan Sepenuhnya)

Meskipun aspek visual memerlukan perombakan mendasar, beberapa bagian arsitektur dan fungsionalitas berikut **sudah dieksekusi dengan sangat baik dan harus dipertahankan tanpa perubahan logika**:

1. **Format Tabel Standar APA 7th:**
   * Berkas: `apps/web/src/components/result-table.tsx` (baris 175, 199)
   * Garis tabel sudah mengadopsi kaidah jurnal ilmiah (garis ganda atas, satu garis bawah header, dan garis penutup tebal di bawah tanpa garis vertikal). Ini sangat disukai dosen penguji skripsi.
2. **Fitur Salin Format Tab-Separated ke Word:**
   * Berkas: `apps/web/src/components/result-table.tsx` (baris 52–80)
   * Logika menyalin isi tabel dalam format teks berpemisah tab (`\t`) memungkinkan mahasiswa langsung menempelkannya (`Ctrl+V`) ke lembar kerja Microsoft Word tanpa merusak format kolom.
3. **Pemisahan Logika Jejak Hitung (Traceability):**
   * Berkas: `apps/web/src/components/traceability-panel.tsx`
   * Konsep bahwa setiap angka statistik memiliki formula kalkulasi, derajat kebebasan (df), dan nilai kritis tabel pembanding (r-tabel, t-tabel, F-tabel) adalah nilai jual utama yang wajib diangkat menjadi fitur unggulan visual.
4. **Pemeriksaan Asumsi Klasik yang Tegas:**
   * Berkas: `apps/web/src/components/assumption-alert.tsx`
   * Komponen peringatan asumsi klasik (normalitas, multikolinearitas, heteroskedastisitas) memberikan diagnosa eksplisit ketika data mahasiswa tidak memenuhi syarat uji parametrik.
5. **Kebijakan Privasi dan Keamanan Super Admin:**
   * Admin tidak pernah melihat isi baris data responden, hanya metadata agregat. Log audit tercatat dengan rapi.

---

## 4. Kesimpulan dan Langkah Selanjutnya

Audit ini mengonfirmasi bahwa perombakan tampilan harus diarahkan ke tema **"Meja kerja skripsi: kertas, tinta, coretan revisi, dan keluaran statistik"**. 

Langkah selanjutnya adalah menyusun dokumen `docs/design/plan.md` yang memetakan:
1. Palet 6 warna terukur dengan rasio kontras WCAG AAA/AA.
2. Tipografi sans tunggal berkarakter dengan angka tabular bawaan (`Public Sans`).
3. Sketsa tata letak ASCII untuk Beranda (demo langsung di atas lipatan), Wizard, Halaman Hasil (3 kolom ala SPSS), dan Ringkasan Admin (tabel metrik padat).
4. Peninjauan kritis mandiri untuk menolak segala bentuk pilihan bawaan AI.
