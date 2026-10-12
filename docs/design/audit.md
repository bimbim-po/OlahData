# Audit Desain Antarmuka OlahData: Dari Alat Kaku Menuju Teman Belajar yang Pintar

**Tanggal Audit:** 12 Oktober 2026  
**Penilai:** Design Lead & Frontend Engineer  
**Fokus Audit:** Mengidentifikasi kekakuan visual, ketidakjelasan alur bagi mahasiswa cemas, serta tanda khas buatan AI (*Daftar Larangan*) sebelum perombakan menuju konsep **Teman Belajar yang Pintar**.

---

## 1. Ringkasan Eksekutif

Aplikasi OlahData saat ini memiliki keakuratan statistik yang tinggi dan kepatuhan privasi yang ketat. Namun, antarmuka sebelumnya masih terasa seperti **alat statistik institusional yang kaku dan mengintimidasi**. 

Bagi mahasiswa tingkat akhir yang sedang stres menghadapi revisi dosen pembimbing dan tidak menguasai metodologi statistik secara mendalam:
1. **Terlalu Dingin & Formal:** Sudut-sudut tajam (0–4px) dan kontras tajam ala koran/jurnal membuat aplikasi terasa menguji, bukan mendampingi.
2. **Hasil Sulit Dicerna Cepat:** Mahasiswa langsung disajikan tabel angka penuh tanpa lapis pemahaman berjenjang (*progressive disclosure*). Belum ada kalimat ringkasan bersahaja di tingkat atas ("Intinya").
3. **Ketiadaan Konteks Istilah:** Istilah teknis seperti *Cronbach's Alpha*, *VIF*, *p-value*, dan *R Square* belum memiliki penjelasan instan *"Apa artinya?"* dengan analogi konkret.
4. **Peringatan Tanpa Tindakan Konkret:** Ketika asumsi statistik dilanggar, sistem memberikan peringatan tetapi belum menyajikan blok panduan langsung *"Perlu dilakukan apa?"*.
5. **Kurangnya Kehangatan Meja Belajar:** Belum ada elemen visual yang ramah seperti sapuan stabilo kuning (`#FFE14D`) untuk memandu mata mahasiswa menghubungkan angka narasi dengan sel tabel.

---

## 2. Temuan Audit Berdasarkan Komponen & Berkas

### A. Tipografi & Ukuran Teks
* **Kerapatan Terlalu Tinggi & Font Masih Terasa Formal:**
  * Berkas: `apps/web/src/app/globals.css` (baris 35–45)
  * Teks isi menggunakan ukuran 13–14px dengan letter-spacing rapat. Bagi mahasiswa yang membaca di layar ponsel saat cemas, teks ini terlalu padat.
  * *Perbaikan yang dibutuhkan:* Mengadopsi font sans yang dirancang khusus untuk kenyamanan membaca panjang dan kehangatan visual (seperti **`Figtree`** atau **`Lexend`**), ukuran teks isi dinaikkan ke **16–17px** dengan tinggi baris (*line-height*) yang lebih longgar dan batas lebar kolom di bawah 70 karakter.

### B. Palet Warna & Ketidakhadiran Stabilo Belajar
* **Ketiadaan Kuning Stabilo Pembimbing:**
  * Berkas: `apps/web/src/styles/tokens.css` (baris 3–20)
  * Warna sorotan saat ini menggunakan latar biru pudar (`--ink-highlight: #E8EDFC`). Warna ini dingin dan menyatu dengan teks tautan.
  * Mahasiswa mengasosiasikan pemahaman catatan kuliah dengan **sapuan stabilo kuning (`#FFE14D`)**.
* **Status Lulus Uji & Peringatan Kurang Hangat:**
  * Hijau saat ini (`#2D6B57`) dan merah (`#C23B2E`) terasa sangat kaku.
  * Perlu diganti dengan warna mint segar bersahabat (`#BFEBD9` dengan teks gelap di atasnya) untuk status lulus, serta koral hangat (`#E8574F`) untuk hal yang butuh perhatian.

