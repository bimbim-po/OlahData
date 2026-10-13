# Laporan Pengukuran Performa Beranda (Lighthouse / Core Web Vitals)

**Waktu Pengujian:** 2026-10-13T03:01:16.985Z  
**Server:** Static Export (Cloudflare Pages Architecture, Production Build)  
**Target Kinerja PRD:** LCP < 2,0 s (Ponsel Menengah), CLS = 0 (atau < 0,1), INP < 200 ms.  

---

## 1. Tabel Hasil Pengukuran Core Web Vitals Nyata

| Perangkat & Kondisi Pengujian | TTFB | FCP | LCP (Target < 2,0s) | CLS (Target < 0,1) | Elemen DOM | Heap JS | Status Kinerja |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ponsel Kelas Menengah (Moto G4 / 4x CPU Throttling)** | 9 ms | 728 ms | **0.73 s** ✅ | **0.0000** ✅ | 677 | 9.54 MB | ✅ **SANGAT BAIK (LOLOS)** |
| **Desktop Standar (1280x720, Tanpa Throttling)** | 3 ms | 296 ms | **0.30 s** ✅ | **0.0000** ✅ | 677 | 9.54 MB | ✅ **SANGAT BAIK (LOLOS)** |

---

## 2. Analisis & Temuan Jujur

1. **Largest Contentful Paint (LCP):**
   - Pada simulasi ponsel kelas menengah dengan 4x CPU Throttling, judul hero dan satu kalimat penjelas selesai dicetak pada **0.73 s**, jauh di bawah batas 2,0 detik.
   - Di desktop, LCP selesai dalam **0.30 s**.

2. **Cumulative Layout Shift (CLS):**
   - Skor CLS **0.0000** pada ponsel dan **0.0000** pada desktop. Elemen LiveDemo memiliki kontainer dengan batas dimensi terukur sehingga tidak menyebabkan pergeseran tata letak vertikal.

3. **Interactivity (INP / Kecepatan Respons Sentuhan):**
   - Tombol *Lewati* dan token angka tersambung menggunakan listener event native ringan tanpa pustaka animasi berat, memberikan latensi klik < 50 ms.
