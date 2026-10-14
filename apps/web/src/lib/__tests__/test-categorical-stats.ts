import { computeCrosstabAndChiSquare } from '../categorical-stats';
import { mockHealthDataset } from '../mock/dataset-contoh';

console.log('--- Menjalankan Tes Modul Statistik Hubungan Kategori (Fase 3) ---');

// 1. Crosstab & Chi-Square Calculation on Mock Health Dataset
console.log('\n[1] Pengujian Tabulasi Silang & Chi-Square pada mockHealthDataset (N=100)...');

const { crosstab, chiSquare, riskEstimate, symmetricMeasures } = computeCrosstabAndChiSquare(
  mockHealthDataset,
  'Kebiasaan_Merokok',
  'Kejadian_Hipertensi',
  0.05
);

console.log(`Variabel Baris: ${crosstab.rowVar} (Kategori: ${crosstab.rowCategories.join(', ')})`);
console.log(`Variabel Kolom: ${crosstab.colVar} (Kategori: ${crosstab.colCategories.join(', ')})`);
console.log(`Total N Valid: ${crosstab.totalN}`);

// Periksa N = 100
if (crosstab.totalN !== 100) {
  throw new Error(`Total N should be 100, got ${crosstab.totalN}`);
}

// Matrix cell counts:
// a = Merokok & Hipertensi
// b = Merokok & Tidak Hipertensi
// c = Tidak Merokok & Hipertensi
// d = Tidak Merokok & Tidak Hipertensi
const r0 = crosstab.rowCategories[0]; // Merokok
const r1 = crosstab.rowCategories[1]; // Tidak Merokok
const c0 = crosstab.colCategories[0]; // Hipertensi
const c1 = crosstab.colCategories[1]; // Tidak Hipertensi

const a = crosstab.matrix[0][0];
const b = crosstab.matrix[0][1];
const c = crosstab.matrix[1][0];
const d = crosstab.matrix[1][1];

console.log(`Tabel Kontingensi 2x2: [${r0}] ${c0}=${a}, ${c1}=${b} | [${r1}] ${c0}=${c}, ${c1}=${d}`);

// Expected Counts
const e00 = crosstab.expectedMatrix[0][0];
const e01 = crosstab.expectedMatrix[0][1];
const e10 = crosstab.expectedMatrix[1][0];
const e11 = crosstab.expectedMatrix[1][1];
console.log(`Frekuensi Harapan (Expected Counts): e00=${e00.toFixed(2)}, e01=${e01.toFixed(2)}, e10=${e10.toFixed(2)}, e11=${e11.toFixed(2)}`);

if (e00 <= 0 || e01 <= 0 || e10 <= 0 || e11 <= 0) {
  throw new Error('Expected counts must be positive');
}

// Chi-Square Tests
console.log('\n[2] Hasil Mesin Uji Chi-Square:');
console.log(`Pearson Chi-Square: ${chiSquare.pearsonChiSquare.toFixed(3)}, df: ${chiSquare.df}, Sig: ${chiSquare.pearsonSig.toExponential(3)}`);
if (chiSquare.continuityCorrection !== undefined) {
  console.log(`Continuity Correction (Yates): ${chiSquare.continuityCorrection.toFixed(3)}, Sig: ${chiSquare.continuityCorrectionSig?.toExponential(3)}`);
}
if (chiSquare.likelihoodRatio !== undefined) {
  console.log(`Likelihood Ratio: ${chiSquare.likelihoodRatio.toFixed(3)}, Sig: ${chiSquare.likelihoodRatioSig?.toExponential(3)}`);
}
if (chiSquare.fisherExact !== undefined) {
  console.log(`Fisher's Exact Test (2-sided): ${chiSquare.fisherExact.toExponential(3)}, (1-sided): ${chiSquare.fisherExact1Sided?.toExponential(3)}`);
}
console.log(`Catatan Kaki Cochran: "${chiSquare.cochranFootnote}"`);
console.log(`Expected Count Terendah: ${chiSquare.minExpectedCount.toFixed(2)}`);

// Verifikasi kaidah Cochran pada data ini (semua expected >= 5)
if (chiSquare.minExpectedCount < 5) {
  throw new Error('All expected counts in mockHealthDataset should be >= 5');
}
if (chiSquare.pearsonSig >= 0.05) {
  throw new Error('Smoking and Hypertension should have statistically significant association (p < 0.05)');
}

// 3. Estimasi Risiko Epidemiologi (Odds Ratio & Relative Risk)
console.log('\n[3] Estimasi Risiko Epidemiologi:');
if (!riskEstimate) {
  throw new Error('Risk estimate must be computed for 2x2 table');
}

console.log(`Odds Ratio (OR): ${riskEstimate.oddsRatio.toFixed(3)}`);
console.log(`95% CI: ${riskEstimate.ciLower.toFixed(3)} - ${riskEstimate.ciUpper.toFixed(3)}`);
console.log(`RR Cohort 1 (${c0}): ${riskEstimate.forCohortRisk1.toFixed(3)} (95% CI: ${riskEstimate.forCohortRisk1CiLower.toFixed(3)} - ${riskEstimate.forCohortRisk1CiUpper.toFixed(3)})`);
console.log(`RR Cohort 2 (${c1}): ${riskEstimate.forCohortRisk2.toFixed(3)} (95% CI: ${riskEstimate.forCohortRisk2CiLower.toFixed(3)} - ${riskEstimate.forCohortRisk2CiUpper.toFixed(3)})`);
console.log(`Kesimpulan: ${riskEstimate.conclusion}`);

// Verifikasi Odds Ratio > 1 dan CI tidak mencakup 1
if (riskEstimate.oddsRatio <= 1 || riskEstimate.ciLower <= 1) {
  throw new Error('Odds ratio should be significantly greater than 1 with CI > 1');
}

// 4. Symmetric Measures
console.log('\n[4] Symmetric Measures:');
if (!symmetricMeasures) {
  throw new Error('Symmetric measures must be computed');
}
console.log(`Phi: ${symmetricMeasures.phi !== undefined ? symmetricMeasures.phi.toFixed(3) : '-'} (${symmetricMeasures.phiStrength || '-'})`);
console.log(`Cramer's V: ${symmetricMeasures.cramersV.toFixed(3)} (${symmetricMeasures.cramersVStrength})`);
console.log(`Contingency Coefficient C: ${symmetricMeasures.contingencyCoeff.toFixed(3)} (${symmetricMeasures.contingencyCoeffStrength})`);
console.log(`Approximate Sig: ${symmetricMeasures.pValue.toExponential(3)}`);

if (symmetricMeasures.cramersV <= 0 || symmetricMeasures.cramersV > 1) {
  throw new Error('Cramer\'s V must be between 0 and 1');
}

console.log('\n✅ Seluruh pengujian deterministik Modul Hubungan Kategori (Chi-Square & OR) BERHASIL 100%!');
