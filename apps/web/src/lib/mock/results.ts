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
import { formatNumber } from '../format';
import { ENGINE_VERSION } from '../constants';

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
    description: 'Kolmogorov-Smirnov untuk asumsi distribusi normal',
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
    description: 'Uji Glejser untuk varians residual',
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
];

// N = 120, k = 2 prediktor (X1: Kualitas Layanan, X2: Kepuasan Pelanggan, Y: Loyalitas Pelanggan)
const descriptiveData: DescriptiveResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    mean: 2.843,
    median: 2.833,
    stdDev: 1.103,
    min: 1.000,
    max: 5.000,
    n: 120,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    mean: 3.047,
    median: 3.000,
    stdDev: 1.120,
    min: 1.000,
    max: 5.000,
    n: 120,
  },
  {
    variable: 'Loyalitas Pelanggan (Y)',
    mean: 3.067,
    median: 3.167,
    stdDev: 1.204,
    min: 1.000,
    max: 5.000,
    n: 120,
  },
];

// N = 120, df = 120 - 2 = 118, alpha = 0.05 -> r tabel = 0.1793
const rTabelValue = 0.1793;

const validityData: ValidityResult[] = [
  // Kualitas Layanan (KL1 - KL6)
  { item: 'KL1', construct: 'Kualitas Layanan', rHitung: 0.860, rTabel: rTabelValue, valid: true },
  { item: 'KL2', construct: 'Kualitas Layanan', rHitung: 0.831, rTabel: rTabelValue, valid: true },
  { item: 'KL3', construct: 'Kualitas Layanan', rHitung: 0.844, rTabel: rTabelValue, valid: true },
  { item: 'KL4', construct: 'Kualitas Layanan', rHitung: 0.856, rTabel: rTabelValue, valid: true },
  { item: 'KL5', construct: 'Kualitas Layanan', rHitung: 0.839, rTabel: rTabelValue, valid: true },
  { item: 'KL6', construct: 'Kualitas Layanan', rHitung: 0.866, rTabel: rTabelValue, valid: true },
  // Kepuasan Pelanggan (KP1 - KP6)
  { item: 'KP1', construct: 'Kepuasan Pelanggan', rHitung: 0.848, rTabel: rTabelValue, valid: true },
  { item: 'KP2', construct: 'Kepuasan Pelanggan', rHitung: 0.852, rTabel: rTabelValue, valid: true },
  { item: 'KP3', construct: 'Kepuasan Pelanggan', rHitung: 0.857, rTabel: rTabelValue, valid: true },
  { item: 'KP4', construct: 'Kepuasan Pelanggan', rHitung: 0.871, rTabel: rTabelValue, valid: true },
  { item: 'KP5', construct: 'Kepuasan Pelanggan', rHitung: 0.853, rTabel: rTabelValue, valid: true },
  { item: 'KP6', construct: 'Kepuasan Pelanggan', rHitung: 0.849, rTabel: rTabelValue, valid: true },
  // Loyalitas Pelanggan (LO1 - LO6)
  { item: 'LO1', construct: 'Loyalitas Pelanggan', rHitung: 0.882, rTabel: rTabelValue, valid: true },
  { item: 'LO2', construct: 'Loyalitas Pelanggan', rHitung: 0.874, rTabel: rTabelValue, valid: true },
  { item: 'LO3', construct: 'Loyalitas Pelanggan', rHitung: 0.893, rTabel: rTabelValue, valid: true },
  { item: 'LO4', construct: 'Loyalitas Pelanggan', rHitung: 0.884, rTabel: rTabelValue, valid: true },
  { item: 'LO5', construct: 'Loyalitas Pelanggan', rHitung: 0.877, rTabel: rTabelValue, valid: true },
  { item: 'LO6', construct: 'Loyalitas Pelanggan', rHitung: 0.882, rTabel: rTabelValue, valid: true },
];

const reliabilityData: ReliabilityResult[] = [
  {
    construct: 'Kualitas Layanan',
    cronbachAlpha: 0.923,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'KL1', alpha: 0.906 },
      { item: 'KL2', alpha: 0.912 },
      { item: 'KL3', alpha: 0.910 },
      { item: 'KL4', alpha: 0.907 },
      { item: 'KL5', alpha: 0.910 },
      { item: 'KL6', alpha: 0.906 },
    ],
  },
  {
    construct: 'Kepuasan Pelanggan',
    cronbachAlpha: 0.931,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'KP1', alpha: 0.919 },
      { item: 'KP2', alpha: 0.919 },
      { item: 'KP3', alpha: 0.918 },
      { item: 'KP4', alpha: 0.914 },
      { item: 'KP5', alpha: 0.919 },
      { item: 'KP6', alpha: 0.919 },
    ],
  },
  {
    construct: 'Loyalitas Pelanggan',
    cronbachAlpha: 0.945,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'LO1', alpha: 0.934 },
      { item: 'LO2', alpha: 0.936 },
      { item: 'LO3', alpha: 0.932 },
      { item: 'LO4', alpha: 0.934 },
      { item: 'LO5', alpha: 0.935 },
      { item: 'LO6', alpha: 0.934 },
    ],
  },
];

