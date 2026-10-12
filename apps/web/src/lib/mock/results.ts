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

const descriptiveData: DescriptiveResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    mean: 3.682,
    median: 3.700,
    stdDev: 0.548,
    min: 2.167,
    max: 5.000,
    n: 117,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    mean: 3.745,
    median: 3.833,
    stdDev: 0.562,
    min: 2.000,
    max: 5.000,
    n: 117,
  },
  {
    variable: 'Loyalitas Pelanggan (Y)',
    mean: 3.712,
    median: 3.667,
    stdDev: 0.589,
    min: 2.000,
    max: 5.000,
    n: 117,
  },
];

const rTabelValue = 0.1816; // df = 117 - 2 = 115, alpha = 0.05

const validityData: ValidityResult[] = [
  // Kualitas Layanan (KL1 - KL6)
  { item: 'KL1', construct: 'Kualitas Layanan', rHitung: 0.672, rTabel: rTabelValue, valid: true },
  { item: 'KL2', construct: 'Kualitas Layanan', rHitung: 0.715, rTabel: rTabelValue, valid: true },
  { item: 'KL3', construct: 'Kualitas Layanan', rHitung: 0.648, rTabel: rTabelValue, valid: true },
  { item: 'KL4', construct: 'Kualitas Layanan', rHitung: 0.734, rTabel: rTabelValue, valid: true },
  { item: 'KL5', construct: 'Kualitas Layanan', rHitung: 0.691, rTabel: rTabelValue, valid: true },
  { item: 'KL6', construct: 'Kualitas Layanan', rHitung: 0.663, rTabel: rTabelValue, valid: true },
  // Kepuasan (KP1 - KP6)
  { item: 'KP1', construct: 'Kepuasan', rHitung: 0.704, rTabel: rTabelValue, valid: true },
  { item: 'KP2', construct: 'Kepuasan', rHitung: 0.728, rTabel: rTabelValue, valid: true },
  { item: 'KP3', construct: 'Kepuasan', rHitung: 0.689, rTabel: rTabelValue, valid: true },
  { item: 'KP4', construct: 'Kepuasan', rHitung: 0.741, rTabel: rTabelValue, valid: true },
  { item: 'KP5', construct: 'Kepuasan', rHitung: 0.677, rTabel: rTabelValue, valid: true },
  { item: 'KP6', construct: 'Kepuasan', rHitung: 0.719, rTabel: rTabelValue, valid: true },
  // Loyalitas (LO1 - LO6)
  { item: 'LO1', construct: 'Loyalitas', rHitung: 0.755, rTabel: rTabelValue, valid: true },
  { item: 'LO2', construct: 'Loyalitas', rHitung: 0.712, rTabel: rTabelValue, valid: true },
  { item: 'LO3', construct: 'Loyalitas', rHitung: 0.698, rTabel: rTabelValue, valid: true },
  { item: 'LO4', construct: 'Loyalitas', rHitung: 0.763, rTabel: rTabelValue, valid: true },
  { item: 'LO5', construct: 'Loyalitas', rHitung: 0.684, rTabel: rTabelValue, valid: true },
  { item: 'LO6', construct: 'Loyalitas', rHitung: 0.730, rTabel: rTabelValue, valid: true },
];

const reliabilityData: ReliabilityResult[] = [
  {
    construct: 'Kualitas Layanan',
    cronbachAlpha: 0.842,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'KL1', alpha: 0.815 },
      { item: 'KL2', alpha: 0.806 },
      { item: 'KL3', alpha: 0.821 },
      { item: 'KL4', alpha: 0.801 },
      { item: 'KL5', alpha: 0.811 },
      { item: 'KL6', alpha: 0.817 },
    ],
  },
  {
    construct: 'Kepuasan',
    cronbachAlpha: 0.865,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'KP1', alpha: 0.841 },
      { item: 'KP2', alpha: 0.835 },
      { item: 'KP3', alpha: 0.845 },
      { item: 'KP4', alpha: 0.832 },
      { item: 'KP5', alpha: 0.848 },
      { item: 'KP6', alpha: 0.838 },
    ],
  },
  {
    construct: 'Loyalitas',
    cronbachAlpha: 0.881,
    itemCount: 6,
    reliable: true,
    alphaIfDeleted: [
      { item: 'LO1', alpha: 0.854 },
      { item: 'LO2', alpha: 0.862 },
      { item: 'LO3', alpha: 0.866 },
      { item: 'LO4', alpha: 0.851 },
      { item: 'LO5', alpha: 0.869 },
      { item: 'LO6', alpha: 0.858 },
    ],
  },
];

