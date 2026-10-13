# Spesifikasi Halaman: Katalog Komponen UI & Pratinjau Email Transaksional (`/dev/komponen`, `/dev/email`)

**Rute:** `/dev/komponen`, `/dev/email` (Hanya aktif di lingkungan development)  
**Kategori:** Kualitas Rekayasa & Komponen Dev  

---

## 1. Tujuan Pemakai (Satu Kalimat)
Menyediakan lingkungan visual terisolasi bagi tim pengembang untuk memverifikasi seluruh komponen UI dalam keenam keadaannya serta meninjau rendering 8 variasi template email transaksional di desktop dan ponsel.

## 2. Siapa Pemakainya & Apa yang Sedang Dirasakan
Engineer dan desainer yang ingin memastikan tidak ada regresi visual, token warna tidak bocor, dan seluruh state (loading, error, empty, dsb.) teruji sebelum rilis ke produksi.

## 3. Aksi Utama Tunggal & Jelas
**"Pilih Komponen / Email untuk Ditinjau"** (Beralih antar variasi komponen dan template email).

## 4. Isi Utama dengan Hierarki
1. **Katalog Komponen (`/dev/komponen`):**
   - *Token Visual:* Swatch warna Kertas (`#F6F8FC`), Tinta (`#2748D6`), Stabilo (`#FFE14D`), Mint (`#BFEBD9`), Koral (`#E8574F`).
   - *Hierarki Radius:* 6px (Tabel), 10px (Input/Tombol), 16px (Kartu/Dialog).
   - *Komponen Inti & 6 Keadaannya:*
     - `Button` (Default, Hover, Disabled, Loading Shimmer).
     - `Badge` (Mint Lolos, Koral Galat, Tinta Info, Stabilo Aktif).
     - `Table` (Standar APA 7th, Tabular Nums, Baris Aktif Stabilo).
     - `ExplanationBox` (Tiga Lapis Penjelasan, Tombol Apa Artinya).
     - `AssumptionAlert` (Blok Perlu Dilakukan Apa).
     - `EmptyState` (Ajakan Bertindak Ramah).
     - `TraceabilityPanel` (Audit Kriptografis Monospace).
2. **Pratinjau Email Transaksional (`/dev/email`):**
   - 8 Template Wajib:
     1. *Verifikasi Email Mahasiswa*
     2. *Atur Ulang Kata Sandi*
     3. *Selamat Datang di OlahData*
     4. *Bukti Pembayaran & Kuitansi Lunas*
     5. *Pengingat Masa Aktif Paket (H-3)*
     6. *Pembayaran Gagal / Kedaluwarsa*
     7. *Masa Langganan Berakhir*
     8. *Penghapusan Akun & Data Selesai*
   - Toggle Tampilan: HTML Responsif vs Teks Polos (Plain-text fallback).

## 5. Enam Keadaan Wajib
* **Memuat (Skeleton):** Pratinjau komponen skeleton.
* **Kosong:** Tampilan jika tidak ada filter komponen yang cocok.
* **Galat:** Penanganan galat parser template email.
* **Sukses:** Komponen dan email ter-render sempurna.
* **Batas Paket:** N/A.
* **Tanpa Izin:** Rute `/dev/*` hanya aktif pada `process.env.NODE_ENV !== 'production'` atau mengembalikan 404 pada produksi.

## 6. Perilaku di Ponsel (360px Viewport)
* Pengaturan lebar viewport responsif (360px, 768px, 1280px) langsung di dalam bingkai pratinjau.

## 7. Meta & Kopi
* **Judul Meta:** `Katalog Komponen UI & Pratinjau Email (Dev Only) | OlahData`
* **Deskripsi Meta:** `Halaman inspeksi internal komponen dan email transaksional OlahData.`

## 8. Pemeriksaan DAFTAR LARANGAN (Anti-Default)
* [x] Rute ini tidak pernah diindeks oleh mesin pencari (`robots: noindex`) dan tidak muncul di navigasi publik.

## 9. Sketsa Target (ASCII)
```text
+-----------------------------------------------------------------------------------+
| [DEV ONLY] Katalog Komponen UI & Pratinjau Email Transaksional                    |
+-----------------------------------------------------------------------------------+
| [ Katalog Komponen UI ]  [ Pratinjau Email Transaksional ]                        |
|                                                                                   |
| PILIH TEMPLATE EMAIL:                                                             |
| [1. Verifikasi Email] [2. Reset Sandi] [3. Selamat Datang] [4. Kuitansi Pembayaran|
| [5. Pengingat H-3]    [6. Bayar Gagal] [7. Paket Habis]    [8. Hapus Akun Selesai]|
|                                                                                   |
| BINGKAI PRATINJAU EMAIL (Mode: HTML Responsif | Lebar: Ponsel 360px [v]):         |
| +-------------------------------------------------------------------------------+ |
| | [ Logo OlahData ]                                                             | |
| | Halo, Budi!                                                                   | |
| | Pembayaran Paket Kilat 30 Hari sebesar Rp 49.000 telah kami terima.           | |
| | Kuitansi resmi terlampir pada email ini.                                      | |
| |                                                                               | |
| | [ Buka Meja Kerja Skripsimu Sekarang (Tombol Biru Tinta) ]                    | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```
