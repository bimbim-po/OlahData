# Spesifikasi Metodologi & Verifikasi Mesin Statistik OlahData
**Standar Skripsi Kuantitatif S1 Indonesia (Ghozali, Sugiyono, Hair et al.)**  
*Versi Mesin: 1.0.0 — Terverifikasi Penuh dengan Tes Emas (Golden Test Suite)*

---

## 1. Tabel Verifikasi Keluaran Mesin vs Pustaka Acuan Independen

Seluruh angka dihitung oleh mesin Python deterministik (`scipy`, `statsmodels`, `pingouin`, `pandas`) dan diverifikasi terhadap nilai acuan independen pada berkas `fixtures/hasil_acuan_bersih.json` ($N = 100$).

| Modul Analisis | Parameter / Metrik | Nilai Acuan Independen | Keluaran Mesin OlahData | Selisih Mutlak ($\Delta$) | Toleransi Maksimum | Status CI |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Validitas** | $r_{\text{hitung}}$ Butir KL1 | $0,5510443$ | $0,5510443$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $r_{\text{hitung}}$ Butir KL5 (Lemah) | $-0,0470535$ | $-0,0470535$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Gugur)** |
| | $r_{\text{hitung}}$ Butir LP5 (Negatif Reversal) | $0,6422791$ | $0,6422791$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $r_{\text{tabel}}$ ($df = 98, \alpha = 0,05$) | $0,1966144$ | $0,1966144$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| **Reliabilitas** | Cronbach's $\alpha$ Awal (KL: 5 butir) | $0,7070104$ | $0,7070104$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Cronbach's $\alpha$ Akhir (KL: 4 butir valid) | $0,7683937$ | $0,7683937$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Cronbach's $\alpha$ Akhir (KP: 5 butir) | $0,7676722$ | $0,7676722$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Cronbach's $\alpha$ Akhir (LP: 5 butir) | $0,8256411$ | $0,8256411$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| **Deskriptif** | Mean Skor Konstruk KL | $3,7400000$ | $3,7400000$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Tinggi)** |
| | Mean Skor Konstruk KP | $3,6440000$ | $3,6440000$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Tinggi)** |
| | Mean Skor Konstruk LP | $3,8840000$ | $3,8840000$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Tinggi)** |
| **Regresi OLS** | Koefisien $R$ Berganda | $0,5953049$ | $0,5953049$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Koefisien Determinasi ($R^2$) | $0,3543879$ | $0,3543879$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Adjusted $R^2$ | $0,3410762$ | $0,3410762$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $F_{\text{hitung}}$ Simultan | $26,6213713$ | $26,6213713$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $F_{\text{tabel}}$ ($df_1 = 2, df_2 = 97$) | $3,0901867$ | $3,0901867$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Konstanta $B_0$ | $0,8542381$ | $0,8542381$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Koefisien $B$ (KL) | $0,4575806$ | $0,4575806$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Koefisien $B$ (KP) | $0,3617758$ | $0,3617758$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Standardized $\beta$ (KL) | $0,4196167$ | $0,4196167$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Standardized $\beta$ (KP) | $0,2772599$ | $0,2772599$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $t_{\text{hitung}}$ (KL) | $4,5805562$ | $4,5805562$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $t_{\text{hitung}}$ (KP) | $3,0265691$ | $3,0265691$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | $t_{\text{tabel}}$ ($df = 97, \alpha = 0,05$) | $1,9847231$ | $1,9847231$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| **Normalitas** | Lilliefors $D$ (Residual) | $0,0563451$ | $0,0563451$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Lilliefors $p$-value | $0,5784112$ | $0,5784112$ | $< 10^{-6}$ | $1 \times 10^{-3}$ | **LOLOS (Normal)** |
| | Shapiro-Wilk $W$ (Residual) | $0,9916664$ | $0,9916664$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Shapiro-Wilk $p$-value | $0,7821648$ | $0,7821648$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Normal)** |
| **Multikolinearitas**| Tolerance KL & KP | $0,8284534$ | $0,8284534$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | VIF KL & KP | $1,2070685$ | $1,2070685$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Bebas)** |
| **Heteroskedastisitas**| Glejser $t_{\text{hitung}}$ (KL) | $-0,6985449$ | $-0,6985449$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Glejser $p$-value (KL) | $0,4865239$ | $0,4865239$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Homogen)** |
| | Breusch-Pagan LM Stat | $0,8216394$ | $0,8216394$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Breusch-Pagan $p$-value | $0,6631046$ | $0,6631046$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS (Homogen)** |
| **Uji Beda 2 Kelompok**| Levene Stat (Jenis Kelamin) | $0,0067451$ | $0,0067451$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Independent $t$ Stat | $0,4901323$ | $0,4901323$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Mann-Whitney $U$ Stat | $1202,5000$ | $1202,5000$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Cohen's $d$ (Pooled SD) | $0,0980265$ | $0,0980265$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| **Uji Beda 3+ Kelompok**| One-Way ANOVA $F$ | $0,7236541$ | $0,7236541$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Kruskal-Wallis $H$ | $1,3489231$ | $1,3489231$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| **Chi-Kuadrat** | Pearson $\chi^2$ (2x2) | $0,3673067$ | $0,3673067$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |
| | Fisher's Exact $p$-value | $0,6886361$ | $0,6886361$ | $< 10^{-12}$ | $1 \times 10^{-6}$ | **LOLOS** |

