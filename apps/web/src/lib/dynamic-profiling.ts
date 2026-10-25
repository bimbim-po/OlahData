import type { DatasetRow } from './api/types';
import { DEFAULT_LIKERT_MAP } from './dataset-parser';

export type DynamicColumnRole =
  | 'identifier'
  | 'free_text'
  | 'categorical'
  | 'likert'
  | 'continuous';

export interface ColumnProfile {
  columnName: string;
  role: DynamicColumnRole;
  roleLabel: string;
  dataType: 'datetime' | 'number' | 'string' | 'empty';
  totalRows: number;
  validCount: number;
  uniqueCount: number;
  avgCharLength: number;
  minVal: number | null;
  maxVal: number | null;
  isCandidateItem: boolean;
  reason: string;
  sampleValues: (string | number)[];
}

// Regex patterns for metadata and identifiers
const IDENTIFIER_REGEX = [
  /^no$/i,
  /^nomor$/i,
  /^id$/i,
  /^responden$/i,
  /^respondent[\s_]*id$/i,
  /^nim/i,
  /^npm/i,
  /^nik/i,
  /^nisn/i,
  /^timestamp$/i,
  /^cap[\s_]*waktu$/i,
  /^waktu/i,
  /^date$/i,
  /^tanggal/i,
  /^submitted[\s_]*at$/i,
  /^email/i,
  /^surel/i,
  /^alamat[\s_]*email/i,
  /^nama/i,
  /^name$/i,
  /^telepon/i,
  /^phone/i,
  /^no[\s_]*hp/i,
  /^whatsapp/i,
];

// Regex patterns for continuous scores or financial/metric variables
const CONTINUOUS_SCORE_REGEX = [
  /^skor$/i,
  /^score$/i,
  /^total[\s_]*score$/i,
  /^total[\s_]*skor$/i,
  /^nilai[\s_]*kuis$/i,
  /^points?$/i,
  /^poin$/i,
  /^gaji/i,
  /^salary/i,
  /^income/i,
  /^penghasilan/i,
  /^pendapatan/i,
  /^omset/i,
  /^penjualan/i,
  /^biaya/i,
  /^ipk/i,
];

// Regex patterns for qualitative free text
const FREE_TEXT_REGEX = [
  /saran/i,
  /masukan/i,
  /komentar/i,
  /alasan/i,
  /feedback/i,
  /catatan/i,
  /keterangan/i,
  /esai/i,
  /pendapat/i,
];

// Regex patterns for common demographics
const DEMOGRAPHIC_REGEX = [
  /^gender/i,
  /^jenis[\s_]*kelamin/i,
  /^jk$/i,
  /^kelamin/i,
  /^usia/i,
  /^umur/i,
  /^age/i,
  /^pendidikan/i,
  /^education/i,
  /^pekerjaan/i,
  /^profesi/i,
  /^occupation/i,
  /^job/i,
  /^status/i,
  /^divisi/i,
  /^departemen/i,
  /^fakultas/i,
  /^jurusan/i,
  /^prodi/i,
  /^semester/i,
  /^lokasi/i,
  /^domisili/i,
  /^kota/i,
];

/**
 * Checks if a string value represents a datetime.
 */
function isDateTimeFormat(str: string): boolean {
  const s = str.trim();
  if (s.length < 6 || s.length > 40) return false;

  // DD/MM/YYYY HH:MM:SS or YYYY-MM-DD HH:MM:SS
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(\s+[T]?\d{1,2}:\d{1,2}(:\d{1,2})?(\s*[AP]M)?)?$/i.test(s)) {
    return true;
  }
  // Google Form timestamp: "12/10/2024 14:15:30" or "2024/10/12 2:15:30 PM"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}/.test(s)) {
    return true;
  }
  return false;
}

/**
 * Profiles a single column dynamically based purely on values and distributions,
 * adhering strictly to Rules 1-5 of the Dynamic Data Profiling specification.
 */
