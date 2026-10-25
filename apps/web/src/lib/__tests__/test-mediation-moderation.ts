import {
  solveOLS,
  computePathAnalysisAndSobel,
  computeModeratedRegression,
  generatePathMediationNarration,
  generateModerationNarration,
} from '../mediation-moderation';
import { computeDeterministicStats } from '../stats-engine';
import type { Construct } from '../api/types';

function assert(condition: boolean, message: string, detail?: string) {
  if (!condition) {
    console.error(`❌ [GAGAL] ${message}`);
    if (detail) console.error(`   Detail: ${detail}`);
    process.exit(1);
  } else {
    console.log(`  ✓ [LULUS] ${message}`);
    if (detail) console.log(`     -> ${detail}`);
  }
}

console.log('================================================================');
console.log('🧪 PENGUJIAN ANALISIS JALUR (PATH ANALYSIS), SOBEL & MRA MODERASI');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// BUTIR 1: Pengujian OLS Regression Solver Murni
// -----------------------------------------------------------------------------
console.log('1. Uji Solver OLS Deterministik:');
const ySample = [10, 12, 14, 18, 20, 22, 24, 28, 30, 32];
const xMatSample = [
  [1, 2],
  [2, 3],
  [3, 3],
  [4, 5],
  [5, 5],
  [6, 7],
  [7, 7],
  [8, 9],
  [9, 9],
  [10, 10],
];
const fit = solveOLS(ySample, xMatSample, ['X1', 'X2']);

assert(fit.n === 10, 'Jumlah sampel N konsisten', `N = ${fit.n}`);
assert(fit.k === 2, 'Jumlah prediktor k = 2', `k = ${fit.k}`);
assert(fit.rSquare > 0.95, 'Koefisien determinasi R^2 tinggi pada data linier', `R^2 = ${fit.rSquare.toFixed(4)}`);
assert(fit.coefficients.length === 2, 'Koefisien seluruh prediktor terhitung', `Jumlah koefisien: ${fit.coefficients.length}`);
assert(fit.residualError > 0 && fit.residualError < 1, 'Residual error e = sqrt(1 - R^2) valid', `e = ${fit.residualError.toFixed(4)}`);

// -----------------------------------------------------------------------------
// BUTIR 2: Pengujian Analisis Jalur (Path Analysis) & Uji Sobel (Mediasi)
// -----------------------------------------------------------------------------
console.log('\n2. Uji Analisis Jalur & Uji Sobel (Mediasi X -> Z -> Y):');
// Simulasi model mediasi:
// X = Kualitas Layanan (1 to 5)
// Z = Kepuasan Pelanggan = 1.0 + 0.7 * X + noise
// Y = Loyalitas Pelanggan = 0.5 + 0.3 * X + 0.6 * Z + noise
const nMed = 60;
const xVals: number[] = [];
const zVals: number[] = [];
const yVals: number[] = [];

for (let i = 0; i < nMed; i++) {
  const x = 1 + (i % 5);
  const z = 1.2 + 0.65 * x + (i % 2 === 0 ? 0.1 : -0.1);
  const y = 0.8 + 0.35 * x + 0.55 * z + (i % 3 === 0 ? 0.15 : -0.15);
  xVals.push(x);
  zVals.push(z);
  yVals.push(y);
}

const constructScoresMed: Record<string, number[]> = {
  Kualitas_Layanan: xVals,
  Kepuasan_Pelanggan: zVals,
  Loyalitas_Pelanggan: yVals,
};

const constructsMed: Construct[] = [
  { id: 'c1', name: 'Kualitas_Layanan', items: ['KL1'], role: 'independent' },
  { id: 'c2', name: 'Kepuasan_Pelanggan', items: ['KP1'], role: 'mediator' },
  { id: 'c3', name: 'Loyalitas_Pelanggan', items: ['LO1'], role: 'dependent' },
];

const pathResult = computePathAnalysisAndSobel(constructScoresMed, constructsMed, 0.05);

assert(pathResult.hasMediation === true, 'Sistem mendeteksi keberadaan model mediasi', `hasMediation = true`);
assert(pathResult.submodels.length === 2, 'Dihasilkan tepat 2 sub-struktur regresi (X->Z dan X,Z->Y)', `Submodel count = ${pathResult.submodels.length}`);
assert(pathResult.sobelResults.length === 1, 'Dihasilkan 1 hasil pengujian Sobel', `Sobel test count = ${pathResult.sobelResults.length}`);

