import type { DatasetRow } from './api/types';

/**
 * Standard Likert text patterns for Indonesian & English survey responses
 * commonly exported from Google Forms / Typeform / SurveyMonkey.
 */
const LIKERT_MAP: Record<string, number> = {
  // 5: Sangat Setuju / Strongly Agree
  'sangat setuju': 5,
  'strongly agree': 5,
  '5 - sangat setuju': 5,
  '5 - strongly agree': 5,
  '5': 5,
  'ss': 5,
  'sangat puas': 5,
  'sangat baik': 5,
  'sangat sering': 5,

  // 4: Setuju / Agree
  'setuju': 4,
  'agree': 4,
  '4 - setuju': 4,
  '4 - agree': 4,
  '4': 4,
  's': 4,
  'puas': 4,
  'baik': 4,
  'sering': 4,

  // 3: Netral / Ragu-ragu / Neutral
  'netral': 3,
  'ragu-ragu': 3,
  'ragu ragu': 3,
  'neutral': 3,
  '3 - netral': 3,
  '3 - neutral': 3,
  '3': 3,
  'n': 3,
  'rg': 3,
  'rr': 3,
  'cukup': 3,
  'kadang-kadang': 3,
  'kadang kadang': 3,

  // 2: Tidak Setuju / Disagree
  'tidak setuju': 2,
  'kurang setuju': 2,
  'disagree': 2,
  '2 - tidak setuju': 2,
  '2 - disagree': 2,
  '2': 2,
  'ts': 2,
  'ks': 2,
  'tidak puas': 2,
  'kurang puas': 2,
  'buruk': 2,
  'jarang': 2,

  // 1: Sangat Tidak Setuju / Strongly Disagree
  'sangat tidak setuju': 1,
  'strongly disagree': 1,
  '1 - sangat tidak setuju': 1,
  '1 - strongly disagree': 1,
  '1': 1,
  'sts': 1,
  'sangat tidak puas': 1,
  'sangat buruk': 1,
  'tidak pernah': 1,
};

export const STANDARD_LIKERT_PREVIEW = [
  { score: 5, label: 'Sangat Setuju', aliases: 'SS, Strongly Agree, 5' },
  { score: 4, label: 'Setuju', aliases: 'S, Agree, 4' },
  { score: 3, label: 'Netral / Ragu-ragu', aliases: 'N, RG, RR, Neutral, Cukup, 3' },
  { score: 2, label: 'Tidak Setuju', aliases: 'TS, Disagree, Kurang Setuju, KS, 2' },
  { score: 1, label: 'Sangat Tidak Setuju', aliases: 'STS, Strongly Disagree, 1' },
];

export interface LikertColumnDetection {
  column: string;
  sampleValues: string[];
  matchedCount: number;
  totalValidCount: number;
  matchRatio: number;
}

/**
 * Detect columns containing Google Forms textual Likert responses.
 * A column is considered a Likert text column if >= 70% of non-empty values match the Likert dictionary.
 */
export function detectLikertTextColumns(
  rows: DatasetRow[],
  columns?: string[]
): LikertColumnDetection[] {
  const detections: LikertColumnDetection[] = [];
  const targetCols = columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  targetCols.forEach((col) => {
    // Skip row index / id
    if (/^(no|id)$/i.test(col)) return;

    let totalValid = 0;
    let matchCount = 0;
    let hasText = false;
    const sampleSet = new Set<string>();

    for (const row of rows) {
      const val = row[col];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        totalValid++;
        const str = String(val).trim().toLowerCase();
        if (isNaN(Number(str))) {
          hasText = true;
        }
        if (sampleSet.size < 4) {
          sampleSet.add(String(val).trim());
        }
        if (str in LIKERT_MAP) {
          matchCount++;
        }
      }
    }

    if (totalValid > 0 && hasText) {
      const matchRatio = matchCount / totalValid;
      if (matchRatio >= 0.60) {
        detections.push({
          column: col,
          sampleValues: Array.from(sampleSet),
          matchedCount: matchCount,
          totalValidCount: totalValid,
          matchRatio,
        });
      }
    }
  });

  return detections;
}

/**
 * Recode textual Likert answers in specified columns to integers 1-5.
 */
export function recodeDatasetRows(
  rows: DatasetRow[],
  columnsToRecode: string[]
): { recodedRows: DatasetRow[]; totalCellsConverted: number } {
  const colSet = new Set(columnsToRecode);
  let totalCellsConverted = 0;

  const recodedRows = rows.map((row) => {
    const newRow = { ...row };
    colSet.forEach((col) => {
      const raw = newRow[col];
      if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
        const str = String(raw).trim().toLowerCase();
        if (str in LIKERT_MAP) {
          const numericVal = LIKERT_MAP[str];
          if (newRow[col] !== numericVal) {
            newRow[col] = numericVal;
            totalCellsConverted++;
          }
        }
      }
    });
    return newRow;
  });

  return { recodedRows, totalCellsConverted };
}

/**
 * Auto-detect timestamp and personal identifiable info (PII) columns from Google Forms.
 */
export function detectMetadataAndPiiColumns(
  columns: string[]
): { column: string; role: 'id' | 'ignored'; reason: string }[] {
  const results: { column: string; role: 'id' | 'ignored'; reason: string }[] = [];

  columns.forEach((col) => {
    const clean = col.trim().toLowerCase();
    if (/^(timestamp|cap[\s_]?waktu|waktu|date|tanggal|waktu[\s_]?pengisian)$/i.test(clean)) {
      results.push({ column: col, role: 'ignored', reason: 'Cap waktu otomatis Google Forms' });
    } else if (/^(nama|name|nama[\s_]?lengkap|full[\s_]?name|email|alamat[\s_]?email|email[\s_]?address|username|surel)$/i.test(clean)) {
      results.push({ column: col, role: 'ignored', reason: 'Data pribadi responden (PII)' });
    } else if (/^(no[\s_]?hp|nomor[\s_]?telepon|no[\s_]?wa|nomor[\s_]?whatsapp|telepon|phone)$/i.test(clean)) {
      results.push({ column: col, role: 'ignored', reason: 'Kontak responden (PII)' });
    } else if (/^(skor|score|total[\s_]?score|total[\s_]?skor|nilai[\s_]?kuis|point|points|poin)$/i.test(clean)) {
      results.push({ column: col, role: 'ignored', reason: 'Nilai kuis / Skor kontinu Google Forms' });
    } else if (/^(no|nomor|id|no\.|nomor[\s_]?responden|id[\s_]?responden|nim|npm|nisn|nik)$/i.test(clean)) {
      results.push({ column: col, role: 'id', reason: 'ID Responden' });
    }
  });

  return results;
}
