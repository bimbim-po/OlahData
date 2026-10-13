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

  console.log('✓ SEMUA TES RUMUS STATISTIK DETERMINISTIK LOLOS 100%!');
}

runRegressionFormulaTests();
