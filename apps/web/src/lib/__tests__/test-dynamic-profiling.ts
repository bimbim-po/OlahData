import { profileDatasetColumns, calculateReverseScore } from '../dynamic-profiling';
import { analyzeDatasetQuality } from '../validation';
import type { DatasetRow } from '../api/types';

function runTests() {
  console.log('--- Menjalankan Tes Dynamic Data Profiling & Non-Likert Isolation ---');

  // 1. Mock Google Forms dataset matching user screenshot (N = 101)
  const n = 101;
  const mockGoogleFormsRows: DatasetRow[] = [];
  const columns = [
    'Timestamp',
    'Skor',
    'Email',
    'Nama Lengkap',
    'NIM',
    'Jenis Kelamin',
    'Saran Terbuka',
    'X1_1',
    'X1_2',
    'X1_3',
    'Y_1',
    'Y_2',
  ];

  for (let i = 1; i <= n; i++) {
    mockGoogleFormsRows.push({
      No: i,
      Timestamp: `12/10/2024 14:${(10 + (i % 50)).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}`,
      Skor: (i % 11), // 0 to 10 (causes critical out of scale error in naive validators)
      Email: `27300${i}@student.telkomuniversity.ac.id`,
      'Nama Lengkap': `Mahasiswa Responden ${i}`,
      NIM: 1202200000 + i, // Large numeric ID
      'Jenis Kelamin': i % 2 === 0 ? 'Pria' : 'Wanita',
      'Saran Terbuka': `Mohon agar layanan perpustakaan kampus diperpanjang jam operasionalnya sampai malam hari untuk responden ke-${i}.`,
      X1_1: ((i % 5) + 1),
      X1_2: (((i + 1) % 5) + 1),
      X1_3: (((i + 2) % 5) + 1),
      Y_1: (((i + 3) % 5) + 1),
      Y_2: (((i + 4) % 5) + 1),
    });
  }

  // A. Profile Columns
  const profileMap = profileDatasetColumns(mockGoogleFormsRows, columns);

  console.log('\n[Hasil Profiling Kolom]');
  columns.forEach((col) => {
    const p = profileMap[col];
    console.log(`- ${col}: ${p.roleLabel} (${p.role}) -> ${p.reason}`);
  });

  // Verify Role Classifications
  if (profileMap['Timestamp'].role !== 'identifier') {
    throw new Error(`Expected Timestamp to be 'identifier', got '${profileMap['Timestamp'].role}'`);
  }
  if (profileMap['Skor'].role !== 'continuous') {
    throw new Error(`Expected Skor to be 'continuous', got '${profileMap['Skor'].role}'`);
  }
  if (profileMap['Email'].role !== 'identifier') {
    throw new Error(`Expected Email to be 'identifier', got '${profileMap['Email'].role}'`);
  }
  if (profileMap['Nama Lengkap'].role !== 'identifier') {
    throw new Error(`Expected Nama Lengkap to be 'identifier', got '${profileMap['Nama Lengkap'].role}'`);
  }
  if (profileMap['NIM'].role !== 'identifier') {
    throw new Error(`Expected NIM to be 'identifier', got '${profileMap['NIM'].role}'`);
  }
  if (profileMap['Jenis Kelamin'].role !== 'categorical') {
    throw new Error(`Expected Jenis Kelamin to be 'categorical', got '${profileMap['Jenis Kelamin'].role}'`);
  }
  if (profileMap['Saran Terbuka'].role !== 'free_text') {
    throw new Error(`Expected Saran Terbuka to be 'free_text', got '${profileMap['Saran Terbuka'].role}'`);
  }
  if (profileMap['X1_1'].role !== 'likert') {
    throw new Error(`Expected X1_1 to be 'likert', got '${profileMap['X1_1'].role}'`);
  }

  console.log('\n✓ Semua klasifikasi peran kolom berhasil 100%!');

  // B. Quality Analysis Isolation: Must have ZERO critical errors
  const issues = analyzeDatasetQuality(mockGoogleFormsRows, columns);
  const criticalErrors = issues.filter((iss) => iss.severity === 'error');
  const warnings = issues.filter((iss) => iss.severity === 'warning');
  const infos = issues.filter((iss) => iss.severity === 'info');

  console.log(`\n[Hasil Analisis Kualitas Data]`);
  console.log(`- Total Temuan: ${issues.length}`);
  console.log(`- Galat Kritis (Error): ${criticalErrors.length}`);
  console.log(`- Peringatan (Warning): ${warnings.length}`);
  console.log(`- Informasi Profil: ${infos.length}`);

  if (criticalErrors.length > 0) {
    console.error('Critical errors found:', criticalErrors);
    throw new Error(`FAILED: Expected 0 critical errors, but got ${criticalErrors.length}!`);
  }

  console.log('✓ Sukses: 0 Galat Kritis! NIM dan Skor tidak lagi memblokir proses analisis.');

  // C. Test Reverse Score Formula
  // Formula: Skor_Baru = (Skor_Maksimal_Skala + Skor_Minimal_Skala) - Skor_Lama
  // Scale 1 to 5: (5 + 1) - x = 6 - x
  // 5 -> 1, 4 -> 2, 3 -> 3, 2 -> 4, 1 -> 5
  if (calculateReverseScore(5, 1, 5) !== 1) throw new Error('Reverse score 5 in 1-5 failed');
  if (calculateReverseScore(4, 1, 5) !== 2) throw new Error('Reverse score 4 in 1-5 failed');
  if (calculateReverseScore(3, 1, 5) !== 3) throw new Error('Reverse score 3 in 1-5 failed');
  if (calculateReverseScore(2, 1, 5) !== 4) throw new Error('Reverse score 2 in 1-5 failed');
  if (calculateReverseScore(1, 1, 5) !== 5) throw new Error('Reverse score 1 in 1-5 failed');

  // Scale 1 to 7: (7 + 1) - x = 8 - x
  if (calculateReverseScore(7, 1, 7) !== 1) throw new Error('Reverse score 7 in 1-7 failed');
  if (calculateReverseScore(6, 1, 7) !== 2) throw new Error('Reverse score 6 in 1-7 failed');
  if (calculateReverseScore(1, 1, 7) !== 7) throw new Error('Reverse score 1 in 1-7 failed');

  console.log('✓ Rumus Reverse Score Universal terverifikasi deterministik 100%!');
  console.log('\n🎉 SEMUA PENGUJIAN DYNAMIC DATA PROFILING LOLOS TANPA KESALAHAN!');
}

runTests();
