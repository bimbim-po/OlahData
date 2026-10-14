import {
  computePairedTTest,
  computeLeveneTest,
  computeIndependentTTest,
  computeOneWayAnova,
  computeMannWhitneyU,
  computeWilcoxonSignedRank,
  computeKruskalWallis,
  detectResidualOutliers,
  computeSpearmanHeteroscedasticity,
} from '../comparative-stats';
import { mockExperimentalDataset } from '../mock/dataset-contoh';

console.log('--- Menjalankan Tes Modul Statistik Komparatif & Eksperimen (Fase 2) ---');

// 1. Paired Sample t-Test & N-Gain
console.log('\n[1] Pengujian Paired Sample t-Test & N-Gain...');
const preValues = mockExperimentalDataset.map((r) => Number(r.Pre_Test));
const postValues = mockExperimentalDataset.map((r) => Number(r.Post_Test));

const { tTest: pairedRes, nGain } = computePairedTTest(preValues, postValues, 'Pre_Test', 'Post_Test', 100);
console.log(`N: ${pairedRes.n}`);
console.log(`Mean Pre: ${pairedRes.meanPre.toFixed(2)}, Mean Post: ${pairedRes.meanPost.toFixed(2)}`);
console.log(`Mean Diff: ${pairedRes.meanDiff.toFixed(2)}`);
console.log(`t-hitung: ${pairedRes.tHitung.toFixed(3)}, t-tabel: ${pairedRes.tTabel.toFixed(3)}, p-value: ${pairedRes.pValue.toExponential(3)}`);
console.log(`Signifikan: ${pairedRes.significant}`);

if (!pairedRes.significant || pairedRes.tHitung <= pairedRes.tTabel) {
  throw new Error('Paired t-test should be statistically significant');
}

console.log(`N-Gain Rata-rata: ${nGain.meanNGainScore.toFixed(3)} (${nGain.meanNGainPercent.toFixed(1)}%)`);
console.log(`Kategori Hake: ${nGain.hakeCategory}, Tafsiran Meltzer: ${nGain.meltzerCategory}`);
if (nGain.meanNGainScore < 0 || nGain.meanNGainScore > 1) {
  throw new Error('N-Gain score out of bound [0, 1]');
}

// 2. Levene & Independent Sample t-Test
console.log('\n[2] Pengujian Independent Sample t-Test...');
const groupA = mockExperimentalDataset.filter((r) => r.Kelas === 'Kelas Eksperimen').map((r) => Number(r.Post_Test));
const groupB = mockExperimentalDataset.filter((r) => r.Kelas === 'Kelas Kontrol').map((r) => Number(r.Post_Test));

const indepRes = computeIndependentTTest(groupA, groupB, 'Kelas Eksperimen', 'Kelas Kontrol', 'Post_Test', 0.05);
console.log(`Levene F: ${indepRes.levene.fStatistic.toFixed(3)}, Sig: ${indepRes.levene.pValue.toFixed(3)}`);
console.log(`Asumsi Homogenitas: ${indepRes.levene.equalVariancesAssumed ? 'Terpenuhi (Equal variances assumed)' : 'Tidak Terpenuhi (Welch)'}`);
console.log(`t-hitung (Rekomendasi): ${indepRes.recommendedRow.tHitung.toFixed(3)}, df: ${indepRes.recommendedRow.df.toFixed(1)}, p-value: ${indepRes.recommendedRow.pValue.toExponential(3)}`);
console.log(`Mean Diff: ${indepRes.recommendedRow.meanDiff.toFixed(3)}`);

if (indepRes.recommendedRow.tHitung <= 0) {
  throw new Error('Kelas Eksperimen post-test should be significantly higher than control');
}

// 3. One-Way ANOVA & Post-Hoc Tukey HSD
console.log('\n[3] Pengujian One-Way ANOVA & Post-Hoc Tukey...');
const anovaGroups = [
  { name: 'Metode Inkuiri Terbimbing', scores: groupA },
  { name: 'Metode Ceramah Konvensional', scores: groupB },
  { name: 'Metode Hybrid Problem-Based', scores: groupA.map(v => Math.min(100, v + 2)) },
];

