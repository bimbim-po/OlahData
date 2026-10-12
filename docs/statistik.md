# Dokumentasi Rumus, Konvensi SPSS, dan Asumsi Statistik OlahData

Dokumen ini menjelaskan dasar matematis, konvensi ilmiah yang diimplementasikan pada **Mesin Statistik OlahData** (`services/stats`), serta pemenuhan standar penulisan skripsi kuantitatif di Indonesia (merujuk pada Sugiyono, Ghozali, Azwar, dan standar APA edisi ke-7).

---

## 1. Prinsip Utama Komputasi

1. **Deterministik Penuh**: Seluruh angka dihitung murni dengan formula aljabar linier dan distribusi probabilitas (`scipy`, `numpy`, `statsmodels`). Model Bahasa (LLM) **tidak pernah** menghitung atau mengubah angka.
2. **Presisi Tinggi**: Toleransi absolut komputasi $< 0,001$ terhadap benchmark acuan R dan JASP.
3. **Format Angka Indonesia (id-ID)**: Seluruh penyajian angka menggunakan koma (`,`) sebagai pemisah desimal dan titik (`.`) sebagai pemisah ribuan.

---

## 2. Uji Kualitas Data & Pembersihan

Dataset responden bersifat *immutable* (tidak dapat diubah). Setiap eksklusi baris bermasalah menghasilkan versi data baru (`derived`), dengan jejak audit yang tercatat.

Pemeriksaan kualitas mencakup:
1. **Sel Kosong / Nilai Hilang (Missing Values)**: Memeriksa apakah ada sel kosong, `null`, atau string kosong.
2. **Nilai Di Luar Skala (Out of Range)**: Untuk skala Likert 1–5, nilai $< 1$ atau $> 5$ ditandai sebagai galat (*error*).
3. **Baris Duplikat**: Memeriksa jawaban responden yang identik 100% di semua butir kuesioner.
4. **Straight-lining**: Mendeteksi responden dengan respons seragam konstan (misalnya memilih angka 3 pada seluruh butir kuesioner).

---

## 3. Uji Validitas Butir Instrumen (Pearson Product Moment)

### Konvensi
Di Indonesia, uji validitas kuesioner skripsi umumnya menggunakan korelasi **Pearson Product Moment** antara skor butir ($X$) dengan total skor konstruk ($Y$).

$$r_{xy} = \frac{N \sum XY - (\sum X)(\sum Y)}{\sqrt{\left[N \sum X^2 - (\sum X)^2\right] \left[N \sum Y^2 - (\sum Y)^2\right]}}$$

### Nilai Kritis $r_{\text{tabel}}$
Nilai $r_{\text{tabel}}$ dihitung secara dinamis dari distribusi $t$-Student dua arah (*two-tailed*) pada derajat bebas $df = N - 2$ dan taraf signifikansi $\alpha = 0,05$:

$$t_{\text{kritis}} = t_{\alpha/2, df}$$
$$r_{\text{tabel}} = \frac{t_{\text{kritis}}}{\sqrt{df + t_{\text{kritis}}^2}}$$

**Kriteria Keputusan:**
- Jika $r_{\text{hitung}} > r_{\text{tabel}}$ dan bernilai positif, maka butir pernyataan dinyatakan **Valid**.
- Jika $r_{\text{hitung}} \le r_{\text{tabel}}$ atau bernilai negatif, maka butir pernyataan dinyatakan **Gugur (Tidak Valid)**.

---

## 4. Uji Reliabilitas (Cronbach's Alpha)

Reliabilitas mengukur konsistensi internal dari butir-butir dalam satu variabel konstruk.

$$\alpha = \left(\frac{k}{k - 1}\right) \left(1 - \frac{\sum_{i=1}^k s_i^2}{s_{\text{total}}^2}\right)$$

Di mana:
- $k$: Jumlah butir dalam konstruk.
- $s_i^2$: Varians sampel butir ke-$i$ dengan penyebut $N - 1$.
- $s_{\text{total}}^2$: Varians skor total konstruk.

### Alpha if Item Deleted
Dihitung dengan menghitung ulang nilai $\alpha$ apabila butir ke-$j$ dikeluarkan dari konstruk.

**Kriteria Keputusan:**
- $\alpha \ge 0,600$ (merujuk Nunnally & Ghozali): Konstruk dinyatakan **Reliabel**.

---

## 5. Uji Asumsi Klasik Regresi Linier

Sebelum uji regresi linier berganda, model harus memenuhi asumsi Gauss-Markov:

### A. Uji Normalitas Residual
Normalitas diuji pada residual regresi unstandardized ($e_i = Y_i - \hat{Y}_i$) menggunakan uji **Kolmogorov-Smirnov (One-Sample K-S)**:
- $H_0$: Residual berdistribusi normal.
- Kriteria: Jika $\text{Asymp. Sig.} \ge 0,05$, maka residual terdistribusi secara **normal**.

### B. Uji Multikolinearitas
Menguji apakah ada korelasi linier yang tinggi antar variabel bebas. Untuk setiap prediktor $X_j$, dilakukan regresi tambahan (*auxiliary regression*) terhadap prediktor lainnya untuk memperoleh $R_j^2$:
- $\text{Tolerance} = 1 - R_j^2$
- $\text{VIF} = \frac{1}{\text{Tolerance}}$
- Kriteria: Bebas multikolinearitas jika $\text{Tolerance} > 0,10$ dan $\text{VIF} < 10,0$.

### C. Uji Heteroskedastisitas (Uji Glejser)
Menguji apakah varians residual konstan (homoskedastisitas). Dilakukan dengan meregresikan nilai mutlak residual $|e_i|$ terhadap seluruh variabel bebas:
$$|e_i| = \gamma_0 + \gamma_1 X_{1i} + \dots + \gamma_p X_{pi} + v_i$$
- Kriteria: Jika nilai signifikansi $p$-value untuk semua variabel bebas $\ge 0,05$, maka model terbebas dari masalah heteroskedastisitas (**homoskedastisitas terpenuhi**).

---

## 6. Regresi Linier Berganda (OLS)

Model regresi populasi:
$$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \dots + \beta_p X_p + e$$

Diestimasi dengan metode kuadrat terkecil (*Ordinary Least Squares*):
$$\mathbf{B} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{Y}$$

### A. Uji Parsial (Uji t)
Menguji pengaruh masing-masing variabel bebas secara individual terhadap variabel terikat:
$$t_j = \frac{B_j}{SE(B_j)}, \quad df = N - p - 1$$
- Kriteria: Signifikan jika $p\text{-value} < 0,05$.

### B. Uji Simultan (Uji F)
Menguji kelayakan model secara keseluruhan:
$$F = \frac{MS_{\text{reg}}}{MS_{\text{res}}} = \frac{SS_{\text{reg}} / p}{SS_{\text{res}} / (N - p - 1)}$$
- Nilai kritis $F_{\text{tabel}} = F_{\alpha, p, N - p - 1}$.
- Kriteria: Model signifikan dan fit jika $F_{\text{hitung}} > F_{\text{tabel}}$ dan $p\text{-value} < 0,05$.

### C. Koefisien Determinasi ($R^2$ dan Adjusted $R^2$)
$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$$
$$\text{Adjusted } R^2 = 1 - \frac{(1 - R^2)(N - 1)}{N - p - 1}$$
Menggambarkan persentase variasi variabel terikat yang dapat dijelaskan oleh variasi variabel-variabel bebas.
