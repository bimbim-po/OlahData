import type {
  TestOption,
  AnalysisResults,
  DescriptiveResult,
  ValidityResult,
  ReliabilityResult,
  NormalityResult,
  MulticollinearityResult,
  HeteroscedasticityResult,
  RegressionResult,
  FTestResult,
  DeterminationResult,
  CorrelationResult,
} from '../api/types';
import { formatNumber, formatPValue, getSignificanceLabel } from '../format';
import { ENGINE_VERSION } from '../constants';
import goldenFixture from './hasil_acuan_bersih.json';
import { computeIndependentTTest, computeOneWayAnova } from '../comparative-stats';
import { computeCrosstabAndChiSquare } from '../categorical-stats';
import { mockExperimentalDataset, mockHealthDataset } from './dataset-contoh';

export const mockTestOptions: TestOption[] = [
  {
    id: 'descriptive',
    name: 'Statistik Deskriptif',
    description: 'Mean, median, standar deviasi, distribusi frekuensi',
    prerequisites: [],
    recommended: true,
    recommendReason: 'Selalu diperlukan sebagai langkah awal analisis',
  },
  {
    id: 'validity',
    name: 'Uji Validitas',
    description: 'Korelasi item-total (r hitung vs r tabel)',
    prerequisites: [],
    recommended: true,
    recommendReason: 'Diperlukan untuk memastikan item kuesioner mengukur apa yang seharusnya diukur',
  },
  {
    id: 'reliability',
    name: 'Uji Reliabilitas',
    description: "Cronbach's Alpha per konstruk",
    prerequisites: ['validity'],
    recommended: true,
    recommendReason: 'Diperlukan untuk memastikan konsistensi internal kuesioner',
  },
  {
    id: 'normality',
    name: 'Uji Normalitas',
    description: 'Kolmogorov-Smirnov & Shapiro-Wilk untuk asumsi distribusi normal',
    prerequisites: [],
    recommended: true,
    recommendReason: 'Prasyarat untuk regresi linier',
  },
  {
    id: 'multicollinearity',
    name: 'Uji Multikolinearitas',
    description: 'Tolerance dan VIF antar variabel bebas',
    prerequisites: [],
    recommended: true,
    recommendReason: 'Prasyarat: terdapat lebih dari satu variabel bebas',
  },
  {
    id: 'heteroscedasticity',
    name: 'Uji Heteroskedastisitas',
    description: 'Uji Glejser & Breusch-Pagan untuk varians residual',
    prerequisites: [],
    recommended: true,
    recommendReason: 'Prasyarat untuk regresi linier',
  },
  {
    id: 'regression',
    name: 'Regresi Linier Berganda',
    description: 'Pengaruh simultan dan parsial variabel bebas terhadap terikat',
    prerequisites: ['normality', 'multicollinearity', 'heteroscedasticity'],
    recommended: true,
    recommendReason: 'Sesuai dengan desain penelitian: 2 variabel bebas, 1 variabel terikat',
  },
  {
    id: 'correlation',
    name: 'Korelasi Pearson',
    description: 'Kekuatan dan arah hubungan antar variabel',
    prerequisites: [],
    recommended: false,
  },
  {
    id: 'anova',
    name: 'ANOVA Satu Arah',
    description: 'Perbedaan rata-rata antar kelompok',
    prerequisites: [],
    recommended: false,
  },
  {
    id: 'paired-ttest',
    name: 'Paired Sample t-Test',
    description: 'Uji beda rata-rata dua sampel berpasangan (Pre-test vs Post-test)',
    prerequisites: [],
    recommended: false,
    recommendReason: 'Cocok untuk desain eksperimen pra-pasca perlakuan',
  },
  {
    id: 'ngain',
    name: 'N-Gain Score Ternormalisasi',
    description: 'Efektivitas peningkatan hasil belajar (Hake 1998 & Meltzer 2002)',
    prerequisites: ['paired-ttest'],
    recommended: false,
    recommendReason: 'Standar baku skripsi FKIP dan Pendidikan untuk mengukur efektivitas model ajar',
  },
  {
    id: 'independent-ttest',
    name: 'Independent Sample t-Test',
    description: 'Uji beda rata-rata 2 kelompok bebas (Kelas Eksperimen vs Kontrol) & Uji Levene',
    prerequisites: [],
    recommended: false,
    recommendReason: 'Membandingkan efektivitas antar dua kelompok subjek berbeda',
  },
  {
    id: 'oneway-anova',
    name: 'One-Way ANOVA & Post-Hoc Tukey',
    description: 'Uji beda rata-rata 3 kelompok atau lebih & perbandingan berpasangan Tukey HSD',
    prerequisites: [],
    recommended: false,
    recommendReason: 'Untuk desain penelitian dengan 3 atau lebih variasi perlakuan',
  },
  {
    id: 'nonparametric',
    name: 'Uji Non-Parametrik Alternatif',
    description: 'Mann-Whitney U, Wilcoxon Signed-Rank, & Kruskal-Wallis H (Bebas Asumsi Normal)',
    prerequisites: [],
    recommended: false,
    recommendReason: 'Alternatif resmi yang sah jika data tidak berdistribusi normal',
  },
  {
    id: 'crosstab',
    name: 'Tabulasi Silang (Crosstab)',
    description: 'Matriks frekuensi aktual, harapan (expected count), dan persentase baris/total',
    prerequisites: [],
    recommended: false,
    recommendReason: 'Menyajikan sebaran hubungan antar variabel kategorik (nominal/ordinal)',
  },
  {
    id: 'chisquare',
    name: 'Uji Chi-Square & Fisher Exact',
    description: 'Pearson Chi-Square, Yates Continuity Correction, & Fisher Exact Test otomatis',
    prerequisites: ['crosstab'],
    recommended: false,
    recommendReason: 'Uji signifikansi hubungan kategorik dengan aturan keputusan Cochran otomatis',
  },
  {
    id: 'odds-ratio',
    name: 'Estimasi Risiko (Odds Ratio & RR)',
    description: 'Kalkulasi Odds Ratio (OR), Relative Risk (RR), dan 95% Confidence Interval',
    prerequisites: ['chisquare'],
    recommended: false,
    recommendReason: 'Standar baku penelitian FKM, Kebidanan, & Epidemiologi Klinis',
  },
];