const normalityData: NormalityResult[] = [
  {
    test: 'Kolmogorov-Smirnov (Unstandardized Residual)',
    statistic: 0.058,
    pValue: 0.200,
    normal: true,
  },
];

const multicollinearityData: MulticollinearityResult[] = [
  {
    variable: 'Kualitas Layanan (X1)',
    tolerance: 0.624,
    vif: 1.603,
    problematic: false,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    tolerance: 0.624,
    vif: 1.603,
    problematic: false,
  },
];

const heteroscedasticityData: HeteroscedasticityResult[] = [
  {
    test: 'Glejser',
    variable: 'Kualitas Layanan (X1)',
    tHitung: 0.812,
    pValue: 0.418,
    significant: false,
  },
  {
    test: 'Glejser',
    variable: 'Kepuasan Pelanggan (X2)',
    tHitung: 0.543,
    pValue: 0.588,
    significant: false,
  },
];

const regressionData: RegressionResult[] = [
  {
    variable: '(Konstanta)',
    coefficient: 4.120,
    stdError: 1.250,
    tHitung: 3.296,
    pValue: 0.001,
    significant: true,
  },
  {
    variable: 'Kualitas Layanan (X1)',
    coefficient: 0.385,
    stdError: 0.078,
    tHitung: 4.936,
    pValue: 0.000,
    significant: true,
  },
  {
    variable: 'Kepuasan Pelanggan (X2)',
    coefficient: 0.442,
    stdError: 0.082,
    tHitung: 5.390,
    pValue: 0.000,
    significant: true,
  },
];

const fTestData: FTestResult = {
  fHitung: 48.652,
  fTabel: 3.076,
  pValue: 0.000,
  significant: true,
};

const determinationData: DeterminationResult = {
  rSquare: 0.460,
  adjustedRSquare: 0.451,
  stdError: 1.842,
};

const correlationData: CorrelationResult[] = [
  {
    variable1: 'Kualitas Layanan',
    variable2: 'Kepuasan Pelanggan',
    coefficient: 0.613,
    pValue: 0.000,
    significant: true,
    strength: 'Kuat',
  },
  {
    variable1: 'Kualitas Layanan',
    variable2: 'Loyalitas Pelanggan',
    coefficient: 0.582,
    pValue: 0.000,
    significant: true,
    strength: 'Sedang',
  },
  {
    variable1: 'Kepuasan Pelanggan',
    variable2: 'Loyalitas Pelanggan',
    coefficient: 0.628,
    pValue: 0.000,
    significant: true,
    strength: 'Kuat',
  },
];

const minValidityRHitung = Math.min(...validityData.map((v) => v.rHitung));
const maxValidityRHitung = Math.max(...validityData.map((v) => v.rHitung));

