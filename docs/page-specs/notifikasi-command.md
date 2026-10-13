# Spesifikasi Halaman: Kotak Notifikasi & Pencarian Global (`/app/notifikasi`, `GlobalSearchCommand`, `/app/pintasan`)

**Rute:** `/app/notifikasi`, `GlobalSearchCommand` (dialog Ctrl+K), `/app/pintasan` (dialog shortcut `?`)  
**Kategori:** Aplikasi Utama & Produktivitas  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Mengetahui pembaruan status pemrosesan data/pembayaran tanpa membuka banyak tab, serta berpindah cepat ke proyek atau uji statistik tertentu menggunakan kombinasi tombol papan ketik (Ctrl+K).

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang sedang fokus mengetik naskah skripsi di laptop dan ingin berpindah cepat antar-uji statistik tanpa memindahkan tangan ke touchpad/mouse.

## 3. Aksi Utama Tunggal & Jelas
**"Cari Proyek, Halaman, atau Istilah Statistik..."** pada kotak perintah (Command Palette), dan **"Tandai Semua Telah Dibaca"** pada notifikasi.

## 4. Isi Utama dengan Hierarki
1. **Kotak Notifikasi (`/app/notifikasi`):**
   - *Status Komputasi:* *"Pengujian regresi linier untuk proyek 'Pengaruh Kepemimpinan' telah selesai dihitung (1,42 detik)."*
   - *Pembaruan Paket:* *"Paket Kilat 30 Hari kamu aktif hingga 12 November 2026."*
   - *Pemberitahuan Sistem:* *"Pembaruan formula: Nilai r-tabel kini menghitung derajat bebas dinamis hingga N = 2.000 responden."*
2. **Pencarian Global (Command Palette Ctrl/Cmd + K):**
   - Bagian 1: Proyek Skripsi Terkini.
   - Bagian 2: Akses Cepat Modul Uji (Validitas, Reliabilitas, Asumsi, Regresi, ANOVA).
   - Bagian 3: Glosarium Istilah (Ketik "VIF", "Cronbach", "Sig", langsung baca artinya).
   - Bagian 4: Navigasi Cepat (Pengaturan, Langganan, Bantuan, Ganti Mode Tampilan).
3. **Pintasan Keyboard (`?`):**
   - `Ctrl + K`: Buka Pencarian Cepat.
   - `C`: Salin tabel yang sedang aktif ke format Word.
   - `1 / 2 / 3`: Beralih antara Lapis 1 (Intinya), Lapis 2 (Tabel), Lapis 3 (Bab 4).
   - `T`: Ganti mode terang/gelap (Tema meja belajar).
   - `Esc`: Tutup dialog / modal aktif.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** List item command palette skeleton saat mengetik pencarian.
* **Kosong:** Pada notifikasi: *"Tidak ada pemberitahuan baru. Semua pekerjaanmu berjalan lancar."* Pada pencarian: *"Tidak ditemukan hasil untuk '[kata kunci]'."*
* **Galat:** Penanganan ramah jika gagal menandai notifikasi telah dibaca.
* **Sukses:** Navigasi instan seketika tombol Enter ditekan.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Dialihkan ke `/masuk`.

## 6. Perilaku di Ponsel (360px Viewport)
* Tombol pencarian berupa ikon kaca pembesar di header aplikasi membuka modal layar penuh dengan input fokus otomatis.

## 7. Meta & Kopi
* **Judul Meta:** `Notifikasi & Pintasan Papan Ketik | OlahData`
* **Deskripsi Meta:** `Pusat notifikasi dan navigasi cepat meja kerja OlahData.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`notifications`, `shortcuts`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas notifikasi promosi atau iklan mengganggu (spam).

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [ PENCARIAN GLOBAL & NAVIGASI CEPAT (Ctrl + K)                                  X]|
| > Cari proyek, uji statistik, atau ketik istilah (mis: VIF, regresi)...           |
+-----------------------------------------------------------------------------------+
| PROYEK SKRIPSI TERKINI:                                                           |
| [*] Pengaruh Kepemimpinan terhadap Kinerja (Terakhir dibuka 10 menit lalu)        |
| [ ] Kepuasan Pasien Rawat Inap Rumah Sakit                                        |
|                                                                                   |
| AKSES LANGSUNG UJI STATISTIK:                                                     |
| [>] Uji Validitas Butir (Pearson Product Moment)                                  |
| [>] Uji Reliabilitas Instrumen (Cronbach's Alpha)                                 |
| [>] Uji Asumsi Klasik (Normalitas, Multikolinearitas, Heteroskedastisitas)        |
| [>] Regresi Linier Berganda (OLS, Uji t, Uji F, R Square)                         |
|                                                                                   |
| GLOSARIUM PENJELASAN SINGKAT:                                                     |
| [?] Apa itu Variance Inflation Factor (VIF)?                                      |
| [?] Apa maksud nilai signifikansi (Sig.) 0,000?                                   |
+-----------------------------------------------------------------------------------+
```