// Angka resmi hasil mesin statistik dari fixtures/hasil_acuan_bersih.json (N = 100)
// Predictors: KL (Kualitas Layanan), KP (Kepuasan Pelanggan); Dependent: LP (Loyalitas Pelanggan)

const descriptiveData: DescriptiveResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    mean: goldenFixture.descriptive.KL.mean,
    median: goldenFixture.descriptive.KL.median,
    stdDev: goldenFixture.descriptive.KL.stdDev,
    min: goldenFixture.descriptive.KL.min,
    max: goldenFixture.descriptive.KL.max,
    n: goldenFixture.descriptive.KL.n,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    mean: goldenFixture.descriptive.KP.mean,
    median: goldenFixture.descriptive.KP.median,
    stdDev: goldenFixture.descriptive.KP.stdDev,
    min: goldenFixture.descriptive.KP.min,
    max: goldenFixture.descriptive.KP.max,
    n: goldenFixture.descriptive.KP.n,
  },
  {
    variable: 'Loyalitas Pelanggan (Y)',
    mean: goldenFixture.descriptive.LP.mean,
    median: goldenFixture.descriptive.LP.median,
    stdDev: goldenFixture.descriptive.LP.stdDev,
    min: goldenFixture.descriptive.LP.min,
    max: goldenFixture.descriptive.LP.max,
    n: goldenFixture.descriptive.LP.n,
  },
];

