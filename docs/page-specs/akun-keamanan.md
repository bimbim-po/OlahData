# Spesifikasi Halaman: Pengaturan Akun, Keamanan, & Hak Data (`/app/pengaturan`, `/app/pengaturan/keamanan`, `/app/pengaturan/data-saya`, `/app/pengaturan/hapus-akun`)

**Rute:** `/app/pengaturan`, `/app/pengaturan/keamanan`, `/app/pengaturan/data-saya`, `/app/pengaturan/hapus-akun`, `/app/langganan/batal`  
**Kategori:** Akun & Hak Privasi Mandiri  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Mengelola informasi profil akademik, mengamankan sesi login dan kata sandi, mengunduh seluruh arsip data mandiri (ekspor ZIP), membatalkan paket tanpa paksaan, atau menghapus permanen akun dengan penjelasan transparan.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang skripsinya sudah selesai atau yang ingin berpindah perangkat, serta ingin memastikan akun dan berkas penelitiannya tidak tertinggal tanpa pengawasan.

## 3. Aksi Utama Tunggal & Jelas
- Pada `/app/pengaturan`: **"Simpan Perubahan Profil"**
- Pada `/app/pengaturan/keamanan`: **"Perbarui Kata Sandi"** / **"Keluar dari Sesi Lain"**
- Pada `/app/pengaturan/data-saya`: **"Unduh Seluruh Arsip Data Saya (.ZIP)"**
- Pada `/app/pengaturan/hapus-akun`: **"Hapus Akun Saya Secara Permanen"** (wajib ketik nama akun untuk konfirmasi)
- Pada `/app/langganan/batal`: **"Konfirmasi Pembatalan Paket"**

## 4. Isi Utama dengan Hierarki
1. **Navigasi Sub-Tab Pengaturan:** Profil | Keamanan Akun | Unduh Data | Batalkan / Hapus Akun.
2. **Profil Akademik (`/pengaturan`):** Nama lengkap, Perguruan Tinggi, Program Studi, Email pendaftaran, Tema tampilan (Kertas Terang / Meja Belajar Malam / Sistem).
3. **Keamanan Akun (`/pengaturan/keamanan`):**
   - Form ganti kata sandi.
   - Daftar sesi aktif peramban (Browser, Sistem Operasi, Lokasi IP perkiraan, Waktu aktif).
   - Opsi keluar dari seluruh perangkat lain.
4. **Hak Unduh Data Saya (`/pengaturan/data-saya`):**
   - Mengunduh paket arsip berisi seluruh metadata proyek, konfigurasi pemetaan variabel, dan riwayat analisis dalam format JSON & Excel.
5. **Hapus Akun Permanen (`/pengaturan/hapus-akun`):**
   - Penjelasan akibat: Semua berkas kuesioner dan proyek akan dihapus permanen dari Supabase dalam 24 jam dan tidak dapat dipulihkan.
   - Tindakan pencegahan: Mengharuskan pengguna mengetik frasa `"HAPUS AKUN SAYA"` sebelum tombol aktif.
6. **Alur Pembatalan Paket (`/langganan/batal`):**
   - Pertanyaan umpan balik singkat tanpa manipulasi emosional: *"Mengapa kamu ingin membatalkan?"* (Skripsi sudah selesai, pindah metode kualitatif, kendala biaya, dll.).
   - Masa aktif paket tetap berjalan sampai hari terakhir periode yang sudah dibayar.

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Form pengaturan skeleton.
* **Kosong:** N/A.
* **Galat:** Validasi sebaris jika konfirmasi hapus salah ketik atau kata sandi lama salah.
* **Sukses:** Notifikasi hijau mint *"Perubahan berhasil disimpan"*.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Dialihkan ke `/masuk`.

## 6. Perilaku di Ponsel (360px Viewport)
* Navigasi sub-tab pengaturan dapat digeser horizontal (*scrollable tabs*).

## 7. Meta & Kopi
* **Judul Meta:** `Pengaturan Akun & Kendali Data Pribadi | OlahData`
* **Deskripsi Meta:** `Kelola profil, keamanan sesi, unduh arsip data, dan pengaturan privasi akun OlahData.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`accountSettings`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG ada *Dark Pattern* yang menyembunyikan tombol batal atau hapus akun (kebijakan keterbukaan penuh).

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Meja Kerja  /  Pengaturan Akun                                        |
+-----------------------------------------------------------------------------------+
| PENGATURAN AKUN & PRIVASI MANDIRI                                                 |
| [ Profil ]  [ Keamanan Sesi ]  [ Unduh Data Saya ]  [ Hapus Akun (Koral) ]        |
|                                                                                   |
| TAB: UNDUH DATA SAYA (HAK PRIVASI PENUH):                                         |
| Kamu berhak mengunduh seluruh data yang pernah kamu masukkan ke OlahData.        |
| Paket arsip meliputi: seluruh berkas kuesioner, pemetaan variabel, dan hasil uji. |
|                                                                                   |
| [ Unduh Seluruh Arsip Dataku (.ZIP) ]                                             |
|                                                                                   |
| TAB: HAPUS AKUN PERMANEN:                                                         |
| Peringatan: Tindakan ini tidak dapat dibatalkan. Seluruh data proyek skripsimu    |
| akan dihapus dari server secara permanen.                                         |
|                                                                                   |
| Untuk konfirmasi, ketik "HAPUS AKUN SAYA" di bawah ini:                          |
| [ HAPUS AKUN SAYA                                                               ] |
| [ Hapus Akun Saya Secara Permanen (Koral) ]                                       |
+-----------------------------------------------------------------------------------+
```
