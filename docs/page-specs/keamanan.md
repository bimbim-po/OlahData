# Spesifikasi Halaman: Keamanan & Privasi Data Responden (`/keamanan`)

**Rute:** `/keamanan`  
**Kategori:** Publik & Kepercayaan Produk  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Memahami secara transparan dan dalam bahasa Indonesia sederhana tentang bagaimana berkas kuesioner dilindungi, siapa yang dapat melihatnya, berapa lama data disimpan, dan jaminan bahwa data responden tidak pernah disalahgunakan.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Mahasiswa yang mengumpulkan data kuesioner rahasia (mis. kinerja karyawan, pasien rumah sakit, atau siswa sekolah), takut datanya bocor ke internet atau dibaca oleh pihak lain, dan membutuhkan kepastian hukum tertulis untuk dosen pembimbing.

## 3. Aksi Utama Tunggal & Jelas
**"Unduh Lembar Pernyataan Privasi untuk Dosen"** atau **"Pelajari Pengaturan Hapus Data Mandiri"**.

## 4. Isi Utama dengan Hierarki
1. **Empat Komitmen Keras Privasi OlahData:**
   - *1. Data Responden Bersifat Rahasia Penuh:* Disimpan dalam basis data terenkripsi di tingkat istirahat (*AES-256 at rest*) dan transit (*TLS 1.3*).
   - *2. Admin TIDAK BISA Melihat Isi Responden:* Dashboard Super Admin hanya menerima metadata teknis (jumlah baris, ukuran berkas, jenis uji, durasi komputasi). Tidak ada tombol pratinjau data di area admin.
   - *3. Tidak Ada Data yang Dipakai Melatih AI:* Jawaban kuesioner tidak pernah dikirim ke pihak ketiga untuk pelatihan model LLM.
   - *4. Retensi & Hapus Mandiri:* Mahasiswa dapat menghapus seluruh dataset dan akun secara mandiri kapan saja, menghapus permanen semua catatan dalam 24 jam.
2. **Tabel Ringkas Aliran Data:**
   - *Jenis Data:* Berkas Excel tabulasi kuesioner.
   - *Tujuan:* Menghitung rumus validitas, reliabilitas, regresi.
   - *Lokasi Simpan:* Supabase PostgreSQL terisolasi Row-Level Security (RLS).
   - *Masa Simpan Default:* 90 hari setelah analisis selesai, atau dihapus langsung oleh pengguna.
3. **Pernyataan Sertifikasi yang Jujur:**
   - Tidak mencatut sertifikasi kepatuhan fiktif (SOC 2, ISO 27001).
   - Secara jujur menyatakan kepatuhan terhadap prinsip pelindungan data pribadi (UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi - UU PDP).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Kerangka kartu komitmen privasi.
* **Kosong:** N/A.
* **Galat:** Pesan galat koneksi standar dengan tombol muat ulang.
* **Sukses:** Halaman ter-render dengan tipografi tenang dan tabel pemetaan data yang jelas.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Akses terbuka tanpa autentikasi.

## 6. Perilaku di Ponsel (360px Viewport)
* Tabel peta data beradaptasi menjadi kartu-kartu ringkas yang mudah dibaca secara vertikal.

## 7. Meta & Kopi
* **Judul Meta:** `Keamanan & Pelindungan Data Responden Kuesioner | OlahData`
* **Deskripsi Meta:** `Pelajari bagaimana OlahData mengisolasi data responden skripsimu. Enkripsi penuh, tanpa pelacakan pihak ketiga, dan hak hapus data mandiri.`
* **Kopi:** Terpusat di `src/lib/copy.ts` (`securityPage`).

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] DILARANG memasang lencana keamanan palsu (*"100% Hacker Proof"*, *"Bank Grade Security"*, *"ISO 27001 Certified"* tanpa sertifikat sah).
* [x] Bahasa yang digunakan adalah bahasa hukum sederhana, bukan jargon kepatuhan asing yang membingungkan.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [OlahData]  Fitur  Harga  Panduan  Keamanan [aktif]          [Masuk] [Buka Meja]  |
+-----------------------------------------------------------------------------------+
| KEAMANAN & PELINDUNGAN DATA RESPONDEN                                             |
| Jawaban kuesioner penelitianmu adalah amanah ilmiah. Kami menjaganya dengan ketat.|
|                                                                                   |
| 4 KOMITMEN PERLINDUNGAN PRIVASI:                                                  |
| [1] Enkripsi Penuh saat Transit & Istirahat (AES-256)                             |
| [2] Admin TIDAK PERNAH melihat isi sel jawaban responden pengguna                 |
| [3] Data TIDAK PERNAH digunakan untuk melatih kecerdasan buatan (AI)              |
| [4] Kamu memiliki kendali 100% untuk menghapus permanen kapan saja               |
|                                                                                   |
| PEMETAAN PENYIMPANAN DATA:                                                        |
| Data Disimpan         | Tujuan                     | Siapa yang Melihat | Retensi |
| Berkas Tabulasi (.xlsx)| Komputasi Uji Statistik    | Hanya Akunmu       | 90 Hari |
| Hasil Tabel Bab 4     | Ekspor Naskah Skripsi      | Hanya Akunmu       | 90 Hari |
| Metadata Komputasi    | Pemantauan Error Sistem    | Admin Teknis       | 30 Hari |
|                                                                                   |
| Ingin menghapus atau mengunduh seluruh arsip datamu?                              |
| [ Kelola Data di Pengaturan Akun -> ]                                             |
+-----------------------------------------------------------------------------------+
```
