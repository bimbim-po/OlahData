import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from '../apps/web/node_modules/xlsx/xlsx.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicDir = path.join(rootDir, 'apps', 'web', 'public', 'data-contoh');
const dataDummyDir = path.join(rootDir, 'data_dummy');

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(dataDummyDir, { recursive: true });

// Seeded PRNG for reproducible realistic survey responses
function createRng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = createRng(12345);

function randomInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Clamp to 1-5
function clampLikert(val) {
  return Math.max(1, Math.min(5, Math.round(val)));
}

// -----------------------------------------------------------------------------
// DATASET 1: Riset Pemasaran (100 Responden)
// X1: Kualitas Pelayanan (5 butir)
// X2: Kepuasan Pelanggan (5 butir)
// Y: Loyalitas Pelanggan (5 butir)
// -----------------------------------------------------------------------------
function generateMarketingData(n = 100) {
  const rows = [];
  const genders = ['Laki-laki', 'Perempuan'];
  const educations = ['SMA/SMK', 'Diploma (D3)', 'Sarjana (S1)', 'Magister (S2)'];
  const occupations = ['Mahasiswa', 'Karyawan Swasta', 'Wiraswasta', 'PNS/BUMN'];

  for (let i = 1; i <= n; i++) {
    // Latent trait for this respondent (satisfaction/loyalty tendency)
    const latentGeneral = 3.2 + rng() * 1.5; // ~3.2 to 4.7
    const latentX1 = latentGeneral + (rng() - 0.5) * 0.8;
    const latentX2 = latentGeneral + (rng() - 0.5) * 0.6;
    const latentY = 0.45 * latentX1 + 0.45 * latentX2 + (rng() - 0.5) * 0.5;

    const row = {
      No: i,
      Jenis_Kelamin: genders[rng() > 0.52 ? 1 : 0],
      Usia: randomInt(20, 35),
      Pendidikan: educations[randomInt(0, 3)],
      Pekerjaan: occupations[randomInt(0, 3)],
      // X1: Kualitas Pelayanan
      X1_1: clampLikert(latentX1 + (rng() - 0.5) * 0.7),
      X1_2: clampLikert(latentX1 + (rng() - 0.5) * 0.7),
      X1_3: clampLikert(latentX1 + (rng() - 0.5) * 0.7),
      X1_4: clampLikert(latentX1 + (rng() - 0.5) * 0.7),
      X1_5: clampLikert(latentX1 + (rng() - 0.5) * 0.7),
      // X2: Kepuasan Pelanggan
      X2_1: clampLikert(latentX2 + (rng() - 0.5) * 0.7),
      X2_2: clampLikert(latentX2 + (rng() - 0.5) * 0.7),
      X2_3: clampLikert(latentX2 + (rng() - 0.5) * 0.7),
      X2_4: clampLikert(latentX2 + (rng() - 0.5) * 0.7),
      X2_5: clampLikert(latentX2 + (rng() - 0.5) * 0.7),
      // Y: Loyalitas Pelanggan
      Y_1: clampLikert(latentY + (rng() - 0.5) * 0.7),
      Y_2: clampLikert(latentY + (rng() - 0.5) * 0.7),
      Y_3: clampLikert(latentY + (rng() - 0.5) * 0.7),
      Y_4: clampLikert(latentY + (rng() - 0.5) * 0.7),
      Y_5: clampLikert(latentY + (rng() - 0.5) * 0.7),
    };
    rows.push(row);
  }
  return rows;
}

// -----------------------------------------------------------------------------
// DATASET 2: Riset SDM / Organisasi (80 Responden)
// X1: Motivasi Kerja (5 butir)
// X2: Disiplin Kerja (5 butir)
// Y: Kinerja Karyawan (5 butir)
// -----------------------------------------------------------------------------
function generateHrmData(n = 80) {
  const rows = [];
  const genders = ['Pria', 'Wanita'];
  const divisis = ['Operasional', 'Pemasaran', 'Keuangan', 'SDM / HRD', 'IT & Sistem'];

  for (let i = 1; i <= n; i++) {
    const latentGeneral = 3.4 + rng() * 1.3;
    const latentMot = latentGeneral + (rng() - 0.5) * 0.7;
    const latentDis = latentGeneral + (rng() - 0.5) * 0.7;
    const latentKin = 0.5 * latentMot + 0.4 * latentDis + (rng() - 0.5) * 0.5;

    const row = {
      No: i,
      Jenis_Kelamin: genders[rng() > 0.48 ? 1 : 0],
      Usia: randomInt(22, 45),
      Divisi: divisis[randomInt(0, 4)],
      Masa_Kerja_Tahun: randomInt(1, 15),
      // X1: Motivasi Kerja
      X1_1: clampLikert(latentMot + (rng() - 0.5) * 0.65),
      X1_2: clampLikert(latentMot + (rng() - 0.5) * 0.65),
      X1_3: clampLikert(latentMot + (rng() - 0.5) * 0.65),
      X1_4: clampLikert(latentMot + (rng() - 0.5) * 0.65),
      X1_5: clampLikert(latentMot + (rng() - 0.5) * 0.65),
      // X2: Disiplin Kerja
      X2_1: clampLikert(latentDis + (rng() - 0.5) * 0.65),
      X2_2: clampLikert(latentDis + (rng() - 0.5) * 0.65),
      X2_3: clampLikert(latentDis + (rng() - 0.5) * 0.65),
      X2_4: clampLikert(latentDis + (rng() - 0.5) * 0.65),
      X2_5: clampLikert(latentDis + (rng() - 0.5) * 0.65),
      // Y: Kinerja Karyawan
      Y_1: clampLikert(latentKin + (rng() - 0.5) * 0.65),
      Y_2: clampLikert(latentKin + (rng() - 0.5) * 0.65),
      Y_3: clampLikert(latentKin + (rng() - 0.5) * 0.65),
      Y_4: clampLikert(latentKin + (rng() - 0.5) * 0.65),
      Y_5: clampLikert(latentKin + (rng() - 0.5) * 0.65),
    };
    rows.push(row);
  }
  return rows;
}

// Helper write to CSV and XLSX
function saveDataset(rows, baseFilename) {
  // 1. Create CSV
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];
  for (const r of rows) {
    const values = headers.map((h) => {
      const val = r[h];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val;
    });
    csvLines.push(values.join(','));
  }
  const csvContent = csvLines.join('\n');

  // 2. Create XLSX Workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Kuesioner');
  const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Save to public dir
  const pubCsv = path.join(publicDir, `${baseFilename}.csv`);
  const pubXlsx = path.join(publicDir, `${baseFilename}.xlsx`);
  fs.writeFileSync(pubCsv, csvContent, 'utf-8');
  fs.writeFileSync(pubXlsx, xlsxBuffer);

  // Save to data_dummy dir
  const rootCsv = path.join(dataDummyDir, `${baseFilename}.csv`);
  const rootXlsx = path.join(dataDummyDir, `${baseFilename}.xlsx`);
  fs.writeFileSync(rootCsv, csvContent, 'utf-8');
  fs.writeFileSync(rootXlsx, xlsxBuffer);

  console.log(`Saved: ${baseFilename}.csv (${rows.length} baris, ${headers.length} kolom)`);
  console.log(`Saved: ${baseFilename}.xlsx`);
}

// Generate
console.log('Generating dummy datasets...');
const mktData = generateMarketingData(100);
saveDataset(mktData, 'data_kuesioner_pemasaran_100_responden');

const hrmData = generateHrmData(80);
saveDataset(hrmData, 'data_kuesioner_sdm_80_responden');

console.log('Semua file data dummy berhasil dibuat!');
