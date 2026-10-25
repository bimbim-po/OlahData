import crypto from 'crypto';
import type { AnalysisResults } from '@/lib/api/types';

// =============================================================================
// PRINSIP S1-S5: MESIN SINKRONISASI KANONIK SERVER (SINGLE SOURCE OF TRUTH)
// =============================================================================

export const FORBIDDEN_DEMO_TITLES = new Set([
  'pengaruh kualitas layanan dan kepuasan terhadap loyalitas pelanggan',
  'pengaruh kualitas layanan terhadap kepuasan pelanggan',
  'analisis skripsi',
  'penelitian skripsi',
  'analisis data skripsi',
  'proyek penelitian baru',
  'judul penelitian contoh',
]);

export const LEGACY_DUMMY_PROJECT_IDS = new Set([
  'project-1',
  'project-2',
  'project-3',
  'demo-project-1',
  'demo-project-2',
]);

export const LEGACY_DUMMY_RUN_IDS = new Set([
  'run-2026-001',
  'run-2026-002',
  'run-2026-003',
  'run-2026-004',
  'run-demo-1',
  'run-demo-2',
]);

export const MIN_RESPONDENTS_DEFAULT = 5;
export const MAX_NOTE_LENGTH = 20000;

export const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// =============================================================================
// TIPE DATA MODEL SERVER (SESUAI SKEMA SUPABASE MIGRATION 0011)
// =============================================================================

export interface ServerDatasetRecord {
  id: string;
  projectId: string;
  version: number;
  kind: 'original' | 'derived';
  contentHash: string;
  rowCount: number;
  columnCount: number;
  columnMeta: Array<{ name: string; type: string; role?: string }>;
  excludedRows: number[];
  rows?: Record<string, unknown>[];
  uploadedAt: string;
}

export interface ServerRowExclusionRecord {
  id: string;
  datasetId: string;
  projectId: string;
  rowIndex: number;
  reason: string;
  createdAt: string;
}