const normalityData: NormalityResult[] = [
  {
    test: 'Kolmogorov-Smirnov (Unstandardized Residual)',
    statistic: 0.046,
    pValue: 0.950,
    normal: true,
  },
];

const multicollinearityData: MulticollinearityResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    tolerance: 0.709,
    vif: 1.410,
    problematic: false,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    tolerance: 0.709,
    vif: 1.410,
    problematic: false,
  },
];

const heteroscedasticityData: HeteroscedasticityResult[] = [
  {
    test: 'Glejser',
    variable: 'Kualitas Layanan (X1)',
    tHitung: 0.978,
    pValue: 0.330,
    significant: false,
  },
  {
    test: 'Glejser',
    variable: 'Kepuasan Pelanggan (X2)',
    tHitung: -0.060,
    pValue: 0.953,
    significant: false,
  },
];

// OLS regression: Y = 0.380 + 0.484 X1 + 0.430 X2
// N = 120, k = 2 prediktor, df_res = 117
const regressionData: RegressionResult[] = [
  {
    variable: '(Konstanta)',
    coefficient: 0.380,
    stdError: 0.238,
    tHitung: 1.595,
    pValue: 0.114,
    significant: false,
  },
  {
    variable: 'Kualitas Layanan (X1)',
    coefficient: 0.484,
    stdError: 0.081,
    tHitung: 6.000,
    pValue: 0.000,
    significant: true,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    coefficient: 0.430,
    stdError: 0.079,
    tHitung: 5.422,
    pValue: 0.000,
    significant: true,
  },
];

// F = (R2/k) / ((1 - R2)/(n - k - 1)) = (0.5476/2) / ((1 - 0.5476)/117) = 70.824
const fTestData: FTestResult = {
  fHitung: 70.824,
  fTabel: 3.074,
  pValue: 0.000,
  significant: true,
};

// Adjusted R2 = 1 - (1 - R2)*(n - 1)/(n - k - 1) = 1 - (1 - 0.5476)*119/117 = 0.540
const determinationData: DeterminationResult = {
  rSquare: 0.548,
  adjustedRSquare: 0.540,
  stdError: 0.817,
};

const correlationData: CorrelationResult[] = [
  {
    variable1: 'Kualitas Layanan (X1)',
    variable2: 'Kepuasan Pelanggan (X2)',
    coefficient: 0.539,
    pValue: 0.000,
    significant: true,
    strength: 'Sedang',
  },
  {
    variable1: 'Kualitas Layanan (X1)',
    variable2: 'Loyalitas Pelanggan (Y)',
    coefficient: 0.679,
    pValue: 0.000,
    significant: true,
    strength: 'Kuat',
  },
  {
    variable1: 'Kepuasan Pelanggan (X2)',
    variable2: 'Loyalitas Pelanggan (Y)',
    coefficient: 0.655,
    pValue: 0.000,
    significant: true,
    strength: 'Kuat',
  },
];

const minValidityRHitung = Math.min(...validityData.map((v) => v.rHitung));
const maxValidityRHitung = Math.max(...validityData.map((v) => v.rHitung));