// df = N - 2 = 98, alpha = 0.05 dua arah -> r tabel = 0.1966
const rTabelValue = 0.1966;

const validityData: ValidityResult[] = Object.entries(goldenFixture.validitas).map(([item, val]) => ({
  item,
  construct: val.construct,
  rHitung: val.rHitung,
  rTabel: val.rTabel || rTabelValue,
  valid: val.valid,
}));

const reliabilityData: ReliabilityResult[] = [
  {
    construct: 'Kualitas Layanan',
    cronbachAlpha: goldenFixture.reliabilitas.KL.finalAlpha,
    itemCount: goldenFixture.reliabilitas.KL.finalItemCount,
    reliable: goldenFixture.reliabilitas.KL.reliable,
    alphaIfDeleted: goldenFixture.reliabilitas.KL.itemsAnalysis.map((it) => ({
      item: it.item,
      alpha: it.alphaIfDeleted,
    })),
  },
  {
    construct: 'Kepuasan Pelanggan',
    cronbachAlpha: goldenFixture.reliabilitas.KP.finalAlpha,
    itemCount: goldenFixture.reliabilitas.KP.finalItemCount,
    reliable: goldenFixture.reliabilitas.KP.reliable,
    alphaIfDeleted: goldenFixture.reliabilitas.KP.itemsAnalysis.map((it) => ({
      item: it.item,
      alpha: it.alphaIfDeleted,
    })),
  },
  {
    construct: 'Loyalitas Pelanggan',
    cronbachAlpha: goldenFixture.reliabilitas.LP.finalAlpha,
    itemCount: goldenFixture.reliabilitas.LP.finalItemCount,
    reliable: goldenFixture.reliabilitas.LP.reliable,
    alphaIfDeleted: goldenFixture.reliabilitas.LP.itemsAnalysis.map((it) => ({
      item: it.item,
      alpha: it.alphaIfDeleted,
    })),
  },
];

const normalityData: NormalityResult[] = [
  {
    test: 'Shapiro-Wilk (Residual)',
    statistic: goldenFixture.asumsi_klasik.normalitas.shapiroWilk.statistic,
    pValue: goldenFixture.asumsi_klasik.normalitas.shapiroWilk.pValue,
    normal: goldenFixture.asumsi_klasik.normalitas.shapiroWilk.normal,
  },
];

const multicollinearityData: MulticollinearityResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    tolerance: goldenFixture.asumsi_klasik.multikolinearitas.KL.tolerance,
    vif: goldenFixture.asumsi_klasik.multikolinearitas.KL.vif,
    problematic: goldenFixture.asumsi_klasik.multikolinearitas.KL.problematic,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    tolerance: goldenFixture.asumsi_klasik.multikolinearitas.KP.tolerance,
    vif: goldenFixture.asumsi_klasik.multikolinearitas.KP.vif,
    problematic: goldenFixture.asumsi_klasik.multikolinearitas.KP.problematic,
  },
];

const heteroscedasticityData: HeteroscedasticityResult[] = [
  {
    test: 'Glejser',
    variable: 'Kualitas Layanan (X1)',
    tHitung: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KL.tHitung,
    pValue: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KL.pValue,
    significant: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KL.heteroscedastic,
  },
  {
    test: 'Glejser',
    variable: 'Kepuasan Pelanggan (X2)',
    tHitung: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KP.tHitung,
    pValue: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KP.pValue,
    significant: goldenFixture.asumsi_klasik.heteroskedastisitas.glejser.KP.heteroscedastic,
  },
];

