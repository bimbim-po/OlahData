import type { DataIssue, DatasetRow } from '../api/types';

function createSeededRandom(seed: number) {
  let s = seed;
  return function next(min: number, max: number): number {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return min + (Math.abs(s) % (max - min + 1));
  };
}

const rng = createSeededRandom(42);

function generateInitialRows(): DatasetRow[] {
  const educationLevels = ['S1', 'D3', 'D4'];
  const rows: DatasetRow[] = [];

  for (let i = 0; i < 120; i++) {
    // Generate correlated construct bases
    const generalBase = rng(2, 4);
    const baseKL = Math.max(1, Math.min(5, generalBase + rng(-1, 1)));
    const baseKP = Math.max(1, Math.min(5, generalBase + rng(-1, 1)));
    const baseLO = Math.max(1, Math.min(5, Math.round((baseKL + baseKP) / 2) + rng(-1, 1)));

    const likert = (base: number) => Math.max(1, Math.min(5, base + rng(-1, 1)));

    rows.push({
      No: i + 1,
      Jenis_Kelamin: rng(0, 1) === 0 ? 'L' : 'P',
      Usia: rng(18, 25),
      Pendidikan: educationLevels[rng(0, 2)],
      KL1: likert(baseKL),
      KL2: likert(baseKL),
      KL3: likert(baseKL),
      KL4: likert(baseKL),
      KL5: likert(baseKL),
      KL6: likert(baseKL),
      KP1: likert(baseKP),
      KP2: likert(baseKP),
      KP3: likert(baseKP),
      KP4: likert(baseKP),
      KP5: likert(baseKP),
      KP6: likert(baseKP),
      LO1: likert(baseLO),
      LO2: likert(baseLO),
      LO3: likert(baseLO),
      LO4: likert(baseLO),
      LO5: likert(baseLO),
      LO6: likert(baseLO),
    });
  }

  // Row 60 is an exact duplicate of Row 59 (keep No as 60 for table index)
  rows[59] = {
    ...rows[58],
    No: 60,
  };

  // Row 45: KL3 = null (empty)
  rows[44].KL3 = null;

  // Row 78: KP2 = null (empty)
  rows[77].KP2 = null;

  // Row 112: LO5 = null (empty)
  rows[111].LO5 = null;

  // Row 33: KL5 = 7 (out of scale)
  rows[32].KL5 = 7;

  // Row 91: KP4 = 7 (out of scale)
  rows[90].KP4 = 7;

  return rows;
}

export const mockDataset: DatasetRow[] = generateInitialRows();

function generateExperimentalRows(): DatasetRow[] {
  const expRng = createSeededRandom(12345);
  const rows: DatasetRow[] = [];

  // 30 Siswa Kelas Eksperimen
  for (let i = 1; i <= 30; i++) {
    const pre = expRng(48, 62);
    // Eksperimen meningkat signifikan (post 78-96)
    const post = Math.min(100, pre + expRng(25, 40));
    rows.push({
      No: i,
      Nama: `Siswa Eksperimen ${i}`,
      Kelas: 'Kelas Eksperimen',
      Metode_Ajar: 'Model Inovatif (Problem-Based Learning)',
      Pre_Test: pre,
      Post_Test: post,
    });
  }

  // 30 Siswa Kelas Kontrol
  for (let i = 31; i <= 60; i++) {
    const idx = i - 30;
    const pre = expRng(48, 62);
    // Kontrol meningkat sedikit (post 58-72)
    const post = Math.min(100, pre + expRng(8, 18));
    rows.push({
      No: i,
      Nama: `Siswa Kontrol ${idx}`,
      Kelas: 'Kelas Kontrol',
      Metode_Ajar: 'Model Konvensional (Ceramah)',
      Pre_Test: pre,
      Post_Test: post,
    });
  }

  return rows;
}

export const mockExperimentalDataset: DatasetRow[] = generateExperimentalRows();

export const mockIssues: DataIssue[] = [
  { id: 'issue-1', severity: 'error', message: 'Sel kosong', row: 45, column: 'KL3', value: null },
  { id: 'issue-2', severity: 'error', message: 'Sel kosong', row: 78, column: 'KP2', value: null },
  { id: 'issue-3', severity: 'error', message: 'Sel kosong', row: 112, column: 'LO5', value: null },
  { id: 'issue-4', severity: 'error', message: 'Nilai di luar skala 1-5', row: 33, column: 'KL5', value: 7 },
  { id: 'issue-5', severity: 'error', message: 'Nilai di luar skala 1-5', row: 91, column: 'KP4', value: 7 },
  { id: 'issue-6', severity: 'warning', message: 'Baris duplikat (sama dengan baris 59)', row: 60, column: undefined, value: undefined },
];