---

## 2. Landasan Rumus Matematika & Statistika (LaTeX)

### 2.1 Pembalikan Butir Berkebalikan (Negative Item Reversal)
Untuk butir kuesioner bernada negatif (unfavorable), nilai dibalik sebelum agregasi skor atau pengujian validitas:
$$x_{\text{rev}} = \text{skala}_{\max} + \text{skala}_{\min} - x$$
Pada skala Likert 1–5: $x_{\text{rev}} = 5 + 1 - x = 6 - x$.

### 2.2 Skor Konstruk & Kategorisasi Likert
Skor komposit konstruk dihitung dari rata-rata butir valid untuk mempertahankan rentang interpretasi 1–5:
$$S_c = \frac{1}{k_{\text{valid}}} \sum_{i=1}^{k_{\text{valid}}} x_i$$
Panjang kelas interval kategorisasi dihitung dengan rumus Sturges / rentang berjarak sama:
$$I = \frac{\text{skala}_{\max} - \text{skala}_{\min}}{K} = \frac{5 - 1}{5} = 0,80$$
Kategori Skor Rata-rata Likert 1–5:
- $1,00 \le \bar{x} \le 1,80$: **Sangat Rendah**
- $1,81 \le \bar{x} \le 2,60$: **Rendah**
- $2,61 \le \bar{x} \le 3,40$: **Sedang**
- $3,41 \le \bar{x} \le 4,20$: **Tinggi**
- $4,21 \le \bar{x} \le 5,00$: **Sangat Tinggi**

### 2.3 Uji Validitas Butir (Corrected Item-Total Correlation)
Korelasi butir terkoreksi mengkorelasikan skor butir $x_i$ dengan jumlah butir lain dalam konstruk yang sama ($T_{-i} = \sum_{j \neq i} x_j$):
$$r_{i, T_{-i}} = \frac{\sum (x_i - \bar{x}_i)(T_{-i} - \bar{T}_{-i})}{\sqrt{\sum (x_i - \bar{x}_i)^2 \sum (T_{-i} - \bar{T}_{-i})^2}}$$
Nilai kritis $r_{\text{tabel}}$ dihitung deterministik dari distribusi $t$ Student dengan derajat kebebasan $df = N - 2$ pada taraf signifikansi dua arah $\alpha = 0,05$:
$$t_{\text{kritis}} = t_{\alpha/2, \, N-2}, \quad r_{\text{tabel}} = \frac{t_{\text{kritis}}}{\sqrt{df + t_{\text{kritis}}^2}}$$
Kriteria: Butir dinyatakan **Valid** jika $r_{i, T_{-i}} > r_{\text{tabel}}$ dan $p < 0,05$.

### 2.4 Uji Reliabilitas Instrumen (Cronbach's Alpha)
Koefisien reliabilitas konsistensi internal:
$$\alpha = \frac{k}{k - 1} \left( 1 - \frac{\sum_{i=1}^k s_i^2}{s_T^2} \right)$$
di mana:
- $k$ adalah jumlah butir instrumen,
- $s_i^2 = \frac{1}{n-1}\sum (x_{ij} - \bar{x}_i)^2$ adalah varians butir ke-$i$,
- $s_T^2 = \frac{1}{n-1}\sum (T_j - \bar{T})^2$ adalah varians total skor konstruk.