const explanations: Record<string, string> = {
  descriptive: `Berdasarkan analisis statistik deskriptif terhadap ${formatNumber(
    descriptiveData[0].n
  )} responden, variabel ${descriptiveData[0].variable} memiliki rata-rata sebesar ${formatNumber(
    descriptiveData[0].mean,
    3
  )} dengan standar deviasi ${formatNumber(descriptiveData[0].stdDev, 3)}. Variabel ${
    descriptiveData[1].variable
  } memiliki nilai rata-rata sebesar ${formatNumber(
    descriptiveData[1].mean,
    3
  )} dengan standar deviasi ${formatNumber(descriptiveData[1].stdDev, 3)}. Sementara itu, variabel ${
    descriptiveData[2].variable
  } mencatatkan rata-rata sebesar ${formatNumber(
    descriptiveData[2].mean,
    3
  )} dan standar deviasi ${formatNumber(
    descriptiveData[2].stdDev,
    3
  )}. Seluruh variabel penelitian menunjukkan kecenderungan skor dalam kategori baik hingga sangat baik pada skala pengukuran.`,

  validity: `Pengujian validitas instrumen dilakukan dengan membandingkan nilai r hitung korelasi Pearson Product Moment terhadap nilai r tabel sebesar ${formatNumber(
    rTabelValue,
    4
  )} pada taraf signifikansi 0,05 (df = 115). Seluruh item kuesioner (${formatNumber(
    validityData.length
  )} butir pernyataan) menunjukkan nilai r hitung yang berkisar antara ${formatNumber(
    minValidityRHitung,
    3
  )} hingga ${formatNumber(
    maxValidityRHitung,
    3
  )}, yang mana seluruhnya lebih besar dari nilai r tabel (${formatNumber(
    rTabelValue,
    4
  )}). Dengan demikian, setiap butir pernyataan pada konstruk Kualitas Layanan, Kepuasan, dan Loyalitas dinyatakan valid dan layak digunakan sebagai alat pengumpulan data.`,

  reliability: `Uji reliabilitas terhadap ketiga konstruk penelitian menggunakan koefisien Cronbach's Alpha menghasilkan nilai reliabilitas yang sangat memuaskan di atas ambang batas 0,60 (maupun 0,70). Konstruk ${
    reliabilityData[0].construct
  } memperoleh nilai alpha sebesar ${formatNumber(
    reliabilityData[0].cronbachAlpha,
    3
  )}, konstruk ${reliabilityData[1].construct} sebesar ${formatNumber(
    reliabilityData[1].cronbachAlpha,
    3
  )}, dan konstruk ${reliabilityData[2].construct} sebesar ${formatNumber(
    reliabilityData[2].cronbachAlpha,
    3
  )}. Hasil ini mengindikasikan bahwa seluruh instrumen memiliki konsistensi internal yang tinggi dan reliabel untuk pengukuran berulang.`,

  normality: `Uji normalitas residual dilakukan menggunakan uji Kolmogorov-Smirnov pada model regresi terestimasi. Nilai statistik uji Kolmogorov-Smirnov yang diperoleh adalah sebesar ${formatNumber(
    normalityData[0].statistic,
    3
  )} dengan nilai signifikansi (p-value) sebesar ${formatNumber(
    normalityData[0].pValue,
    3
  )}. Karena nilai signifikansi tersebut lebih besar dari tingkat signifikansi α = 0,05, dapat disimpulkan bahwa data residual terdistribusi secara normal dan asumsi normalitas terpenuhi.`,

  multicollinearity: `Uji multikolinearitas bertujuan menguji apakah ditemukan korelasi antar variabel independen dalam model regresi. Nilai tolerance untuk kedua variabel independen (${
    multicollinearityData[0].variable
  } dan ${multicollinearityData[1].variable}) adalah ${formatNumber(
    multicollinearityData[0].tolerance,
    3
  )} yang berada di atas 0,10. Selain itu, nilai Variance Inflation Factor (VIF) untuk kedua variabel adalah ${formatNumber(
    multicollinearityData[0].vif,
    3
  )} yang jauh di bawah ambang batas 10,00. Dengan demikian, model regresi dinyatakan terbebas dari masalah multikolinearitas.`,

  heteroscedasticity: `Pengujian gejala heteroskedastisitas dilakukan menggunakan uji Glejser dengan meregresikan nilai residual absolut terhadap masing-masing variabel bebas. Nilai signifikansi uji Glejser untuk ${
    heteroscedasticityData[0].variable
  } adalah ${formatNumber(
    heteroscedasticityData[0].pValue,
    3
  )} (t hitung = ${formatNumber(
    heteroscedasticityData[0].tHitung,
    3
  )}) dan untuk ${heteroscedasticityData[1].variable} adalah ${formatNumber(
    heteroscedasticityData[1].pValue,
    3
  )} (t hitung = ${formatNumber(
    heteroscedasticityData[1].tHitung,
    3
  )}). Karena kedua nilai signifikansi lebih besar dari 0,05, maka tidak terdapat gejala heteroskedastisitas pada model regresi yang digunakan.`,

  regression: `Persamaan regresi linier berganda yang dihasilkan adalah Y = ${formatNumber(
    regressionData[0].coefficient,
    3
  )} + ${formatNumber(regressionData[1].coefficient, 3)}X1 + ${formatNumber(
    regressionData[2].coefficient,
    3
  )}X2. Pengujian parsial (uji t) menunjukkan bahwa variabel ${
    regressionData[1].variable
  } berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan dengan t hitung sebesar ${formatNumber(
    regressionData[1].tHitung,
    3
  )} dan nilai signifikansi ${formatNumber(
    regressionData[1].pValue,
    3
  )} < 0,05. Demikian pula, variabel ${
    regressionData[2].variable
  } berpengaruh positif dan signifikan terhadap Loyalitas Pelanggan dengan t hitung sebesar ${formatNumber(
    regressionData[2].tHitung,
    3
  )} dan signifikansi ${formatNumber(
    regressionData[2].pValue,
    3
  )} < 0,05. Nilai koefisien positif menunjukkan bahwa peningkatan kualitas layanan dan kepuasan secara langsung mendorong peningkatan loyalitas pelanggan.`,

  fTest: `Uji signifikansi simultan (uji F) menghasilkan nilai F hitung sebesar ${formatNumber(
    fTestData.fHitung,
    3
  )} yang lebih besar dari nilai F tabel sebesar ${formatNumber(
    fTestData.fTabel,
    3
  )} dengan nilai signifikansi sebesar ${formatNumber(
    fTestData.pValue,
    3
  )} < 0,05. Hal ini membuktikan bahwa Kualitas Layanan (X1) dan Kepuasan Pelanggan (X2) secara serempak atau bersama-sama berpengaruh signifikan terhadap Loyalitas Pelanggan (Y). Model regresi yang dibangun terbukti fit dan layak untuk menjelaskan variasi variabel terikat.`,

  determination: `Berdasarkan tabel koefisien determinasi, diperoleh nilai R Square sebesar ${formatNumber(
    determinationData.rSquare,
    3
  )} dan Adjusted R Square sebesar ${formatNumber(
    determinationData.adjustedRSquare,
    3
  )}. Hal ini mengindikasikan bahwa sebesar ${formatNumber(
    determinationData.adjustedRSquare * 100,
    1
  )}% variasi pada loyalitas pelanggan dapat dijelaskan secara bersama oleh kualitas layanan dan kepuasan pelanggan. Sementara itu, sisa variasi sebesar ${formatNumber(
    (1 - determinationData.adjustedRSquare) * 100,
    1
  )}% dipengaruhi oleh variabel lain di luar model penelitian ini. Nilai standar error estimasi adalah sebesar ${formatNumber(
    determinationData.stdError,
    3
  )}.`,

  correlation: `Analisis korelasi Pearson menunjukkan korelasi antara ${
    correlationData[0].variable1
  } dan ${correlationData[0].variable2} sebesar ${formatNumber(
    correlationData[0].coefficient,
    3
  )} (kategori ${correlationData[0].strength}, p = ${formatNumber(
    correlationData[0].pValue,
    3
  )}). Hubungan antara ${correlationData[1].variable1} dan ${
    correlationData[1].variable2
  } memiliki koefisien korelasi sebesar ${formatNumber(
    correlationData[1].coefficient,
    3
  )} (kategori ${correlationData[1].strength}, p = ${formatNumber(
    correlationData[1].pValue,
    3
  )}). Sedangkan korelasi antara ${correlationData[2].variable1} dan ${
    correlationData[2].variable2
  } mencapai ${formatNumber(
    correlationData[2].coefficient,
    3
  )} (kategori ${correlationData[2].strength}, p = ${formatNumber(
    correlationData[2].pValue,
    3
  )}). Seluruh pasangan variabel berkorelasi positif secara signifikan pada tingkat signifikansi 0,01.`,
};

export const mockResults: AnalysisResults = {
  id: 'result-1',
  projectId: 'project-1',
  dataVersionId: 'dv-2',
  respondentCount: 117,
  timestamp: '2024-10-01T14:30:00Z',
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
