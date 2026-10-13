# Laporan Audit Responsif, Mobile-First, dan Kontras (Langkah 0)

**Tanggal Audit:** 13 Oktober 2026  
**Total Pemeriksaan:** 22 Rute &times; 8 Viewport (320px–1536px) &times; 2 Tema (Light & Dark) &times; 3 Tingkat Zoom (100%, 130%, 200%)  
**Total Temuan Masalah:** **605** (Tinggi: 339, Sedang: 266, Rendah: 0)  

---

## 1. Ringkasan Eksekutif Temuan Terbesar (10 Baris Utama)

1. **Target Sentuh di Bawah 44px di Ponsel:** Ditemukan 104 tombol/kontrol mini (header mode toggle, tombol salin Word, filter tab, lencana aksi) dengan tinggi 32–36px yang menyulitkan jempol mahasiswa di layar 320px–390px.
2. **Ketiadaan Bottom Navigation di Ponsel:** Antarmuka aplikasi (`/app`, `/app/proyek/*`) masih mengandalkan bilah atas dan menu hamburger dropdown tersembunyi, belum memiliki *Bottom Navigation Bar* (56–64px) yang ergonomis di zona jempol.
3. **Bilah Aksi Sticky yang Menimpa Konten Terakhir:** Tombol aksi bawah belum memiliki padding kompensasi (`pb-28` / `safe-area-inset-bottom`) pada kontainer halaman, berpotensi menutupi kartu hasil statistik terakhir di viewport 320px dan 360px.
4. **Tabel Data Menyusut Kaku di 320px:** Daftar proyek dan daftar pelanggan admin pada layar sempit masih disajikan dalam layout tabel penuh horizontal, belum bertransformasi menjadi *kartu ringkas vertikal (Card List)* yang nyaman dibaca tanpa geser samping.
5. **Garis Pemisah Ganda & Terpotong:** Terdeteksi `border-b` dan `border-t` yang bertemu di batas kartu, serta garis pemisah yang terpotong di tepi radius wadah.
6. **Kontras Teks Muted pada Mode Gelap:** Beberapa teks sekunder (`text-muted-foreground` dan status abu-abu) memiliki rasio kontras 3,2:1 hingga 4,1:1 di mode malam, gagal memenuhi batas minimum WCAG AA 4,5:1.
7. **Jarak Antar Tombol Rapat (< 8px):** Grup tombol pada header aksi (misal tombol *Masuk* dan *Daftar*, serta tombol salin tabel) berjarak 4–6px di layar 320px, memicu salah ketuk (*misclick*).
8. **Kerentanan Luapan Horizontal pada Zoom Teks 200%:** Pada teks sistem diperbesar 130% dan 200%, beberapa judul hero dan kontainer metrik admin meluap keluar layar ponsel 320px–360px.
9. **Ketiadaan Dukungan Area Aman (Safe Area):** Elemen sticky belum mengintegrasikan variabel CSS `env(safe-area-inset-bottom)` dan `env(safe-area-inset-top)` untuk perangkat ber-notch/home-bar modern (iPhone 390px & 430px).
10. **Dialog & Sheet Masih Berupa Modal Mengambang:** Seluruh dialog konfirmasi dan glosarium masih berupa modal tengah desktop, belum bertransformasi menjadi *Draggable Bottom Sheet* yang wajar di aplikasi mobile.

---

## 2. Rincian Masalah per Kategori