Ambang batas standar skripsi: $\alpha \ge 0,70$ (opsional $\alpha \ge 0,60$ untuk penelitian eksploratif). Dihitung dua tahap:
1. **$\alpha$ Awal**: mencakup seluruh butir yang diujikan.
2. **$\alpha$ Akhir**: dihitung ulang setelah butir yang tidak valid (gugur) dikeluarkan.

### 2.5 Regresi Linier Berganda (OLS)
Model empiris:
$$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \dots + \beta_k X_k + e$$
Estimasi vektor parameter OLS:
$$\hat{\beta} = (X^T X)^{-1} X^T Y$$
Varians-kovarians koefisien:
$$\text{Cov}(\hat{\beta}) = MS_{\text{res}} (X^T X)^{-1}, \quad MS_{\text{res}} = \frac{SS_{\text{res}}}{n - k - 1}$$
Koefisien Beta Terstandar (Standardized Beta) dari regresi skor-$z$:
$$\beta_j^* = \hat{\beta}_j \times \frac{s_{X_j}}{s_Y}$$
Uji parsial (Uji $t$):
$$t_j = \frac{\hat{\beta}_j}{SE(\hat{\beta}_j)}, \quad df = n - k - 1$$
Uji simultan (Uji $F$):
$$F = \frac{MS_{\text{reg}}}{MS_{\text{res}}} = \frac{SS_{\text{reg}} / k}{SS_{\text{res}} / (n - k - 1)}$$
Koefisien Determinasi ($R^2$) dan Adjusted $R^2$:
$$R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}, \quad \text{Adjusted } R^2 = 1 - \frac{(1 - R^2)(n - 1)}{n - k - 1}$$
Identitas aljabar wajib terpenuhi:
$$F \equiv \frac{R^2 / k}{(1 - R^2) / (n - k - 1)}$$

### 2.6 Uji Asumsi Klasik
1. **Normalitas Residual**:
   - Lilliefors Kolmogorov-Smirnov:
     $$D = \max_e |F_n(e) - \Phi(e; 0, s_e)|$$
   - Shapiro-Wilk:
     $$W = \frac{\left( \sum_{i=1}^n a_i e_{(i)} \right)^2}{\sum_{i=1}^n (e_i - \bar{e})^2}$$
   Kriteria: Residual berdistribusi normal bila $p \ge 0,05$.
2. **Multikolinearitas**:
   Regresi pembantu $X_j$ terhadap seluruh prediktor lainnya menghasilkan $R_j^2$:
   $$\text{Tolerance} = 1 - R_j^2, \quad \text{VIF} = \frac{1}{\text{Tolerance}}$$
   Kriteria: Model bebas multikolinearitas bila $\text{Tolerance} > 0,10$ dan $\text{VIF} < 10,0$.
3. **Heteroskedastisitas (Uji Glejser & Breusch-Pagan)**:
   - Glejser: meregresikan nilai mutlak residual $|e_i|$ terhadap seluruh prediktor:
     $$|e_i| = \gamma_0 + \sum_{j=1}^k \gamma_j X_{ij} + v_i$$
     Kriteria: Homoskedastisitas terpenuhi bila seluruh $p$-value uji $t$ parameter $\gamma_j > 0,05$.
   - Breusch-Pagan:
     $$LM = n R^2_{e^2} \sim \chi^2(k)$$
4. **Autokorelasi (Durbin-Watson)**:
   $$d = \frac{\sum_{t=2}^n (e_t - e_{t-1})^2}{\sum_{t=1}^n e_t^2}$$
   *Catatan Metodologis*: Durbin-Watson hanya relevan untuk data runtun waktu (time series), dan dinonaktifkan secara bawaan untuk survei cross-sectional.