// OLS regression dari hasil_acuan_bersih.json:
// Y = 0.761 + 0.490 X1 + 0.375 X2
const regressionData: RegressionResult[] = [
  {
    variable: '(Konstanta)',
    coefficient: goldenFixture.regresi_berganda.coefficients[0].b,
    stdError: goldenFixture.regresi_berganda.coefficients[0].se,
    tHitung: goldenFixture.regresi_berganda.coefficients[0].t,
    pValue: goldenFixture.regresi_berganda.coefficients[0].p,
    significant: false,
  },
  {
    variable: 'Kualitas Layanan (X1)',
    coefficient: goldenFixture.regresi_berganda.coefficients[1].b,
    stdError: goldenFixture.regresi_berganda.coefficients[1].se,
    tHitung: goldenFixture.regresi_berganda.coefficients[1].t,
    pValue: goldenFixture.regresi_berganda.coefficients[1].p,
    significant: goldenFixture.regresi_berganda.coefficients[1].significant,
    standardizedBeta: goldenFixture.regresi_berganda.coefficients[1].beta,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    coefficient: goldenFixture.regresi_berganda.coefficients[2].b,
    stdError: goldenFixture.regresi_berganda.coefficients[2].se,
    tHitung: goldenFixture.regresi_berganda.coefficients[2].t,
    pValue: goldenFixture.regresi_berganda.coefficients[2].p,
    significant: goldenFixture.regresi_berganda.coefficients[2].significant,
    standardizedBeta: goldenFixture.regresi_berganda.coefficients[2].beta,
  },
];

const fTestData: FTestResult = {
  fHitung: goldenFixture.regresi_berganda.fHitung,
  fTabel: goldenFixture.regresi_berganda.fTabel,
  pValue: goldenFixture.regresi_berganda.pSimultan,
  significant: true,
};

const determinationData: DeterminationResult = {
  rSquare: goldenFixture.regresi_berganda.rSquare,
  adjustedRSquare: goldenFixture.regresi_berganda.adjustedRSquare,
  stdError: goldenFixture.regresi_berganda.stdErrorEstimate,
};

const correlationData: CorrelationResult[] = [
  {
    variable1: 'Kualitas Layanan (X1)',
    variable2: 'Kepuasan Pelanggan (X2)',
    coefficient: goldenFixture.korelasi.pearson.KL.KP.r,
    pValue: goldenFixture.korelasi.pearson.KL.KP.p,
    significant: goldenFixture.korelasi.pearson.KL.KP.p < 0.05,
    strength: 'Sedang',
  },
  {
    variable1: 'Kualitas Layanan (X1)',
    variable2: 'Loyalitas Pelanggan (Y)',
    coefficient: goldenFixture.korelasi.pearson.KL.LP.r,
    pValue: goldenFixture.korelasi.pearson.KL.LP.p,
    significant: goldenFixture.korelasi.pearson.KL.LP.p < 0.05,
    strength: 'Kuat',
  },
  {
    variable1: 'Kepuasan Pelanggan (X2)',
    variable2: 'Loyalitas Pelanggan (Y)',
    coefficient: goldenFixture.korelasi.pearson.KP.LP.r,
    pValue: goldenFixture.korelasi.pearson.KP.LP.p,
    significant: goldenFixture.korelasi.pearson.KP.LP.p < 0.05,
    strength: 'Sedang',
  },
];

const sampleGroupA = mockExperimentalDataset
  .filter((r) => r.Kelas === 'Kelas Eksperimen')
  .map((r) => Number(r.Post_Test));
const sampleGroupB = mockExperimentalDataset
  .filter((r) => r.Kelas === 'Kelas Kontrol')
  .map((r) => Number(r.Post_Test));

const sampleIndependentTTest = computeIndependentTTest(
  sampleGroupA,
  sampleGroupB,
  'Kelompok Layanan Prioritas',
  'Kelompok Layanan Reguler',
  'Loyalitas Pelanggan (Y)',
  0.05
);

const sampleOneWayAnova = computeOneWayAnova(
  [
    { name: 'Pendidikan SMA/SMK', scores: sampleGroupB },
    { name: 'Pendidikan Sarjana (S1)', scores: sampleGroupA },
    { name: 'Pendidikan Pascasarjana (S2)', scores: sampleGroupA.map((v) => Math.min(100, v + 2)) },
  ],
  'Loyalitas Pelanggan (Y)',
  'Tingkat Pendidikan',
  0.05
);