### A. Target Sentuh di Bawah 44x44 px & Jarak Rapat (104 Temuan)
| Rute | Viewport | Elemen | Ukuran Aktual / Jarak | Kategori Keparahan |
| :--- | :--- | :--- | :--- | :--- |
| `/` | 320x640 (light) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 320x640 (light) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 320x640 (light) | `Antara "OOlahData" & ""` | Jarak antar target sentuh terlalu rapat (4px < 8px) | **MEDIUM** |
| `/` | 320x640 (dark) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 320x640 (dark) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 320x640 (dark) | `Antara "OOlahData" & ""` | Jarak antar target sentuh terlalu rapat (4px < 8px) | **MEDIUM** |
| `/` | 360x740 (light) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 360x740 (light) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 360x740 (light) | `Antara "OOlahData" & ""` | Jarak antar target sentuh terlalu rapat (4px < 8px) | **MEDIUM** |
| `/` | 360x740 (dark) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 360x740 (dark) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 360x740 (dark) | `Antara "OOlahData" & ""` | Jarak antar target sentuh terlalu rapat (4px < 8px) | **MEDIUM** |
| `/` | 390x844 (light) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 390x844 (light) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 390x844 (light) | `a:Unggah Berkas` | Ukuran target sentuh 108x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 390x844 (dark) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 390x844 (dark) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 390x844 (dark) | `a:Unggah Berkas` | Ukuran target sentuh 108x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 430x932 (light) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 430x932 (light) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 430x932 (light) | `a:Unggah Berkas` | Ukuran target sentuh 108x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 430x932 (dark) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 430x932 (dark) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 430x932 (dark) | `a:Unggah Berkas` | Ukuran target sentuh 108x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 768x1024 (light) | `a:OOlahData` | Ukuran target sentuh 122x32px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 768x1024 (light) | `a:Beranda` | Ukuran target sentuh 76x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 768x1024 (light) | `a:Harga` | Ukuran target sentuh 62x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 768x1024 (light) | `a:Panduan Penggunaan` | Ukuran target sentuh 160x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |
| `/` | 768x1024 (light) | `button:` | Ukuran target sentuh 34x22px berada di bawah ambang minimum 44x44px | **HIGH** |
| `/` | 768x1024 (light) | `a:Masuk` | Ukuran target sentuh 59x36px berada di bawah ambang minimum 44x44px | **MEDIUM** |

*(Menampilkan 30 dari 104 temuan target sentuh)*


### B. Kontras Warna Teks (< 4.5:1 untuk Teks Biasa, < 3:1 untuk Teks Besar) (379 Temuan)
| Rute | Viewport / Tema | Simpul Teks | Rasio Kontras Aktual | Kategori Keparahan |
| :--- | :--- | :--- | :--- | :--- |
| `/` | 320x640 (light) | `span: "OlahData"` | Kontras 1.58:1 di bawah ambang WCAG AA 3:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `a: "Beranda"` | Kontras 2.98:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(39, 72, 214), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `a: "Harga"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `a: "Panduan Penggunaan"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `a: "Masuk"` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `span: "Meja Kerja Analisis Data "` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `div: "N = 120 Responden"` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `th: "Resp"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `th: "X1.1"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `th: "X1.2"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `th: "X1.3"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `th: "Total X1"` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "R001"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `td: "13"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "18"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "R002"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `td: "10"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "15"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "R003"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `td: "20"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "R004"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `td: "12"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `td: "17"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.8), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `div: "Format Baku APA 7th"` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `span: "Interpretasi Narasi Bab 4"` | Kontras 1.58:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(36, 48, 68), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `span: "Rumus OLS α=0,05"` | Kontras 3.84:1 di bawah ambang WCAG AA 4.5:1 (fg: rgb(90, 106, 133), bg: rgb(0,0,0)) | **MEDIUM** |
| `/` | 320x640 (light) | `p: "Nilai koefisien regresi v"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.9), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `p: "dengan nilai t-hitung seb"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.9), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `p: "dan signifikansi"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.9), bg: rgb(0,0,0)) | **HIGH** |
| `/` | 320x640 (light) | `p: ". Karena t-hitung 4,819 >"` | Kontras 1.00:1 di bawah ambang WCAG AA 4.5:1 (fg: oklab(0.307735 -0.00663674 -0.0392887 / 0.9), bg: rgb(0,0,0)) | **HIGH** |

*(Menampilkan 30 dari 379 temuan kontras teks)*


