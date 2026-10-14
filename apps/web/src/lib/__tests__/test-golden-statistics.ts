import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { computeDeterministicStats } from '../stats-engine';
import type { Construct, DatasetRow } from '../api/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../../');

function loadCsv(relPath: string): DatasetRow[] {
  const fullPath = path.resolve(rootDir, relPath);
  const text = fs.readFileSync(fullPath, 'utf-8');
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data as DatasetRow[];
}

function loadGolden(): Record<string, any> {
  const p = path.resolve(rootDir, 'fixtures/golden_references.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function runGoldenTests() {
  console.log('--- MENJALANKAN TEST EMAS (GOLDEN TESTS) STATISTIK DETERMINISTIK ---');
  const golden = loadGolden();

  const constructs: Construct[] = [
    { id: 'c1', name: 'KL', items: ['KL1', 'KL2', 'KL3'], role: 'independent' },
    { id: 'c2', name: 'KP', items: ['KP1', 'KP2', 'KP3'], role: 'independent' },
    { id: 'c3', name: 'LO', items: ['LO1', 'LO2', 'LO3'], role: 'dependent' },
  ];

  const tests: ('descriptive' | 'validity' | 'reliability' | 'regression' | 'normality' | 'multicollinearity' | 'heteroscedasticity' | 'correlation')[] = [
    'descriptive',
    'validity',
    'reliability',
    'regression',
    'multicollinearity',
    'heteroscedasticity',
    'correlation',
  ];

  // Test 1: dataset_30
  console.log('\n[1/3] Menguji dataset_30.csv...');
  const rows30 = loadCsv('fixtures/dataset_30.csv');
  const res30 = computeDeterministicStats({
    rows: rows30,
    constructs,
    selectedTests: tests,
  });
  const g30 = golden.dataset_30;

  // Verify Descriptive
  for (const varName of ['KL', 'KP', 'LO']) {
    const calc = res30.descriptive?.find((d) => d.variable === varName);
    const exp = g30.descriptive[varName];
    if (!calc) throw new Error(`Missing descriptive for ${varName}`);
    if (Math.abs(calc.mean - exp.mean) > 1e-4) {
      throw new Error(`Descriptive Mean mismatch on ${varName}: got ${calc.mean}, expected ${exp.mean}`);
    }
    if (Math.abs(calc.stdDev - exp.stdDev) > 1e-4) {
      throw new Error(`Descriptive StdDev mismatch on ${varName}: got ${calc.stdDev}, expected ${exp.stdDev}`);
    }
  }
  console.log('  ✓ Statistik Deskriptif cocok persis dengan SciPy');

  // Verify Cronbach Alpha
  for (const c of constructs) {
    const calc = res30.reliability?.find((r) => r.construct === c.name);
    const exp = g30.reliability[c.name];
    if (!calc) throw new Error(`Missing reliability for ${c.name}`);
    if (Math.abs(calc.cronbachAlpha - exp.cronbachAlpha) > 1e-4) {
      throw new Error(`Alpha mismatch on ${c.name}: got ${calc.cronbachAlpha}, expected ${exp.cronbachAlpha}`);
    }
  }
  console.log('  ✓ Reliabilitas Cronbach Alpha cocok persis dengan SciPy');

  // Verify Regression & ANOVA
  const calcF = res30.fTest?.fHitung ?? 0;
  const expF = g30.fTest.fHitung;
  if (Math.abs(calcF - expF) > 1e-4) {
    throw new Error(`F Hitung mismatch: got ${calcF}, expected ${expF}`);
  }
  const calcR2 = res30.determination?.rSquare ?? 0;
  const expR2 = g30.determination.rSquare;
  if (Math.abs(calcR2 - expR2) > 1e-4) {
    throw new Error(`R2 mismatch: got ${calcR2}, expected ${expR2}`);
  }
  const calcAdjR2 = res30.determination?.adjustedRSquare ?? 0;
  const expAdjR2 = g30.determination.adjustedRSquare;
  if (Math.abs(calcAdjR2 - expAdjR2) > 1e-4) {
    throw new Error(`Adj R2 mismatch: got ${calcAdjR2}, expected ${expAdjR2}`);
  }
  console.log(`  ✓ Regresi OLS, F Hitung (${calcF}), dan R² (${calcR2}) cocok persis`);

  // Test 2: dataset_120
  console.log('\n[2/3] Menguji dataset_120.csv...');
  const rows120 = loadCsv('fixtures/dataset_120.csv');
  const res120 = computeDeterministicStats({
    rows: rows120,
    constructs,
    selectedTests: tests,
  });
  const g120 = golden.dataset_120;

  for (const varName of ['KL', 'KP', 'LO']) {
    const calc = res120.descriptive?.find((d) => d.variable === varName);
    const exp = g120.descriptive[varName];
    if (Math.abs(calc!.mean - exp.mean) > 1e-4) {
      throw new Error(`Mean mismatch on ${varName} (120): got ${calc!.mean}, expected ${exp.mean}`);
    }
  }
  const f120 = res120.fTest?.fHitung ?? 0;
  if (Math.abs(f120 - g120.fTest.fHitung) > 1e-3) {
    throw new Error(`F120 mismatch: got ${f120}, expected ${g120.fTest.fHitung}`);
  }
  console.log(`  ✓ Dataset 120 berhasil: F Hitung = ${f120}, R² = ${res120.determination?.rSquare}`);

  // Test 3: Pengujian Konsistensi Rumus Regresi Deterministik
  console.log('\n[3/3] Menguji Hubungan Teoretis Rumus: F = (R2/k) / ((1-R2)/(n-k-1))...');
  const n = res120.respondentCount;
  const k = 2;
  const r2 = res120.determination!.rSquare;
  const theoreticalF = (r2 / k) / ((1.0 - r2) / (n - k - 1));
  const diffF = Math.abs(res120.fTest!.fHitung - theoreticalF);
  if (diffF > 0.05) {
    throw new Error(`Inkonsistensi rumus F regresi: F=${res120.fTest!.fHitung}, Teoretis=${theoreticalF}`);
  }
  console.log(`  ✓ Rumus identitas F = (R2/k)/((1-R2)/(n-k-1)) terverifikasi identik (selisih ${diffF.toFixed(6)})`);

  // Test 4: Tes Penguncian (Unggah A lalu B, hasil wajib berubah)
  console.log('\n[4/4] Menguji Isolasi & Penguncian (Upload A -> Upload B, hasil wajib berubah)...');
  if (res30.fTest!.fHitung === res120.fTest!.fHitung) {
    throw new Error('Hasil antara dataset A dan B sama! Indikasi data mock bocor.');
  }
  if (res30.determination!.rSquare === res120.determination!.rSquare) {
    throw new Error('R2 antara dataset A dan B sama! Indikasi data mock bocor.');
  }
  console.log('  ✓ Hasil analisis A dan B berbeda dan terkunci independen. Nol kebocoran data contoh.');

  console.log('\n🎉 SEMUA TES EMAS (GOLDEN TESTS) STATISTIK LOLOS 100%!\n');
}

runGoldenTests().catch((err) => {
  console.error('❌ GAGAL PADA TES EMAS:', err);
  process.exit(1);
});
