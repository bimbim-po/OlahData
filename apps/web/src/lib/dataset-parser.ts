import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DatasetRow } from './api/types';
import type { ColumnRoleInfo } from './stats-engine';

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
  /^email[\s_]*address$/i,
  /^surel/i,
  /^alamat[\s_]*email/i,
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
  /^kategori[\s_]*pengeluaran/i,
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

export async function fetchServerSha256(data: ArrayBuffer | Uint8Array): Promise<string | null> {
  try {
    if (typeof fetch === 'undefined') return null;
    const body = data instanceof ArrayBuffer ? data : (data.buffer as ArrayBuffer);
    const res = await fetch('/api/dataset/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.sha256 || null;
  } catch {
    return null;
  }
}

export function detectColumnRole(colName: string, values: unknown[]): 'id' | 'demographic' | 'item' | 'ignored' {
  const clean = colName.trim().toLowerCase();

  // Check ID patterns
  if (['no', 'id', 'nomor', 'responden'].includes(clean)) {
    return 'id';
  }

  if (['timestamp', 'cap waktu', 'cap_waktu', 'email address', 'alamat email', 'surel'].includes(clean)) {
    return 'ignored';
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

  return 'item';
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  sha256: string;
  serverSha256?: string;
  serverSha256Matches?: boolean;
  delimiter?: string;
  encoding?: string;
  headerRowIndex?: number;
  titleRowsSkipped?: number;
  trailingEmptyRows?: number;
  sheetNames?: string[];
  selectedSheet?: string;
  textLikertMappedCount?: number;
  textLikertDetails?: Array<{
    row: number;
    column: string;
    rawText: string;
    mappedValue: number;
  }>;
  columnLabels?: Record<string, string>;
  originalHeaders?: string[];
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
    verifyServerHash?: boolean;
  }
): Promise<ParseResult> {
  const fileName = file.name;
  const fileSize = file.size;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('Ukuran berkas melebihi batas maksimum 10 MB. Silakan kurangi ukuran berkas Anda.');
  }

  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Format berkas tidak didukung. Harap unggah berkas tabulasi .csv, .xlsx, atau .xls.');
  }

  const buffer = await file.arrayBuffer();
  const sha256 = await computeSha256(buffer);
  
  // Optional server-side hash verification
  let serverSha256: string | undefined;
  let serverSha256Matches: boolean | undefined;
  if (options?.verifyServerHash !== false && typeof window !== 'undefined') {
    const sHash = await fetchServerSha256(buffer);
    if (sHash) {
      serverSha256 = sHash;
      serverSha256Matches = sHash.toLowerCase() === sha256.toLowerCase();
    }
  }

  const likertMap = { ...DEFAULT_LIKERT_MAP, ...(options?.customLikertMap || {}) };
  const ignoredInfo = {
    emptyRowsSkipped: 0,
    mergedCellsDetected: 0,
    notes: [] as string[],
  };

  let rawRows: Record<string, unknown>[] = [];
  let detectedHeaders: string[] = [];
  let originalHeadersList: string[] = [];
  let sheetNames: string[] | undefined;
  let selectedSheet: string | undefined;
  let detectedDelimiter = ',';
  let detectedEncoding = 'utf-8';
  let detectedHeaderRowIndex = 1;
  let detectedTitleRowsSkipped = 0;
  let trailingEmptyRowsCount = 0;

  if (ext === 'csv') {
    // 1. Decode with auto-detection for BOM / Windows-1252
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      detectedEncoding = 'utf-8';
    } catch {
      text = new TextDecoder('windows-1252').decode(buffer);
      detectedEncoding = 'windows-1252';
      ignoredInfo.notes.push('File terdeteksi menggunakan encoding Windows-1252.');
    }

    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
      ignoredInfo.notes.push('BOM (Byte Order Mark) UTF-8 terdeteksi dan dilepaskan.');
    }

    // Split text into raw lines to detect titles, delimiters, and trailing empties
    const rawLines = text.split(/\r?\n/);
    if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
      rawLines.pop();
    }

    // Count trailing empty lines
    let endIdx = rawLines.length - 1;
    while (endIdx >= 0 && rawLines[endIdx].trim() === '') {
      trailingEmptyRowsCount++;
      endIdx--;
    }
    const contentLines = rawLines.slice(0, endIdx + 1);

    if (trailingEmptyRowsCount > 0) {
      ignoredInfo.emptyRowsSkipped += trailingEmptyRowsCount;
      ignoredInfo.notes.push(`Mengabaikan ${trailingEmptyRowsCount} baris kosong di akhir berkas.`);
    }

    // 2. Delimiter detection across candidate lines (scan lines 0 to 10)
    let maxSemicolons = 0;
    let maxCommas = 0;
    let maxTabs = 0;

    for (let i = 0; i < Math.min(10, contentLines.length); i++) {
      const line = contentLines[i];
      const semiCount = (line.match(/;/g) || []).length;
      const commaCount = (line.match(/,/g) || []).length;
      const tabCount = (line.match(/\t/g) || []).length;

      if (semiCount > maxSemicolons) maxSemicolons = semiCount;
      if (commaCount > maxCommas) maxCommas = commaCount;
      if (tabCount > maxTabs) maxTabs = tabCount;
    }

    if (maxSemicolons > maxCommas && maxSemicolons > maxTabs) {
      detectedDelimiter = ';';
      ignoredInfo.notes.push('Pemisah kolom titik koma (;) terdeteksi.');
    } else if (maxTabs > maxCommas && maxTabs > maxSemicolons) {
      detectedDelimiter = '\t';
      ignoredInfo.notes.push('Pemisah kolom tab (\\t) terdeteksi.');
    } else {
      detectedDelimiter = ',';
    }

    // 3. Title rows skipping detection (scan lines 0 to 5)
    // If initial line(s) have very few columns while a later line has many columns (e.g. >= 4),
    // the later line is the actual header row!
    let headerLineIdx = 0;
    for (let i = 0; i < Math.min(6, contentLines.length); i++) {
      const colCount = contentLines[i].split(detectedDelimiter).length;
      if (colCount >= 4) {
        headerLineIdx = i;
        break;
      }
    }

    if (headerLineIdx > 0) {
      detectedTitleRowsSkipped = headerLineIdx;
      detectedHeaderRowIndex = headerLineIdx + 1; // 1-indexed
      ignoredInfo.notes.push(
        `Baris judul (${headerLineIdx} baris) dilewati. Baris header terdeteksi pada baris ke-${detectedHeaderRowIndex}.`
      );
    }

    // Slice content from the detected header line
    const cleanedCsvText = contentLines.slice(headerLineIdx).join('\n');

    const parsed = Papa.parse<Record<string, unknown>>(cleanedCsvText, {
      header: true,
      delimiter: detectedDelimiter,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Keep raw strings to handle comma decimals safely
    });

    rawRows = (parsed.data || []) as Record<string, unknown>[];
    detectedHeaders = (parsed.meta.fields || []).filter((f) => f && f.trim() !== '');
    originalHeadersList = [...detectedHeaders];

    if (parsed.errors && parsed.errors.length > 0) {
      ignoredInfo.emptyRowsSkipped += parsed.errors.length;
    }
  } else {
    // Excel (.xlsx, .xls) - Makro VBA diabaikan secara ketat demi integritas keamanan
    const workbook = XLSX.read(buffer, {
      type: 'array',
      bookVBA: false,
      cellFormula: false,
      cellHTML: false,
    });
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

    // Read raw sheet rows to detect title rows
    const sheetMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    let headerLineIdx = 0;
    for (let i = 0; i < Math.min(6, sheetMatrix.length); i++) {
      const row = sheetMatrix[i];
      if (Array.isArray(row) && row.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length >= 4) {
        headerLineIdx = i;
        break;
      }
    }

    if (headerLineIdx > 0) {
      detectedTitleRowsSkipped = headerLineIdx;
      detectedHeaderRowIndex = headerLineIdx + 1;
      ignoredInfo.notes.push(
        `Baris judul (${headerLineIdx} baris) dilewati. Baris header terdeteksi pada baris ke-${detectedHeaderRowIndex}.`
      );
    }

    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      range: headerLineIdx,
      defval: null,
      raw: false,
      blankrows: false,
    });

    if (rawData.length > 0) {
      detectedHeaders = Object.keys(rawData[0]).filter((k) => k && k.trim() !== '');
      originalHeadersList = [...detectedHeaders];
      rawRows = rawData;
    }
  }

  if (rawRows.length === 0 || detectedHeaders.length === 0) {
    throw new Error('Tidak ada baris data yang terbaca dari berkas yang diunggah.');
  }

  // Sanitize headers: remove whitespace
  const cleanHeaders = detectedHeaders.map((h) => h.trim());

  // 4. Google Form short-code proposer
  // Detect if headers are long questionnaire questions (> 25 characters)
  const columnLabels: Record<string, string> = {};
  const finalColumnNames: string[] = [];
  let longHeaderCount = 0;
  let questionCodeIndex = 1;

  cleanHeaders.forEach((origHeader) => {
    // If it's a typical demographic or short ID, keep as is
    if (DEMOGRAPHIC_REGEX.some((rx) => rx.test(origHeader)) || origHeader.length <= 25) {
      finalColumnNames.push(origHeader);
      columnLabels[origHeader] = origHeader;
    } else {
      longHeaderCount++;
      // Propose short code e.g. P1, P2 or infer from prefix
      const matchPrefix = origHeader.match(/^([A-Za-z]+)\s*(\d+)/);
      let shortCode: string;
      if (matchPrefix) {
        shortCode = `${matchPrefix[1].toUpperCase()}${matchPrefix[2]}`;
      } else {
        shortCode = `P${questionCodeIndex++}`;
      }
      finalColumnNames.push(shortCode);
      columnLabels[shortCode] = origHeader;
    }
  });

  if (longHeaderCount > 0) {
    ignoredInfo.notes.push(
      `Terdeteksi ${longHeaderCount} nama kolom panjang (format Google Form). Kode singkat (P1, P2...) diusulkan dan teks asli disimpan sebagai label.`
    );
  }

  // 5. Parse rows: handle decimal commas & text Likert mapping
  const finalRows: DatasetRow[] = [];
  const textLikertDetails: Array<{ row: number; column: string; rawText: string; mappedValue: number }> = [];
  let emptyRowCount = 0;

  rawRows.forEach((r, idx) => {
    // Check if entire row is empty
    const rawValues = cleanHeaders.map((h) => r[h]);
    const isAllEmpty = rawValues.every(
      (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
    );
    if (isAllEmpty) {
      emptyRowCount++;
      return;
    }

    const row: DatasetRow = {};
    const respondentRowNumber = finalRows.length + 1;

    cleanHeaders.forEach((origCol, colIdx) => {
      const targetCol = finalColumnNames[colIdx];
      let rawVal = r[origCol];

      if (rawVal === undefined || rawVal === null) {
        row[targetCol] = null;
        return;
      }

      if (typeof rawVal === 'string') {
        const trimmed = rawVal.trim();
        if (trimmed === '') {
          row[targetCol] = null;
          return;
        }

        // 5a. Check text Likert map
        const lower = trimmed.toLowerCase();
        if (likertMap[lower] !== undefined) {
          const mappedNum = likertMap[lower];
          row[targetCol] = mappedNum;
          textLikertDetails.push({
            row: respondentRowNumber,
            column: targetCol,
            rawText: trimmed,
            mappedValue: mappedNum,
          });
          return;
        }

        // 5b. Check Indonesian decimal comma (e.g. "3,5" -> 3.5, "-2,75" -> -2.75)
        if (/^-?\d+,\d+$/.test(trimmed)) {
          const num = Number(trimmed.replace(',', '.'));
          if (!isNaN(num)) {
            row[targetCol] = num;
            return;
          }
        }

        // 5c. Regular numeric check
        const num = Number(trimmed);
        if (!isNaN(num)) {
          row[targetCol] = num;
          return;
        }

        row[targetCol] = trimmed;
      } else if (typeof rawVal === 'number') {
        row[targetCol] = rawVal;
      } else {
        row[targetCol] = String(rawVal);
      }
    });

    // Ensure 1-indexed row number
    if (row.No === undefined) {
      row.No = respondentRowNumber;
    }
    finalRows.push(row);
  });

  if (emptyRowCount > 0) {
    ignoredInfo.emptyRowsSkipped += emptyRowCount;
    ignoredInfo.notes.push(`Mengabaikan ${emptyRowCount} baris kosong tanpa nilai.`);
  }

  if (textLikertDetails.length > 0) {
    ignoredInfo.notes.push(
      `Memetakan ${textLikertDetails.length} jawaban teks Likert menjadi angka 1-5 berdasarkan tabel pemetaan.`
    );
  }

  // Ensure 'No' is the first column if not present
  const allCols = finalColumnNames.includes('No') ? finalColumnNames : ['No', ...finalColumnNames];

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
    serverSha256,
    serverSha256Matches,
    delimiter: detectedDelimiter,
    encoding: detectedEncoding,
    headerRowIndex: detectedHeaderRowIndex,
    titleRowsSkipped: detectedTitleRowsSkipped,
    trailingEmptyRows: trailingEmptyRowsCount,
    sheetNames,
    selectedSheet,
    textLikertMappedCount: textLikertDetails.length,
    textLikertDetails,
    columnLabels,
    originalHeaders: originalHeadersList,
    ignoredInfo,
    columns: allCols,
    columnMeta,
    rows: finalRows,
    totalRawRows: rawRows.length,
  };
}
