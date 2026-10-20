# Dokumentasi Pengujian Kegunaan (Usability) OlahData: Alur 5 Layar

Dokumen ini mencatat rancangan pengujian pengguna, skenario uji, persona mahasiswa, serta perbandingan kendala (*sticking points*) sebelum dan sesudah perbaikan sistem OlahData.

---

## 1. Filosofi & Metrik Keberhasilan UX

Tujuan utama OlahData adalah membawa mahasiswa tingkat akhir rumpun ilmu sosial/humaniora/manajemen dari berkas kuesioner mentah hingga draf Bab 4 siap sidang:
- **< 60 detik** menggunakan mode data contoh (tanpa pendaftaran akun).
- **< 10 menit** menggunakan berkas kuesioner riil mahasiswa tanpa perlu membaca panduan manual atau tutorial video.
- **Nada bahasa:** Hangat, suportif, akademis, tidak menggurui, dan bebas jargon statistika yang mengintimidasi (misalnya: menggunakan istilah *pertanyaan*, *variabel*, *dataset*, sementara istilah teknis seperti *SHA-256* dan *jejak audit* dilipat rapi).
- **Integritas data:** Data mentah responden tidak pernah diubah diam-diam; seluruh perbaikan menghasilkan dataset turunan (*derived dataset*) dengan jejak audit yang transparan.

---

## 2. 5 Persona Mahasiswa & Skenario Pengujian

### Persona 1: Rian (Mahasiswa Manajemen S1 — Pengguna Pemula Pertama Kali)
- **Profil:** Rian sedang menyusun skripsi dengan tenggat waktu seminar hasil tinggal 3 hari. Belum pernah menggunakan SPSS atau R, merasa cemas dengan rumus statistik, dan ingin melihat hasil cepat sebelum memutuskan memakai data sendiri.
- **Skenario Uji:** Membuka OlahData, langsung klik tombol **"Pakai Data Contoh (60 Detik Selesai)"** pada layar pertama tanpa login.
- **Alur yang Dilalui:**
  1. *Layar 1 (Unggah):* Melihat spanduk ramah `Mode Data Contoh Kuesioner Skripsi (N = 120)` dengan tombol pelarian `Pakai Data Saya`. Membaca penjelasan singkat dan mengklik tombol utama `Lanjut: Periksa Kualitas Data`.
  2. *Layar 2 (Temuan Data):* Membaca kartu ringkasan `"Kami menemukan 120 responden dan 20 kolom"`. Semua temuan kualitas telah tertangani secara transparan. Klik `Lanjut: Tentukan Pertanyaan Penelitian`.
  3. *Layar 3 (Pertanyaan Penelitian):* Memilih kartu besar `"Pengaruh variabel terhadap variabel lain (Regresi Linier)"`. Memeriksa variabel Kualitas Layanan ($X_1$), Kepuasan Pelanggan ($X_2$), dan Loyalitas Pelanggan ($Y$). Klik `Lanjut: Cek Kesiapan Analisis`.
  4. *Layar 4 (Cek Kesiapan):* Memeriksa lampu indikator hijau (ukuran sampel aman, desain cocok). Tombol `Jalankan Paket Bab 4` langsung aktif. Klik tombol tersebut.
  5. *Layar 5 (Hasil Bab 4):* Dalam 4 detik, seluruh Tabel APA 7th (Tabel 4.1 sampai 4.5) beserta narasi akademis dan tombol `Salin Narasi Bab 4` tersaji rapi.
- **Waktu Penyelesaian:** **38 detik** (Target: < 60 detik).

---

### Persona 2: Nabila (Mahasiswa Psikologi — Pengguna Google Form Export)
- **Profil:** Mengumpulkan kuesioner skripsi melalui Google Forms. Hasil unduhan CSV berisi kolom `Timestamp`, `Email Address`, nama kolom berupa pertanyaan kuesioner yang sangat panjang (>50 karakter), dan respons berbentuk teks Likert (`"Sangat Setuju"`, `"Setuju"`, `"Netral"`, `"Tidak Setuju"`, `"Sangat Tidak Setuju"`).
- **Skenario Uji:** Mengunggah file mentah CSV hasil ekspor langsung dari Google Forms tanpa mengedit di Excel terlebih dahulu.
- **Tantangan Teknis:** Kolom timestamp dan email harus diabaikan secara cerdas; teks kuesioner panjang disingkat menjadi kode butir ($P_1, P_2, \dots$) tanpa menghilangkan teks pertanyaan aslinya; respons teks Likert dipetakan ke skala angka 1–5 secara otomatis.
- **Hasil Sistem:**
  - Parser otomatis mendeteksi kolom `Timestamp` dan `Email Address` sebagai kolom non-analisis.
  - Teks kuesioner panjang otomatis diringkas menjadi kode butir praktis, dan teks pertanyaan asli disimpan rapi dalam tabel pemetaan yang dapat disunting mahasiswa.
  - Teks Likert terpetakan otomatis ke skor 1–5, dengan catatan audit yang dapat dibuka mahasiswa.