### 2.7 Uji Komparatif & Asosiasi
1. **Uji Beda 2 Kelompok**:
   - Homogenitas Varians Levene (berpusat median / Brown-Forsythe):
     $$W = \frac{(N - k)}{(k - 1)} \frac{\sum n_i (\bar{z}_{i\cdot} - \bar{z}_{\cdot\cdot})^2}{\sum \sum (z_{ij} - \bar{z}_{i\cdot})^2}, \quad z_{ij} = |y_{ij} - \tilde{y}_i|$$
   - Independent Samples $t$-test (bila varians homogen, $p_{\text{Levene}} \ge 0,05$):
     $$t = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}} \sqrt{\frac{1}{n_1} + \frac{1}{n_2}}}, \quad s_{\text{pooled}} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}$$
   - Welch's $t$-test (bila varians heterogen, $p_{\text{Levene}} < 0,05$).
   - Mann-Whitney $U$ (pendamping non-parametrik).
   - Cohen's $d$:
     $$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{\text{pooled}}}$$
2. **Uji Beda 3+ Kelompok**:
   - One-Way ANOVA: $F = \frac{MS_{\text{between}}}{MS_{\text{within}}}$.
   - Post-Hoc Tukey HSD (bila ANOVA signifikan):
     $$q = \frac{\bar{x}_i - \bar{x}_j}{\sqrt{MS_{\text{within}} / n}}$$
   - Kruskal-Wallis $H$ (pendamping non-parametrik).
3. **Uji Asosiasi Chi-Kuadrat**:
   $$\chi^2 = \sum_{i=1}^r \sum_{j=1}^c \frac{(O_{ij} - E_{ij})^2}{E_{ij}}, \quad E_{ij} = \frac{R_i \times C_j}{N}$$
   - Koreksi Kontinuitas Yates (tabel $2 \times 2$):
     $$\chi_{\text{Yates}}^2 = \sum \frac{(|O_{ij} - E_{ij}| - 0,5)^2}{E_{ij}}$$
   - Fisher's Exact Test:
     $$p = \frac{(a + b)! (c + d)! (a + c)! (b + d)!}{a! \, b! \, c! \, d! \, N!}$$
   - Evaluasi Aturan Cochran: Jika lebih dari 20% sel memiliki $E_{ij} < 5$, sistem menerbitkan peringatan akademik dan merekomendasikan Fisher's Exact Test untuk tabel $2 \times 2$.

### 2.8 Kualitas Data & Deteksi Pencilan
1. **Pencilan Univariat**: $|z| > 3,0$ di mana $z_i = \frac{x_i - \bar{x}}{s}$.
2. **Pencilan Multivariat**: Jarak Mahalanobis $D_i^2 = (x_i - \bar{x})^T S^{-1} (x_i - \bar{x}) \sim \chi^2(df = p)$. Responden ditandai pencilan bila $p < 0,001$.

---

## 3. Catatan Dosen Penguji (Justifikasi Metodologis Sidang Skripsi)

Jika mahasiswa ditanya oleh Dosen Penguji saat sidang mengenai pilihan metode yang digunakan OlahData, berikut argumentasi ilmiah pembelaannya:

### 1. Mengapa menggunakan Lilliefors, bukan Kolmogorov-Smirnov standar?
> **Jawaban untuk Penguji:**  
> "Uji Kolmogorov-Smirnov bawaan (misal `scipy.stats.kstest`) mensyaratkan parameter distribusi normal ($\mu$ dan $\sigma$) telah diketahui secara independen sebelum data diambil. Pada regresi skripsi, nilai $\mu$ residual (selalu 0) dan varians residual $s_e^2$ diestimasi langsung dari sampel data yang sama. Mengabaikan estimasi sampel membuat nilai $p$ menjadi terlalu konservatif/longgar (mudah menyatakan normal padahal tidak). Koreksi Lilliefors menyesuaikan tabel distribusi empiris K-S khusus untuk parameter sampel terestimasi, sesuai rujukan standar Ghozali (2018) dan SPSS One-Sample K-S."

### 2. Mengapa menggunakan Corrected Item-Total Correlation untuk validitas butir?
> **Jawaban untuk Penguji:**  
> "Korelasi bivariate Pearson sederhana antara butir dengan total skor mengandung bias *part-whole correlation* (autokorelasi palsu), karena butir yang sedang diuji ikut menjumlahkan dirinya sendiri ke dalam total skor. Hal ini menyebabkan nilai $r_{\text{hitung}}$ terinflasi lebih tinggi dari sebenarnya. Dengan *Corrected Item-Total Correlation*, butir ke-$i$ dikorelasikan hanya dengan jumlah butir-butir *selain* butir ke-$i$ ($T - x_i$), sehingga mencerminkan konsistensi konvergen butir yang murni tanpa bias autokorelasi."

