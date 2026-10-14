import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DatasetRow } from './api/types';
import type { ColumnRoleInfo, DatasetSourceMeta } from './stats-engine';

export const DEFAULT_LIKERT_MAP: Record<string, number> = {
  'sangat setuju': 5,
  'setuju': 4,
  'netral': 3,
  'ragu-ragu': 3,
  'kurang setuju': 2,
  'tidak setuju': 2,
  'sangat tidak setuju': 1,
  'ss': 5,
  's': 4,
  'n': 3,
  'rr': 3,
  'ks': 2,
  'ts': 2,
  'sts': 1,
  'strongly agree': 5,
  'agree': 4,
  'neutral': 3,
  'disagree': 2,
  'strongly disagree': 1,
};

export const DEMOGRAPHIC_REGEX = [
  /^no$/i,
  /^id$/i,
  /^nomor$/i,
  /^responden/i,
  /^nama/i,
  /^timestamp$/i,
  /^cap[\s_]*waktu$/i,
  /^usia/i,
  /^umur/i,
  /^gender/i,
  /^jenis[\s_]*kelamin/i,
  /^jk$/i,
  /^pendidikan/i,
  /^pekerjaan/i,
  /^profesi/i,
  /^penghasilan/i,
  /^gaji/i,
  /^status/i,
  /^ipk/i,
  /^semester/i,
  /^fakultas/i,
  /^jurusan/i,
  /^prodi/i,
];

export async function computeSha256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  let buffer: Uint8Array;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    buffer = new Uint8Array(data);
  } else {
    buffer = data;
  }

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as unknown as BufferSource);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback
  try {
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return 'sha256-hash-unavailable';
  }
}

export function detectColumnRole(colName: string, values: unknown[]): 'id' | 'demographic' | 'item' | 'ignored' {
  const clean = colName.trim().toLowerCase();

  // Check ID patterns
  if (['no', 'id', 'nomor', 'responden', 'timestamp'].includes(clean)) {
    return 'id';
  }

  for (const pat of DEMOGRAPHIC_REGEX) {
    if (pat.test(clean)) {
      return 'demographic';
    }
  }

  // Check if values resemble Likert items (numeric 1-5 or Likert text)
  let numericLikertCount = 0;
  let textLikertCount = 0;
  let totalValid = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    totalValid++;
    const num = Number(v);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      numericLikertCount++;
    } else if (typeof v === 'string' && DEFAULT_LIKERT_MAP[v.trim().toLowerCase()] !== undefined) {
      textLikertCount++;
    }
  }

  if (totalValid > 0 && (numericLikertCount + textLikertCount) / totalValid > 0.6) {
    return 'item';
  }

  // If mostly non-numeric and not Likert, treat as demographic or ignored
  return 'item';
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  sha256: string;
  sheetNames?: string[];
  selectedSheet?: string;
  ignoredInfo: {
    emptyRowsSkipped: number;
    mergedCellsDetected: number;
    notes: string[];
  };
  columns: string[];
  columnMeta: ColumnRoleInfo[];
  rows: DatasetRow[];
  totalRawRows: number;
}