---

### Persona 3: Bagus (Mahasiswa Akuntansi — Pengguna Excel Kampus dengan Judul di Atas Header)
- **Profil:** Mengunggah berkas Excel (`.xlsx`) yang dibuat oleh asisten laboratorium kampus. Pada baris 1 dan 2 terdapat teks judul penelitian dan nama fakultas; baris header tabel kuesioner baru dimulai pada baris ke-3. Terdapat beberapa sheet dalam buku kerja Excel tersebut.
- **Skenario Uji:** Mengunggah berkas `.xlsx` multilembar dengan baris judul dekoratif di atas baris header tabel.
- **Tantangan Teknis:** Parser konvensional biasanya gagal karena menganggap baris judul sebagai header (menyebabkan galat nama kolom kosong atau tipe data korup).
- **Hasil Sistem:**
  - Sistem mendeteksi keberadaan beberapa lembar kerja dan menampilkan dropdown pemilih lembar (*sheet selector*).
  - Algoritma pemindai baris melompati 2 baris judul di atas dan mendeteksi baris ke-3 sebagai baris header yang sah berdasarkan densitas kolom ($col \ge 4$).
  - Mahasiswa menerima pesan ramah: *"Baris judul (2 baris) dilewati. Baris header terdeteksi pada baris ke-3."*

---

### Persona 4: Dini (Mahasiswa Pendidikan — Pengguna Format Desimal Koma Indonesia)
- **Profil:** Mengetik skor rata-rata kuesioner di laptop Windows berbahasa Indonesia, di mana pemisah desimal adalah tanda koma (misalnya `"3,5"`, `"4,2"`, atau nilai minus `"-0,75"`), dan pemisah kolom CSV adalah titik koma (`;`).
- **Skenario Uji:** Mengunggah berkas kuesioner CSV dengan pemisah titik koma dan angka berkoma desimal.
- **Tantangan Teknis:** Library parser JavaScript standar (seperti PapaParse bawaan) sering memecah koma secara keliru atau menganggap `"3,5"` sebagai string teks bukan angka numerik.
- **Hasil Sistem:**
  - Pemindai otomatis mendeteksi pemisah kolom adalah titik koma (`;`).
  - Regex parser menangani pola numerik `/^-?\d+,\d+$/` dan mengonversinya menjadi angka desimal standar (`3.5`) secara presisi tanpa pembulatan prematur.

---

### Persona 5: Tari (Mahasiswa Ilmu Komunikasi — Responden Berjawaban Campuran & Butir Negatif)
- **Profil:** Kuesionernya memiliki beberapa butir berkebalikan (*favorable / unfavorable*), serta data responden yang tercampur antara singkatan teks (`SS`, `S`, `N`, `TS`, `STS`) dan angka numerik (`1 - 5`).
- **Skenario Uji:** Mengunggah berkas dengan jawaban teks campuran dan butir negatif pada variabel Loyalitas ($LP_5$).
- **Tantangan Teknis:** Pengguna perlu membalik butir negatif ($6 - x$) tanpa merusak data asli, dan memastikan butir yang tidak valid (misal $KL_5$) terdeteksi sebelum regresi dijalankan.
- **Hasil Sistem:**
  - Tabel pemetaan teks cerdas mengenali singkatan bahasa Indonesia (`SS`, `S`, `TS`, `STS`) maupun bahasa Inggris (`SA`, `A`, `D`, `SD`).
  - Pada Layar 3 (Pertanyaan Penelitian), tersedia tombol sakelar *"Pertanyaan Negatif (dibalik $6 - x$)"* untuk butir $LP_5$.
  - Pada Layar 4 (Cek Kesiapan), lampu kuning menyala pada *Korelasi Awal* mendeteksi $KL_5$ tidak valid ($r < r_{tabel}$), disertai tombol satu klik *"Keluarkan Pertanyaan KL5"* sehingga reliabilitas konstruk meningkat menjadi $> 0,70$.

