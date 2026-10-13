# Pertanyaan Terbuka & Ide di Luar PRD (Open Questions)

Dokumen ini mencatat ide, usulan fitur, dan pertimbangan teknis yang teridentifikasi selama audit kelengkapan namun **berada di luar lingkup PRD saat ini**, agar tim tetap berfokus pada eksekusi inti produk tanpa memicu scope creep.

---

## 1. Integrasi Langsung ke Google Form / KoboToolbox / Qualtrics
* **Kebutuhan yang tampak:** Banyak mahasiswa menyebarkan kuesioner lewat Google Forms dan ingin sinkronisasi langsung dengan Google Sheets tanpa harus mengunduh file `.xlsx` terlebih dahulu.
* **Pertimbangan & Risiko:** Memerlukan OAuth pihak ketiga, izin akses akun Google pengguna, dan penanganan token refresh yang memperluas attack surface.
* **Keputusan Saat Ini:** Di luar lingkup sekarang. Mahasiswa cukup mengunduh berkas `.xlsx` atau `.csv` dari Google Sheets lalu mengunggahnya secara mandiri ke OlahData.

---

## 2. Fitur Izin Akses Dataset Pengguna pada Tiket Dukungan Admin
* **Kebutuhan yang tampak:** Ketika mahasiswa mengalami galat aneh pada datanya (mis. singular matrix), admin mungkin tergoda untuk melihat baris responden pengguna untuk membantu diagnosis.
* **Pertimbangan & Risiko:** Aturan keras privasi OlahData: **Admin TIDAK PERNAH melihat isi data responden pengguna**. Membuka celah izin akan merusak kepercayaan akademik.
* **Keputusan Saat Ini:** Tetap dilarang keras. Dukungan teknis hanya mengandalkan log metadata (jumlah baris, kode galat, nama kolom) dan panduan mandiri *"Perlu dilakukan apa?"*.

---

## 3. Ekspor Langsung ke Format Dokumen Google Docs (Google Workspace Add-on)
* **Kebutuhan yang tampak:** Sebagian mahasiswa menyusun skripsi di Google Docs alih-alih Microsoft Word desktop.
* **Pertimbangan & Risiko:** Memerlukan penerbitan Google Workspace Marketplace App. Tombol salin satu-klik *"Salin Tabel Word"* yang ada saat ini sudah menggunakan format tab-separated yang juga kompatibel saat ditempel (paste) langsung ke tabel Google Docs.
* **Keputusan Saat Ini:** Pertahankan format clipboard tab-separated dan ekspor file `.docx` / `.pdf` lokal.

---

## 4. Dukungan Model Persamaan Struktural (SEM-PLS / AMOS)
* **Kebutuhan yang tampak:** Mahasiswa strata-2 (S2) atau skripsi dengan variabel intervening/moderating sering menanyakan SmartPLS atau AMOS.
* **Pertimbangan & Risiko:** OlahData difokuskan secara tajam untuk **mahasiswa S1 Indonesia** dengan regresi linier berganda OLS, validitas Pearson, reliabilitas Cronbach's Alpha, dan asumsi klasik. SEM-PLS memerlukan algoritma bootstrap iteratif yang jauh lebih kompleks dan membingungkan mahasiswa pemula.
* **Keputusan Saat Ini:** Fokus 100% pada kesempurnaan regresi berganda dan asumsi klasik standar Bab 4 S1. Fitur SEM dicatat untuk roadmap produk lanjutan (OlahData Pro/Pascasarjana).

---

## 5. Sistem Referral Teman Skripsi / Afiliasi Mahasiswa
* **Kebutuhan yang tampak:** Mahasiswa saling merekomendasikan alat olah data di grup angkatan kampus.
* **Pertimbangan & Risiko:** Memerlukan sistem pelacakan komisi, penarikan dana (payout), dan pencegahan fraud.
* **Keputusan Saat Ini:** Gunakan diskon voucher manual sederhana untuk paket semesteran jika diperlukan, tunda sistem komisi afiliasi otomatis.