### C. Bentuk & Radius yang Terlalu Kaku
* **Radius Sudut 0–4px:**
  * Berkas: `apps/web/src/styles/tokens.css` (baris 35–42)
  * Sudut tajam 0–2px pada tabel dan tombol menciptakan atmosfer dingin instrumen laboratorium lama.
  * *Perbaikan yang dibutuhkan:* Radius bertingkat yang lembut menurut perannya:
    * Tabel: `6px`
    * Kotak input & tombol aksi: `10px`
    * Dialog & panel kartu: `16px`

### D. Alur Penjelasan Hasil Belum Tiga Lapis
* **Penyajian Langsung Tabel Tanpa Lapis "Intinya":**
  * Berkas: `apps/web/src/app/app/proyek/[id]/hasil/page.tsx` (baris 675–760)
  * Di atas tabel langsung tertulis nomor tabel dan judul. Tidak ada kalimat pemandu sederhana di puncak komponen (misal: *"Alat ukurmu konsisten: nilai alpha 0,872, di atas batas 0,7."*).
* **Belum Ada Tombol "Apa artinya?":**
  * Mahasiswa yang tidak hafal arti *p-value* atau *VIF* terpaksa membuka Google atau buku Sugiyono/Ghozali. Belum ada tombol mikro popover/dialog *"Apa artinya?"* yang menjelaskan istilah dalam 1–2 kalimat tanpa rumus matematika rumit.
* **Belum Ada Blok "Perlu dilakukan apa?":**
  * Pada `AssumptionAlert`, saat ada asumsi heteroskedastisitas atau korelasi gugur, rekomendasi masih berupa teks pasif. Mahasiswa butuh arahan konkret: *"Dua butir memiliki korelasi rendah. Pertimbangkan menghapusnya, lalu klik tombol jalankan ulang."*

### E. Beranda & Alur Onboarding 60 Detik
* **Ketiadaan Jalur Cepat 60 Detik ke Hasil:**
  * Berkas: `apps/web/src/app/(marketing)/page.tsx`
  * Meskipun sudah ada tabel preview di hero, mahasiswa baru yang datang dengan kepanikan belum memiliki tombol aksi tunggal yang sangat jelas untuk mencoba data contoh dan melihat hasil lengkap dalam 60 detik tanpa harus membaca teori.

### F. Dashboard Super Admin
* **Kepadatan Informasi yang Perlu Lebih Fungsional:**
  * Berkas: `apps/web/src/app/admin/page.tsx`
  * Perlu dipastikan warna koral hanya menyala untuk hal yang benar-benar membutuhkan tindakan owner, serta tabel audit dan sparkline disajikan secara tenang dan lugas.

---

## 3. Yang Sudah Baik (Pertahankan Sepenuhnya)

1. **Mesin Statistik Deterministik Python:** Rumus matematika baku (OLS, Pearson, Cronbach's Alpha, Kolmogorov-Smirnov, Glejser) menghitung angka pasti tanpa halusinasi AI.
2. **Keterhubungan Angka Dua Arah:** Fondasi teknis sinkronisasi `activeNumber` antara narasi dan sel tabel sudah terbangun rapi.
3. **Ekspor Word (Tab-Separated):** Mahasiswa dapat menyalin tabel langsung ke Word dengan format kolom yang tidak berantakan.
4. **Isolasi Keamanan & Privasi:** Admin tidak pernah membaca isi data responden pengguna; audit log tercatat secara otomatis.

---

## 4. Kesimpulan Audit

Perombakan berikutnya harus berfokus pada transformasi **"Teman Belajar yang Pintar"**:
* Menghadirkan **kuning stabilo (`#FFE14D`)** pada angka yang tersambung.
* Menerapkan **tiga lapis penjelasan** (Intinya &rarr; Tabel &rarr; Teks Bab 4).
* Menyematkan tombol **"Apa artinya?"** dan blok panduan **"Perlu dilakukan apa?"**.
* Menggunakan font yang sangat ramah dan mudah dibaca (**`Figtree`**), radius bertingkat lembut (6px / 10px / 16px), dan nada bicara kakak tingkat yang sabar.
