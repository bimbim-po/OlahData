import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DatasetRow } from './api/types';
import type { ColumnRoleInfo } from './stats-engine';
import { parseIndonesianNumber } from './format';

export const DEFAULT_LIKERT_MAP: Record<string, number> = {
  // Indonesian 5-point agreement
  'sangat tidak setuju': 1,
  'tidak setuju': 2,
  'kurang setuju': 2,
  'netral': 3,
  'ragu-ragu': 3,
  'cukup setuju': 3,
  'setuju': 4,
  'sangat setuju': 5,
  'sts': 1,
  'ts': 2,
  'ks': 2,
  'n': 3,
  'rr': 3,
  'cs': 3,
  's': 4,
  'ss': 5,

  // English 5-point agreement
  'strongly disagree': 1,
  'disagree': 2,
  'somewhat disagree': 2,
  'neutral': 3,
  'neither agree nor disagree': 3,
  'somewhat agree': 4,
  'agree': 4,
  'strongly agree': 5,
  'sd': 1,
  'd': 2,
  'a': 4,
  'sa': 5,

  // Frequency
  'tidak pernah': 1,
  'jarang': 2,
  'kadang-kadang': 3,
  'sering': 4,
  'selalu': 5,
  'never': 1,
  'rarely': 2,
  'sometimes': 3,
  'often': 4,
  'always': 5,

  // Satisfaction
  'sangat tidak puas': 1,
  'tidak puas': 2,
  'kurang puas': 2,
  'cukup puas': 3,
  'puas': 4,
  'sangat puas': 5,
  'very dissatisfied': 1,
  'dissatisfied': 2,
  'neutral satisfaction': 3,
  'satisfied': 4,
  'very satisfied': 5,

  // Quality
  'sangat buruk': 1,
  'buruk': 2,
  'cukup': 3,
  'baik': 4,
  'sangat baik': 5,
  'very poor': 1,
  'poor': 2,
  'fair': 3,
  'good': 4,
  'very good': 5,
  'excellent': 5,
};

export const METADATA_REGEX = [
  /^timestamp$/i,
  /^cap[\s_]*waktu$/i,
  /^waktu$/i,
  /^date$/i,
  /^tanggal$/i,
  /^time$/i,
  /^start[\s_]*time$/i,
  /^completion[\s_]*time$/i,
  /^submitted[\s_]*at$/i,
  /^created[\s_]*at$/i,
  /^updated[\s_]*at$/i,
  /^ip[\s_]*address$/i,
  /^email/i,
  /^surel/i,
  /^alamat[\s_]*email/i,
  /^nama/i,
  /^name$/i,
  /^full[\s_]*name/i,
  /^telepon/i,
  /^phone/i,
  /^no[\s_]*hp/i,
  /^whatsapp/i,
  /^skor$/i,
  /^score$/i,
  /^total[\s_]*score$/i,
  /^total[\s_]*skor$/i,
  /^nilai[\s_]*kuis$/i,
  /^point/i,
  /^poin/i,
];