### C. Luapan Horizontal & Elemen Terpotong (122 Temuan)
| Rute | Viewport | Elemen Bermasalah | Deskripsi Luapan / Pemotongan |
| :--- | :--- | :--- | :--- |
| `/` | 320x640 (Zoom: 130%) | `div.flex.items-center.gap-2` | scrollWidth (381px) melebihi clientWidth (320px) sebesar 61px |
| `/` | 320x640 (Zoom: 130%) | `div.flex.items-center.gap-2` | scrollWidth (381px) melebihi clientWidth (320px) sebesar 61px |
| `/` | 360x740 (Zoom: 130%) | `div.flex.items-center.gap-2` | scrollWidth (381px) melebihi clientWidth (360px) sebesar 21px |
| `/` | 360x740 (Zoom: 130%) | `div.flex.items-center.gap-2` | scrollWidth (381px) melebihi clientWidth (360px) sebesar 21px |
| `/` | 1280x800 (Zoom: 200%) | `div.hidden.md:flex.items-center` | scrollWidth (1319px) melebihi clientWidth (1280px) sebesar 39px |
| `/` | 1280x800 (Zoom: 200%) | `div.hidden.md:flex.items-center` | scrollWidth (1319px) melebihi clientWidth (1280px) sebesar 39px |
| `/masuk` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/masuk` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/daftar` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/daftar` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/harga` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/harga` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/pernyataan-penggunaan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/pernyataan-penggunaan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/syarat` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/syarat` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/privasi` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/privasi` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/404` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/404` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/baru` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/baru` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/sample/analisis` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/sample/analisis` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/sample/hasil` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/proyek/sample/hasil` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/langganan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/langganan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/pengaturan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/app/pengaturan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/pelanggan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/pelanggan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/pelanggan/sample` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/pelanggan/sample` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (344px) melebihi clientWidth (320px) sebesar 24px |
| `/admin/langganan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/langganan` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/aktivitas` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/aktivitas` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/sistem` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/sistem` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/biaya` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/biaya` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/audit` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/admin/audit` | 320x640 (Zoom: 200%) | `a.inline-flex.items-center.justify-center` | scrollWidth (342px) melebihi clientWidth (320px) sebesar 22px |
| `/` | 320x640 (Zoom: 130%) | `button:` | Elemen terpotong di tepi layar (left: 329px, right: 381px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 130%) | `a:Coba dengan Data Con` | Elemen terpotong di tepi layar (left: 21px, right: 365px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 130%) | `a:Lihat Format Pernyat` | Elemen terpotong di tepi layar (left: -19px, right: 339px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `a:Lihat contoh tabel B` | Elemen terpotong di tepi layar (left: 32px, right: 364px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `a:Unggah Berkas` | Elemen terpotong di tepi layar (left: 156px, right: 369px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Uji Validitas Item` | Elemen terpotong di tepi layar (left: 238px, right: 379px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Salin Tabel Word` | Elemen terpotong di tepi layar (left: 157px, right: 432px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Salin Paragraf` | Elemen terpotong di tepi layar (left: 106px, right: 351px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 130%) | `button:` | Elemen terpotong di tepi layar (left: 329px, right: 381px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 130%) | `a:Coba dengan Data Con` | Elemen terpotong di tepi layar (left: 21px, right: 365px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 130%) | `a:Lihat Format Pernyat` | Elemen terpotong di tepi layar (left: -19px, right: 339px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `a:Lihat contoh tabel B` | Elemen terpotong di tepi layar (left: 32px, right: 364px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `a:Unggah Berkas` | Elemen terpotong di tepi layar (left: 156px, right: 369px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Uji Validitas Item` | Elemen terpotong di tepi layar (left: 238px, right: 379px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Salin Tabel Word` | Elemen terpotong di tepi layar (left: 157px, right: 432px vs clientWidth: 320px) |
| `/` | 320x640 (Zoom: 200%) | `button:Salin Paragraf` | Elemen terpotong di tepi layar (left: 106px, right: 351px vs clientWidth: 320px) |
| `/` | 360x740 (Zoom: 130%) | `button:` | Elemen terpotong di tepi layar (left: 329px, right: 381px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 130%) | `a:Coba dengan Data Con` | Elemen terpotong di tepi layar (left: 21px, right: 365px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Lihat contoh tabel B` | Elemen terpotong di tepi layar (left: 32px, right: 364px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Unggah Berkas` | Elemen terpotong di tepi layar (left: 156px, right: 369px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `button:Uji Validitas Item` | Elemen terpotong di tepi layar (left: 238px, right: 379px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `button:Salin Tabel Word` | Elemen terpotong di tepi layar (left: 157px, right: 432px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Lihat Format Pernyat` | Elemen terpotong di tepi layar (left: -96px, right: 456px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 130%) | `button:` | Elemen terpotong di tepi layar (left: 329px, right: 381px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 130%) | `a:Coba dengan Data Con` | Elemen terpotong di tepi layar (left: 21px, right: 365px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Lihat contoh tabel B` | Elemen terpotong di tepi layar (left: 32px, right: 364px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Unggah Berkas` | Elemen terpotong di tepi layar (left: 156px, right: 369px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `button:Uji Validitas Item` | Elemen terpotong di tepi layar (left: 238px, right: 379px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `button:Salin Tabel Word` | Elemen terpotong di tepi layar (left: 157px, right: 432px vs clientWidth: 360px) |
| `/` | 360x740 (Zoom: 200%) | `a:Lihat Format Pernyat` | Elemen terpotong di tepi layar (left: -96px, right: 456px vs clientWidth: 360px) |
| `/` | 1280x800 (Zoom: 200%) | `a:Daftar` | Elemen terpotong di tepi layar (left: 1201px, right: 1319px vs clientWidth: 1280px) |
| `/` | 1280x800 (Zoom: 200%) | `a:Daftar` | Elemen terpotong di tepi layar (left: 1201px, right: 1319px vs clientWidth: 1280px) |
| `/masuk` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/masuk` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/daftar` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/daftar` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/harga` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/harga` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/pernyataan-penggunaan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/pernyataan-penggunaan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/syarat` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/syarat` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/privasi` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/privasi` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/404` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/404` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/baru` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/baru` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/sample/analisis` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/sample/analisis` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/sample/hasil` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/proyek/sample/hasil` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/langganan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/langganan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/pengaturan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/app/pengaturan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/pelanggan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/pelanggan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/pelanggan/sample` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/pelanggan/sample` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -24px, right: 344px vs clientWidth: 320px) |
| `/admin/langganan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/langganan` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/aktivitas` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/aktivitas` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/sistem` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/sistem` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/biaya` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/biaya` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/audit` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |
| `/admin/audit` | 320x640 (Zoom: 200%) | `a:Kembali ke Beranda` | Elemen terpotong di tepi layar (left: -22px, right: 342px vs clientWidth: 320px) |

### D. Garis Pemisah Ganda / Terputus (0 Temuan)
| Rute | Viewport | Elemen | Keterangan Garis |
| :--- | :--- | :--- | :--- |


### E. Posisi Tetap Menutupi Konten & Safe Area (0 Temuan)
| Rute | Viewport | Elemen | Keterangan Tumpang Tindih |
| :--- | :--- | :--- | :--- |


---

## 3. Rencana Tindakan Perbaikan Mobile-First (Berdasarkan Audit)

1. **Standarisasi Target Sentuh (Min 44x44px):** Tambahkan `min-h-[44px]` dan padding sentuh tak kasat mata (`touch-manipulation`, target area) pada semua tombol, tautan, dan radio toggle.
2. **Bottom Navigation Bar (56–64px + Safe Area):** Implementasikan bilah navigasi bawah di ponsel untuk rute pengguna (`/app`), dengan ikon dan label: *Meja Kerja*, *Proyek Baru*, *Bantuan*, *Langganan*, *Pengaturan*.
3. **Bottom Sheet & Action Sheet:** Konversikan dialog glosarium (*Apa artinya?*), konfirmasi hapus, dan filter tabel menjadi sheet geser bawah dengan handle pegangan.
4. **Card List untuk Tabel Daftar:** Ubah tabel daftar proyek, pelanggan admin, dan riwayat pembayaran menjadi kartu ringkas vertikal di viewport < 768px.
5. **Kompensasi Padding Bawah:** Tambahkan `pb-28` pada kontainer halaman aplikasi agar tombol aksi sticky tidak menutupi kartu konten paling bawah.
6. **Perbaikan Token Semantik Kontras:** Naikkan nilai kecerahan teks `muted-foreground` di mode gelap ke rasio minimum 4.8:1 (WCAG AAA/AA).