export function profileColumn(colName: string, rows: DatasetRow[]): ColumnProfile {
  const cleanName = colName.trim();
  const lowerName = cleanName.toLowerCase();
  const totalRows = rows.length;

  // Extract non-empty valid values
  const validVals: any[] = [];
  for (const row of rows) {
    const v = row[colName];
    if (v !== null && v !== undefined && v !== '') {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed !== '' && !['-', 'n/a', 'na', 'null', 'none'].includes(trimmed.toLowerCase())) {
          validVals.push(trimmed);
        }
      } else {
        validVals.push(v);
      }
    }
  }

  const validCount = validVals.length;
  const uniqueSet = new Set(validVals.map((v) => String(v).trim().toLowerCase()));
  const uniqueCount = uniqueSet.size;

  // Compute sample values
  const sampleValues = validVals.slice(0, 4);

  // If column has no valid values
  if (validCount === 0) {
    return {
      columnName: cleanName,
      role: 'identifier',
      roleLabel: 'Metadata (Kosong)',
      dataType: 'empty',
      totalRows,
      validCount: 0,
      uniqueCount: 0,
      avgCharLength: 0,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: 'Kolom tidak memiliki nilai (seluruh baris kosong). Diabaikan dari perhitungan.',
      sampleValues: [],
    };
  }

  // 1. Check Datetime
  const dateTimeMatches = validVals.filter((v) => typeof v === 'string' && isDateTimeFormat(v)).length;
  const isDateTime = validCount > 0 && dateTimeMatches / validCount >= 0.7;
  const isTimestampName = /^(timestamp|cap[\s_]*waktu|waktu|date|tanggal|submitted[\s_]*at)$/i.test(lowerName);

  if (isDateTime || isTimestampName) {
    return {
      columnName: cleanName,
      role: 'identifier',
      roleLabel: 'Identifier / Timestamp',
      dataType: 'datetime',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength: validVals.reduce((acc, v) => acc + String(v).length, 0) / validCount,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: `Format waktu/datetime terdeteksi (${dateTimeMatches}/${validCount} baris). Diabaikan dari seluruh statistik.`,
      sampleValues,
    };
  }

  const stringVals = validVals.map((v) => String(v));
  const avgCharLength = stringVals.reduce((acc, s) => acc + s.length, 0) / (stringVals.length || 1);
  const isFreeTextKeyword = FREE_TEXT_REGEX.some((pat) => pat.test(lowerName));
  const isIdNamePattern = IDENTIFIER_REGEX.some((pat) => pat.test(lowerName));
  const isEmailValues = validCount > 0 && validVals.filter((v) => typeof v === 'string' && v.includes('@')).length / validCount >= 0.7;

  // 2. Check Known Identifier / Metadata patterns (NIM, Nama, Email, ID, No, Telepon, etc.)
  if (isIdNamePattern || isEmailValues) {
    return {
      columnName: cleanName,
      role: 'identifier',
      roleLabel: 'Identifier / Metadata',
      dataType: typeof validVals[0] === 'number' ? 'number' : 'string',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: `Pola identitas unik / responden terdeteksi (${cleanName}, ${uniqueCount} nilai unik). Diabaikan dari analisis instrumen.`,
      sampleValues,
    };
  }

  // 3. Check Free Text / Kualitatif:
  // Kriteria: Tipe data teks/string dengan jumlah unik > 15 DAN rata-rata panjang karakter > 30.
  if ((uniqueCount > 15 && avgCharLength > 30) || (isFreeTextKeyword && avgCharLength > 20)) {
    return {
      columnName: cleanName,
      role: 'free_text',
      roleLabel: 'Teks Bebas / Kualitatif',
      dataType: 'string',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: `Data esai/kualitatif teks terbuka (${uniqueCount} variasi teks, rata-rata ${Math.round(avgCharLength)} karakter). Diabaikan dari uji statistik korelasi/regresi.`,
      sampleValues,
    };
  }

  // 4. Check Unnamed Identifiers: Unique values == Total Rows
  const isExactUnique = totalRows >= 3 && uniqueCount === totalRows;
  if (isExactUnique) {
    return {
      columnName: cleanName,
      role: 'identifier',
      roleLabel: 'Identifier Unik',
      dataType: typeof validVals[0] === 'number' ? 'number' : 'string',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: `Jumlah nilai unik (${uniqueCount}) sama persis dengan total responden (${totalRows}). Diperlakukan sebagai identitas unik.`,
      sampleValues,
    };
  }

  // Check numeric convertibility
  let numericCount = 0;
  const numericList: number[] = [];
  for (const v of validVals) {
    if (typeof v === 'number' && !isNaN(v)) {
      numericCount++;
      numericList.push(v);
    } else if (typeof v === 'string') {
      const s = v.trim().replace(',', '.');
      // If matches Google Forms quiz score format like "80 / 100", extract the numerator
      const scoreMatch = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*\d+$/);
      if (scoreMatch) {
        const parsed = Number(scoreMatch[1]);
        if (!isNaN(parsed)) {
          numericCount++;
          numericList.push(parsed);
          continue;
        }
      }
      const parsed = Number(s);
      if (!isNaN(parsed) && s !== '') {
        numericCount++;
        numericList.push(parsed);
      }
    }
  }

  const isPredominantlyNumeric = validCount > 0 && numericCount / validCount >= 0.85;

  // 4. If Predominantly Numeric:
  if (isPredominantlyNumeric && numericList.length > 0) {
    const minVal = Math.min(...numericList);
    const maxVal = Math.max(...numericList);
    const span = maxVal - minVal;

    // Is it a continuous metric or quiz score?
    // Rule 5: Tipe data angka dengan uniqueCount > 15 ATAU nama kolom Skor/Continuous ATAU rentang skala di luar skala Likert tipikal (misal > 11 atau < 0).
    const isScoreName = CONTINUOUS_SCORE_REGEX.some((pat) => pat.test(lowerName));
    const isOutSideLikertBounds = maxVal > 11 || minVal < 0 || span > 10;

    if (uniqueCount > 15 || isScoreName || isOutSideLikertBounds) {
      return {
        columnName: cleanName,
        role: 'continuous',
        roleLabel: 'Metrik Kontinu / Skor',
        dataType: 'number',
        totalRows,
        validCount,
        uniqueCount,
        avgCharLength,
        minVal,
        maxVal,
        isCandidateItem: false,
        reason: isScoreName
          ? `Kolom skor kontinu / nilai kuis (${cleanName}, rentang ${minVal} - ${maxVal}). Valid untuk analisis parametrik, bukan butir pertanyaan Likert.`
          : `Data numerik kontinu (${uniqueCount} nilai unik, rentang ${minVal} - ${maxVal}). Bukan butir Likert.`,
        sampleValues,
      };
    }

    // Rule 4: ORDINAL / LIKERT: Tipe data angka dengan jumlah unik antara 2 hingga 11.
    if (uniqueCount >= 2 && uniqueCount <= 11) {
      return {
        columnName: cleanName,
        role: 'likert',
        roleLabel: 'Skala Likert (Indikator)',
        dataType: 'number',
        totalRows,
        validCount,
        uniqueCount,
        avgCharLength,
        minVal,
        maxVal,
        isCandidateItem: true,
        reason: `Skala Likert ordinal numerik (${uniqueCount} pilihan nilai dalam rentang ${minVal} - ${maxVal}). Kandidat utama indikator pertanyaan penelitian.`,
        sampleValues,
      };
    }

    // Numeric with 1 unique value (constant) or categorized demographic code (e.g. 1=Pria, 2=Wanita)
    if (uniqueCount <= 15) {
      return {
        columnName: cleanName,
        role: 'categorical',
        roleLabel: 'Kategori / Demografi (Numerik)',
        dataType: 'number',
        totalRows,
        validCount,
        uniqueCount,
        avgCharLength,
        minVal,
        maxVal,
        isCandidateItem: false,
        reason: `Kode kategori numerik dengan ${uniqueCount} variasi nilai. Khusus untuk analisis frekuensi / deskriptif.`,
        sampleValues,
      };
    }
  }

  // 5. If String / Text Data:
  // Check if it's text-based Likert (e.g. "Sangat Setuju", "Setuju")
  let textLikertCount = 0;
  for (const v of validVals) {
    const s = String(v).trim().toLowerCase();
    if (DEFAULT_LIKERT_MAP[s] !== undefined || /^\d+\s*[-:.)]/.test(s)) {
      textLikertCount++;
    }
  }

  if (validCount > 0 && textLikertCount / validCount >= 0.65 && uniqueCount <= 11) {
    return {
      columnName: cleanName,
      role: 'likert',
      roleLabel: 'Skala Likert (Teks Verbal)',
      dataType: 'string',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength,
      minVal: 1,
      maxVal: 5,
      isCandidateItem: true,
      reason: `Jawaban teks skala Likert (${textLikertCount}/${validCount} baris cocok kamus Likert). Otomatis dipetakan menjadi angka indikator penelitian.`,
      sampleValues,
    };
  }

  // Rule 3: CATEGORICAL / DEMOGRAFI:
  // Tipe data teks dengan jumlah unik <= 15 (dan bukan merupakan Identifier).
  if (uniqueCount <= 15 || DEMOGRAPHIC_REGEX.some((pat) => pat.test(lowerName))) {
    return {
      columnName: cleanName,
      role: 'categorical',
      roleLabel: 'Kategori / Demografi',
      dataType: 'string',
      totalRows,
      validCount,
      uniqueCount,
      avgCharLength,
      minVal: null,
      maxVal: null,
      isCandidateItem: false,
      reason: `Variabel demografi / klasifikasi dengan ${uniqueCount} pilihan kategori unik. Digunakan khusus untuk analisis frekuensi & karakteristik responden.`,
      sampleValues,
    };
  }

  // Default fallback for any remaining text column with > 15 unique values: Treat as Free Text
  return {
    columnName: cleanName,
    role: 'free_text',
    roleLabel: 'Teks Bebas / Terbuka',
    dataType: 'string',
    totalRows,
    validCount,
    uniqueCount,
    avgCharLength,
    minVal: null,
    maxVal: null,
    isCandidateItem: false,
    reason: `Kolom teks terbuka (${uniqueCount} nilai unik). Diabaikan dari perhitungan kuantitatif kuesioner.`,
    sampleValues,
  };
}

/**
 * Profiles all columns of a dataset dynamically.
 */
export function profileDatasetColumns(
  rows: DatasetRow[],
  columns: string[]
): Record<string, ColumnProfile> {
  const profileMap: Record<string, ColumnProfile> = {};
  for (const col of columns) {
    profileMap[col] = profileColumn(col, rows);
  }
  return profileMap;
}

/**
 * Formula universal untuk pembalikan skor (Reverse Score):
 * Skor_Baru = (Skor_Maksimal_Skala + Skor_Minimal_Skala) - Skor_Lama
 */
export function calculateReverseScore(
  oldScore: number,
  scaleMin: number = 1,
  scaleMax: number = 5
): number {
  return scaleMax + scaleMin - oldScore;
}