export const DEMOGRAPHIC_REGEX = [
  /^usia/i,
  /^umur/i,
  /^age/i,
  /^gender/i,
  /^jenis[\s_]*kelamin/i,
  /^jk$/i,
  /^sex$/i,
  /^pendidikan/i,
  /^education/i,
  /^pekerjaan/i,
  /^profesi/i,
  /^job/i,
  /^occupation/i,
  /^penghasilan/i,
  /^gaji/i,
  /^salary/i,
  /^income/i,
  /^pendapatan/i,
  /^kategori[\s_]*pengeluaran/i,
  /^status/i,
  /^agama/i,
  /^domisili/i,
  /^lokasi/i,
  /^kota/i,
  /^provinsi/i,
  /^ipk/i,
  /^gpa/i,
  /^semester/i,
  /^angkatan/i,
  /^kelas/i,
  /^fakultas/i,
  /^jurusan/i,
  /^prodi/i,
  /^program[\s_]*studi/i,
  /^jabatan/i,
  /^divisi/i,
  /^departemen/i,
  /^lama[\s_]*bekerja/i,
  /^masa[\s_]*kerja/i,
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

export function detectColumnRole(colName: string, values: unknown[]): 'id' | 'demographic' | 'item' | 'open_question' | 'ignored' {
  const clean = colName.trim().toLowerCase();

  const nonNullVals = values.filter((v) => v !== null && v !== undefined && v !== '');
  const stringVals = nonNullVals.map((v) => String(v).trim());
  const uniqueCount = new Set(stringVals.map((s) => s.toLowerCase())).size;
  const avgLen = stringVals.length > 0 ? stringVals.reduce((acc, s) => acc + s.length, 0) / stringVals.length : 0;
  const hasSentenceStructure = stringVals.some((s) => s.includes(' ') && s.length > 12);

  // =========================================================================
  // LAYER 1: METADATA, TIMESTAMPS, SCORES, & PII -> 'ignored'
  // Harus diprioritaskan utama agar Cap Waktu, Email, Nama Lengkap, dan Skor
  // tidak salah terdeteksi sebagai Pertanyaan Terbuka / Demografi.
  // =========================================================================

  // 1a. Cap Waktu / Timestamp / Datetime
  const isTimestampName = /^(timestamp|cap[\s_]*waktu|waktu|date|tanggal|time|start[\s_]*time|completion[\s_]*time|submitted[\s_]*at|created[\s_]*at|updated[\s_]*at|waktu[\s_]*pengisian)$/i.test(clean);
  const dateTimePatternMatches = stringVals.filter((s) =>
    /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(\s+[T]?\d{1,2}:\d{1,2}(:\d{1,2})?(\s*[AP]M)?)?$/i.test(s) ||
    /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}/.test(s)
  ).length;
  const isDateTimeValues = stringVals.length > 0 && dateTimePatternMatches / stringVals.length >= 0.6;
  if (isTimestampName || isDateTimeValues) {
    return 'ignored';
  }

  // 1b. Skor Kontinu / Nilai Kuis (Google Form quiz points)
  if (/^(skor|score|total[\s_]*score|total[\s_]*skor|nilai[\s_]*kuis|points?|poin)$/i.test(clean)) {
    return 'ignored';
  }

  // 1c. PII: Nama Lengkap, Email, Kontak Responden
  const isPiiName = /^(email|surel|alamat[\s_]*email|email[\s_]*address|nama|name|nama[\s_]*lengkap|full[\s_]*name|nama[\s_]*responden|username|kontak|no[\s_]*hp|nomor[\s_]*telepon|no[\s_]*wa|nomor[\s_]*whatsapp|telepon|phone)$/i.test(clean);
  const emailValMatches = stringVals.filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)).length;
  const isEmailValues = stringVals.length > 0 && emailValMatches / stringVals.length >= 0.5;
  if (isPiiName || isEmailValues) {
    return 'ignored';
  }

  // =========================================================================
  // LAYER 2: IDENTIFIER / ID RESPONDEN -> 'id'
  // Nomor urut, NIM, NPM, NIK, ID Responden
  // =========================================================================
  const isIdName =
    /^(no|id|nomor|no[\s_.]*responden|id[\s_.]*responden|respondent[\s_]*id|collector[\s_]*id|response[\s_]*id|network[\s_]*id|nim|npm|nik|nisn)$/i.test(clean) ||
    clean.startsWith('nim') ||
    clean.startsWith('npm') ||
    clean.startsWith('nik') ||
    clean.startsWith('nisn');
  if (isIdName) {
    return 'id';
  }

  // Cek apakah kolom berisi integer unik berurutan 1..N (identitas baris otomatis)
  if (nonNullVals.length >= 3 && uniqueCount === nonNullVals.length) {
    const isAllIntegers = nonNullVals.every((v) => {
      const n = Number(v);
      return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 100000;
    });
    if (isAllIntegers && !hasSentenceStructure && avgLen <= 10) {
      return 'id';
    }
  }

  // =========================================================================
  // LAYER 3: DEMOGRAFI -> 'demographic'
  // Karakteristik responden (Jenis Kelamin, Usia, Program Studi, Pendidikan, dll)
  // =========================================================================
  for (const pat of DEMOGRAPHIC_REGEX) {
    if (pat.test(clean)) {
      return 'demographic';
    }
  }

  // =========================================================================
  // LAYER 4: PERTANYAAN TERBUKA (KUALITATIF / SARAN / MASUKAN) -> 'open_question'
  // Kolom feedback/alasan/uraian naratif bebas responden
  // =========================================================================
  const OPEN_QUESTION_KEYWORDS = [
    'saran', 'kritik', 'masukan', 'pendapat', 'alasan', 'komentar', 'uraian', 'ceritakan',
    'catatan', 'keterangan', 'feedback', 'tanggapan', 'opini', 'pertanyaan terbuka',
    'pertanyaan_terbuka', 'open_ended', 'rekomendasi', 'kendala', 'harapan', 'pengalaman',
    'evaluasi', 'pesan', 'penjelasan', 'tuliskan'
  ];
  const isQuestionPrompt =
    clean.includes('?') ||
    clean.startsWith('mengapa') ||
    clean.startsWith('bagaimana') ||
    clean.startsWith('apa alasan') ||
    clean.startsWith('jelaskan') ||
    clean.startsWith('sebutkan') ||
    clean.startsWith('ceritakan');
  const hasOpenKeyword = OPEN_QUESTION_KEYWORDS.some((kw) => clean.includes(kw));

  if (hasOpenKeyword || isQuestionPrompt) {
    return 'open_question';
  }

  // =========================================================================
  // LAYER 5: BUTIR INSTRUMEN PENELITIAN -> 'item'
  // Skala Likert numerik (1-5, 1-7, 1-10) atau teks (Sangat Setuju, dll)
  // =========================================================================

  // Cek pola penamaan item baku penelitian (mis. P1..P10, X1_1, Y1, KL1, dsb.)
  const isStandardItemCode =
    /^[a-zA-Z]{1,3}\s*[-_.]?\s*\d{1,2}$/i.test(clean) ||
    /^(item|butir|indikator|pernyataan)\s*[-_.]?\s*\d+$/i.test(clean);

  let numericLikertCount = 0;
  let textLikertCount = 0;
  let numericCount = 0;
  const numVals: number[] = [];

  for (const v of nonNullVals) {
    const num = Number(v);
    if (!isNaN(num) && typeof v !== 'boolean') {
      numericCount++;
      numVals.push(num);
      if (num >= 0 && num <= 11) {
        numericLikertCount++;
      }
    } else if (typeof v === 'string' && DEFAULT_LIKERT_MAP[v.trim().toLowerCase()] !== undefined) {
      textLikertCount++;
    }
  }

  // Jika kolom bernama kode item dan memiliki nilai numerik dalam rentang wajar (1-10)
  if (isStandardItemCode && nonNullVals.length > 0 && (numericLikertCount + textLikertCount) / nonNullVals.length >= 0.5) {
    return 'item';
  }

  // Jika mayoritas nilai adalah skala Likert (numerik 1-10 atau teks ordinal)
  if (nonNullVals.length > 0 && (numericLikertCount + textLikertCount) / nonNullVals.length >= 0.6) {
    // Pastikan bukan usia atau gaji kontinu
    if (numVals.length > 0) {
      const minN = Math.min(...numVals);
      const maxN = Math.max(...numVals);
      if (maxN <= 11 && minN >= 0) {
        return 'item';
      }
    } else {
      return 'item';
    }
  }

  // =========================================================================
  // LAYER 6: FALLBACK HEURISTICS
  // =========================================================================

  // Jika unik sedikit (<= 15) dan bertipe string/kategori -> Demografi
  if (uniqueCount <= 15 && nonNullVals.length > 0) {
    return 'demographic';
  }

  // Jika kalimat panjang bebas dengan spasi dan banyak ragam -> Pertanyaan Terbuka
  if (hasSentenceStructure && avgLen > 25 && uniqueCount > 5) {
    return 'open_question';
  }

  return 'ignored';
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
  summary?: {
    totalRows: number;
    totalColumns: number;
    missingCellCount: number;
    itemCount: number;
    demographicCount: number;
    idCount: number;
    openQuestionCount: number;
    ignoredCount: number;
  };
}


export function extractGoogleSheetsCsvUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();

  // Pattern 1: Published to web (/d/e/2PACX.../pubhtml or /pub)
  const pubMatch = url.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9_\-]+)/i);
  if (pubMatch) {
    const pubId = pubMatch[1];
    let gid = '';
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/i);
    if (gidMatch) gid = `&gid=${gidMatch[1]}`;
    return `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${gid}`;
  }

  // Pattern 2: Standard spreadsheet (/spreadsheets/d/SPREADSHEET_ID)
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_\-]+)/i);
  if (sheetMatch) {
    const sheetId = sheetMatch[1];
    let gid = '';
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/i);
    if (gidMatch) gid = `&gid=${gidMatch[1]}`;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
  }

  return null;
}

export function parseGenericTabularXml(xmlString: string): { rows: Record<string, unknown>[]; headers: string[] } {
  const rows: Record<string, unknown>[] = [];
  const headersSet = new Set<string>();

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Berkas XML tidak valid: ' + (parserError.textContent || 'Format XML rusak'));
    }
    const possibleRowTags = ['row', 'record', 'item', 'entry', 'data', 'responden', 'respondent', 'baris', 'subject'];
    let rowElements: Element[] = [];
    for (const tag of possibleRowTags) {
      const els = doc.getElementsByTagName(tag);
      if (els && els.length > 0) {
        rowElements = Array.from(els);
        break;
      }
    }
    if (rowElements.length === 0 && doc.documentElement) {
      rowElements = Array.from(doc.documentElement.children);
    }
    for (const rowEl of rowElements) {
      const rowObj: Record<string, unknown> = {};
      for (let i = 0; i < rowEl.attributes.length; i++) {
        const attr = rowEl.attributes[i];
        rowObj[attr.name] = attr.value;
        headersSet.add(attr.name);
      }
      for (let i = 0; i < rowEl.children.length; i++) {
        const child = rowEl.children[i];
        rowObj[child.tagName] = child.textContent?.trim() ?? '';
        headersSet.add(child.tagName);
      }
      if (Object.keys(rowObj).length > 0) {
        rows.push(rowObj);
      }
    }
  } else {
    // Regex fallback for Node.js test environment
    const rowRegex = /<(?:row|record|item|entry|data|responden|respondent|baris)(?:[\s>][\s\S]*?)<\/(?:row|record|item|entry|data|responden|respondent|baris)>/gi;
    let match;
    while ((match = rowRegex.exec(xmlString)) !== null) {
      const rowContent = match[0];
      const rowObj: Record<string, unknown> = {};
      const openTagMatch = rowContent.match(/^<[a-zA-Z0-9_\-]+([^>]*)>/);
      if (openTagMatch && openTagMatch[1]) {
        const attrRegex = /([a-zA-Z0-9_\-]+)=["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(openTagMatch[1])) !== null) {
          rowObj[attrMatch[1]] = attrMatch[2];
          headersSet.add(attrMatch[1]);
        }
      }
      const tagRegex = /<([a-zA-Z0-9_\-\.]+)[^>]*>([^<]*)<\/\1>/g;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(rowContent)) !== null) {
        const key = tagMatch[1];
        const val = tagMatch[2].trim();
        rowObj[key] = val;
        headersSet.add(key);
      }
      if (Object.keys(rowObj).length > 0) {
        rows.push(rowObj);
      }
    }
  }

  return {
    rows,
    headers: Array.from(headersSet),
  };
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

  if (fileSize === 0) {
    throw new Error('File kosong atau tidak memiliki baris data. Silakan unggah file CSV/Excel yang valid.');
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('Ukuran berkas melebihi batas maksimum 10 MB. Silakan kurangi ukuran berkas Anda.');
  }

  const allowedExtensions = ['csv', 'xlsx', 'xls', 'xml', 'json'];
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new Error('Format berkas tidak didukung. Harap unggah berkas tabulasi .csv, .xlsx, .xls, .xml, atau .json.');
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
  } else if (ext === 'xml') {
    let xmlText: string;
    try {
      xmlText = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      detectedEncoding = 'utf-8';
    } catch {
      xmlText = new TextDecoder('windows-1252').decode(buffer);
      detectedEncoding = 'windows-1252';
      ignoredInfo.notes.push('File XML terdeteksi menggunakan encoding Windows-1252.');
    }

    if (xmlText.charCodeAt(0) === 0xfeff) {
      xmlText = xmlText.slice(1);
      ignoredInfo.notes.push('BOM (Byte Order Mark) UTF-8 terdeteksi dan dilepaskan.');
    }

    // 1. Cek apakah XML Spreadsheet 2003 (Excel XML)
    const isExcelXml = xmlText.includes('urn:schemas-microsoft-com:office:spreadsheet') || xmlText.includes('<Workbook');
    if (isExcelXml) {
      try {
        const workbook = XLSX.read(xmlText, {
          type: 'string',
          bookVBA: false,
          cellFormula: false,
          cellHTML: false,
        });
        sheetNames = workbook.SheetNames;
        selectedSheet = options?.sheetName || sheetNames[0];
        if (selectedSheet && workbook.Sheets[selectedSheet]) {
          const sheet = workbook.Sheets[selectedSheet];
          const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: null,
            raw: false,
            blankrows: false,
          });
          if (rawData.length > 0) {
            rawRows = rawData;
            detectedHeaders = Object.keys(rawRows[0]).filter((k) => k && k.trim() !== '');
            originalHeadersList = [...detectedHeaders];
            ignoredInfo.notes.push('Format XML terdeteksi sebagai Microsoft Excel XML Spreadsheet 2003.');
          }
        }
      } catch {
        // Fallback to generic XML parsing below
      }
    }

    // 2. Jika bukan Excel XML atau belum terurai, gunakan generic tabular XML parser
    if (rawRows.length === 0) {
      const parsedXml = parseGenericTabularXml(xmlText);
      rawRows = parsedXml.rows;
      detectedHeaders = parsedXml.headers;
      originalHeadersList = [...detectedHeaders];
      ignoredInfo.notes.push(`Format XML terdeteksi sebagai data tabulasi generik (${rawRows.length} baris data).`);
    }

    if (rawRows.length === 0 || detectedHeaders.length === 0) {
      throw new Error('Berkas XML tidak memuat elemen baris data yang dapat diuraikan. Pastikan XML menggunakan tag baris seperti <row>, <record>, <data>, <item>, atau <responden>.');
    }
  } else if (ext === 'json') {
    let jsonText: string;
    try {
      jsonText = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      detectedEncoding = 'utf-8';
    } catch {
      jsonText = new TextDecoder('windows-1252').decode(buffer);
      detectedEncoding = 'windows-1252';
      ignoredInfo.notes.push('Berkas JSON terdeteksi menggunakan encoding Windows-1252.');
    }

    if (jsonText.charCodeAt(0) === 0xfeff) {
      jsonText = jsonText.slice(1);
    }

    try {
      const parsed = JSON.parse(jsonText);
      const rowsArray = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.data)
        ? parsed.data
        : Array.isArray(parsed?.rows)
        ? parsed.rows
        : [];

      if (rowsArray.length > 0 && typeof rowsArray[0] === 'object' && rowsArray[0] !== null) {
        rawRows = rowsArray;
        detectedHeaders = Object.keys(rawRows[0]).filter((k) => k && k.trim() !== '');
        originalHeadersList = [...detectedHeaders];
        ignoredInfo.notes.push(`Format JSON terdeteksi sebagai data tabulasi (${rawRows.length} baris data).`);
      } else {
        throw new Error('File kosong atau tidak memiliki baris data. Silakan unggah file CSV/Excel yang valid.');
      }
    } catch (err: unknown) {
      throw new Error(
        err instanceof Error && err.message.includes('baris data')
          ? err.message
          : 'Berkas JSON rusak atau format tidak valid. Pastikan berisi array of objects.'
      );
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
    throw new Error('File kosong atau tidak memiliki baris data. Silakan unggah file CSV/Excel yang valid.');
  }

  // Sanitize headers: remove whitespace
  const cleanHeaders = detectedHeaders.map((h) => h.trim());

  // Deduplicate headers by appending _2, _3 while saving the original text
  const seenHeadersCount = new Map<string, number>();
  const dedupedHeaders: string[] = [];
  const originalHeaderMap: Record<string, string> = {};

  cleanHeaders.forEach((h) => {
    if (seenHeadersCount.has(h)) {
      const cnt = seenHeadersCount.get(h)! + 1;
      seenHeadersCount.set(h, cnt);
      const uniqueName = `${h}_${cnt}`;
      dedupedHeaders.push(uniqueName);
      originalHeaderMap[uniqueName] = h;
      ignoredInfo.notes.push(`Header duplikat terdeteksi: '${h}' diberi nama unik '${uniqueName}'.`);
    } else {
      seenHeadersCount.set(h, 1);
      dedupedHeaders.push(h);
      originalHeaderMap[h] = h;
    }
  });

  // 4. Item code and label extraction
  const columnLabels: Record<string, string> = {};
  const finalColumnNames: string[] = [];
  let longHeaderCount = 0;
  let questionCodeIndex = 1;

  dedupedHeaders.forEach((uniqueCol) => {
    const origText = originalHeaderMap[uniqueCol] || uniqueCol;
    // If it's a typical demographic or short metadata, keep as is
    if (METADATA_REGEX.some((rx) => rx.test(origText)) || DEMOGRAPHIC_REGEX.some((rx) => rx.test(origText)) || origText.length <= 20) {
      finalColumnNames.push(uniqueCol);
      columnLabels[uniqueCol] = origText;
    } else {
      longHeaderCount++;
      // Extract code prefix e.g. X1.1, Q1, P3, or P{n}
      const matchPrefix = origText.match(/^([A-Za-z]{1,4}[_\-.]?\d{1,2}(?:[._]\d{1,2})?)/);
      const matchNum = origText.match(/^(?:\(?(\d{1,3})\)?[:.\-\s]+)/);
      let shortCode: string;
      if (matchPrefix) {
        shortCode = matchPrefix[1].replace(/_/g, '.').toUpperCase();
      } else if (matchNum) {
        shortCode = `P${matchNum[1]}`;
      } else {
        shortCode = `P${questionCodeIndex++}`;
      }

      // Ensure shortCode is unique in finalColumnNames
      if (finalColumnNames.includes(shortCode)) {
        shortCode = `${shortCode}_${questionCodeIndex++}`;
      }

      finalColumnNames.push(shortCode);
      columnLabels[shortCode] = origText;
    }
  });

  if (longHeaderCount > 0) {
    ignoredInfo.notes.push(
      `Terdeteksi ${longHeaderCount} nama kolom panjang (format Google Form / kuesioner online). Label butir konsisten dibuat dan pertanyaan asli disimpan.`
    );
  }

  // 5. Parse rows: handle decimal commas, string numbers & text Likert mapping
  const finalRows: DatasetRow[] = [];
  const textLikertDetails: Array<{ row: number; column: string; rawText: string; mappedValue: number }> = [];
  let emptyRowCount = 0;

  for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
    // Yield every 250 rows to keep main UI thread completely responsive
    if (rIdx > 0 && rIdx % 250 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const r = rawRows[rIdx];

    // Check if entire row is empty
    const rawValues = detectedHeaders.map((h) => r[h]);
    const isAllEmpty = rawValues.every(
      (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
    );
    if (isAllEmpty) {
      emptyRowCount++;
      continue;
    }

    const row: DatasetRow = {};
    const respondentRowNumber = finalRows.length + 1;

    dedupedHeaders.forEach((uniqueCol, colIdx) => {
      const origRawKey = originalHeaderMap[uniqueCol] || uniqueCol;
      const targetCol = finalColumnNames[colIdx];
      let rawVal = r[origRawKey];

      if (rawVal === undefined || rawVal === null) {
        row[targetCol] = null;
        return;
      }

      if (typeof rawVal === 'string') {
        const trimmed = rawVal.trim();
        // Missing string markers
        if (trimmed === '' || ['-', 'n/a', 'na', 'null', 'none', '#n/a', 'nan', '<kosong>'].includes(trimmed.toLowerCase())) {
          row[targetCol] = null;
          return;
        }

        // 5a. Check Google Form scale label: "5 - Sangat Setuju" or "1 (Sangat Tidak Setuju)"
        const gfMatch = trimmed.match(/^(\d+)\s*[-:.)]\s*([a-zA-Z].*)$/);
        if (gfMatch) {
          const num = Number(gfMatch[1]);
          if (!isNaN(num)) {
            row[targetCol] = num;
            textLikertDetails.push({
              row: respondentRowNumber,
              column: targetCol,
              rawText: trimmed,
              mappedValue: num,
            });
            return;
          }
        }

        // 5b. Check text Likert dictionary
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

        // 5c. Safe parsing of Indonesian formatted numbers and currency
        const indoParsed = parseIndonesianNumber(trimmed);
        if (indoParsed !== null) {
          row[targetCol] = indoParsed;
          return;
        }

        row[targetCol] = trimmed;
      } else if (typeof rawVal === 'number') {
        row[targetCol] = isNaN(rawVal) ? null : rawVal;
      } else {
        row[targetCol] = String(rawVal);
      }
    });

    // Ensure 1-indexed row number
    if (row.No === undefined) {
      row.No = respondentRowNumber;
    }
    finalRows.push(row);
  }

  if (finalRows.length === 0) {
    throw new Error('File kosong atau tidak memiliki baris data. Silakan unggah file CSV/Excel yang valid.');
  }

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
    summary: {
      totalRows: finalRows.length,
      totalColumns: allCols.length,
      missingCellCount: columnMeta.reduce((acc, c) => acc + c.missingCount, 0),
      itemCount: columnMeta.filter((c) => c.role === 'item').length,
      demographicCount: columnMeta.filter((c) => c.role === 'demographic').length,
      idCount: columnMeta.filter((c) => c.role === 'id').length,
      openQuestionCount: columnMeta.filter((c) => c.role === 'open_question').length,
      ignoredCount: columnMeta.filter((c) => c.role === 'ignored').length,
    },
  };
}
