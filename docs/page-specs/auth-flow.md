# Spesifikasi Halaman: Alur Autentikasi Lengkap (`/lupa-sandi`, `/atur-ulang-sandi`, `/verifikasi-email`, `/tautan-kedaluwarsa`)

**Rute:** `/lupa-sandi`, `/atur-ulang-sandi`, `/verifikasi-email`, `/verifikasi-email/kirim-ulang`, `/tautan-kedaluwarsa`  
**Kategori:** Autentikasi & Keamanan Akses  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Memulihkan akses akun, memverifikasi kepemilikan email mahasiswa, atau mengatasi tautan login kedaluwarsa dengan petunjuk yang menenangkan tanpa rasa panik.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang lupa kata sandi di tengah malam saat deadline revisi, atau mahasiswa baru yang belum menerima email konfirmasi pendaftaran.

## 3. Aksi Utama Tunggal & Jelas
- Pada `/lupa-sandi`: **"Kirim Tautan Atur Ulang Sandi"**
- Pada `/atur-ulang-sandi`: **"Simpan Kata Sandi Baru & Masuk"**
- Pada `/verifikasi-email`: **"Buka Email Saya"** atau **"Kirim Ulang Email Konfirmasi"**
- Pada `/tautan-kedaluwarsa`: **"Minta Tautan Baru"**

## 4. Isi Utama dengan Hierarki
1. **Lupa Kata Sandi (`/lupa-sandi`):**
   - Header: *"Lupa kata sandi akunmu? Kami bantu pulihkan."*
   - Input: Email pendaftaran mahasiswa.
   - Micro-copy penenang: *"Kami akan mengirim tautan aman ke emailmu dalam beberapa detik."*
   - Navigasi kembali: Tautan ke `/masuk`.
2. **Atur Ulang Kata Sandi (`/atur-ulang-sandi`):**
   - Input: Kata sandi baru + Konfirmasi kata sandi baru.
   - Indikator kekuatan sandi manusiawi (Minimal 8 karakter, kombinasi huruf dan angka).
3. **Verifikasi Email (`/verifikasi-email`):**
   - Header: *"Satu langkah lagi: Periksa kotak masuk emailmu."*
   - Petunjuk: Cek folder Spam / Promosi jika belum muncul dalam 2 menit.
   - Tombol kirim ulang: Waktu tunggu mundur 60 detik (*cooldown timer*) untuk mencegah spam.
4. **Tautan Kedaluwarsa (`/tautan-kedaluwarsa`):**
   - Penjelasan santai: *"Tautan keamanan ini sudah melewati batas waktu 24 jam demi keamanan akunmu."*
   - Aksi langsung: Input email untuk langsung mendapatkan tautan baru.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Form skeleton dengan tombol disabled saat request verifikasi diproses.
* **Kosong:** N/A.
* **Galat:** Pesan galat jelas jika email tidak terdaftar atau token verifikasi tidak cocok.
* **Sukses:** Konfirmasi hijau mint *"Tautan baru telah terkirim ke email [email]!"*.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Bebas diakses sesuai kebutuhan alur auth.

## 6. Perilaku di Ponsel (360px Viewport)
* Formulir vertikal ramping (max-width 420px) di tengah layar, keyboard type email dan password optimal.

## 7. Meta & Kopi
* **Judul Meta:** `Pulihkan Kata Sandi & Verifikasi Akun | OlahData`
* **Deskripsi Meta:** `Atur ulang kata sandi atau konfirmasi email akun OlahData dengan mudah dan aman.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`auth`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Bebas pesan galat teknis mentah (*"Error 401 unauthorized token invalid"*).
* [x] Bahasa ramah dan menuntun mahasiswa langkah demi langkah.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
|                                  [ OlahData ]                                     |
+-----------------------------------------------------------------------------------+
| LUPA KATA SANDI AKUNMU?                                                           |
| Masukkan alamat email yang kamu daftarkan untuk menerima tautan pemulihan.        |
|                                                                                   |
| Alamat Email : [ mahasiswa@kampus.ac.id                                         ] |
|                                                                                   |
| [ Kirim Tautan Atur Ulang Sandi (Biru Tinta) ]                                    |
|                                                                                   |
| Ingat kata sandimu? [ Kembali ke Halaman Masuk ]                                  |
|                                                                                   |
| (Kondisi Sukses):                                                                 |
| [v] Tautan pemulihan telah dikirim ke mahasiswa@kampus.ac.id (Mint)               |
| Periksa kotak masuk atau folder spam emailmu dalam 1-2 menit ke depan.            |
+-----------------------------------------------------------------------------------+
```
