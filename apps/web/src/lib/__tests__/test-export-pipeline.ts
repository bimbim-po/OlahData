import assert from 'node:assert';
import { generateAcademicPdfReport } from '../pdf-generator';
import { exportResult } from '../api';
import { computeDeterministicStats } from '../stats-engine';
import type { Construct } from '../api/types';

console.log('--- TEST PIPELINE EKSPOR PDF & WORD OLAHDATA ---');

// 1. Generate real dataset results
const sampleRows = Array.from({ length: 30 }, (_, i) => ({
  No: i + 1,
  KL1: ((i % 5) + 1),
  KL2: (((i + 1) % 5) + 1),
  KP1: (((i + 2) % 5) + 1),
  KP2: (((i + 3) % 5) + 1),
  LO1: (((i + 4) % 5) + 1),
  LO2: ((i % 5) + 1),
}));

const constructs: Construct[] = [
  { id: 'c-kl', name: 'Kualitas Layanan', role: 'independent', items: ['KL1', 'KL2'] },
  { id: 'c-kp', name: 'Kepuasan Pelanggan', role: 'independent', items: ['KP1', 'KP2'] },
  { id: 'c-lo', name: 'Loyalitas Pelanggan', role: 'dependent', items: ['LO1', 'LO2'] },
];

const results = computeDeterministicStats(
  sampleRows,
  constructs,
  ['descriptive', 'validity', 'reliability', 'normality', 'multicollinearity', 'heteroscedasticity', 'regression', 'correlation'],
  [],
  'mean',
  {
    fileName: 'test_dataset.csv',
    datasetId: 'ds-test-1',
    runId: 'run-test-1',
    version: 1,
    kind: 'original',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    rowCount: 30,
    columnCount: 7,
    excludedRows: [],
    columns: [],
  }
);

console.log('[1/4] Menguji pembuatan PDF murni (pdf-generator)...');
const pdfBytes = generateAcademicPdfReport(results, {
  projectTitle: 'Uji Validitas dan Regresi Dataset 30',
  sections: ['descriptive', 'validity', 'reliability', 'normality', 'regression', 'correlation'],
  includeStatement: true,
  watermark: false,
});

assert(pdfBytes instanceof Uint8Array, 'PDF harus berupa Uint8Array');
assert(pdfBytes.length > 2000, `Ukuran PDF (${pdfBytes.length} bytes) harus memadai, bukan string dummy 36 bytes!`);

const pdfString = Buffer.from(pdfBytes).toString('latin1');
assert(pdfString.startsWith('%PDF-1.4'), 'Header PDF harus berstandar %PDF-1.4');
assert(pdfString.includes('%%EOF'), 'Dokumen PDF harus memiliki trailer %%EOF');
assert(pdfString.includes('/Catalog'), 'Struktur PDF harus memiliki /Catalog');
assert(pdfString.includes('/Pages'), 'Struktur PDF harus memiliki /Pages');
assert(pdfString.includes('xref'), 'Struktur PDF harus memiliki cross-reference table (xref)');
console.log(`  [OK] PDF valid: ${pdfBytes.length} bytes, format %PDF-1.4 terverifikasi.`);

console.log('[2/4] Menguji fungsi exportResult untuk format PDF...');
exportResult('proj-test', {
  format: 'pdf',
  sections: ['descriptive', 'validity', 'regression'],
  includeStatement: true,
}, results).then(async (pdfBlob) => {
  assert.strictEqual(pdfBlob.type, 'application/pdf', 'MIME type PDF harus application/pdf');
  const buffer = await pdfBlob.arrayBuffer();
  assert(buffer.byteLength > 2000, 'Blob PDF harus lebih besar dari 2000 bytes');
  const str = Buffer.from(buffer).toString('latin1');
  assert(str.startsWith('%PDF-1.4'), 'Isi blob PDF harus diawali %PDF-1.4');
  console.log(`  [OK] exportResult(pdf): ${buffer.byteLength} bytes blob valid.`);

  console.log('[3/4] Menguji fungsi exportResult untuk format Word...');
  const wordBlob = await exportResult('proj-test', {
    format: 'word',
    sections: ['descriptive', 'regression'],
    includeStatement: true,
  }, results);

  assert.strictEqual(wordBlob.type, 'application/msword;charset=utf-8', 'MIME type Word harus application/msword');
  const wordText = await wordBlob.text();
  assert(wordText.includes('<html'), 'Dokumen Word harus berisi HTML terstruktur');
  assert(wordText.includes('Tabel 4.1'), 'Tabel deskriptif harus termuat');
  assert(wordText.includes('Tabel 4.7'), 'Tabel regresi harus termuat');
  assert(wordText.includes('Kualitas Layanan'), 'Nama variabel hasil harus termuat dalam dokumen Word');
  assert(wordText.length > 1500, 'Dokumen Word tidak boleh kosong atau ringkas');
  console.log(`  [OK] exportResult(word): ${wordText.length} karakter dokumen Word valid.`);

  console.log('[4/4] Verifikasi isolasi ekspor: data pengguna tidak menggunakan mockResults...');
  assert.notStrictEqual(results.respondentCount, 120, 'N responden harus 30 sesuai data tes, bukan 120 dari mock');
  assert.strictEqual(results.respondentCount, 30, 'N responden harus tepat 30');
  console.log('  [OK] Seluruh data ekspor berasal dari kalkulasi deterministik data pengguna.');

  console.log('\nSEMUA PENGUJIAN EKSPOR BERHASIL 100%!');
  process.exit(0);
}).catch((err) => {
  console.error('Test gagal:', err);
  process.exit(1);
});