### 3. Mengapa uji Levene menggunakan pusat Median (Brown-Forsythe)?
> **Jawaban untuk Penguji:**  
> "Uji Levene klasik berbasis rata-rata (*mean*) sangat sensitif terhadap pencilan (*outliers*) dan pelanggaran normalitas ringan. Menggunakan median sebagai titik pusat (*center='median'*) menghasilkan uji Brown-Forsythe yang jauh lebih tangguh (*robust*) terhadap kurtosis dan kemencengan data kuesioner tanpa mengorbankan *statistical power*."

### 4. Mengapa konstanta regresi tidak dijadikan hipotesis penelitian?
> **Jawaban untuk Penguji:**  
> "Konstanta ($\beta_0$) merepresentasikan nilai prediksi $Y$ saat seluruh prediktor $X_1, X_2, \dots, X_k = 0$. Dalam kuesioner skala Likert 1–5, nilai responden 0 berada di luar rentang pengukuran empiris (ekstrapolasi matematis semata). Hipotesis penelitian skripsi secara substansial berfokus pada pengaruh variabel ($H_1, H_2$). Oleh karena itu, OlahData tetap menampilkan signifikansi $p$ konstanta secara jujur, namun tidak menjadikannya kesimpulan hipotesis penelitian."

---

## 4. Panduan Membaca Keluaran untuk Mahasiswa

### Langkah 1: Memeriksa Kualitas Data di Data Doctor
Sebelum masuk ke uji hipotesis, pastikan dataset bebas dari:
- Sel kosong (missing values),
- Nilai salah ketik di luar 1–5 (misal angka 7 atau 0),
- Responden unengaged (menjawab 5 semua atau 1 semua di seluruh kuesioner).
Setiap pengecualian responden di OlahData disimpan sebagai *dataset turunan* tanpa mengubah data mentah asli Anda.

### Langkah 2: Uji Validitas & Reliabilitas (Bab 4 Bagian 4.1)
1. **Tabel Validitas**: Perhatikan kolom $r_{\text{hitung}}$ dan $r_{\text{tabel}}$.
   - Jika $r_{\text{hitung}} > r_{\text{tabel}}$ dan $p < 0,05 \implies$ Butir dinyatakan **Valid**.
   - Jika $r_{\text{hitung}} \le r_{\text{tabel}} \implies$ Butir dinyatakan **Gugur (Tidak Valid)**. Keluarkan butir gugur dari perhitungan skor konstruk.
2. **Tabel Reliabilitas**: Perhatikan kolom *Cronbach's Alpha Akhir*.
   - Nilai $\alpha \ge 0,70$ menunjukkan kuesioner Anda sangat andal dan konsisten.

### Langkah 3: Uji Asumsi Klasik Regresi (Bab 4 Bagian 4.2)
1. **Normalitas**: Nilai Sig. Lilliefors atau Shapiro-Wilk $> 0,05$ berarti residual berdistribusi normal (lolos asumsi).
2. **Multikolinearitas**: Nilai Tolerance $> 0,10$ dan VIF $< 10,0$ berarti tidak ada tumpang-tindih antar variabel bebas.
3. **Heteroskedastisitas**: Pada uji Glejser, nilai Sig. seluruh variabel $> 0,05$ berarti varians residual seragam (bebas heteroskedastisitas).

### Langkah 4: Uji Hipotesis Regresi (Bab 4 Bagian 4.3)
1. **Uji Parsial (Uji $t$)**:
   - Bandingkan $t_{\text{hitung}}$ dengan $t_{\text{tabel}}$, atau lihat nilai Sig. ($p$).
   - Jika $p < 0,05$ dan $t_{\text{hitung}} > t_{\text{tabel}} \implies$ **$H_0$ ditolak, hipotesis penelitian didukung** (variabel $X$ berpengaruh signifikan terhadap $Y$).
2. **Uji Simultan (Uji $F$)**:
   - Jika $p_{\text{simultan}} < 0,05 \implies$ Semua variabel bebas secara bersama-sama berpengaruh signifikan terhadap variabel terikat.
3. **Koefisien Determinasi ($R^2$)**:
   - Nilai $R^2$ menunjukkan persentase variasi variabel terikat yang dapat dijelaskan oleh variabel bebas dalam model Anda.