const sampleCategorical = computeCrosstabAndChiSquare(
  mockHealthDataset,
  'Kebiasaan_Merokok',
  'Kejadian_Hipertensi',
  0.05
);

const explanations: Record<string, string> = {
  descriptive: `Berdasarkan analisis statistik deskriptif terhadap 100 responden, variabel Kualitas Layanan (X1) memiliki rata-rata sebesar 3,738 dengan standar deviasi 0,524. Variabel Kepuasan Pelanggan (X2) memiliki nilai rata-rata sebesar 3,738 dengan standar deviasi 0,473. Sementara itu, variabel Loyalitas Pelanggan (Y) mencatatkan rata-rata sebesar 3,992 dan standar deviasi 0,551. Seluruh variabel penelitian menunjukkan sebaran skor yang representatif pada skala Likert 1 sampai 5.`,

  validity: `Pengujian validitas instrumen dilakukan dengan membandingkan nilai r hitung korelasi Pearson Product Moment terhadap nilai r tabel sebesar 0,197 pada taraf signifikansi 0,05 (df = 98, N = 100). Pada variabel Kualitas Layanan (X1), empat butir pernyataan (KL1 sampai KL4) memiliki nilai r hitung antara 0,372 hingga 0,577 yang lebih besar dari r tabel (0,197) sehingga dinyatakan valid, sedangkan butir KL5 memiliki r hitung -0,047 (p = 0,641) sehingga gugur dan dikeluarkan dari model. Seluruh butir pernyataan Kepuasan Pelanggan (KP1-KP5) dan Loyalitas Pelanggan (LP1-LP5) dinyatakan valid.`,

  reliability: `Uji reliabilitas terhadap ketiga konstruk penelitian menggunakan koefisien Cronbach's Alpha menghasilkan nilai reliabilitas yang memenuhi kriteria reliabilitas (alfa Cronbach > 0,70). Konstruk Kualitas Layanan (X1) dengan 4 butir valid memperoleh nilai alpha sebesar 0,796, konstruk Kepuasan Pelanggan (X2) sebesar 0,753, dan konstruk Loyalitas Pelanggan (Y) sebesar 0,826. Hasil ini mengindikasikan bahwa seluruh instrumen memiliki konsistensi internal yang tinggi dan reliabel untuk pengukuran berulang.`,

  normality: `Uji normalitas residual dilakukan menggunakan uji Shapiro-Wilk pada model regresi terestimasi (N = 100). Nilai statistik uji Shapiro-Wilk yang diperoleh adalah sebesar 0,991 dengan nilai signifikansi (p-value) sebesar 0,733. Karena nilai signifikansi tersebut lebih besar dari tingkat signifikansi α = 0,05, dapat disimpulkan bahwa data residual terdistribusi secara normal dan asumsi normalitas terpenuhi.`,

  multicollinearity: `Uji multikolinearitas bertujuan menguji apakah ditemukan korelasi tinggi antar variabel independen dalam model regresi. Nilai tolerance untuk kedua variabel independen (Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2)) adalah 0,951 yang berada jauh di atas 0,10. Selain itu, nilai Variance Inflation Factor (VIF) untuk kedua variabel adalah 1,051 yang jauh di bawah ambang batas 10,00. Dengan demikian, model regresi dinyatakan terbebas dari masalah multikolinearitas.`,

  heteroscedasticity: `Pengujian gejala heteroskedastisitas dilakukan menggunakan uji Glejser dengan meregresikan nilai residual absolut terhadap masing-masing variabel bebas. Nilai signifikansi uji Glejser untuk Kualitas Layanan (X1) adalah 0,966 (t hitung = -0,042) yang lebih besar dari 0,05. Secara simultan melalui uji Breusch-Pagan, diperoleh nilai signifikansi sebesar 0,287 (> 0,05), sehingga model regresi dinyatakan terbebas dari gejala heteroskedastisitas.`,

  regression: `Persamaan regresi linier berganda yang dihasilkan adalah Y = 0,761 + 0,490X1 + 0,375X2. Pengujian parsial (uji t) menunjukkan bahwa variabel Kualitas Layanan (X1) berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan (Y) dengan t hitung sebesar 5,708 dan nilai signifikansi p < 0,001. Demikian pula, variabel Kepuasan Pelanggan (X2) berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan (Y) dengan t hitung sebesar 3,942 dan signifikansi p < 0,001. Nilai koefisien determinasi R Square sebesar 0,386 (Adjusted R Square = 0,374) dengan F hitung sebesar 30,525 (p < 0,001).`,

  fTest: `Uji signifikansi simultan (uji F) dengan N = 100 dan 2 prediktor menghasilkan nilai F hitung sebesar 30,525 yang lebih besar dari nilai F tabel sebesar 3,090 dengan nilai signifikansi sebesar p < 0,001. Hal ini membuktikan bahwa Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2) secara serempak atau bersama-sama berpengaruh signifikan terhadap Loyalitas Pelanggan (Y). Model regresi yang dibangun terbukti fit dan layak untuk menjelaskan variasi variabel terikat.`,

  determination: `Berdasarkan tabel koefisien determinasi (N = 100, k = 2), diperoleh nilai R Square sebesar 0,386 dan Adjusted R Square sebesar 0,374. Hal ini mengindikasikan bahwa sebesar 37,4% variasi pada Loyalitas Pelanggan (Y) dapat dijelaskan secara bersama oleh Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2). Sementara itu, sisa variasi sebesar 62,6% dipengaruhi oleh faktor lain di luar model penelitian ini. Nilai standar error estimasi adalah sebesar 0,436.`,

  correlation: `Analisis korelasi Pearson menunjukkan korelasi antara Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2) sebesar 0,221 (p = 0,027). Hubungan antara Kualitas Layanan (X1) dan Loyalitas Pelanggan (Y) memiliki koefisien korelasi sebesar 0,537 (p < 0,001). Sedangkan korelasi antara Kepuasan Pelanggan (X2) dan Loyalitas Pelanggan (Y) mencapai 0,424 (p < 0,001). Seluruh pasangan variabel berkorelasi positif secara signifikan.`,

  independentTTest: sampleIndependentTTest.conclusion,
  oneWayAnova: sampleOneWayAnova.conclusion,
  crosstab: `Tabulasi silang melibatkan ${sampleCategorical.crosstab.totalN} responden valid dengan distribusi frekuensi aktual dan harapan (expected count) lengkap.`,
  chisquare: sampleCategorical.chiSquare.conclusion,
};

export const mockResults: AnalysisResults = {
  id: 'result-1',
  projectId: 'project-1',
  dataVersionId: 'dv-2',
  respondentCount: goldenFixture.n,
  timestamp: '2026-10-15T14:30:00Z',
  engineVersion: ENGINE_VERSION,
  significanceLevel: goldenFixture.significanceLevel,
  descriptive: descriptiveData,
  validity: validityData,
  reliability: reliabilityData,
  normality: normalityData,
  multicollinearity: multicollinearityData,
  heteroscedasticity: heteroscedasticityData,
  regression: regressionData,
  fTest: fTestData,
  determination: determinationData,
  correlation: correlationData,
  independentTTest: sampleIndependentTTest,
  oneWayAnova: sampleOneWayAnova,
  crosstab: sampleCategorical.crosstab,
  chiSquare: sampleCategorical.chiSquare,
  riskEstimate: sampleCategorical.riskEstimate,
  symmetricMeasures: sampleCategorical.symmetricMeasures,
  explanations,
};