export async function parseSpreadsheetFile(
  file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  options?: {
    sheetName?: string;
    customLikertMap?: Record<string, number>;
  }
): Promise<ParseResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const buffer = await file.arrayBuffer();
  const sha256 = await computeSha256(buffer);
  const ext = fileName.split('.').pop()?.toLowerCase();

  const likertMap = { ...DEFAULT_LIKERT_MAP, ...(options?.customLikertMap || {}) };
  const ignoredInfo = {
    emptyRowsSkipped: 0,
    mergedCellsDetected: 0,
    notes: [] as string[],
  };

  let rawRows: Record<string, unknown>[] = [];
  let detectedHeaders: string[] = [];
  let sheetNames: string[] | undefined;
  let selectedSheet: string | undefined;

  if (ext === 'csv') {
    // Decode with auto-detection for BOM / Windows-1252
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      // Fallback Windows-1252
      text = new TextDecoder('windows-1252').decode(buffer);
      ignoredInfo.notes.push('File terdeteksi menggunakan encoding Windows-1252.');
    }

    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    // Detect delimiter
    const firstLine = text.split('\n')[0] || '';
    let delimiter = ',';
    if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
      delimiter = ';';
      ignoredInfo.notes.push('Pemisah kolom titik koma (;) terdeteksi.');
    } else if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
      ignoredInfo.notes.push('Pemisah kolom tab (\\t) terdeteksi.');
    }

    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      delimiter,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep raw strings to handle comma decimals safely
    });

    rawRows = (parsed.data || []) as Record<string, unknown>[];
    detectedHeaders = (parsed.meta.fields || []).filter((f) => f && f.trim() !== '');
    if (parsed.errors && parsed.errors.length > 0) {
      ignoredInfo.emptyRowsSkipped += parsed.errors.length;
    }
  } else {
    // Excel (.xlsx, .xls)
    const workbook = XLSX.read(buffer, { type: 'array' });
    sheetNames = workbook.SheetNames;
    selectedSheet = options?.sheetName || sheetNames[0];

    if (!selectedSheet || !workbook.Sheets[selectedSheet]) {
      throw new Error('Lembar kerja (sheet) tidak ditemukan dalam berkas Excel.');
    }

    const sheet = workbook.Sheets[selectedSheet];

    // Check merged cells
    if (sheet['!merges'] && sheet['!merges'].length > 0) {
      ignoredInfo.mergedCellsDetected = sheet['!merges'].length;
      ignoredInfo.notes.push(
        `Terdeteksi ${sheet['!merges'].length} sel gabungan (merged cells). Sel gabungan diuraikan secara eksplisit.`
      );
    }

    // Convert sheet to json with header detection
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false, // keep as formatted string to detect decimals and text
      blankrows: false,
    });

    if (rawData.length > 0) {
      detectedHeaders = Object.keys(rawData[0]).filter((k) => k && k.trim() !== '');
      rawRows = rawData;
    }
  }

  if (rawRows.length === 0 || detectedHeaders.length === 0) {
    throw new Error('Tidak ada baris data yang terbaca dari berkas yang diunggah.');
  }

  // Sanitize headers: remove whitespace
  const cleanHeaders = detectedHeaders.map((h) => h.trim());

  // Parse rows: handle decimal commas & text Likert mapping
  const finalRows: DatasetRow[] = [];
  let emptyRowCount = 0;

  rawRows.forEach((r, idx) => {
    // Check if entire row is empty
    const values = cleanHeaders.map((h) => r[h]);
    const isAllEmpty = values.every(
      (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
    );
    if (isAllEmpty) {
      emptyRowCount++;
      return;
    }

    const row: DatasetRow = {};
    cleanHeaders.forEach((col) => {
      let rawVal = r[col];
      if (rawVal === undefined || rawVal === null) {
        row[col] = null;
        return;
      }

      if (typeof rawVal === 'string') {
        const trimmed = rawVal.trim();
        if (trimmed === '') {
          row[col] = null;
          return;
        }

        // 1. Check text Likert map
        const lower = trimmed.toLowerCase();
        if (likertMap[lower] !== undefined) {
          row[col] = likertMap[lower];
          return;
        }

        // 2. Check Indonesian decimal comma (e.g. "3,5" -> 3.5)
        if (/^-?\d+,\d+$/.test(trimmed)) {
          const num = Number(trimmed.replace(',', '.'));
          if (!isNaN(num)) {
            row[col] = num;
            return;
          }
        }

        // 3. Regular numeric check
        const num = Number(trimmed);
        if (!isNaN(num)) {
          row[col] = num;
          return;
        }

        row[col] = trimmed;
      } else if (typeof rawVal === 'number') {
        row[col] = rawVal;
      } else {
        row[col] = String(rawVal);
      }
    });

    // Ensure 1-indexed row number
    if (row.No === undefined) {
      row.No = finalRows.length + 1;
    }
    finalRows.push(row);
  });

  if (emptyRowCount > 0) {
    ignoredInfo.emptyRowsSkipped += emptyRowCount;
    ignoredInfo.notes.push(`Mengabaikan ${emptyRowCount} baris kosong tanpa nilai.`);
  }

  // Ensure 'No' is the first column if not present
  const allCols = cleanHeaders.includes('No') ? cleanHeaders : ['No', ...cleanHeaders];

  // Classify column roles
  const columnMeta: ColumnRoleInfo[] = allCols.map((col) => {
    const colVals = finalRows.map((r) => r[col]);
    const role = detectColumnRole(col, colVals);
    const missingCount = colVals.filter((v) => v === null || v === undefined || v === '').length;
    const firstValid = colVals.find((v) => v !== null && v !== undefined && v !== '');
    const dataType = typeof firstValid === 'number' ? 'number' : typeof firstValid === 'string' ? 'string' : 'unknown';

    return {
      name: col,
      role,
      dataType,
      missingCount,
    };
  });

  return {
    fileName,
    fileSize,
    sha256,
    sheetNames,
    selectedSheet,
    ignoredInfo,
    columns: allCols,
    columnMeta,
    rows: finalRows,
    totalRawRows: rawRows.length,
  };
}