---

## 3. Matriks Perbandingan Kendala (*Sticking Points*)

| Area Alur | Sebelum Perbaikan (Wizard Lama / SPSS Biasa) | Sesudah Perbaikan (OlahData 5 Layar) |
| :--- | :--- | :--- |
| **Pintu Masuk & Data Contoh** | Mahasiswa dipaksa mendaftar akun atau bingung memilih antara SPSS output atau raw data. Data contoh bercampur dengan proyek pengguna. | Tombol data contoh jelas dengan spanduk ramah `Data Contoh`. Tombol `Pakai Data Saya` selalu tersedia. Nol login untuk mencoba. |
| **Format Header & Judul** | Berkas gagal diproses jika baris 1 bukan header (misal ada judul skripsi di baris 1-2). Menghasilkan galat fatal putih/blank. | Pemindai otomatis mengenali baris judul dan melompatinya (header baris ke-3 terdeteksi mulus). Dropdown sheet untuk Excel. |
| **Ekspor Google Form** | Nama pertanyaan panjang (>80 karakter) merusak tabel. Jawaban teks `"Sangat Setuju"` dianggap galat tipe data. | Deteksi teks Likert otomatis dipetakan ke 1–5 dengan tabel pemetaan interaktif. Pertanyaan panjang diringkas menjadi $P_1, P_2$ dan teks asli disimpan sebagai label. |
| **Desimal Koma Indonesia** | Angka `"3,5"` dibaca string atau menimbulkan galat parsing pemisah koma `,`. | Deteksi otomatis titik koma (`;`) dan konversi koma desimal Indonesia menjadi float murni. |
| **Transparansi Kualitas Data** | Nilai kosong atau ekstrim dibuang diam-diam oleh software, atau program berhenti mendadak dengan kode galat misterius. | Kartu temuan ramah: *"Kami menemukan X responden dan Y kolom"*. Tiga opsi per temuan: *Kecualikan baris ini*, *Perbaiki di berkas*, atau *Lanjutkan apa adanya*. Nol modifikasi diam-diam. |
| **Model Pembayaran & Kuota** | Tombol checkout membingungkan, simulasi pembayaran QRIS palsu yang merusak kredibilitas akademis. | **Mode Daftar Tunggu murni:** Fitur berbayar / kuota >50 responden menampilkan gembok anggun dan membuka dialog email daftar tunggu tervalidasi dengan rate-limiting. Nol tombol bayar palsu. |
| **Bantuan Istilah Statistika** | Istilah teknis asing (*cronbach alpha, heteroscedasticity, glejser, SHA-256*) membuat mahasiswa panik dan takut salah. | Istilah teknis utama disederhanakan (*pertanyaan, variabel, dataset*). Jejak audit dan SHA-256 dilipat di bagian detail. Setiap istilah memiliki tooltip *"Apa artinya?"* dengan 2 kalimat sederhana dan contoh nyata. |
| **Kecepatan Hasil Bab 4** | Mahasiswa harus memilih puluhan menu uji satu per satu lalu merapikan tabel ke Word secara manual berjam-jam. | Tombol tunggal *"Jalankan Paket Bab 4"* menyelesaikan seluruh rangkaian analisis dalam < 15 detik dengan tabel APA 7th dan narasi skripsi baku. |

---

## 4. Kesimpulan Evaluasi Usability

Dengan penerapan alur 5 layar ini, OlahData berhasil memangkas friksi mental mahasiswa tingkat akhir:
1. **Kejelasan:** Tiap layar hanya memiliki **satu pertanyaan utama** dan **satu tombol aksi utama**.
2. **Keamanan:** Pekerjaan tersimpan otomatis (*autosave*), pengguna dapat melangkah maju dan mundur tanpa kehilangan konfigurasi.
3. **Kredibilitas Akademis:** Seluruh angka dihitung deterministik sesuai kaidah statistika baku, bukan halusinasi AI, dan siap dipertanggungjawabkan di hadapan dosen penguji skripsi.