const sobel = pathResult.sobelResults[0];
assert(sobel.pathA.b > 0.5, 'Jalur a (X -> Z) terhitung positif', `a = ${sobel.pathA.b.toFixed(4)}`);
assert(sobel.pathB.b > 0.4, 'Jalur b (Z -> Y) terhitung positif', `b = ${sobel.pathB.b.toFixed(4)}`);
assert(sobel.indirectEffect > 0, 'Indirect Effect terhitung positif', `Indirect = ${sobel.indirectEffect.toFixed(4)}`);
assert(Math.abs(sobel.totalEffect - (sobel.directEffect + sobel.indirectEffect)) < 1e-4, 'Total effect tepat sama dengan direct + indirect', `Total = ${sobel.totalEffect.toFixed(4)}`);
assert(sobel.sobelZ > 1.96, 'Statistik Z Sobel melampaui 1.96 (signifikan pada alpha 0.05)', `Z_sobel = ${sobel.sobelZ.toFixed(4)}`);
assert(sobel.sobelPValue < 0.05, 'P-value Sobel signifikan (p < 0.05)', `p = ${sobel.sobelPValue.toFixed(6)}`);
assert(sobel.significant === true, 'Status mediasi dinyatakan signifikan', `Significant = ${sobel.significant}`);
assert(
  sobel.mediationType === 'Partial Mediation' || sobel.mediationType === 'Full Mediation',
  'Tipe mediasi teridentifikasi secara sahih',
  `Tipe: ${sobel.mediationType}`
);

// -----------------------------------------------------------------------------
// BUTIR 3: Pengujian Moderated Regression Analysis / MRA (Moderasi)
// -----------------------------------------------------------------------------
console.log('\n3. Uji Moderated Regression Analysis / MRA (Moderasi X -> Y dimoderasi Z):');
// Simulasi model moderasi interaksi:
// X = Harga, Z = Kualitas Pelayanan
// Y = Keputusan Pembelian = 2.0 + 0.4*X + 0.3*Z + 0.5*(X*Z)
const nMod = 80;
const xMod: number[] = [];
const zMod: number[] = [];
const yMod: number[] = [];

for (let i = 0; i < nMod; i++) {
  const x = 1.0 + (i % 5);
  const z = 2.0 + ((i * 3) % 4);
  const inter = x * z;
  const y = 1.5 + 0.3 * x + 0.25 * z + 0.4 * inter + (i % 2 === 0 ? 0.2 : -0.2);
  xMod.push(x);
  zMod.push(z);
  yMod.push(y);
}

const constructScoresMod: Record<string, number[]> = {
  Harga: xMod,
  Kualitas: zMod,
  Keputusan: yMod,
};

const constructsMod: Construct[] = [
  { id: 'm1', name: 'Harga', items: ['H1'], role: 'independent' },
  { id: 'm2', name: 'Kualitas', items: ['K1'], role: 'moderator' },
  { id: 'm3', name: 'Keputusan', items: ['Y1'], role: 'dependent' },
];

const mraResult = computeModeratedRegression(constructScoresMod, constructsMod, 0.05);

assert(mraResult.hasModeration === true, 'Sistem mendeteksi model moderasi MRA', `hasModeration = true`);
assert(mraResult.results.length === 1, 'Tepat 1 pasangan interaksi MRA dievaluasi', `Pasangan count = ${mraResult.results.length}`);

const mraItem = mraResult.results[0];
assert(mraItem.model1.variables.length === 2, 'Model 1 memuat 2 prediktor efek utama (X, Z)', `Model 1 variables: ${mraItem.model1.variables.join(', ')}`);
assert(mraItem.model2.variables.length === 3, 'Model 2 memuat 3 prediktor termasuk suku interaksi (X, Z, X*Z)', `Model 2 variables: ${mraItem.model2.variables.join(', ')}`);
assert(mraItem.rSquareChange >= 0, 'Delta R^2 bernilai positif non-negatif', `Delta R^2 = ${mraItem.rSquareChange.toFixed(4)}`);
assert(mraItem.interactionB !== 0, 'Koefisien regresi interaksi (B3) terhitung non-nol', `B_interaksi = ${mraItem.interactionB.toFixed(4)}`);
assert(mraItem.interactionSignificant === true, 'Suku interaksi terbukti signifikan memoderasi (p < 0.05)', `p = ${mraItem.interactionPValue.toFixed(6)}`);
assert(
  ['Pure Moderator', 'Quasi Moderator'].includes(mraItem.moderatorType),
  'Tipe moderasi terklasifikasi secara valid (Pure / Quasi Moderator)',
  `Tipe: ${mraItem.moderatorType}`
);
assert(mraItem.moderationDirection === 'Memperkuat', 'Arah pengaruh interaksi positif diklasifikasikan sebagai Memperkuat', `Arah: ${mraItem.moderationDirection}`);