export interface ServerProjectRecord {
  id: string;
  ownerId: string;
  title: string;
  department: string;
  researchType: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'error';
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerNoteRecord {
  id: string;
  projectId: string;
  sectionId: string;
  text: string;
  version: number;
  updatedAt: string;
}

export interface ServerAnalysisRunRecord {
  id: string;
  projectId: string;
  datasetId: string;
  datasetHash: string;
  nUsed: number;
  nExcluded: number;
  tests: string[];
  params: Record<string, unknown>;
  engineVersion: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
  resultsRef: string | null;
  idempotencyKey: string | null;
  fileName?: string;
  datasetVersion?: number;
  datasetKind?: 'original' | 'derived';
}

export interface ServerExportRecord {
  id: string;
  projectId: string;
  runId: string;
  format: 'docx' | 'pdf' | 'spss-word';
  titleSnapshot: string;
  createdAt: string;
}

export interface SyncProjectSummaryDTO {
  id: string;
  ownerId: string;
  title: string;
  department: string;
  researchType: string;
  status: 'draft' | 'ready' | 'running' | 'completed' | 'error';
  isSample: boolean;
  respondentCount: number;
  itemCount: number;
  dataset: {
    id: string | null;
    row_count: number;
    excluded_count: number;
    n: number;
    content_hash: string | null;
    uploaded_at: string | null;
    excluded_rows: number[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SyncApiError {
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// S2: FUNGSI KANONIK PERHITUNGAN N EFEKTIF (SINGLE SOURCE OF TRUTH)
// =============================================================================

/**
 * Prinsip S2: Satu fungsi server kanonik untuk menghitung N.
 * N = jumlah baris dataset - jumlah baris unik yang dikecualikan.
 * Dipakai oleh Dashboard, eksekusi analisis, lampiran, dan ekspor.
 */
export function computeEffectiveN(
  rowCount: number,
  excludedRowsOrCount: number | readonly number[] | null | undefined
): number {
  const safeRowCount = Number.isFinite(rowCount) ? Math.max(0, Math.floor(rowCount)) : 0;
  if (safeRowCount === 0) return 0;

  let excludedCount = 0;
  if (typeof excludedRowsOrCount === 'number') {
    excludedCount = Number.isFinite(excludedRowsOrCount)
      ? Math.max(0, Math.floor(excludedRowsOrCount))
      : 0;
  } else if (Array.isArray(excludedRowsOrCount)) {
    const validUniqueIndices = new Set<number>();
    for (const rawIdx of excludedRowsOrCount) {
      const idx = Number(rawIdx);
      if (Number.isInteger(idx) && idx >= 0 && idx < safeRowCount) {
        validUniqueIndices.add(idx);
      }
    }
    excludedCount = validUniqueIndices.size;
  }

  return Math.max(0, safeRowCount - excludedCount);
}

/**
 * Menghitung hash SHA-256 deterministik untuk isi dataset dan daftar baris yang dikecualikan.
 */
export function computeDatasetContentHash(
  rows: readonly Record<string, unknown>[],
  excludedRows: readonly number[] = []
): string {
  const normalizedExcluded = [...new Set(excludedRows)].sort((a, b) => a - b);
  const payload = JSON.stringify({
    rowCount: rows.length,
    excludedRows: normalizedExcluded,
    sampleFirst: rows[0] || null,
    sampleLast: rows[rows.length - 1] || null,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// =============================================================================
// VALIDASI JUDUL PROYEK & ESCAPING DOKUMEN EKSPOR (MASALAH 3 & MASALAH 5)
// =============================================================================

export interface TitleValidationResult {
  valid: boolean;
  sanitizedTitle: string;
  error?: SyncApiError;
}

/**
 * Validasi judul proyek di sisi server:
 * - Trim spasi berlebih & hapus karakter kontrol
 * - Tolak string kosong (422)
 * - Panjang wajib 5 - 250 karakter (422)
 * - Tolak judul demo bawaan pada proyek non-sampel (422)
 */
export function validateProjectTitle(
  rawTitle: unknown,
  isSample: boolean = false
): TitleValidationResult {
  if (typeof rawTitle !== 'string') {
    return {
      valid: false,
      sanitizedTitle: '',
      error: {
        status: 422,
        code: 'EMPTY_PROJECT_TITLE',
        message: 'Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.',
      },
    };
  }

  // Hapus karakter kontrol ASCII (0x00-0x1F, 0x7F) kecuali spasi standar, lalu rapikan spasi ganda
  const cleaned = rawTitle
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return {
      valid: false,
      sanitizedTitle: '',
      error: {
        status: 422,
        code: 'EMPTY_PROJECT_TITLE',
        message: 'Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.',
      },
    };
  }

  if (cleaned.length < 5 || cleaned.length > 250) {
    return {
      valid: false,
      sanitizedTitle: cleaned,
      error: {
        status: 422,
        code: 'INVALID_TITLE_LENGTH',
        message: `Judul penelitian harus terdiri dari 5 hingga 250 karakter (saat ini ${cleaned.length} karakter). Perbaiki di formulir proyek.`,
      },
    };
  }

  const normalizedLower = cleaned.toLowerCase();
  if (!isSample && FORBIDDEN_DEMO_TITLES.has(normalizedLower)) {
    return {
      valid: false,
      sanitizedTitle: cleaned,
      error: {
        status: 422,
        code: 'DEMO_TITLE_FORBIDDEN',
        message:
          'Judul penelitian belum diisi atau masih menggunakan judul demo bawaan sistem. Lengkapi judul asli Anda di formulir proyek sebelum mengunduh.',
      },
    };
  }

  return {
    valid: true,
    sanitizedTitle: cleaned,
  };
}

/**
 * Escape karakter khusus XML/HTML (&, <, >, ", ') tanpa mengubah kata "&" menjadi "dan"
 * dan tetap menjaga simbol akademik/statistik Unicode (R², α, β, ≥, —).
 */
export function escapeXmlDocumentText(input: string): string {
  if (!input) return '';
  return String(input)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Menormalkan karakter Unicode & simbol statistik ke representasi aman Type1 PDF
 * lalu melakukan escape karakter kontrol PDF (\, (, )) agar tidak merusak struktur PDF 1.4.
 */
export function escapePdfSafeText(input: string): string {
  if (!input) return '';
  return String(input)
    .replace(/\u2014/g, '--') // em-dash —
    .replace(/\u2013/g, '-') // en-dash –
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/\u2022/g, '*') // bullet •
    .replace(/\u2026/g, '...') // ellipsis …
    .replace(/R\u00B2/g, 'R2') // R²
    .replace(/\u00B2/g, '2') // superscript 2
    .replace(/\u03B1/g, 'alpha') // α
    .replace(/\u03B2/g, 'beta') // β
    .replace(/\u2265/g, '>=') // ≥
    .replace(/\u2264/g, '<=') // ≤
    .replace(/\u2260/g, '!=') // ≠
    .replace(/\u00B1/g, '+/-') // ±
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

// =============================================================================
// PENYIMPANAN SERVER TERPUSAT (TANPA SEED DUMMY PADA PROYEK PENGGUNA)
// =============================================================================

class CanonicalServerStore {
  projects = new Map<string, ServerProjectRecord>();
  datasets = new Map<string, ServerDatasetRecord>(); // key: datasetId
  projectLatestDataset = new Map<string, string>(); // key: projectId -> datasetId
  rowExclusions = new Map<string, ServerRowExclusionRecord[]>(); // key: datasetId
  notes = new Map<string, ServerNoteRecord>(); // key: `${projectId}::${sectionId}`
  runs = new Map<string, ServerAnalysisRunRecord>(); // key: runId
  results = new Map<string, AnalysisResults>(); // key: runId
  exports = new Map<string, ServerExportRecord>(); // key: exportId
  idempotencyLocks = new Map<string, string>(); // key: `${projectId}::${idempotencyKey}` -> runId
  migrationCompleted = false;

  resetForTesting(): void {
    this.projects.clear();
    this.datasets.clear();
    this.projectLatestDataset.clear();
    this.rowExclusions.clear();
    this.notes.clear();
    this.runs.clear();
    this.results.clear();
    this.exports.clear();
    this.idempotencyLocks.clear();
    this.migrationCompleted = false;
  }
}

const globalForSync = globalThis as unknown as {
  __olahdataCanonicalStore?: CanonicalServerStore;
};

export const serverStore: CanonicalServerStore =
  globalForSync.__olahdataCanonicalStore || new CanonicalServerStore();

if (!globalForSync.__olahdataCanonicalStore) {
  globalForSync.__olahdataCanonicalStore = serverStore;
}

// =============================================================================
// S3: PEMERIKSAAN AUTENTIKASI & KEPEMILIKAN PROYEK (ISOLASI PENGGUNA)
// =============================================================================

export function assertAuthenticatedUser(
  userId: string | null | undefined
): { ok: true; userId: string } | { ok: false; error: SyncApiError } {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return {
      ok: false,
      error: {
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Sesi Anda belum terautentikasi atau telah berakhir. Silakan masuk terlebih dahulu.',
      },
    };
  }
  return { ok: true, userId: userId.trim() };
}

export function assertProjectOwnership(
  projectId: string,
  userId: string | null | undefined
):
  | { ok: true; project: ServerProjectRecord; userId: string }
  | { ok: false; error: SyncApiError } {
  const authCheck = assertAuthenticatedUser(userId);
  if (!authCheck.ok) return authCheck;

  const project = serverStore.projects.get(projectId);
  if (!project) {
    return {
      ok: false,
      error: {
        status: 404,
        code: 'PROJECT_NOT_FOUND',
        message: 'Proyek penelitian tidak ditemukan di penyimpanan server.',
      },
    };
  }

  if (project.ownerId !== authCheck.userId) {
    return {
      ok: false,
      error: {
        status: 403,
        code: 'FORBIDDEN_PROJECT_ACCESS',
        message: 'Akses ditolak: Anda tidak memiliki izin untuk mengakses atau mengubah proyek pengguna lain.',
      },
    };
  }

  return { ok: true, project, userId: authCheck.userId };
}

// =============================================================================
// OPERASI PROYEK & DATASET (MASALAH 3 & MASALAH 5)
// =============================================================================

export function buildProjectSummaryDTO(project: ServerProjectRecord): SyncProjectSummaryDTO {
  const latestDatasetId = serverStore.projectLatestDataset.get(project.id) || null;
  const dataset = latestDatasetId ? serverStore.datasets.get(latestDatasetId) || null : null;

  const rowCount = dataset ? dataset.rowCount : 0;
  const excludedRows = dataset ? [...new Set(dataset.excludedRows)].sort((a, b) => a - b) : [];
  const effectiveN = computeEffectiveN(rowCount, excludedRows);
  const excludedCount = Math.max(0, rowCount - effectiveN);

  return {
    id: project.id,
    ownerId: project.ownerId,
    title: project.title,
    department: project.department,
    researchType: project.researchType,
    status: project.status,
    isSample: project.isSample,
    respondentCount: effectiveN,
    itemCount: dataset ? dataset.columnCount : 0,
    dataset: {
      id: dataset ? dataset.id : null,
      row_count: rowCount,
      excluded_count: excludedCount,
      n: effectiveN,
      content_hash: dataset ? dataset.contentHash : null,
      uploaded_at: dataset ? dataset.uploadedAt : null,
      excluded_rows: excludedRows,
    },
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function createServerProject(params: {
  id?: string;
  ownerId: string | null | undefined;
  title: unknown;
  department?: string;
  researchType?: string;
  isSample?: boolean;
}): { ok: true; data: SyncProjectSummaryDTO } | { ok: false; error: SyncApiError } {
  const authCheck = assertAuthenticatedUser(params.ownerId);
  if (!authCheck.ok) return authCheck;

  const isSample = Boolean(params.isSample);
  const titleCheck = validateProjectTitle(params.title, isSample);
  if (!titleCheck.valid || !titleCheck.sanitizedTitle) {
    return { ok: false, error: titleCheck.error! };
  }

  const now = new Date().toISOString();
  const projectId = params.id || `proj_${crypto.randomUUID()}`;

  const record: ServerProjectRecord = {
    id: projectId,
    ownerId: authCheck.userId,
    title: titleCheck.sanitizedTitle,
    department: (params.department || 'Manajemen').trim(),
    researchType: (params.researchType || 'Regresi Linier Berganda').trim(),
    status: 'draft',
    isSample,
    createdAt: now,
    updatedAt: now,
  };

  serverStore.projects.set(projectId, record);
  return { ok: true, data: buildProjectSummaryDTO(record) };
}

export function listServerProjectsForUser(
  ownerId: string | null | undefined
): { ok: true; data: SyncProjectSummaryDTO[] } | { ok: false; error: SyncApiError } {
  const authCheck = assertAuthenticatedUser(ownerId);
  if (!authCheck.ok) return authCheck;

  const list: SyncProjectSummaryDTO[] = [];
  for (const proj of serverStore.projects.values()) {
    if (proj.ownerId === authCheck.userId && !LEGACY_DUMMY_PROJECT_IDS.has(proj.id)) {
      list.push(buildProjectSummaryDTO(proj));
    }
  }

  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return { ok: true, data: list };
}

export function getServerProjectSummary(
  projectId: string,
  ownerId: string | null | undefined
): { ok: true; data: SyncProjectSummaryDTO } | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(projectId, ownerId);
  if (!access.ok) return access;

  return { ok: true, data: buildProjectSummaryDTO(access.project) };
}

export function updateServerProjectTitle(params: {
  projectId: string;
  ownerId: string | null | undefined;
  title: unknown;
  department?: string;
}): { ok: true; data: SyncProjectSummaryDTO } | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  const titleCheck = validateProjectTitle(params.title, access.project.isSample);
  if (!titleCheck.valid) {
    return { ok: false, error: titleCheck.error! };
  }

  const updated: ServerProjectRecord = {
    ...access.project,
    title: titleCheck.sanitizedTitle,
    department: params.department ? params.department.trim() : access.project.department,
    updatedAt: new Date().toISOString(),
  };

  serverStore.projects.set(updated.id, updated);

  // Sinkronkan judul pada hasil analisis yang tersimpan di server agar selalu konsisten (S1)
  for (const [runId, run] of serverStore.runs.entries()) {
    if (run.projectId === updated.id) {
      const res = serverStore.results.get(runId);
      if (res) {
        serverStore.results.set(runId, {
          ...res,
          projectTitle: updated.title,
        });
      }
    }
  }

  return { ok: true, data: buildProjectSummaryDTO(updated) };
}

export function registerServerDataset(params: {
  datasetId?: string;
  projectId: string;
  ownerId: string | null | undefined;
  rowCount: number;
  columnCount: number;
  rows?: Record<string, unknown>[];
  excludedRows?: number[];
  columnMeta?: Array<{ name: string; type: string; role?: string }>;
}): { ok: true; dataset: ServerDatasetRecord; project: SyncProjectSummaryDTO } | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  const safeRowCount = Math.max(0, Math.floor(params.rowCount));
  const safeColCount = Math.max(0, Math.floor(params.columnCount));
  const validExcluded = (params.excludedRows || []).filter(
    (idx) => Number.isInteger(idx) && idx >= 0 && idx < safeRowCount
  );
  const uniqueExcluded = [...new Set(validExcluded)].sort((a, b) => a - b);

  const datasetId = params.datasetId || `ds_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const rows = params.rows || [];
  const contentHash = computeDatasetContentHash(rows, uniqueExcluded);

  const datasetRecord: ServerDatasetRecord = {
    id: datasetId,
    projectId: access.project.id,
    version: 1,
    kind: uniqueExcluded.length > 0 ? 'derived' : 'original',
    contentHash,
    rowCount: safeRowCount,
    columnCount: safeColCount,
    columnMeta: params.columnMeta || [],
    excludedRows: uniqueExcluded,
    rows,
    uploadedAt: now,
  };

  serverStore.datasets.set(datasetId, datasetRecord);
  serverStore.projectLatestDataset.set(access.project.id, datasetId);

  const updatedProject: ServerProjectRecord = {
    ...access.project,
    status: access.project.status === 'draft' ? 'ready' : access.project.status,
    updatedAt: now,
  };
  serverStore.projects.set(updatedProject.id, updatedProject);

  return {
    ok: true,
    dataset: datasetRecord,
    project: buildProjectSummaryDTO(updatedProject),
  };
}

// =============================================================================
// EKSKLUSI BARIS RESPONDEN (PRINSIP S2 & MASALAH 3)
// =============================================================================

export function mutateDatasetRowExclusions(params: {
  datasetId: string;
  ownerId: string | null | undefined;
  action: 'exclude' | 'restore';
  rowIndices: number[];
  reason?: string;
  minRequiredN?: number;
}):
  | {
      ok: true;
      data: {
        datasetId: string;
        projectId: string;
        rowCount: number;
        excludedCount: number;
        excludedRows: number[];
        n: number;
        contentHash: string;
      };
    }
  | { ok: false; error: SyncApiError } {
  const authCheck = assertAuthenticatedUser(params.ownerId);
  if (!authCheck.ok) return authCheck;

  const dataset = serverStore.datasets.get(params.datasetId);
  if (!dataset) {
    return {
      ok: false,
      error: {
        status: 404,
        code: 'DATASET_NOT_FOUND',
        message: 'Dataset tidak ditemukan di penyimpanan server.',
      },
    };
  }

  const access = assertProjectOwnership(dataset.projectId, authCheck.userId);
  if (!access.ok) return access;

  if (!Array.isArray(params.rowIndices) || params.rowIndices.length === 0) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'EMPTY_ROW_INDICES',
        message: 'Daftar nomor baris responden yang ingin diubah tidak boleh kosong.',
      },
    };
  }

  for (const idx of params.rowIndices) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= dataset.rowCount) {
      return {
        ok: false,
        error: {
          status: 422,
          code: 'INVALID_ROW_INDEX',
          message: `Nomor baris responden (${idx}) berada di luar rentang dataset (0 s.d. ${Math.max(0, dataset.rowCount - 1)}).`,
        },
      };
    }
  }

  const currentSet = new Set<number>(dataset.excludedRows);
  if (params.action === 'exclude') {
    for (const idx of params.rowIndices) currentSet.add(idx);
  } else {
    for (const idx of params.rowIndices) currentSet.delete(idx);
  }

  const nextExcludedRows = [...currentSet].sort((a, b) => a - b);
  const nextEffectiveN = computeEffectiveN(dataset.rowCount, nextExcludedRows);
  const minRequired = params.minRequiredN ?? MIN_RESPONDENTS_DEFAULT;

  if (nextEffectiveN < minRequired) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'INSUFFICIENT_RESPONDENTS',
        message: `Pengecualian baris ditolak: jumlah responden tersisa (N = ${nextEffectiveN}) kurang dari batas minimum analisis statistik (minimal ${minRequired} responden).`,
        details: {
          rowCount: dataset.rowCount,
          attemptedExcludedCount: nextExcludedRows.length,
          remainingN: nextEffectiveN,
          minRequiredN: minRequired,
        },
      },
    };
  }

  const now = new Date().toISOString();
  const nextHash = computeDatasetContentHash(dataset.rows || [], nextExcludedRows);

  const updatedDataset: ServerDatasetRecord = {
    ...dataset,
    kind: nextExcludedRows.length > 0 ? 'derived' : 'original',
    excludedRows: nextExcludedRows,
    contentHash: nextHash,
  };
  serverStore.datasets.set(dataset.id, updatedDataset);

  // Perbarui daftar row_exclusions
  const existingExclusions = serverStore.rowExclusions.get(dataset.id) || [];
  const filteredExclusions = existingExclusions.filter((ex) => currentSet.has(ex.rowIndex));
  const existingIdxSet = new Set(filteredExclusions.map((ex) => ex.rowIndex));
  for (const idx of nextExcludedRows) {
    if (!existingIdxSet.has(idx)) {
      filteredExclusions.push({
        id: `rex_${crypto.randomUUID()}`,
        datasetId: dataset.id,
        projectId: dataset.projectId,
        rowIndex: idx,
        reason: params.reason || 'Anomali data responden',
        createdAt: now,
      });
    }
  }
  serverStore.rowExclusions.set(dataset.id, filteredExclusions);

  // Perbarui updated_at proyek agar revalidasi langsung terlihat (S4)
  const updatedProject: ServerProjectRecord = {
    ...access.project,
    updatedAt: now,
  };
  serverStore.projects.set(updatedProject.id, updatedProject);

  // Sinkronkan respondentCount pada hasil analisis terbaru jika ada
  for (const [runId, run] of serverStore.runs.entries()) {
    if (run.projectId === dataset.projectId) {
      const res = serverStore.results.get(runId);
      if (res) {
        serverStore.results.set(runId, {
          ...res,
          respondentCount: nextEffectiveN,
        });
      }
    }
  }

  return {
    ok: true,
    data: {
      datasetId: updatedDataset.id,
      projectId: updatedDataset.projectId,
      rowCount: updatedDataset.rowCount,
      excludedCount: nextExcludedRows.length,
      excludedRows: nextExcludedRows,
      n: nextEffectiveN,
      contentHash: nextHash,
    },
  };
}

// =============================================================================
// CATATAN PEMBAHASAN INTERAKTIF DENGAN OPTIMISTIC CONCURRENCY CONTROL (MASALAH 2)
// =============================================================================

export function getServerProjectNotes(params: {
  projectId: string;
  ownerId: string | null | undefined;
  sectionId?: string;
}): { ok: true; data: ServerNoteRecord[] } | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  const list: ServerNoteRecord[] = [];
  for (const note of serverStore.notes.values()) {
    if (note.projectId === params.projectId) {
      if (!params.sectionId || note.sectionId === params.sectionId) {
        list.push(note);
      }
    }
  }

  list.sort((a, b) => a.sectionId.localeCompare(b.sectionId));
  return { ok: true, data: list };
}

export function upsertServerProjectNote(params: {
  projectId: string;
  ownerId: string | null | undefined;
  sectionId: unknown;
  text: unknown;
  expectedVersion?: number;
  forceOverwrite?: boolean;
}): { ok: true; data: ServerNoteRecord } | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  if (typeof params.sectionId !== 'string' || !params.sectionId.trim()) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'INVALID_SECTION_ID',
        message: 'Identitas subbab pembahasan (sectionId) wajib diisi.',
      },
    };
  }

  if (typeof params.text !== 'string') {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'INVALID_NOTE_TEXT',
        message: 'Teks catatan pembahasan harus berupa teks yang valid.',
      },
    };
  }

  if (params.text.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'NOTE_TOO_LONG',
        message: `Catatan pembahasan melebihi batas maksimum ${MAX_NOTE_LENGTH.toLocaleString('id-ID')} karakter.`,
      },
    };
  }

  const cleanSectionId = params.sectionId.trim();
  const key = `${params.projectId}::${cleanSectionId}`;
  const existing = serverStore.notes.get(key);

  // Optimistic Concurrency Control (409 Conflict jika versi tidak cocok)
  if (
    existing &&
    !params.forceOverwrite &&
    params.expectedVersion !== undefined &&
    params.expectedVersion !== existing.version
  ) {
    return {
      ok: false,
      error: {
        status: 409,
        code: 'NOTE_VERSION_CONFLICT',
        message:
          'Catatan pada subbab ini telah diubah dari tab atau sesi lain. Pilih "Gabung" untuk menyatukan catatan atau "Timpa" untuk menggunakan versi Anda.',
        details: {
          currentNote: existing,
          serverVersion: existing.version,
          clientVersion: params.expectedVersion,
        },
      },
    };
  }

  const now = new Date().toISOString();
  const nextVersion = existing ? existing.version + 1 : 1;

  const saved: ServerNoteRecord = {
    id: existing ? existing.id : `note_${crypto.randomUUID()}`,
    projectId: params.projectId,
    sectionId: cleanSectionId,
    text: params.text,
    version: nextVersion,
    updatedAt: now,
  };

  serverStore.notes.set(key, saved);

  // Perbarui timestamp proyek
  serverStore.projects.set(access.project.id, {
    ...access.project,
    updatedAt: now,
  });

  return { ok: true, data: saved };
}

// =============================================================================
// EKSEKUSI ANALISIS TRANSAKSIONAL, IDEMPOTENCY & PEMBERSIHAN RIWAYAT (MASALAH 4)
// =============================================================================

/**
 * Migrasi satu kali yang idempoten: menghapus seluruh log analisis dummy/yatim
 * yang tidak memiliki projectId sah, datasetId sah, atau datasetHash sah.
 */
export function purgeLegacyDummyRuns(): { purgedCount: number; remainingCount: number } {
  let purgedCount = 0;

  for (const [runId, run] of serverStore.runs.entries()) {
    const isLegacyDummyId = LEGACY_DUMMY_RUN_IDS.has(runId);
    const isDummyProject = !run.projectId || LEGACY_DUMMY_PROJECT_IDS.has(run.projectId);
    const missingDatasetMeta = !run.datasetId || !run.datasetHash;
    const projectExists = serverStore.projects.has(run.projectId);

    if (isLegacyDummyId || isDummyProject || missingDatasetMeta || !projectExists) {
      serverStore.runs.delete(runId);
      serverStore.results.delete(runId);
      purgedCount++;
    }
  }

  serverStore.migrationCompleted = true;
  return {
    purgedCount,
    remainingCount: serverStore.runs.size,
  };
}

export function executeServerAnalysisRun(params: {
  projectId: string;
  ownerId: string | null | undefined;
  datasetId?: string;
  tests: string[];
  significanceLevel?: number;
  idempotencyKey?: string;
  engineVersion?: string;
  computeFn: (ctx: {
    project: ServerProjectRecord;
    dataset: ServerDatasetRecord;
    effectiveN: number;
    excludedRows: number[];
    runId: string;
  }) => AnalysisResults;
}):
  | {
      ok: true;
      deduplicated: boolean;
      run: ServerAnalysisRunRecord;
      results: AnalysisResults;
    }
  | { ok: false; error: SyncApiError; failedRun?: ServerAnalysisRunRecord } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  // Pastikan migrasi pembersihan dummy sudah dijalankan
  if (!serverStore.migrationCompleted) {
    purgeLegacyDummyRuns();
  }

  const targetDatasetId =
    params.datasetId || serverStore.projectLatestDataset.get(params.projectId) || null;
  const dataset = targetDatasetId ? serverStore.datasets.get(targetDatasetId) || null : null;

  if (!dataset || dataset.projectId !== params.projectId) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'DATASET_REQUIRED',
        message: 'Dataset kuesioner belum diunggah pada proyek ini. Unggah data terlebih dahulu sebelum menjalankan analisis.',
      },
    };
  }

  const effectiveN = computeEffectiveN(dataset.rowCount, dataset.excludedRows);
  if (effectiveN < MIN_RESPONDENTS_DEFAULT) {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'INSUFFICIENT_RESPONDENTS',
        message: `Jumlah responden aktif (N = ${effectiveN}) tidak mencukupi untuk analisis statistik (minimal ${MIN_RESPONDENTS_DEFAULT} responden).`,
      },
    };
  }

  const normalizedTests =
    Array.isArray(params.tests) && params.tests.length > 0
      ? [...new Set(params.tests)]
      : ['descriptive', 'validity', 'reliability', 'normality', 'regression'];

  // Idempotency / Double-click protection:
  // Jika idempotencyKey dikirim dan sudah pernah dieksekusi untuk proyek ini, kembalikan run yang ada
  const idemKey = params.idempotencyKey?.trim() || null;
  if (idemKey) {
    const lockKey = `${params.projectId}::${idemKey}`;
    const existingRunId = serverStore.idempotencyLocks.get(lockKey);
    if (existingRunId) {
      const existingRun = serverStore.runs.get(existingRunId);
      const existingResults = serverStore.results.get(existingRunId);
      if (existingRun && existingResults) {
        return {
          ok: true,
          deduplicated: true,
          run: existingRun,
          results: existingResults,
        };
      }
    }
  }

  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const runId = `run_${crypto.randomUUID()}`;

  try {
    const rawResults = params.computeFn({
      project: access.project,
      dataset,
      effectiveN,
      excludedRows: dataset.excludedRows,
      runId,
    });

    const finishedAtMs = Date.now();
    const finishedAt = new Date(finishedAtMs).toISOString();
    const durationMs = Math.max(1, finishedAtMs - startedAtMs);

    const syncedResults: AnalysisResults = {
      ...rawResults,
      id: `res_${runId}`,
      projectId: access.project.id,
      projectTitle: access.project.title,
      dataVersionId: dataset.id,
      respondentCount: effectiveN,
      timestamp: finishedAt,
      engineVersion: params.engineVersion || '1.0.0',
      sourceMeta: {
        fileName: rawResults.sourceMeta?.fileName || `dataset_${dataset.id}.csv`,
        datasetId: dataset.id,
        runId,
        version: rawResults.sourceMeta?.version || dataset.version || 1,
        kind: rawResults.sourceMeta?.kind || dataset.kind || 'original',
        sha256: dataset.contentHash,
        rowCount: effectiveN,
        columnCount: dataset.columnCount,
        excludedRows: dataset.excludedRows,
        columns: rawResults.sourceMeta?.columns || [],
      },
    };

    const runRecord: ServerAnalysisRunRecord = {
      id: runId,
      projectId: access.project.id,
      datasetId: dataset.id,
      datasetHash: dataset.contentHash,
      nUsed: effectiveN,
      nExcluded: dataset.excludedRows.length,
      tests: normalizedTests,
      params: {
        significanceLevel: params.significanceLevel ?? 0.05,
      },
      engineVersion: params.engineVersion || '1.0.0',
      status: 'succeeded',
      errorMessage: null,
      startedAt,
      finishedAt,
      durationMs,
      resultsRef: syncedResults.id,
      idempotencyKey: idemKey,
      fileName: syncedResults.sourceMeta?.fileName || `dataset_${dataset.id}.csv`,
      datasetVersion: dataset.version,
      datasetKind: dataset.kind,
    };

    // Transaksi atomik di memori server: simpan run, hasil, dan perbarui status proyek
    serverStore.runs.set(runId, runRecord);
    serverStore.results.set(runId, syncedResults);
    if (idemKey) {
      serverStore.idempotencyLocks.set(`${params.projectId}::${idemKey}`, runId);
    }

    serverStore.projects.set(access.project.id, {
      ...access.project,
      status: 'completed',
      updatedAt: finishedAt,
    });

    return {
      ok: true,
      deduplicated: false,
      run: runRecord,
      results: syncedResults,
    };
  } catch (err: unknown) {
    const finishedAtMs = Date.now();
    const finishedAt = new Date(finishedAtMs).toISOString();
    const errorMsg =
      err instanceof Error && err.message
        ? err.message
        : 'Gagal menjalankan perhitungan analisis statistik pada dataset ini.';

    const failedRun: ServerAnalysisRunRecord = {
      id: runId,
      projectId: access.project.id,
      datasetId: dataset.id,
      datasetHash: dataset.contentHash,
      nUsed: effectiveN,
      nExcluded: dataset.excludedRows.length,
      tests: normalizedTests,
      params: {
        significanceLevel: params.significanceLevel ?? 0.05,
      },
      engineVersion: params.engineVersion || '1.0.0',
      status: 'failed',
      errorMessage: errorMsg,
      startedAt,
      finishedAt,
      durationMs: Math.max(1, finishedAtMs - startedAtMs),
      resultsRef: null,
      idempotencyKey: idemKey,
      fileName: `dataset_${dataset.id}.csv`,
      datasetVersion: dataset.version,
      datasetKind: dataset.kind,
    };

    // Kegagalan analisis tetap dicatat dengan status = 'failed' dan pesan kesalahan
    serverStore.runs.set(runId, failedRun);
    serverStore.projects.set(access.project.id, {
      ...access.project,
      status: 'error',
      updatedAt: finishedAt,
    });

    return {
      ok: false,
      failedRun,
      error: {
        status: 500,
        code: 'ANALYSIS_EXECUTION_FAILED',
        message: errorMsg,
      },
    };
  }
}

export function listServerRuns(params: {
  ownerId: string | null | undefined;
  projectId?: string;
}): { ok: true; data: ServerAnalysisRunRecord[] } | { ok: false; error: SyncApiError } {
  const authCheck = assertAuthenticatedUser(params.ownerId);
  if (!authCheck.ok) return authCheck;

  if (!serverStore.migrationCompleted) {
    purgeLegacyDummyRuns();
  }

  if (params.projectId) {
    const access = assertProjectOwnership(params.projectId, authCheck.userId);
    if (!access.ok) return access;
  }

  const runs: ServerAnalysisRunRecord[] = [];
  for (const run of serverStore.runs.values()) {
    const proj = serverStore.projects.get(run.projectId);
    if (!proj || proj.ownerId !== authCheck.userId) continue;
    if (params.projectId && run.projectId !== params.projectId) continue;
    runs.push(run);
  }

  runs.sort((a, b) => {
    const timeDiff = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
  return { ok: true, data: runs };
}

// =============================================================================
// EKSPOR DOKUMEN WORD & PDF DARI DATABASE SERVER (MASALAH 5)
// =============================================================================

export function prepareServerExportContext(params: {
  projectId: string;
  ownerId: string | null | undefined;
  runId?: string;
  format: 'docx' | 'pdf' | 'spss-word';
}):
  | {
      ok: true;
      context: {
        exportRecord: ServerExportRecord;
        project: ServerProjectRecord;
        run: ServerAnalysisRunRecord;
        results: AnalysisResults;
        notesMap: Record<string, string>;
        effectiveN: number;
      };
    }
  | { ok: false; error: SyncApiError } {
  const access = assertProjectOwnership(params.projectId, params.ownerId);
  if (!access.ok) return access;

  // Validasi ketat judul proyek dari database saat request ekspor diterima (Masalah 5)
  const titleCheck = validateProjectTitle(access.project.title, access.project.isSample);
  if (!titleCheck.valid) {
    return {
      ok: false,
      error: {
        status: 422,
        code: titleCheck.error?.code || 'INVALID_PROJECT_TITLE_FOR_EXPORT',
        message: 'Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.',
      },
    };
  }

  // Cari runId yang diminta atau run terbaru yang succeeded untuk proyek ini
  let targetRun: ServerAnalysisRunRecord | undefined;
  if (params.runId) {
    const found = serverStore.runs.get(params.runId);
    if (!found || found.projectId !== access.project.id) {
      return {
        ok: false,
        error: {
          status: 404,
          code: 'RUN_NOT_FOUND',
          message: 'Riwayat eksekusi analisis tidak ditemukan untuk proyek ini.',
        },
      };
    }
    targetRun = found;
  } else {
    const projectRuns = Array.from(serverStore.runs.values())
      .filter((r) => r.projectId === access.project.id && r.status === 'succeeded')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    targetRun = projectRuns[0];
  }

  if (!targetRun || targetRun.status !== 'succeeded') {
    return {
      ok: false,
      error: {
        status: 422,
        code: 'NO_COMPLETED_ANALYSIS_RUN',
        message: 'Belum ada hasil analisis yang selesai untuk diekspor. Jalankan analisis terlebih dahulu.',
      },
    };
  }

  const storedResults = serverStore.results.get(targetRun.id);
  if (!storedResults) {
    return {
      ok: false,
      error: {
        status: 404,
        code: 'ANALYSIS_RESULTS_NOT_FOUND',
        message: 'Data tabel hasil analisis tidak ditemukan di penyimpanan server.',
      },
    };
  }

  // Hitung N efektif kanonik (S2) dari dataset proyek saat ini
  const latestDatasetId = serverStore.projectLatestDataset.get(access.project.id) || targetRun.datasetId;
  const dataset = serverStore.datasets.get(latestDatasetId);
  const effectiveN = dataset
    ? computeEffectiveN(dataset.rowCount, dataset.excludedRows)
    : targetRun.nUsed;

  // Muat seluruh catatan pembahasan dari tabel notes untuk proyek ini (Masalah 2 & 5)
  const notesMap: Record<string, string> = {};
  for (const note of serverStore.notes.values()) {
    if (note.projectId === access.project.id && note.text.trim()) {
      notesMap[note.sectionId] = note.text.trim();
    }
  }

  const exportRecord: ServerExportRecord = {
    id: `exp_${crypto.randomUUID()}`,
    projectId: access.project.id,
    runId: targetRun.id,
    format: params.format,
    titleSnapshot: titleCheck.sanitizedTitle,
    createdAt: new Date().toISOString(),
  };

  serverStore.exports.set(exportRecord.id, exportRecord);

  const syncedResults: AnalysisResults = {
    ...storedResults,
    projectId: access.project.id,
    projectTitle: titleCheck.sanitizedTitle,
    respondentCount: effectiveN,
  };

  return {
    ok: true,
    context: {
      exportRecord,
      project: access.project,
      run: targetRun,
      results: syncedResults,
      notesMap,
      effectiveN,
    },
  };
}