const explanations: Record<string, string> = {
  descriptive: `Berdasarkan analisis statistik deskriptif terhadap 120 responden, variabel Kualitas Layanan (X1) memiliki rata-rata sebesar 2,843 dengan standar deviasi 1,103. Variabel Kepuasan Pelanggan (X2) memiliki nilai rata-rata sebesar 3,047 dengan standar deviasi 1,120. Sementara itu, variabel Loyalitas Pelanggan (Y) mencatatkan rata-rata sebesar 3,067 dan standar deviasi 1,204. Seluruh variabel penelitian menunjukkan sebaran skor yang representatif pada skala pengukuran 1 sampai 5.`,

  validity: `Pengujian validitas instrumen dilakukan dengan membandingkan nilai r hitung korelasi Pearson Product Moment terhadap nilai r tabel sebesar 0,1793 pada taraf signifikansi 0,05 (df = 118, N = 120). Seluruh item kuesioner (18 butir pernyataan) menunjukkan nilai r hitung yang berkisar antara 0,831 hingga 0,893, yang mana seluruhnya lebih besar dari nilai r tabel (0,1793). Dengan demikian, setiap butir pernyataan pada konstruk Kualitas Layanan (X1), Kepuasan Pelanggan (X2), dan Loyalitas Pelanggan (Y) dinyatakan valid dan layak digunakan sebagai alat pengumpulan data.`,

  reliability: `Uji reliabilitas terhadap ketiga konstruk penelitian menggunakan koefisien Cronbach's Alpha menghasilkan nilai reliabilitas yang memenuhi kriteria reliabilitas (alfa Cronbach > 0,70). Konstruk Kualitas Layanan (X1) memperoleh nilai alpha sebesar 0,923, konstruk Kepuasan Pelanggan (X2) sebesar 0,931, dan konstruk Loyalitas Pelanggan (Y) sebesar 0,945. Hasil ini mengindikasikan bahwa seluruh instrumen memiliki konsistensi internal yang tinggi dan reliabel untuk pengukuran berulang.`,

  normality: `Uji normalitas residual dilakukan menggunakan uji Kolmogorov-Smirnov pada model regresi terestimasi (N = 120). Nilai statistik uji Kolmogorov-Smirnov yang diperoleh adalah sebesar 0,046 dengan nilai signifikansi (p-value) sebesar 0,950. Karena nilai signifikansi tersebut lebih besar dari tingkat signifikansi α = 0,05, dapat disimpulkan bahwa data residual terdistribusi secara normal dan asumsi normalitas terpenuhi.`,

  multicollinearity: `Uji multikolinearitas bertujuan menguji apakah ditemukan korelasi tinggi antar variabel independen dalam model regresi. Nilai tolerance untuk kedua variabel independen (Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2)) adalah 0,709 yang berada di atas 0,10. Selain itu, nilai Variance Inflation Factor (VIF) untuk kedua variabel adalah 1,410 yang jauh di bawah ambang batas 10,00. Dengan demikian, model regresi dinyatakan terbebas dari masalah multikolinearitas.`,

  heteroscedasticity: `Pengujian gejala heteroskedastisitas dilakukan menggunakan uji Glejser dengan meregresikan nilai residual absolut terhadap masing-masing variabel bebas. Nilai signifikansi uji Glejser untuk Kualitas Layanan (X1) adalah 0,330 (t hitung = 0,978) dan untuk Kepuasan Pelanggan (X2) adalah 0,953 (t hitung = -0,060). Karena kedua nilai signifikansi lebih besar dari 0,05, maka tidak terdapat gejala heteroskedastisitas pada model regresi yang digunakan.`,

  regression: `Persamaan regresi linier berganda yang dihasilkan adalah Y = 0,380 + 0,484X1 + 0,430X2. Pengujian parsial (uji t) menunjukkan bahwa variabel Kualitas Layanan (X1) berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan (Y) dengan t hitung sebesar 6,000 dan nilai signifikansi 0,000 < 0,05. Demikian pula, variabel Kepuasan Pelanggan (X2) berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan (Y) dengan t hitung sebesar 5,422 dan signifikansi 0,000 < 0,05. Nilai koefisien positif menunjukkan bahwa peningkatan kualitas layanan dan kepuasan pelanggan berpengaruh positif dan signifikan terhadap loyalitas pelanggan.`,

  fTest: `Uji signifikansi simultan (uji F) dengan N = 120 dan 2 prediktor menghasilkan nilai F hitung sebesar 70,824 yang lebih besar dari nilai F tabel sebesar 3,074 dengan nilai signifikansi sebesar 0,000 < 0,05. Hal ini membuktikan bahwa Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2) secara serempak atau bersama-sama berpengaruh signifikan terhadap Loyalitas Pelanggan (Y). Model regresi yang dibangun terbukti fit dan layak untuk menjelaskan variasi variabel terikat.`,

  determination: `Berdasarkan tabel koefisien determinasi (N = 120, k = 2), diperoleh nilai R Square sebesar 0,548 dan Adjusted R Square sebesar 0,540. Hal ini mengindikasikan bahwa sebesar 54,0% variasi pada Loyalitas Pelanggan (Y) dapat dijelaskan secara bersama oleh Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2). Sementara itu, sisa variasi sebesar 46,0% dipengaruhi oleh variabel lain di luar model penelitian ini. Nilai standar error estimasi adalah sebesar 0,817.`,

  correlation: `Analisis korelasi Pearson menunjukkan korelasi antara Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2) sebesar 0,539 (kategori Sedang, p = 0,000). Hubungan antara Kualitas Layanan (X1) dan Loyalitas Pelanggan (Y) memiliki koefisien korelasi sebesar 0,679 (kategori Kuat, p = 0,000). Sedangkan korelasi antara Kepuasan Pelanggan (X2) dan Loyalitas Pelanggan (Y) mencapai 0,655 (kategori Kuat, p = 0,000). Seluruh pasangan variabel berkorelasi positif secara signifikan pada tingkat signifikansi 0,01.`,
};

export const mockResults: AnalysisResults = {
  id: 'result-1',
  projectId: 'project-1',
  dataVersionId: 'dv-2',
  respondentCount: 120,
  timestamp: '2026-10-13T14:30:00Z',
  engineVersion: ENGINE_VERSION,
  significanceLevel: 0.05,
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
  explanations,
};