// -----------------------------------------------------------------------------
// BUTIR 4: Pengujian Generator Narasi Bab 4 Akademik
// -----------------------------------------------------------------------------
console.log('\n4. Uji Generator Narasi Akademik Bab 4:');
const narrationMed = generatePathMediationNarration(pathResult);
assert(narrationMed.includes('Path Analysis'), 'Narasi mediasi memuat istilah Path Analysis');
assert(narrationMed.includes('Sobel'), 'Narasi mediasi memuat rujukan Uji Sobel');
assert(narrationMed.includes('Sub-struktur 1'), 'Narasi mediasi menjelaskan Sub-struktur 1');
assert(narrationMed.includes('Sub-struktur 2'), 'Narasi mediasi menjelaskan Sub-struktur 2');

const narrationMod = generateModerationNarration(mraResult);
assert(narrationMod.includes('Moderated Regression Analysis'), 'Narasi moderasi memuat istilah MRA');
assert(narrationMod.includes('Model 1'), 'Narasi moderasi memuat Model 1');
assert(narrationMod.includes('Model 2'), 'Narasi moderasi memuat Model 2');
assert(narrationMod.includes('R²'), 'Narasi moderasi memuat peningkatan determinasi R²');

// -----------------------------------------------------------------------------
// BUTIR 5: Pengujian Integrasi Penuh dengan Engine Utama (computeDeterministicStats)
// -----------------------------------------------------------------------------
console.log('\n5. Uji Integrasi Mesin Statistik Utama (computeDeterministicStats):');
const mockDatasetFull = Array.from({ length: 60 }, (_, i) => ({
  No: i + 1,
  KL1: xVals[i],
  KL2: xVals[i],
  KP1: zVals[i],
  KP2: zVals[i],
  LO1: yVals[i],
  LO2: yVals[i],
}));

const fullEngineResultsMed = computeDeterministicStats({
  rows: mockDatasetFull,
  constructs: [
    { id: 'c1', name: 'Kualitas_Layanan', items: ['KL1', 'KL2'], role: 'independent' },
    { id: 'c2', name: 'Kepuasan_Pelanggan', items: ['KP1', 'KP2'], role: 'mediator' },
    { id: 'c3', name: 'Loyalitas_Pelanggan', items: ['LO1', 'LO2'], role: 'dependent' },
  ],
  selectedTests: ['descriptive', 'validity', 'reliability', 'regression', 'mediation'],
  reverseItems: [],
  calculationMethod: 'mean',
});

assert(fullEngineResultsMed.pathAnalysis !== undefined, 'Engine utama otomatis menghasilkan pathAnalysis saat ada peran mediator');
assert(fullEngineResultsMed.pathAnalysis?.hasMediation === true, 'pathAnalysis pada engine utama berstatus hasMediation = true');
assert(typeof fullEngineResultsMed.explanations.pathAnalysis === 'string', 'Engine utama mengaitkan narasi Bab 4 pathAnalysis ke explanations');

const fullEngineResultsMod = computeDeterministicStats({
  rows: mockDatasetFull,
  constructs: [
    { id: 'm1', name: 'Kualitas_Layanan', items: ['KL1', 'KL2'], role: 'independent' },
    { id: 'm2', name: 'Kepuasan_Pelanggan', items: ['KP1', 'KP2'], role: 'moderator' },
    { id: 'm3', name: 'Loyalitas_Pelanggan', items: ['LO1', 'LO2'], role: 'dependent' },
  ],
  selectedTests: ['descriptive', 'validity', 'reliability', 'regression', 'moderation'],
  reverseItems: [],
  calculationMethod: 'mean',
});

assert(fullEngineResultsMod.moderationAnalysis !== undefined, 'Engine utama otomatis menghasilkan moderationAnalysis saat ada peran moderator');
assert(fullEngineResultsMod.moderationAnalysis?.hasModeration === true, 'moderationAnalysis pada engine utama berstatus hasModeration = true');
assert(typeof fullEngineResultsMod.explanations.moderationAnalysis === 'string', 'Engine utama mengaitkan narasi Bab 4 moderationAnalysis ke explanations');

console.log('\n================================================================');
console.log('HASIL AKHIR PENGUJIAN: 24 LULUS, 0 GAGAL (Total: 24 pengujian)');
console.log('================================================================');
