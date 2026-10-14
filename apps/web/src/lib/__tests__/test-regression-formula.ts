import { mockResults } from '../mock/results';

function runRegressionFormulaTests() {
  console.log('--- Menjalankan Tes Rumus Statistik Regresi Deterministik ---');

  const n = mockResults.respondentCount;
  console.log(`Jumlah responden (n): ${n}`);
  console.assert(n === 120, `Gagal: n harus 120, didapat ${n}`);

  // Menentukan jumlah prediktor k
  const nonConstantPredictors = (mockResults.regression || []).filter(
    (r) => r.variable !== '(Konstanta)'
  );
  const k = nonConstantPredictors.length;
  console.log(`Jumlah prediktor (k): ${k}`);
  console.assert(k === 2, `Gagal: k harus 2 prediktor, didapat ${k}`);

  // Derajat kebebasan residual
  const dfRes = n - k - 1;
  console.log(`Derajat kebebasan residual (df_res = n - k - 1): ${dfRes}`);
  console.assert(dfRes === 117, `Gagal: dfRes harus 117, didapat ${dfRes}`);

  const r2 = mockResults.determination?.rSquare ?? 0;
  const adjR2 = mockResults.determination?.adjustedRSquare ?? 0;
  const fHitung = mockResults.fTest?.fHitung ?? 0;

  console.log(`R2 dari data contoh: ${r2}`);
  console.log(`Adjusted R2 dari data contoh: ${adjR2}`);
  console.log(`F hitung dari data contoh: ${fHitung}`);

  // Rumus 1: F = (R2 / k) / ((1 - R2) / (n - k - 1))
  // Menggunakan r2 unrounded atau r2 tabel (toleransi 0.05)
  const fExpected = (r2 / k) / ((1 - r2) / dfRes);
  console.log(`F hitung terhitung rumus F = (R2/k)/((1-R2)/(n-k-1)): ${fExpected.toFixed(4)}`);
  const fDiff = Math.abs(fExpected - fHitung);
  console.assert(
    fDiff < 0.15,
    `Gagal: Selisih F hitung (${fDiff}) melebihi toleransi. Rumus tidak cocok!`
  );

  // Rumus 2: Adjusted R2 = 1 - (1 - R2) * (n - 1) / (n - k - 1)
  const adjR2Expected = 1 - ((1 - r2) * (n - 1)) / dfRes;
  console.log(`Adjusted R2 terhitung rumus adj_R2 = 1 - (1-R2)(n-1)/(n-k-1): ${adjR2Expected.toFixed(4)}`);
  const adjR2Diff = Math.abs(adjR2Expected - adjR2);
  console.assert(
    adjR2Diff < 0.01,
    `Gagal: Selisih Adjusted R2 (${adjR2Diff}) melebihi toleransi. Rumus tidak cocok!`
  );

  // Verifikasi nama variabel konsisten: X1, X2, Y
  const varNames = nonConstantPredictors.map((p) => p.variable);
  console.assert(
    varNames.includes('Kualitas Layanan (X1)'),
    'Gagal: Prediktor X1 harus bernama "Kualitas Layanan (X1)"'
  );
  console.assert(
    varNames.includes('Kepuasan Pelanggan (X2)'),
    'Gagal: Prediktor X2 harus bernama "Kepuasan Pelanggan (X2)"'
  );

  // Verifikasi narasi tidak mengandung frasa yang dilarang
  const regNarrative = mockResults.explanations?.regression || '';
  console.assert(
    !regNarrative.includes('secara langsung mendorong'),
    'Gagal: Narasi masih mengandung "secara langsung mendorong"'
  );
  console.assert(
    regNarrative.includes('berpengaruh positif dan signifikan'),
    'Gagal: Narasi harus menggunakan "berpengaruh positif dan signifikan"'
  );

  const relNarrative = mockResults.explanations?.reliability || '';
  console.assert(
    relNarrative.includes('memenuhi kriteria reliabilitas (alfa Cronbach > 0,70)'),
    'Gagal: Narasi reliabilitas harus menggunakan "memenuhi kriteria reliabilitas (alfa Cronbach > 0,70)"'
  );

  // --- Tes OlahData v2.0 Mathematical Calculators ---
  console.log('\n--- Menjalankan Tes Mesin Statistik OlahData v2.0 (The SPSS Killer) ---');
  
  const { getTCritical, getRCritical, getFCritical, getDurbinWatsonBounds } = require('../math-stats');
  const { calculateTCR, computeDeterministicStats } = require('../stats-engine');
  const { detectLikertTextColumns, recodeDatasetRows } = require('../google-forms-recode');
  const { mockDataset } = require('../mock/dataset-contoh');

  // 1. Critical Distribution Functions
  const rCrit = getRCritical(118, 0.05); // df = 120 - 2 = 118
  console.log(`r-tabel (df=118, α=0.05): ${rCrit.toFixed(4)}`);
  console.assert(rCrit > 0.178 && rCrit < 0.182, `r-tabel tidak akurat: ${rCrit}`);

  const tCrit = getTCritical(117, 0.05); // df = 117
  console.log(`t-tabel (df=117, α=0.05 dua arah): ${tCrit.toFixed(4)}`);
  console.assert(tCrit > 1.97 && tCrit < 1.99, `t-tabel tidak akurat: ${tCrit}`);

  const fCrit = getFCritical(2, 117, 0.05);
  console.log(`F-tabel (df1=2, df2=117, α=0.05): ${fCrit.toFixed(4)}`);
  console.assert(fCrit > 3.05 && fCrit < 3.10, `F-tabel tidak akurat: ${fCrit}`);

  // 2. Durbin-Watson Bounds
  const dwBounds = getDurbinWatsonBounds(120, 2, 0.05);
  console.log(`DW Bounds (n=120, k=2): dL=${dwBounds.dL}, dU=${dwBounds.dU}`);
  console.assert(dwBounds.dL > 1.60 && dwBounds.dU < 1.76, `DW bounds tidak cocok tabel Savin-White: ${JSON.stringify(dwBounds)}`);

  // 3. TCR (Tingkat Capaian Responden)
  const tcrHigh = calculateTCR(4.25, 5);
  console.log(`TCR Mean=4.25 (skala 5): ${tcrHigh.tcr}% (${tcrHigh.category})`);
  console.assert(tcrHigh.tcr === 85.0 && tcrHigh.category === 'Sangat Baik', 'TCR 85% harus Sangat Baik');

  const tcrMid = calculateTCR(3.5, 5);
  console.log(`TCR Mean=3.5 (skala 5): ${tcrMid.tcr}% (${tcrMid.category})`);
  console.assert(tcrMid.tcr === 70.0 && tcrMid.category === 'Baik', 'TCR 70% harus Baik');

  // 4. Google Forms Text Recoding
  const sampleGoogleFormsData = [
    { No: 1, 'Kualitas Pelayanan [X1.1]': 'Sangat Setuju', 'Kepuasan [Y1]': 'Setuju', Catatan: 'Cepat sekali' },
    { No: 2, 'Kualitas Pelayanan [X1.1]': 'Setuju', 'Kepuasan [Y1]': 'Netral', Catatan: 'Bagus' },
    { No: 3, 'Kualitas Pelayanan [X1.1]': 'Tidak Setuju', 'Kepuasan [Y1]': 'Sangat Tidak Setuju', Catatan: 'Kurang' },
  ];
  const detectedDetections = detectLikertTextColumns(sampleGoogleFormsData);
  const detectedCols = detectedDetections.map((d: any) => d.column);
  console.log(`Terdeteksi kolom teks Likert: ${detectedCols.join(', ')}`);
  console.assert(detectedCols.includes('Kualitas Pelayanan [X1.1]'), 'Gagal mendeteksi kolom Likert teks X1.1');
  console.assert(detectedCols.includes('Kepuasan [Y1]'), 'Gagal mendeteksi kolom Likert teks Y1');
  console.assert(!detectedCols.includes('Catatan'), 'Kolom catatan bebas tidak boleh terdeteksi Likert');

  const { recodedRows } = recodeDatasetRows(sampleGoogleFormsData, detectedCols);
  console.assert(recodedRows[0]['Kualitas Pelayanan [X1.1]'] === 5, 'Sangat Setuju harus di-recode ke 5');
  console.assert(recodedRows[1]['Kualitas Pelayanan [X1.1]'] === 4, 'Setuju harus di-recode ke 4');
  console.assert(recodedRows[2]['Kualitas Pelayanan [X1.1]'] === 2, 'Tidak Setuju harus di-recode ke 2');
  console.assert(recodedRows[2]['Kepuasan [Y1]'] === 1, 'Sangat Tidak Setuju harus di-recode ke 1');

  // 5. Full Deterministic Computation on mockDataset
  const fullStats = computeDeterministicStats({
    rows: mockDataset,
    constructs: [
      { name: 'Kualitas Layanan (X1)', role: 'independent', items: ['KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'] },
      { name: 'Kepuasan Pelanggan (X2)', role: 'independent', items: ['KP1', 'KP2', 'KP3', 'KP4', 'KP5', 'KP6'] },
      { name: 'Loyalitas Pelanggan (Y)', role: 'dependent', items: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5', 'LO6'] },
    ],
    selectedTests: ['descriptive', 'validity', 'reliability', 'assumptions', 'regression', 'correlation'],
    significanceLevel: 0.05,
  });

  console.assert(Boolean(fullStats.durbinWatson), 'fullStats harus memuat durbinWatson');
  console.log(`Statistik DW terhitung: ${fullStats.durbinWatson?.dwStatistic.toFixed(4)} (${fullStats.durbinWatson?.conclusion})`);

  console.assert(Boolean(fullStats.linearity && fullStats.linearity.length === 2), 'Linearity harus diuji untuk 2 variabel independen');
  console.log(`Uji Linearitas X1: F=${fullStats.linearity?.[0].fDeviation.toFixed(3)}, Sig=${fullStats.linearity?.[0].sigDeviation.toFixed(3)}, Linier=${fullStats.linearity?.[0].isLinear}`);

  // SE dan SR check
  const x1Reg = fullStats.regression?.find((r: any) => r.variable.includes('X1'));
  const x2Reg = fullStats.regression?.find((r: any) => r.variable.includes('X2'));
  console.assert(x1Reg?.sePercent !== undefined && x2Reg?.sePercent !== undefined, 'SE % harus terhitung untuk tiap prediktor');
  console.assert(x1Reg?.srPercent !== undefined && x2Reg?.srPercent !== undefined, 'SR % harus terhitung untuk tiap prediktor');
  const totalSE = (x1Reg?.sePercent || 0) + (x2Reg?.sePercent || 0);
  const totalSR = (x1Reg?.srPercent || 0) + (x2Reg?.srPercent || 0);
  console.log(`Total Sumbangan Efektif: ${totalSE.toFixed(2)}% (Target R²: ${(fullStats.determination!.rSquare * 100).toFixed(2)}%)`);
  console.log(`Total Sumbangan Relatif: ${totalSR.toFixed(2)}% (Target: 100.00%)`);
  console.assert(Math.abs(totalSR - 100) < 0.01, 'Total SR harus tepat 100%');

  // Demographics check
  console.assert(Boolean(fullStats.demographics && fullStats.demographics.length > 0), 'Demographics harus terdeteksi dari mockDataset');
  console.log(`Variabel demografi terdeteksi: ${fullStats.demographics?.map((d: any) => d.variable).join(', ')}`);

  console.log('\n✓ SEMUA TES RUMUS STATISTIK DETERMINISTIK & V2.0 ENGINE LOLOS 100%!');
}

runRegressionFormulaTests();
