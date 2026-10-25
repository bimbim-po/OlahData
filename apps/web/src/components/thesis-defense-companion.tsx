'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';

export type DefenseTestKey =
  | 'validity'
  | 'reliability'
  | 'normality'
  | 'multicollinearity'
  | 'heteroscedasticity'
  | 'regression'
  | 'paired-ttest'
  | 'ngain'
  | 'independent-ttest'
  | 'oneway-anova'
  | 'nonparametric'
  | 'chisquare'
  | 'odds-ratio'
  | 'mediation'
  | 'moderation';

interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  citation: {
    author: string;
    title: string;
    year: string;
    note: string;
  };
}

interface ThesisDefenseCompanionProps {
  testType: DefenseTestKey;
  dataMetrics?: {
    n?: number;
    df?: number;
    rTabel?: number;
    cronbachAlpha?: number;
    ksSig?: number;
    maxVif?: number;
    minTolerance?: number;
    glejserSigMin?: number;
    fHitung?: number;
    fTabel?: number;
    rSquare?: number;
    tHitung?: number;
    tTabel?: number;
    leveneSig?: number;
    nGainScore?: number;
    nGainPercent?: number;
    hakeCategory?: string;
    meltzerCategory?: string;
    chosenVar?: string;
    chiSquareValue?: number;
    chiSquareDf?: number;
    chiSquareSig?: number;
    fisherSig?: number;
    oddsRatio?: number;
    orCiLower?: number;
    orCiUpper?: number;
    minExpectedCount?: number;
    cellsLessThan5Count?: number;
    cellsLessThan5Percent?: number;
    sobelZ?: number;
    sobelP?: number;
    indirectEffect?: number;
    directEffect?: number;
    totalEffect?: number;
    vafRatio?: number;
    mediationType?: string;
    deltaR2?: number;
    fChange?: number;
    interactionP?: number;
    moderatorType?: string;
    moderationDirection?: string;
  };
  className?: string;
}

