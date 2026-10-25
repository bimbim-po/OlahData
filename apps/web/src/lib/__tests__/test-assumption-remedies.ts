/**
 * test-assumption-remedies.ts
 * Pengujian Deterministik Unit & Integrasi: Solusi Penyembuhan Asumsi Klasik & Uji Alternatif
 */

import {
  standardNormalInv,
  computeShapiroWilk,
  computeKolmogorovSmirnovLilliefors,
  computeSkewnessKurtosisZTest,
  computeCasewiseDiagnostics,
  computeWhiteHeteroscedasticity,
  analyzeSkewnessAndRecommend,
  transformVariable,
  computeConstructSpearmanMatrix,
} from '../assumption-remedies';
import { computeDeterministicStats } from '../stats-engine';
import { mockDataset } from '../mock/dataset-contoh';

console.log('================================================================');
console.log('🧪 PENGUJIAN PENYEMBUHAN ASUMSI KLASIK & UJI ALTERNATIF (EKONOMETRIKA)');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [LULUS] ${testName}`);
    if (detail) console.log(`     -> ${detail}`);
  } else {
    failed++;
    console.error(`  ❌ [GAGAL] ${testName}`);
    if (detail) console.error(`     -> Galat: ${detail}`);
  }
}

// -----------------------------------------------------------------------------
// BUTIR 1: Pengujian Akurasi Invers Distribusi Normal Baku (Acklam Algorithm)
// -----------------------------------------------------------------------------
console.log('1. Uji Invers Distribusi Normal Baku (Acklam Formula):');
const z975 = standardNormalInv(0.975);
const z025 = standardNormalInv(0.025);
const z50 = standardNormalInv(0.5);
const z84 = standardNormalInv(0.8413447);

assert(
  Math.abs(z975 - 1.95996) < 1e-4,
  'Quantile Z(0.975) tepat bernilai 1.960 (presisi tinggi)',
  `Z(0.975) = ${z975.toFixed(5)}`
);
assert(
  Math.abs(z025 - (-1.95996)) < 1e-4,
  'Quantile Z(0.025) simetris negatif -1.960',
  `Z(0.025) = ${z025.toFixed(5)}`
);
assert(
  Math.abs(z50) < 1e-12,
  'Median Z(0.5) tepat bernilai 0.0',
  `Z(0.5) = ${z50}`
);
assert(
  Math.abs(z84 - 1.0) < 1e-4,
  'Quantile Z(0.8413) setara 1.000 sigma',
  `Z(0.8413) = ${z84.toFixed(5)}`
);

// -----------------------------------------------------------------------------
// BUTIR 2: Pengujian Uji Normalitas Shapiro-Wilk (Royston Algorithm)
// -----------------------------------------------------------------------------
console.log('\n2. Uji Normalitas Shapiro-Wilk:');
// Dataset terdistribusi relatif simetris / normal
const normalSample = [
  -1.85, -1.22, -0.95, -0.71, -0.48, -0.32, -0.15, 0.05,
  0.18, 0.35, 0.52, 0.78, 1.02, 1.25, 1.79
];
const swNormal = computeShapiroWilk(normalSample);

assert(
  swNormal.statistic >= 0.90 && swNormal.normal,
  'Shapiro-Wilk mendeteksi sampel simetris sebagai normal (p >= 0,05)',
  `W = ${swNormal.statistic}, p-value = ${swNormal.pValue}, normal = ${swNormal.normal}`
);

// Dataset miring ekstrim (exponential / skewed)
const skewedSample = [0.1, 0.15, 0.2, 0.22, 0.25, 0.3, 0.35, 0.4, 0.5, 0.8, 1.5, 3.2, 7.8, 15.4];
const swSkewed = computeShapiroWilk(skewedSample);

assert(
  swSkewed.statistic < 0.85 && !swSkewed.normal,
  'Shapiro-Wilk secara sensitif menolak normalitas pada data miring ekstrim (p < 0,05)',
  `W = ${swSkewed.statistic}, p-value = ${swSkewed.pValue}, normal = ${swSkewed.normal}`
);

// -----------------------------------------------------------------------------
// BUTIR 3: Pengujian Kolmogorov-Smirnov dengan Koreksi Lilliefors
// -----------------------------------------------------------------------------
console.log('\n3. Uji Kolmogorov-Smirnov Lilliefors (SPSS Correction):');
const lillieforsRes = computeKolmogorovSmirnovLilliefors(normalSample);

assert(
  lillieforsRes.statistic > 0 && typeof lillieforsRes.pValue === 'number',
  'Statistik D Lilliefors dan p-value terhitung valid',
  `D = ${lillieforsRes.statistic}, Sig. = ${lillieforsRes.pValue}, normal = ${lillieforsRes.normal}`
);

// -----------------------------------------------------------------------------
// BUTIR 4: Pengujian Rasio Z-Score Skewness & Kurtosis (Ghozali / Hair)
// -----------------------------------------------------------------------------
console.log('\n4. Uji Rasio Z-Score Skewness & Kurtosis:');
const zkNormal = computeSkewnessKurtosisZTest(normalSample);
const zkSkewed = computeSkewnessKurtosisZTest(skewedSample);

assert(
  zkNormal.normalAt95 && Math.abs(zkNormal.zSkewness) <= 1.96,
  'Z-Score Skewness data normal berada dalam toleransi |Z| <= 1.96',
  `Z_skew = ${zkNormal.zSkewness}, Z_kurt = ${zkNormal.zKurtosis}, normal95 = ${zkNormal.normalAt95}`
);
assert(
  Math.abs(zkSkewed.zSkewness) > 1.96 && !zkSkewed.normalAt95,
  'Z-Score Skewness mendeteksi anomali pada data miring ekstrim (|Z| > 1.96)',
  `Z_skew = ${zkSkewed.zSkewness}, p-value = ${zkSkewed.pSkewness}`
);

// -----------------------------------------------------------------------------
// BUTIR 5: Pengujian Casewise Diagnostics & Deteksi Outlier Ekstrem
// -----------------------------------------------------------------------------
console.log('\n5. Uji Casewise Diagnostics (|Z| > 3.0 / 2.5):');
const dummyYObs = [10, 11, 12, 10, 11, 12, 10, 11, 12, 45]; // Responden 10 outlier ekstrem
const dummyYPred = [10.2, 10.8, 11.9, 10.1, 11.2, 11.8, 10.3, 10.9, 11.7, 11.5];
const dummyRes = dummyYObs.map((y, i) => y - dummyYPred[i]);

const cdSummary = computeCasewiseDiagnostics(dummyRes, dummyYObs, dummyYPred, undefined, 2.5);

assert(
  cdSummary.outlierCount === 1,
  'Casewise diagnostics mendeteksi tepat 1 outlier ekstrem',
  `Outlier count = ${cdSummary.outlierCount}`
);
assert(
  cdSummary.outlierCases[0].caseNumber === 10,
  'Nomor responden outlier teridentifikasi akurat (Kasus 10 / R010)',
  `Case ID: ${cdSummary.outlierCases[0].caseId}, Z_res: ${cdSummary.outlierCases[0].stdResidual}`
);

// -----------------------------------------------------------------------------
// BUTIR 6: Pengujian Uji Heteroskedastisitas White (White Test)
// -----------------------------------------------------------------------------
console.log('\n6. Uji Heteroskedastisitas White (White Test LM):');
// Kasus homoskedastis: residual acak kecil tidak berhubungan dengan Y_hat
const homoscedasticYPred = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38];
const homoscedasticRes = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1, 0.2, -0.3, 0.1, -0.2, 0.2, -0.1, 0.3, -0.2, 0.1];
const whiteRes = computeWhiteHeteroscedasticity(homoscedasticYPred, homoscedasticRes);

assert(
  whiteRes.homoscedastic && whiteRes.pValue >= 0.05,
  'Uji White mengonfirmasi residual homoskedastis (p >= 0,05)',
  `LM = ${whiteRes.lmStatistic}, df = ${whiteRes.df}, p-value = ${whiteRes.pValue}`
);

// -----------------------------------------------------------------------------
// BUTIR 7: Pengujian Transformasi Data & Rekomendasi
// -----------------------------------------------------------------------------
console.log('\n7. Uji Rekomendasi & Transformasi Ekonometrika:');
const skewedValues = [1, 1.2, 1.5, 2, 2.5, 4, 7, 12, 25, 60, 150];
const rec = analyzeSkewnessAndRecommend(skewedValues, 'Pendapatan');

assert(
  rec.pattern === 'positive_severe' && rec.recommendedMethod === 'log10',
  'Analisis otomatis merekomendasikan Log10 untuk data dengan kemiringan positif tinggi',
  `Pattern: ${rec.pattern}, Rekomendasi: ${rec.recommendedLabel}`
);

const transformedLog = transformVariable(skewedValues, 'log10');
assert(
  transformedLog.improved && Math.abs(transformedLog.newSkewness) < Math.abs(transformedLog.originalSkewness),
  'Transformasi Log10 berhasil menurunkan skewness secara signifikan',
  `Skewness awal: ${transformedLog.originalSkewness} -> Skewness baru: ${transformedLog.newSkewness}`
);

// -----------------------------------------------------------------------------
// BUTIR 8: Pengujian Matriks Korelasi Non-Parametrik Rank Spearman
// -----------------------------------------------------------------------------
console.log('\n8. Uji Matriks Korelasi Non-Parametrik Rank Spearman:');
const constructScores = {
  X1: [10, 20, 30, 40, 50, 60],
  X2: [5, 12, 18, 25, 30, 42],
  Y: [15, 28, 45, 58, 72, 90],
};
const spearmanMatrix = computeConstructSpearmanMatrix(constructScores);

assert(
  spearmanMatrix.length === 3,
  'Matriks Rank Spearman menghasilkan 3 pasangan korelasi lengkap (X1-X2, X1-Y, X2-Y)',
  `Jumlah pasangan: ${spearmanMatrix.length}`
);
assert(
  spearmanMatrix.every((item) => item.rho > 0.95 && item.significant),
  'Koefisien Spearman rho mendekati 1.00 untuk data monoton sempurna',
  `X1-Y rho = ${spearmanMatrix[1].rho}, p-value = ${spearmanMatrix[1].pValue}`
);

// -----------------------------------------------------------------------------
// BUTIR 9: Pengujian Integrasi Penuh dengan Engine Statistik (computeDeterministicStats)
// -----------------------------------------------------------------------------
console.log('\n9. Uji Integrasi Mesin Statistik Utama (computeDeterministicStats):');
const stats = computeDeterministicStats({
  rows: mockDataset,
  constructs: [
    {
      id: 'KL',
      name: 'Kualitas Layanan',
      role: 'independent',
      items: ['KL1', 'KL2', 'KL3', 'KL4', 'KL5'],
    },
    {
      id: 'KP',
      name: 'Kepuasan Pengguna',
      role: 'independent',
      items: ['KP1', 'KP2', 'KP3', 'KP4', 'KP5'],
    },
    {
      id: 'LP',
      name: 'Loyalitas Pengguna',
      role: 'dependent',
      items: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
    },
  ],
  selectedTests: [
    'descriptive',
    'validity',
    'reliability',
    'normality',
    'multicollinearity',
    'heteroscedasticity',
    'regression',
    'correlation',
  ],
});

assert(
  stats.shapiroWilk !== undefined && stats.shapiroWilk.statistic > 0,
  'Engine menghasilkan hasil uji Shapiro-Wilk terintegrasi',
  `W = ${stats.shapiroWilk?.statistic}, p = ${stats.shapiroWilk?.pValue}`
);
assert(
  stats.lillieforsNormality !== undefined,
  'Engine menghasilkan hasil uji Lilliefors terintegrasi',
  `D = ${stats.lillieforsNormality?.statistic}, Sig = ${stats.lillieforsNormality?.pValue}`
);
assert(
  stats.skewnessKurtosis !== undefined && stats.skewnessKurtosis.n === stats.respondentCount,
  'Engine menghasilkan uji Z-Score Skewness & Kurtosis dengan N konsisten',
  `N = ${stats.skewnessKurtosis?.n}, Z_skew = ${stats.skewnessKurtosis?.zSkewness}`
);
assert(
  stats.whiteHetero !== undefined && stats.whiteHetero.df === 2,
  'Engine menghasilkan Uji Heteroskedastisitas White (LM & p-value)',
  `LM = ${stats.whiteHetero?.lmStatistic}, p = ${stats.whiteHetero?.pValue}`
);
assert(
  stats.casewiseDiagnostics !== undefined && stats.casewiseDiagnostics.totalCases === stats.respondentCount,
  'Engine menghasilkan Casewise Diagnostics mencakup seluruh responden',
  `Total cases = ${stats.casewiseDiagnostics?.totalCases}, Outlier count = ${stats.casewiseDiagnostics?.outlierCount}`
);
assert(
  stats.transformationRecommendations !== undefined && stats.transformationRecommendations.length === 3,
  'Engine menghasilkan rekomendasi transformasi untuk setiap variabel konstruk',
  `Rekomendasi variabel count: ${stats.transformationRecommendations?.length}`
);
assert(
  stats.spearmanConstructMatrix !== undefined && stats.spearmanConstructMatrix.length > 0,
  'Engine menghasilkan matriks korelasi non-parametrik Rank Spearman antar konstruk',
  `Pasangan Spearman = ${stats.spearmanConstructMatrix?.length}`
);

console.log('================================================================');
console.log(`HASIL AKHIR PENGUJIAN: ${passed} LULUS, ${failed} GAGAL (Total: ${passed + failed})`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