const anovaRes = computeOneWayAnova(anovaGroups, 'Hasil Belajar Post-Test', 'Model Pembelajaran');
console.log(`F-hitung: ${anovaRes.fHitung.toFixed(3)}, F-tabel: ${anovaRes.fTabel.toFixed(3)}, p-value: ${anovaRes.pValue.toExponential(3)}`);
console.log(`Signifikan: ${anovaRes.significant}`);
console.log(`Jumlah perbandingan Tukey HSD: ${anovaRes.postHocTukey?.length || 0}`);

if (!anovaRes.significant || anovaRes.fHitung <= anovaRes.fTabel) {
  throw new Error('ANOVA should be significant');
}

// 4. Uji Non-Parametrik (Mann-Whitney, Wilcoxon, Kruskal-Wallis)
console.log('\n[4] Pengujian Uji Non-Parametrik...');
const mwRes = computeMannWhitneyU(groupA, groupB, 'Post_Test', 'Kelas', 'Kelas Eksperimen', 'Kelas Kontrol');
console.log(`Mann-Whitney U: ${mwRes.statistic.toFixed(2)}, Z: ${mwRes.zValue?.toFixed(3)}, p-value: ${mwRes.pValue.toExponential(3)}`);
if (!mwRes.significant) {
  throw new Error('Mann-Whitney U should be significant');
}

const wilcoxonRes = computeWilcoxonSignedRank(preValues, postValues, 'Pre_Test', 'Post_Test');
console.log(`Wilcoxon W: ${wilcoxonRes.statistic.toFixed(2)}, Z: ${wilcoxonRes.zValue?.toFixed(3)}, p-value: ${wilcoxonRes.pValue.toExponential(3)}`);
if (!wilcoxonRes.significant) {
  throw new Error('Wilcoxon should be significant');
}

const kwRes = computeKruskalWallis(anovaGroups, 'Hasil Belajar', 'Model Pembelajaran');
console.log(`Kruskal-Wallis H: ${kwRes.statistic.toFixed(3)}, p-value: ${kwRes.pValue.toExponential(3)}`);
if (!kwRes.significant) {
  throw new Error('Kruskal-Wallis should be significant');
}

// 5. Residual Outlier Detection & Spearman Heteroscedasticity
console.log('\n[5] Pengujian Deteksi Outlier Residual & Spearman Rank Heteroskedastisitas...');
const mockResiduals = [
  ...Array(58).fill(0).map((_, i) => (i % 2 === 0 ? 0.5 : -0.5)),
  15.0, // Extreme positive outlier
  -16.0, // Extreme negative outlier
];
const mockRows = mockResiduals.map((_, i) => ({ No: i + 1 }));

const outlierRes = detectResidualOutliers(mockResiduals, mockRows, 2.5);
console.log(`Outlier terdeteksi (|Z| > 2.5): ${outlierRes.totalOutliers} responden (Nomor Baris: ${outlierRes.outliers.map(o => o.rowNumber).join(', ')})`);
console.log(`Estimasi KS Sig. Baru: ${outlierRes.estimatedNormalSigIfRemoved.toFixed(4)}`);

if (outlierRes.totalOutliers !== 2) {
  throw new Error(`Expected 2 outliers, got ${outlierRes.totalOutliers}`);
}

const spearmanRes = computeSpearmanHeteroscedasticity(
  { 'Kualitas Pelayanan (X1)': [10, 12, 14, 15, 16, 18, 20, 22, 24, 25] },
  [0.2, -0.4, 0.1, -0.2, 0.5, -0.1, 0.3, -0.3, 0.2, -0.1]
);
console.log(`Spearman Rank Heteroskedastisitas: t = ${spearmanRes[0].tHitung.toFixed(3)}, Sig = ${spearmanRes[0].pValue.toFixed(3)}, Bebas = ${!spearmanRes[0].significant}`);

console.log('\n✓ SEMUA PENGUJIAN MODUL STATISTIK KOMPARATIF & TROUBLESHOOTER FASE 2 SUKSES 100%!');