export function ThesisDefenseCompanion({
  testType,
  dataMetrics = {},
  className,
}: ThesisDefenseCompanionProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    n = 60,
    df = 58,
    rTabel = 0.254,
    cronbachAlpha = 0.842,
    ksSig = 0.2,
    maxVif = 1.45,
    minTolerance = 0.69,
    glejserSigMin = 0.312,
    fHitung = 14.85,
    fTabel = 3.15,
    rSquare = 0.485,
    tHitung = 3.42,
    tTabel = 2.001,
    leveneSig = 0.428,
    nGainScore = 0.68,
    nGainPercent = 68.2,
    hakeCategory = 'Sedang',
    meltzerCategory = 'Cukup Efektif',
    chosenVar = 'Variabel Terkait',
    chiSquareValue = 18.42,
    chiSquareDf = 1,
    chiSquareSig = 0.0001,
    fisherSig = 0.0001,
    oddsRatio = 7.39,
    orCiLower = 2.85,
    orCiUpper = 19.15,
    minExpectedCount = 23.5,
    cellsLessThan5Count = 0,
    cellsLessThan5Percent = 0,
    sobelZ = 2.934,
    sobelP = 0.003,
    indirectEffect = 0.499,
    directEffect = 0.489,
    totalEffect = 0.988,
    vafRatio = 50.5,
    mediationType = 'Partial Mediation',
    deltaR2 = 0.0467,
    fChange = 8.45,
    interactionP = 0.004,
    moderatorType = 'Quasi Moderator',
    moderationDirection = 'Memperkuat',
  } = dataMetrics;

  const getQuestions = (): QuestionItem[] => {
    switch (testType) {
      case 'validity':
        return [
          {
            id: 'val-1',
            question: 'Mengapa menggunakan r-tabel dengan derajat kebebasan (df) = N - 2?',
            answer: `Izin menjawab Bapak/Ibu Penguji, dalam uji validitas Product Moment Pearson, derajat kebebasan ditentukan dengan rumus df = N - 2 karena terdapat 2 parameter estimasi rata-rata yang dihitung dari sampel (${n} responden, sehingga df = ${n - 2}). Pada taraf signifikansi 5% (uji dua arah), diperoleh nilai r-tabel sebesar ${rTabel.toFixed(3)}. Butir dinyatakan valid karena nilai r-hitung seluruh indikator lebih besar dari r-tabel.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Metode Penelitian Kuantitatif, Kualitatif, dan R&D',
              year: '2019',
              note: 'Penerbit Alfabeta Bandung, Bab Uji Validitas Instrumen, Hal. 178-182.',
            },
          },
          {
            id: 'val-2',
            question: 'Bagaimana jika ada butir pernyataan yang gugur/tidak valid? Mengapa tidak dipakai?',
            answer: `Jika ditemukan butir tidak valid (r-hitung < ${rTabel.toFixed(3)} atau korelasi negatif), secara metodologis butir tersebut harus didrop/dieliminasi dari analisis lanjutan dan tidak diikutsertakan dalam pembentukan skor komposit variabel. Hal ini bertujuan agar instrumen benar-benar murni mengukur konstruk teoritis yang diteliti tanpa bias butir yang membingungkan responden.`,
            citation: {
              author: 'Prof. Dr. Suharsimi Arikunto',
              title: 'Prosedur Penelitian Suatu Pendekatan Praktik',
              year: '2010',
              note: 'Rineka Cipta Jakarta, Bab Pengujian Validitas dan Gugurnya Butir Kuesioner.',
            },
          },
        ];

      case 'reliability':
        return [
          {
            id: 'rel-1',
            question: "Mengapa memilih rumus Cronbach's Alpha dan menetapkan standar minimal 0,70?",
            answer: `Izin menjawab Bapak/Ibu, Cronbach's Alpha digunakan karena kuesioner penelitian ini menggunakan skala bertingkat (Skala Likert 1-5), bukan skala dikotomi benar/salah (yang memakai KR-20). Berdasarkan kriteria Prof. Imam Ghozali dan Nunnally, nilai Cronbach's Alpha > 0,70 (pada data kami diperoleh ${cronbachAlpha.toFixed(3)}) menunjukkan konsistensi internal yang sangat baik dan reliabel untuk pengujian hipotesis.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Universitas Diponegoro, Bab Uji Reliabilitas, Hal. 45-48.',
            },
          },
        ];

      case 'normality':
        return [
          {
            id: 'norm-1',
            question: 'Apakah yang diuji normalitas itu data mentah variabel atau nilai residual regresi?',
            answer: `Izin menjelaskan Bapak/Ibu Penguji, yang wajib berdistribusi normal dalam uji asumsi klasik model regresi OLS adalah nilai residualnya (unstandardized residual), bukan data variabel mentahnya secara individual. Pada penelitian kami, uji One-Sample Kolmogorov-Smirnov menghasilkan nilai Asymp. Sig. (2-tailed) = ${ksSig.toFixed(3)} (> 0,05), sehingga residual terbukti berdistribusi normal secara meyakinkan.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Uji Asumsi Klasik Normalitas Residual, Hal. 161-163.',
            },
          },
        ];

      case 'multicollinearity':
        return [
          {
            id: 'multi-1',
            question: 'Bagaimana membuktikan tidak ada hubungan linear antar variabel bebas (multikolinearitas)?',
            answer: `Kami memeriksa nilai Tolerance dan VIF (Variance Inflation Factor). Model regresi bebas dari masalah multikolinearitas jika nilai Tolerance > 0,10 dan VIF < 10,0. Pada model kami, nilai VIF tertinggi adalah ${maxVif.toFixed(2)} (< 10) dan Tolerance terendah adalah ${minTolerance.toFixed(2)} (> 0,10), membuktikan tidak terdapat korelasi berlebih antar variabel independen.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Uji Multikolinearitas, Hal. 107-108.',
            },
          },
        ];

      case 'heteroscedasticity':
        return [
          {
            id: 'hetero-1',
            question: 'Mengapa memilih Uji Glejser dan apa kriterianya?',
            answer: `Uji Glejser meregresikan nilai mutlak residual (|Abs_Res|) terhadap seluruh variabel independen. Jika nilai signifikansi (Sig.) seluruh variabel bebas > 0,05 (pada penelitian kami Sig. terendah = ${glejserSigMin.toFixed(3)}), maka model regresi dinyatakan homoskedastisitas (bebas dari gangguan varians residual yang tidak konstan).`,
            citation: {
              author: 'Damodar N. Gujarati & Dawn C. Porter',
              title: 'Basic Econometrics (5th Edition)',
              year: '2009',
              note: 'McGraw-Hill, Bab Heteroscedasticity: What Happens if Error Variance is Nonconstant.',
            },
          },
        ];

      case 'regression':
        return [
          {
            id: 'reg-1',
            question: 'Apa perbedaan mendasar antara interpretasi Uji F simultan dan Uji t parsial?',
            answer: `Uji F menguji pengaruh seluruh variabel bebas secara bersama-sama/simultan terhadap variabel terikat (pada model kami diperoleh F-hitung = ${fHitung.toFixed(2)} > F-tabel = ${fTabel.toFixed(2)}, Sig. < 0,05, sehingga model fit dan signifikan). Sedangkan Uji t menguji signifikansi pengaruh masing-masing variabel bebas secara individual (parsial) dengan membandingkan t-hitung dengan t-tabel (${tTabel.toFixed(3)}). Nilai R² sebesar ${(rSquare * 100).toFixed(1)}% mencerminkan persentase variasi yang mampu dijelaskan oleh model.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Statistika untuk Penelitian',
              year: '2018',
              note: 'Penerbit Alfabeta Bandung, Bab Regresi Ganda dan Pengujian Hipotesis, Hal. 260-275.',
            },
          },
        ];

      case 'paired-ttest':
        return [
          {
            id: 'pair-1',
            question: 'Kapan tepatnya Paired Sample t-Test digunakan dalam penelitian eksperimen/pra-pasca?',
            answer: `Paired Sample t-Test digunakan ketika satu kelompok sampel yang sama diukur sebanyak dua kali (Pre-test dan Post-test) untuk melihat efektivitas suatu perlakuan/intervensi. Karena subjeknya berpasangan, pengujian berfokus pada rata-rata selisih skor (mean difference). Pada uji kami diperoleh t-hitung = ${tHitung.toFixed(3)} dengan Sig. < 0,05, yang membuktikan terdapat perbedaan peningkatan hasil belajar yang signifikan setelah perlakuan.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Metode Penelitian Pendidikan (Kuantitatif, Kualitatif, Kombinasi, R&D)',
              year: '2020',
              note: 'Penerbit Alfabeta Bandung, Bab Desain Eksperimen One Group Pretest-Posttest.',
            },
          },
        ];

      case 'ngain':
        return [
          {
            id: 'ngain-1',
            question: 'Mengapa menggunakan rumus N-Gain Score ternormalisasi (Hake 1998) daripada selisih skor biasa?',
            answer: `Penggunaan selisih skor mentah (Post - Pre) memiliki kelemahan bias 'ceiling effect', di mana siswa dengan skor awal tinggi sulit menunjukkan selisih besar. Rumus N-Gain Richard R. Hake membagi selisih dengan potensi peningkatan maksimal yang mungkin diraih (Max - Pre). Rata-rata N-Gain pada data kami adalah ${nGainScore.toFixed(2)} (${nGainPercent.toFixed(1)}%), yang masuk dalam kategori '${hakeCategory}' menurut kriteria Hake dan kualifikasi '${meltzerCategory}' menurut Meltzer (2002).`,
            citation: {
              author: 'Richard R. Hake & David E. Meltzer',
              title: 'Interactive-engagement vs traditional methods (Am. J. Phys) & The relationship between mathematics preparation',
              year: '1998 / 2002',
              note: 'American Journal of Physics 66(1), Hal. 64-74 dan Addendum Kategori Efektivitas.',
            },
          },
        ];

      case 'independent-ttest':
        return [
          {
            id: 'indep-1',
            question: "Mengapa harus memeriksa Uji Homogenitas Levene terlebih dahulu sebelum membaca baris t-hitung?",
            answer: `Izin menjelaskan Bapak/Ibu, rumus Uji-t dua sampel independen mensyaratkan asumsi kesamaan varians. Jika Uji Levene menghasilkan nilai Sig. > 0,05 (pada data kami Sig. = ${leveneSig.toFixed(3)}), maka varians kedua kelompok homogen sehingga baris yang dibaca adalah 'Equal variances assumed'. Sebaliknya jika Sig. ≤ 0,05, maka digunakan koreksi derajat kebebasan Welch-Satterthwaite pada baris 'Equal variances not assumed'.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Independent Sample t-Test dan Uji Homogenitas Varians.',
            },
          },
        ];

      case 'oneway-anova':
        return [
          {
            id: 'anova-1',
            question: 'Kapan ANOVA satu arah digunakan dan mengapa dilanjutkan dengan uji Post-Hoc Tukey HSD?',
            answer: `One-Way ANOVA digunakan untuk membandingkan rata-rata dari tiga kelompok perlakuan atau lebih secara simultan. Jika nilai F-hitung signifikan (Sig. < 0,05), ANOVA hanya memberitahukan bahwa minimal ada satu pasang kelompok yang berbeda, tetapi tidak menyebutkan secara spesifik kelompok mana yang berbeda. Oleh karena itu, uji lanjut Post-Hoc Tukey HSD dilakukan untuk membandingkan kontras antar pasangan perlakuan secara presisi.`,
            citation: {
              author: 'Ronald E. Walpole, Raymond H. Myers, et al.',
              title: 'Probability & Statistics for Engineers & Scientists (9th Ed)',
              year: '2012',
              note: 'Pearson Education, Bab One-Way Analysis of Variance and Multiple Comparisons.',
            },
          },
        ];

      case 'nonparametric':
        return [
          {
            id: 'nonpar-1',
            question: 'Mengapa beralih ke uji non-parametrik (Mann-Whitney / Wilcoxon / Kruskal-Wallis)?',
            answer: `Uji parametrik seperti t-test dan ANOVA memerlukan asumsi bahwa data berdistribusi normal. Ketika data tidak memenuhi asumsi normalitas (Sig. < 0,05) dan jumlah sampel terbatas, uji non-parametrik berbasis pemeringkatan (ranking) menjadi metode resmi yang sah secara metodologis karena bebas dari asumsi distribusi populasi tertentu (distribution-free test).`,
            citation: {
              author: 'W.J. Conover & Prof. Dr. Sugiyono',
              title: 'Practical Nonparametric Statistics & Statistika Nonparametris untuk Penelitian',
              year: '1999 / 2019',
              note: 'John Wiley & Sons / Alfabeta, Bab Uji Dua Sampel Independen & Berpasangan Non-parametrik.',
            },
          },
        ];

      case 'chisquare':
        return [
          {
            id: 'cs-1',
            question: 'Kapan membaca nilai Pearson Chi-Square, Continuity Correction, atau Fisher\'s Exact Test?',
            answer: `Izin menjawab Bapak/Ibu Penguji, berdasarkan kaidah uji Cochran dan panduan Prof. Sopiyudin Dahlan, pemilihan baris uji pada tabel 2x2 didasarkan pada nilai frekuensi harapan (Expected Count). Pada data kami, nilai Expected Count terendah adalah ${minExpectedCount.toFixed(2)}${cellsLessThan5Count > 0 ? ` (ditemukan ${cellsLessThan5Count} sel atau ${cellsLessThan5Percent.toFixed(1)}% dengan E < 5)` : ' (tidak ada sel dengan E < 5)'}. Karena ${cellsLessThan5Count > 0 ? 'terdapat sel dengan E < 5, maka uji yang sahih dan wajib digunakan adalah Fisher\'s Exact Test' : 'semua sel memiliki E >= 5, maka baris Continuity Correction (Yates) atau Pearson Chi-Square dapat digunakan'}. Nilai Asymp. Sig. yang diperoleh adalah ${chiSquareSig < 0.001 ? '< 0,001' : chiSquareSig.toFixed(3)}, yang membuktikan ${chiSquareSig < 0.05 ? 'adanya hubungan yang signifikan secara statistik antara kedua variabel (p < 0,05)' : 'tidak ada hubungan signifikan antara kedua variabel (p > 0,05)'}.`,
            citation: {
              author: 'Dr. M. Sopiyudin Dahlan, M.Epid',
              title: 'Statistik untuk Kedokteran dan Kesehatan: Deskriptif, Bivariat, dan Multivariat',
              year: '2014',
              note: 'Penerbit Epidemiologi Indonesia Jakarta, Bab Analisis Komparatif Kategorik Tidak Berpasangan (Chi-Square & Fisher).',
            },
          },
          {
            id: 'cs-2',
            question: 'Mengapa uji Chi-Square memiliki syarat frekuensi harapan (Expected Count) tidak boleh kurang dari 5?',
            answer: `Distribusi Chi-Square merupakan distribusi kontinu teoritis yang dipakai untuk mengaproksimasi probabilitas multinomial diskret dari sel-sel tabel silang. Apabila frekuensi harapan (E) terlalu kecil (< 5), aproksimasi tersebut menjadi bias dan menghasilkan galat tipe I (nilai Chi-Square tampak terlalu besar). Oleh sebab itu, William G. Cochran (1954) menetapkan kaidah bahwa untuk tabel 2x2 tidak boleh ada nilai harapan < 5, dan jika dilanggar, pengujian harus beralih ke uji peluang hipergeometrik eksak (Fisher's Exact Test).`,
            citation: {
              author: 'William G. Cochran',
              title: 'Some Methods for Strengthening the Common Chi-Square Tests',
              year: '1954',
              note: 'Biometrics, Vol. 10 No. 4, Halaman 417-451.',
            },
          },
        ];

      case 'odds-ratio':
        return [
          {
            id: 'or-1',
            question: 'Bagaimana cara membaca nilai Odds Ratio (OR) dan Confidence Interval 95%?',
            answer: `Nilai Odds Ratio (OR) yang diperoleh adalah ${oddsRatio.toFixed(2)} dengan rentang 95% Confidence Interval antara ${orCiLower.toFixed(2)} hingga ${orCiUpper.toFixed(2)}. Artinya, kelompok terpapar memiliki kemungkinan (odds) sebesar ${oddsRatio.toFixed(2)} kali lebih besar untuk mengalami outcome dibandingkan kelompok yang tidak terpapar. Karena rentang interval keyakinan 95% ${orCiLower > 1.0 ? 'seluruhnya berada di atas angka 1 (tidak melintasi nilai nol efek OR=1)' : (orCiUpper < 1.0 ? 'seluruhnya berada di bawah angka 1' : 'mencakup angka 1')}, maka dapat disimpulkan bahwa variabel paparan ini secara statistik ${orCiLower > 1.0 ? 'terbukti merupakan faktor risiko yang bermakna' : (orCiUpper < 1.0 ? 'merupakan faktor protektif' : 'bukan merupakan faktor risiko yang signifikan')}.`,
            citation: {
              author: 'Prof. Dr. Bhisma Murti, dr., M.P.H., M.Sc., Ph.D.',
              title: 'Prinsip dan Metode Riset Epidemiologi (Edisi ke-5)',
              year: '2018',
              note: 'Program Pascasarjana Universitas Sebelas Maret Surakarta, Bab Ukuran Hubungan Epidemiologi (Odds Ratio & Relative Risk).',
            },
          },
          {
            id: 'or-2',
            question: 'Kapan mahasiswa harus menggunakan Odds Ratio (OR) dan kapan Relative Risk (RR)?',
            answer: `Izin menjelaskan Bapak/Ibu, Relative Risk (Risk Ratio / RR) hanya dapat diinterpretasikan secara sahih pada desain penelitian prospektif (Kohort atau Eksperimen Murni) karena peneliti mengetahui angka insidensi kumulatif populasi risiko secara riil. Sementara pada penelitian Retrospektif (Case-Control) maupun Potong Lintang (Cross-Sectional), ukuran asosiasi epidemiologi standar yang sah digunakan adalah Odds Ratio (OR).`,
            citation: {
              author: 'Kenneth J. Rothman, Sander Greenland, Timothy L. Lash',
              title: 'Modern Epidemiology (3rd Edition)',
              year: '2008',
              note: 'Lippincott Williams & Wilkins, Bab Measures of Effect and Association, Halaman 51-68.',
            },
          },
        ];

      case 'mediation':
        return [
          {
            id: 'med-1',
            question: 'Mengapa Anda menggunakan Uji Sobel untuk menguji efek mediasi dan apa kesimpulannya?',
            answer: `Izin menjawab Bapak/Ibu Dosen Penguji, Uji Sobel (Sobel Test) digunakan untuk menguji signifikansi formal pengaruh tidak langsung (indirect effect) variabel bebas ke variabel terikat melalui variabel mediasi. Dari hasil perhitungan, diperoleh nilai z-hitung Sobel sebesar ${sobelZ.toFixed(3)} dengan p-value = ${sobelP < 0.001 ? '< 0,001' : sobelP.toFixed(4)}. Karena nilai |z| > 1,96 dan p < 0,05, maka hipotesis mediasi diterima secara signifikan. Model ini tergolong '${mediationType}' dengan dekomposisi pengaruh tidak langsung sebesar ${indirectEffect.toFixed(3)} dan pengaruh total ${totalEffect.toFixed(3)}.`,
            citation: {
              author: 'Baron, R. M., & Kenny, D. A.',
              title: 'The moderator-mediator variable distinction in social psychological research',
              year: '1986',
              note: 'Journal of Personality and Social Psychology, 51(6), 1173-1182.',
            },
          },
          {
            id: 'med-2',
            question: 'Apa perbedaan antara Full Mediation (Mediasi Penuh) dan Partial Mediation (Mediasi Parsial)?',
            answer: `Izin menjelaskan Bapak/Ibu, Full Mediation terjadi apabila setelah variabel mediasi dimasukkan ke dalam model, pengaruh langsung variabel bebas ke terikat (koefisien c') menjadi tidak signifikan atau mendekati nol. Artinya pengaruh X ke Y sepenuhnya dialirkan melalui perantara variabel mediasi. Sedangkan Partial Mediation terjadi jika pengaruh langsung X ke Y tetap signifikan meskipun mediator disertakan, yang menunjukkan variabel mediasi menyerap sebagian pengaruh tetapi X masih tetap memiliki kontribusi langsung yang signifikan.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com., Ph.D., Ak.',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Universitas Diponegoro Semarang, Bab Analisis Jalur dan Uji Mediasi Sobel.',
            },
          },
          {
            id: 'med-3',
            question: 'Bagaimana cara menghitung dan menginterpretasikan Variance Accounted For (VAF) pada mediasi?',
            answer: `Izin menjelaskan, VAF mengukur seberapa besar porsi pengaruh tidak langsung relatif terhadap pengaruh total: VAF = (Indirect Effect / Total Effect) × 100%. Pada penelitian ini diperoleh VAF sebesar ${vafRatio.toFixed(1)}%. Menurut Hair et al. (2017), jika VAF > 80% maka terjadi Full Mediation, antara 20% - 80% membuktikan Partial Mediation, dan jika < 20% disimpulkan hampir tidak ada efek mediasi.`,
            citation: {
              author: 'Hair, J. F., Hult, G. T. M., Ringle, C. M., & Sarstedt, M.',
              title: 'A Primer on Partial Least Squares Structural Equation Modeling (PLS-SEM)',
              year: '2017',
              note: 'SAGE Publications, Bab Evaluation of Mediation Effects & VAF Interpretation.',
            },
          },
        ];

      case 'moderation':
        return [
          {
            id: 'mod-1',
            question: 'Mengapa Anda menggunakan metode Moderated Regression Analysis (MRA) untuk uji moderasi?',
            answer: `Izin menjawab Bapak/Ibu Dosen Penguji, Moderated Regression Analysis (MRA) atau regresi hierarkis bertingkat digunakan untuk membuktikan secara empiris apakah variabel moderasi memperkuat atau memperlemah hubungan prediktor. Model 1 mengestimasi efek utama (X dan Z), kemudian Model 2 menambahkan perkalian suku interaksi (X × Z). Hasil menunjukkan penambahan interaksi menghasilkan kenaikan koefisien determinasi Delta R² sebesar ${deltaR2.toFixed(4)} dengan F-change ${fChange.toFixed(3)} (p = ${interactionP < 0.001 ? '< 0,001' : interactionP.toFixed(4)}), yang membuktikan peran moderasi secara signifikan.`,
            citation: {
              author: 'Sharma, S., Durand, R. M., & Gur-Arie, O.',
              title: 'Identification and analysis of moderator variables',
              year: '1981',
              note: 'Journal of Marketing Research, 18(3), 291-300.',
            },
          },
          {
            id: 'mod-2',
            question: 'Bagaimana Anda mengklasifikasikan tipe variabel moderasi (Pure vs Quasi Moderator)?',
            answer: `Izin menjelaskan, menurut klasifikasi Sharma et al. (1981) dan Prof. Imam Ghozali (2018): Quasi Moderator (Moderasi Semu) terjadi apabila variabel Z bertindak sekaligus sebagai prediktor independen langsung (koefisien b2 signifikan) dan suku interaksinya (b3) juga signifikan. Sementara Pure Moderator (Moderasi Murni) terjadi apabila variabel Z TIDAK berpengaruh langsung terhadap Y (b2 tidak signifikan), namun interaksinya (b3) terbukti signifikan mempengaruhi Y. Pada data ini, tipe yang diperoleh adalah '${moderatorType}'.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com., Ph.D., Ak.',
              title: 'Model Persamaan Struktural Konsep dan Aplikasi dengan Program AMOS & SPSS',
              year: '2018',
              note: 'Badan Penerbit Universitas Diponegoro Semarang, Bab Moderated Regression Analysis (MRA).',
            },
          },
          {
            id: 'mod-3',
            question: 'Apakah arah pengaruh moderasi ini memperkuat atau memperlemah hubungan utama?',
            answer: `Izin menjelaskan, arah moderasi ditentukan dari tanda koefisien regresi suku interaksi (b3). Karena bernilai ${moderationDirection === 'Memperkuat' ? 'positif' : 'negatif'}, maka variabel moderasi ini berfungsi '${moderationDirection}' hubungan pengaruh antara variabel bebas terhadap variabel terikat.`,
            citation: {
              author: 'Aiken, L. S., & West, S. G.',
              title: 'Multiple Regression: Testing and Interpreting Interactions',
              year: '1991',
              note: 'SAGE Publications, Newbury Park, CA.',
            },
          },
        ];

      default:
        return [];
    }
  };

  const questions = getQuestions();
  if (questions.length === 0) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: 'Jawaban Disalin!',
      description: 'Gunakan draf jawaban ini untuk persiapan sidang skripsi.',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 transition-all dark:border-amber-400/20 dark:from-amber-950/20 dark:to-orange-950/10',
        className
      )}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                Bekal Sidang & Tanya-Jawab Dosen
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
              >
                Rujukan Metodologi Resmi
              </Badge>
            </div>
            <p className="text-xs text-amber-900/70 dark:text-amber-200/70">
              Pertanyaan umum penguji sidang skripsi, draf jawaban cerdas berbasis angka hasil uji Anda, dan rujukan buku.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <span>{isOpen ? 'Tutup' : 'Buka Bekal'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="mt-4 space-y-3 border-t border-amber-500/20 pt-4">
          {questions.map((item) => {
            const isItemExpanded = expandedQuestion === item.id || questions.length === 1;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-amber-500/20 bg-white/80 p-3.5 shadow-sm transition-all dark:border-amber-500/20 dark:bg-slate-900/80"
              >
                {/* Question Row */}
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() =>
                    setExpandedQuestion(isItemExpanded && questions.length > 1 ? null : item.id)
                  }
                >
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {item.question}
                    </span>
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isItemExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Answer & Citation */}
                {isItemExpanded && (
                  <div className="mt-3 space-y-3 pl-6">
                    {/* Jawaban */}
                    <div className="rounded-md bg-amber-50/60 p-3 text-xs leading-relaxed text-slate-700 dark:bg-amber-950/30 dark:text-slate-300">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          <GraduationCap className="h-3.5 w-3.5" />
                          Draf Jawaban Mahasiswa di Meja Sidang:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.id, item.answer);
                          }}
                          className="h-6 gap-1 px-1.5 text-[10px] text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-900/50"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Salin Draf
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="italic leading-relaxed">{item.answer}</p>
                    </div>

                    {/* Rujukan Ilmiah */}
                    <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Rujukan Ilmiah:{' '}
                        </span>
                        {item.citation.author} ({item.citation.year}).{' '}
                        <span className="italic">{item.citation.title}</span>.{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.citation.note}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
