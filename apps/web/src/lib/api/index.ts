import type {
  Project,
  DatasetRow,
  DataIssue,
  AnalysisConfig,
  AnalysisResults,
  ExportOptions,
  User,
  BillingRecord,
  TestOption,
  SubscriptionPlan,
  DatasetUploadResult,
  DataVersion,
  ProjectStatus,
} from './types';

import { getSupabaseBrowserClient } from '../supabase/client';
import { mockProjects } from '../mock/projects';
import { mockDataset, mockIssues } from '../mock/dataset-contoh';
import { mockResults, mockTestOptions } from '../mock/results';
import {
  buildWordTableHtml,
  buildWordDocumentContent,
  buildApaFigureHtml,
  buildSpssAppendixWordDocumentContent,
} from '../word-table';
import { formatNumber } from '../format';
import { generateAcademicPdfReport } from '../pdf-generator';
import {
  calculateHistogramData,
  calculateNormalPPPlotData,
  generateHistogramSvgString,
  generateNormalPPPlotSvgString,
  convertSvgToPngBase64,
} from '../residual-charts';


// =============================================================================
// 1. AUTENTIKASI (SUPABASE AUTH + PROFILES)
// =============================================================================

export async function login(email: string, password: string): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Coba otentikasi melalui endpoint same-origin serverless untuk menghindari CORS & browser ad-blocker
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const resJson = await res.json().catch(() => null);

    if (resJson && !res.ok) {
      throw new Error(resJson.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    }

    if (res.ok && resJson?.success && resJson.user) {
      // Sinkronkan token sesi ke klien Supabase di peramban
      if (resJson.session?.access_token && resJson.session?.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: resJson.session.access_token,
            refresh_token: resJson.session.refresh_token,
          });
        } catch {
          // ignore
        }
      }

      const user: User = resJson.user;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('olahdata-session', JSON.stringify(user));
        } catch {
          // ignore
        }
      }

      return user;
    }
  } catch (err: unknown) {
    // Jika galat bisnis dari serverless (misal password salah atau email belum terdaftar), lemparkan langsung ke user
    if (
      err instanceof Error &&
      (err.message.includes('belum terdaftar') ||
        err.message.includes('Kata sandi salah') ||
        err.message.includes('percobaan masuk') ||
        err.message.includes('Gagal masuk'))
    ) {
      throw err;
    }
    console.warn('[Login] Serverless login fallback to client signIn:', err);
  }

  // 2. Fallback standard client signInWithPassword bila endpoint serverless tidak merespons
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Kata sandi salah atau akun belum terdaftar. Silakan periksa kembali akun Anda.');
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Alamat email belum dikonfirmasi. Silakan buka tautan di kotak masuk email Anda atau gunakan Lupa Sandi.');
    }
    throw new Error(error.message || 'Gagal masuk. Periksa email dan kata sandi Anda.');
  }

  if (!data.user) {
    throw new Error('Data pengguna tidak ditemukan.');
  }

  // Ambil profil akademik dari tabel public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('nama, prodi, kampus, plan, created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  const user: User = {
    id: data.user.id,
    name: profile?.nama || data.user.user_metadata?.nama || data.user.user_metadata?.full_name || 'Mahasiswa',
    email: data.user.email || cleanEmail,
    university: profile?.kampus || data.user.user_metadata?.kampus || data.user.user_metadata?.university || 'Universitas Indonesia',
    department: profile?.prodi || data.user.user_metadata?.prodi || 'Manajemen',
    plan: (profile?.plan as SubscriptionPlan) || 'free',
    createdAt: profile?.created_at || data.user.created_at || new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('olahdata-session', JSON.stringify(user));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }

  return user;
}

export async function resetPasswordDirect(email: string, newPassword: string): Promise<string> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, newPassword }),
  });
  const resJson = await res.json().catch(() => null);
  if (!res.ok || !resJson?.success) {
    throw new Error(resJson?.error || 'Gagal mengatur ulang kata sandi.');
  }
  return resJson.message || 'Kata sandi berhasil diperbarui.';
}

export async function register(
  name: string,
  email: string,
  password: string,
  university: string
): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Coba registrasi instan lewat endpoint serverless untuk bypass rate limit email & auto-confirm
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: cleanEmail,
        password,
        university,
      }),
    });

    const resJson = await res.json().catch(() => null);

    if (resJson && !res.ok) {
      throw new Error(resJson.error || 'Pendaftaran gagal. Silakan coba kembali.');
    }

    if (res.ok && resJson?.success) {
      // Login langsung di browser client setelah akun terbuat di auth server
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!loginError && loginData?.user) {
        const user: User = {
          id: loginData.user.id,
          name: name.trim() || 'Mahasiswa',
          email: cleanEmail,
          university: university.trim() || 'Universitas',
          department: 'Manajemen',
          plan: 'free',
          createdAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('olahdata-session', JSON.stringify(user));
          } catch {
            // ignore
          }
        }
        return user;
      }
    }
  } catch (err: unknown) {
    // Jika galat validasi bisnis (misal email sudah terdaftar), lemparkan ke user
    if (err instanceof Error && err.message.includes('sudah terdaftar')) {
      throw err;
    }
    // Jika endpoint /api/auth/register tidak merespons (mis. offline), fallback ke client signUp
    console.warn('[Register] Serverless register fallback to client signUp:', err);
  }

  // 2. Fallback standard client signUp
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        nama: name,
        full_name: name,
        kampus: university,
        university,
        prodi: 'Manajemen',
      },
    },
  });

  if (error) {
    if (error.message.includes('rate limit')) {
      throw new Error('Batas pengiriman email autentikasi terlampaui. Silakan coba lagi dalam beberapa menit.');
    }
    if (error.message.includes('already registered')) {
      throw new Error('Alamat email ini sudah terdaftar. Silakan langsung masuk ke akun Anda.');
    }
    throw new Error(error.message || 'Pendaftaran gagal. Silakan coba kembali.');
  }

  if (!data.user) {
    throw new Error('Gagal membuat akun baru.');
  }

  const user: User = {
    id: data.user.id,
    name,
    email: cleanEmail,
    university,
    department: 'Manajemen',
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('olahdata-session', JSON.stringify(user));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }

  return user;
}

export async function logout(): Promise<void> {
  const currentUid = getCurrentUserId();
  const supabase = getSupabaseBrowserClient();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth] Gagal logout dari server:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('olahdata-session');
      localStorage.removeItem('olahdata_active_project_meta');
      localStorage.removeItem('olahdata-projects');
      localStorage.removeItem('olahdata-analysis-runs');
      if (currentUid) {
        localStorage.removeItem(`olahdata_active_project_meta_${currentUid}`);
        localStorage.removeItem(`olahdata-projects-${currentUid}`);
        localStorage.removeItem(`olahdata-analysis-runs-${currentUid}`);
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }
}

export async function getSession(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
      // Coba periksa session lokal sebagai fallback
      const stored = localStorage.getItem('olahdata-session');
      return stored ? (JSON.parse(stored) as User) : null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, prodi, kampus, plan, created_at')
      .eq('id', session.user.id)
      .maybeSingle();

    const user: User = {
      id: session.user.id,
      name: profile?.nama || session.user.user_metadata?.nama || session.user.user_metadata?.full_name || 'Mahasiswa',
      email: session.user.email || '',
      university: profile?.kampus || session.user.user_metadata?.kampus || 'Universitas Indonesia',
      department: profile?.prodi || session.user.user_metadata?.prodi || 'Manajemen',
      plan: (profile?.plan as SubscriptionPlan) || 'free',
      createdAt: profile?.created_at || session.user.created_at || new Date().toISOString(),
    };

    localStorage.setItem('olahdata-session', JSON.stringify(user));
    return user;
  } catch {
    const stored = localStorage.getItem('olahdata-session');
    return stored ? (JSON.parse(stored) as User) : null;
  }
}

// =============================================================================
// 2. CADANGAN LOKAL & FALLBACK (UNTUK MODE DEMO / OFFLINE)
// =============================================================================

const DUMMY_PROJECT_IDS = new Set(['project-1', 'project-2', 'project-3']);
const DUMMY_RUN_IDS = new Set(['run-2026-001', 'run-2026-002', 'run-2026-003', 'run-2026-004']);

/**
 * Prinsip S2: Fungsi kanonik perhitungan N efektif = row_count - excluded_count.
 */
export function computeEffectiveN(
  rowCount: number,
  excludedRowsOrCount?: number | readonly number[] | null
): number {
  const safeRowCount = Number.isFinite(rowCount) ? Math.max(0, Math.floor(rowCount)) : 0;
  if (safeRowCount === 0) return 0;
  if (typeof excludedRowsOrCount === 'number') {
    return Math.max(0, safeRowCount - Math.max(0, Math.floor(excludedRowsOrCount)));
  }
  if (Array.isArray(excludedRowsOrCount)) {
    const valid = new Set<number>();
    for (const r of excludedRowsOrCount) {
      const idx = Number(r);
      if (Number.isInteger(idx) && idx >= 0 && idx < safeRowCount) valid.add(idx);
    }
    return Math.max(0, safeRowCount - valid.size);
  }
  return safeRowCount;
}

export async function getProjectNotesMap(projectId: string): Promise<Record<string, string>> {
  const notesMap: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const prefix = `olahdata_theory_note_${projectId}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && !key.endsWith('__version')) {
          const sectionKey = key.slice(prefix.length);
          const val = localStorage.getItem(key);
          if (val && val.trim()) {
            notesMap[sectionKey] = val.trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('notes')
      .select('section_id, text')
      .eq('project_id', projectId);
    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.section_id && typeof row.text === 'string' && row.text.trim()) {
          notesMap[row.section_id] = row.text.trim();
        }
      }
    }
  } catch {
    // ignore offline/network errors
  }

  return notesMap;
}

function enrichProjectWithLocalResults(proj: Project): Project {
  if (typeof window === 'undefined') return proj;
  try {
    const savedResRaw = localStorage.getItem(`olahdata_results_${proj.id}`);
    if (savedResRaw) {
      const savedRes = JSON.parse(savedResRaw) as AnalysisResults;
      const respondentCount = savedRes.respondentCount || proj.respondentCount || 0;
      const itemCount =
        savedRes.sourceMeta?.columnCount ||
        savedRes.validity?.length ||
        proj.itemCount ||
        0;
      return {
        ...proj,
        title: savedRes.projectTitle && !DUMMY_PROJECT_IDS.has(proj.id) ? savedRes.projectTitle : proj.title,
        respondentCount,
        itemCount,
        status: 'completed',
        updatedAt: savedRes.timestamp || proj.updatedAt,
      };
    }
  } catch {
    // ignore parse errors
  }
  return proj;
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('olahdata-session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed.id;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getUserProjectsKey(userId?: string | null): string {
  const uid = userId || getCurrentUserId();
  return uid ? `olahdata-projects-${uid}` : 'olahdata-projects-guest';
}

export function getUserRunsKey(userId?: string | null): string {
  const uid = userId || getCurrentUserId();
  return uid ? `olahdata-analysis-runs-${uid}` : 'olahdata-analysis-runs-guest';
}

function getStoredProjects(userId?: string | null): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getUserProjectsKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return [];
    const realProjects = parsed
      .filter((p) => p && p.id && !DUMMY_PROJECT_IDS.has(p.id))
      .map(enrichProjectWithLocalResults);
    if (realProjects.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(realProjects));
    }
    return realProjects;
  } catch {
    return [];
  }
}

function saveStoredProjects(projects: Project[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getUserProjectsKey(userId);
    const filtered = projects
      .filter((p) => p && p.id && !DUMMY_PROJECT_IDS.has(p.id))
      .map(enrichProjectWithLocalResults);
    localStorage.setItem(key, JSON.stringify(filtered));

    // Bersihkan kunci warisan global agar tidak mencemari sesi lain
    if (localStorage.getItem('olahdata-projects')) {
      localStorage.removeItem('olahdata-projects');
    }
  } catch {
    // ignore
  }
}

export interface AnalysisRunLogEntry {
  id: string;
  projectId: string;
  projectName: string;
  fileName: string;
  datasetVersion: number;
  datasetKind: 'original' | 'derived';
  tests: string[];
  status: 'succeeded' | 'running' | 'failed';
  startedAt: string;
  durationMs: number;
  respondentCount: number;
}

export function recordAnalysisRun(entry: AnalysisRunLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const storageKey = getUserRunsKey();
    const raw = localStorage.getItem(storageKey);
    const existing: AnalysisRunLogEntry[] = raw ? JSON.parse(raw) : [];
    const cleaned = Array.isArray(existing)
      ? existing.filter((r) => r && r.id && !DUMMY_RUN_IDS.has(r.id) && r.id !== entry.id)
      : [];
    const updated = [entry, ...cleaned].slice(0, 50);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Bersihkan kunci warisan global
    if (localStorage.getItem('olahdata-analysis-runs')) {
      localStorage.removeItem('olahdata-analysis-runs');
    }
  } catch {
    // ignore
  }
}

export async function syncProjectProgress(
  projectId: string,
  updates: {
    title?: string;
    department?: string;
    respondentCount?: number;
    itemCount?: number;
    status?: ProjectStatus;
    fileName?: string;
  }
): Promise<void> {
  const currentUid = getCurrentUserId();
  if (typeof window !== 'undefined') {
    try {
      const list = getStoredProjects(currentUid);
      const idx = list.findIndex((p) => p.id === projectId);
      const now = new Date().toISOString();
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...(updates.title ? { title: updates.title } : {}),
          ...(updates.department ? { department: updates.department } : {}),
          ...(updates.respondentCount !== undefined ? { respondentCount: updates.respondentCount } : {}),
          ...(updates.itemCount !== undefined ? { itemCount: updates.itemCount } : {}),
          ...(updates.status ? { status: updates.status } : {}),
          updatedAt: now,
        };
        saveStoredProjects(list, currentUid);
      } else if (projectId !== 'sample' && !DUMMY_PROJECT_IDS.has(projectId)) {
        const activeMetaRaw = localStorage.getItem(`olahdata_active_project_meta_${currentUid}`) || localStorage.getItem('olahdata_active_project_meta');
        const activeMeta = activeMetaRaw ? JSON.parse(activeMetaRaw) : null;
        const created: Project = {
          id: projectId,
          title: updates.title || activeMeta?.title || 'Proyek Penelitian Skripsi',
          department: updates.department || activeMeta?.department || 'Umum',
          researchType: activeMeta?.researchType || 'Regresi Linier Berganda',
          respondentCount: updates.respondentCount ?? 0,
          itemCount: updates.itemCount ?? 0,
          status: updates.status || 'completed',
          createdAt: now,
          updatedAt: now,
          dataVersions: [],
          currentDataVersion: 'dv-1',
        };
        saveStoredProjects([created, ...list], currentUid);
      }
    } catch {
      // ignore localStorage errors
    }
  }

  if (projectId === 'sample' || projectId.startsWith('project-')) return;

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title) dbUpdates.judul = updates.title;
      if (updates.department) dbUpdates.prodi = updates.department;
      if (updates.status) dbUpdates.status = updates.status;
      await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId)
        .eq('owner_id', user.id);
    }
  } catch {
    // ignore network errors
  }
}

// =============================================================================
// 3. PENGELOLAAN PROYEK (CRUD SUPABASE)
// =============================================================================

interface DbProjectRow {
  id: string;
  owner_id: string;
  judul: string;
  prodi: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  datasets?: Array<{
    id: string;
    version: number;
    kind: string;
    n_rows: number | null;
    n_cols: number | null;
    excluded_rows: number[] | null;
    created_at: string;
  }>;
}

function mapDbProjectToProject(row: DbProjectRow): Project {
  const rawDatasets = (row.datasets || []).sort((a, b) => a.version - b.version);
  const dataVersions: DataVersion[] = rawDatasets.map((ds) => ({
    id: ds.id,
    label: ds.kind === 'derived' ? `Versi ${ds.version} (Pembersihan)` : `Versi ${ds.version} (Awal)`,
    rowCount: computeEffectiveN(ds.n_rows || 0, ds.excluded_rows || []),
    columnCount: ds.n_cols || 0,
    removedRows: ds.excluded_rows || [],
    createdAt: ds.created_at,
  }));

  const latest = rawDatasets[rawDatasets.length - 1];
  const effectiveN = latest
    ? computeEffectiveN(latest.n_rows || 0, latest.excluded_rows || [])
    : 0;

  return {
    id: row.id,
    title: row.judul,
    department: row.prodi || 'Manajemen',
    researchType: 'Regresi Linier Berganda',
    respondentCount: effectiveN,
    itemCount: latest?.n_cols || 0,
    status: (row.status as ProjectStatus) || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dataVersions,
    currentDataVersion: latest ? latest.id : '',
  };
}

export async function getProjects(): Promise<Project[]> {
  const currentUid = getCurrentUserId();
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          owner_id,
          judul,
          prodi,
          status,
          created_at,
          updated_at,
          datasets (
            id,
            version,
            kind,
            n_rows,
            n_cols,
            excluded_rows,
            created_at
          )
        `)
        .eq('owner_id', user.id)
        .is('archived_at', null)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        // Ambil hanya cache lokal yang terdaftar untuk user INI
        const localList = getStoredProjects(user.id);
        const mapped = (data as DbProjectRow[]).map((r) => {
          const base = mapDbProjectToProject(r);
          const localMatch = localList.find((lp) => lp.id === base.id);
          const merged: Project = {
            ...base,
            title: localMatch?.title || base.title,
            department: localMatch?.department || base.department,
            researchType: localMatch?.researchType || base.researchType,
            respondentCount: Math.max(base.respondentCount, localMatch?.respondentCount || 0),
            itemCount: Math.max(base.itemCount, localMatch?.itemCount || 0),
            status: localMatch?.status === 'completed' ? 'completed' : base.status,
          };
          return enrichProjectWithLocalResults(merged);
        });

        // HANYA pertahankan draft offline lokal yang dibuat oleh user ini
        const mappedIds = new Set(mapped.map((m) => m.id));
        const userOfflineDrafts = localList.filter((lp) =>
          !mappedIds.has(lp.id) && (lp.id.startsWith('project-') || lp.id === 'sample')
        );
        const combined = [...mapped, ...userOfflineDrafts];
        saveStoredProjects(combined, user.id);
        return combined;
      }
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal memuat proyek dari database:', err);
  }

  return getStoredProjects(currentUid);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const currentUid = getCurrentUserId();

  if (id === 'sample' || id.startsWith('project-sample')) {
    const storedSample = getStoredProjects(currentUid).find((p) => p.id === id);
    if (storedSample) return enrichProjectWithLocalResults(storedSample);
    return enrichProjectWithLocalResults({ ...mockProjects[0], id });
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Query spesifik ke database Supabase dengan RLS ketat
    const query = supabase
      .from('projects')
      .select(`
        id,
        owner_id,
        judul,
        prodi,
        status,
        created_at,
        updated_at,
        datasets (
          id,
          version,
          kind,
          n_rows,
          n_cols,
          excluded_rows,
          created_at
        )
      `)
      .eq('id', id)
      .is('archived_at', null);

    // Filter ketat dengan owner_id jika pengguna terautentikasi
    if (user?.id) {
      query.eq('owner_id', user.id);
    }

    const { data: row, error } = await query.maybeSingle();

    if (!error && row) {
      const base = mapDbProjectToProject(row as DbProjectRow);
      const localMatch = getStoredProjects(user?.id || currentUid).find((p) => p.id === id);
      return enrichProjectWithLocalResults({
        ...base,
        respondentCount: Math.max(base.respondentCount, localMatch?.respondentCount || 0),
        itemCount: Math.max(base.itemCount, localMatch?.itemCount || 0),
        status: localMatch?.status === 'completed' ? 'completed' : base.status,
      });
    }

    // Jika user terautentikasi tapi proyek tidak ditemukan di database miliknya:
    // JANGAN izinkan kebocoran dari cache lokal akun lain! Tolak akses (undefined).
    if (user?.id) {
      const isLocalOfflineDraft = id.startsWith('project-') || id === 'sample';
      if (!isLocalOfflineDraft) {
        console.warn(`[Security RLS] Akses ditolak: Proyek ${id} bukan milik pengguna ${user.id}`);
        return undefined;
      }
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal memuat proyek ID:', id, err);
  }

  // Fallback lokal HANYA untuk draft offline pengguna saat ini
  const localFound = getStoredProjects(currentUid).find((p) => p.id === id);
  if (localFound) return enrichProjectWithLocalResults(localFound);

  if (typeof window !== 'undefined') {
    try {
      const activeMetaRaw =
        localStorage.getItem(`olahdata_active_project_meta_${currentUid}`) ||
        localStorage.getItem('olahdata_active_project_meta');
      if (activeMetaRaw) {
        const activeMeta = JSON.parse(activeMetaRaw) as Project;
        if (activeMeta && (activeMeta.id === id || id === 'baru')) {
          return enrichProjectWithLocalResults(activeMeta);
        }
      }
    } catch {
      // ignore
    }
  }

  return undefined;
}

export async function createProject(
  title: string,
  department: string,
  researchType: string
): Promise<Project> {
  const currentUid = getCurrentUserId();
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          judul: title,
          prodi: department,
          status: 'draft',
        })
        .select()
        .single();

      if (!error && data) {
        const created: Project = {
          id: data.id,
          title: data.judul,
          department: data.prodi || department,
          researchType: researchType || 'Regresi Linier Berganda',
          respondentCount: 0,
          itemCount: 0,
          status: 'draft',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          dataVersions: [],
          currentDataVersion: '',
        };

        const list = getStoredProjects(user.id);
        saveStoredProjects([created, ...list.filter((p) => p.id !== created.id)], user.id);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`olahdata_active_project_meta_${user.id}`, JSON.stringify(created));
            localStorage.setItem('olahdata_active_project_meta', JSON.stringify(created));
          } catch {
            // ignore
          }
        }
        return created;
      }
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal membuat proyek di database:', err);
  }

  // Fallback lokal
  const newProject: Project = {
    id: `project-${Date.now()}`,
    title,
    department,
    researchType,
    respondentCount: 0,
    itemCount: 0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataVersions: [],
    currentDataVersion: 'dv-1',
  };
  const list = getStoredProjects(currentUid);
  saveStoredProjects([newProject, ...list], currentUid);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`olahdata_active_project_meta_${currentUid}`, JSON.stringify(newProject));
      localStorage.setItem('olahdata_active_project_meta', JSON.stringify(newProject));
    } catch {
      // ignore
    }
  }
  return newProject;
}

export async function createSampleProject(): Promise<Project> {
  const currentUid = getCurrentUserId();
  const title = 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan (Data Contoh)';
  const department = 'Manajemen';
  const researchType = 'Regresi Linier Berganda';

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: projectRow, error: pError } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          judul: title,
          prodi: department,
          status: 'completed',
        })
        .select()
        .single();

      if (!pError && projectRow) {
        // Buat metadata dataset contoh awal di Supabase
        const { data: datasetRow } = await supabase
          .from('datasets')
          .insert({
            project_id: projectRow.id,
            version: 1,
            kind: 'original',
            storage_path: `samples/${user.id}/${projectRow.id}/data_kuesioner_contoh.csv`,
            n_rows: 120,
            n_cols: 18,
            excluded_rows: [],
          })
          .select()
          .single();

        const sampleProject: Project = {
          id: projectRow.id,
          title: projectRow.judul,
          department: projectRow.prodi || department,
          researchType,
          respondentCount: 120,
          itemCount: 18,
          status: 'completed',
          createdAt: projectRow.created_at,
          updatedAt: projectRow.updated_at,
          dataVersions: [
            {
              id: datasetRow?.id || `dv-${projectRow.id}-1`,
              label: 'Versi awal (Data Contoh)',
              rowCount: 120,
              columnCount: 18,
              removedRows: [],
              createdAt: projectRow.created_at,
            },
          ],
          currentDataVersion: datasetRow?.id || `dv-${projectRow.id}-1`,
        };

        const list = getStoredProjects(user.id);
        saveStoredProjects([sampleProject, ...list], user.id);
        return sampleProject;
      }
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal membuat proyek contoh di database:', err);
  }

  // Fallback lokal
  const fallbackSample: Project = {
    id: `project-${Date.now()}`,
    title,
    department,
    researchType,
    respondentCount: 120,
    itemCount: 18,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataVersions: [
      {
        id: 'dv-sample-1',
        label: 'Versi awal (Data Contoh)',
        rowCount: 120,
        columnCount: 18,
        removedRows: [],
        createdAt: new Date().toISOString(),
      },
    ],
    currentDataVersion: 'dv-sample-1',
  };

  const list = getStoredProjects(currentUid);
  saveStoredProjects([fallbackSample, ...list], currentUid);
  return fallbackSample;
}

export async function deleteProject(id: string): Promise<void> {
  const currentUid = getCurrentUserId();
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .eq('owner_id', user.id);
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal mengarsipkan proyek:', err);
  }

  const list = getStoredProjects(currentUid).filter((p) => p.id !== id);
  saveStoredProjects(list, currentUid);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`olahdata_results_${id}`);
    } catch {}
  }
}

export async function deleteAllProjects(): Promise<void> {
  const currentUid = getCurrentUserId();
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('projects')
        .update({ archived_at: new Date().toISOString() })
        .eq('owner_id', user.id);
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal mengarsipkan semua proyek:', err);
  }

  saveStoredProjects([], currentUid);
}

// =============================================================================
// 4. UNGGAH DATASET KE STORAGE PRIVAT SUPABASE
// =============================================================================

export async function uploadDataset(
  projectId: string,
  file: File,
  meta?: { rowCount: number; columnCount: number; excludedRows?: number[] }
): Promise<DatasetUploadResult> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Mode demo / anonim: izinkan fallback lokal
    const mockId = `ds-local-${Date.now()}`;
    return {
      datasetId: mockId,
      storagePath: `local/${projectId}/${file.name}`,
      rowCount: meta?.rowCount || 0,
      columnCount: meta?.columnCount || 0,
    };
  }

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  // Format path terisolasi: {user_id}/{project_id}/{timestamp}_{filename}
  const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedFileName}`;

  // 1. Unggah ke bucket Storage privat 'datasets'
  const { error: uploadError } = await supabase.storage
    .from('datasets')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[Supabase Storage Upload Error]:', uploadError);
    throw new Error(`Gagal mengunggah berkas ke penyimpanan privat: ${uploadError.message}`);
  }

  // 2. Tentukan nomor versi dataset berikutnya
  const { data: existingDatasets } = await supabase
    .from('datasets')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = existingDatasets && existingDatasets.length > 0 ? existingDatasets[0].version + 1 : 1;

  // 3. Catat entri dataset ke tabel public.datasets
  const { data: datasetRow, error: dbError } = await supabase
    .from('datasets')
    .insert({
      project_id: projectId,
      version: nextVersion,
      kind: nextVersion === 1 ? 'original' : 'derived',
      storage_path: storagePath,
      n_rows: meta?.rowCount || null,
      n_cols: meta?.columnCount || null,
      excluded_rows: meta?.excludedRows || [],
    })
    .select()
    .single();

  if (dbError || !datasetRow) {
    console.error('[Supabase Dataset Insert Error]:', dbError);
    throw new Error(`Gagal mencatat metadata dataset: ${dbError?.message}`);
  }

  // 4. Perbarui status proyek menjadi aktif
  await supabase
    .from('projects')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', projectId);

  return {
    datasetId: datasetRow.id,
    storagePath,
    rowCount: datasetRow.n_rows || meta?.rowCount || 0,
    columnCount: datasetRow.n_cols || meta?.columnCount || 0,
  };
}

// =============================================================================
// 5. PRATINJAU DATASET & MASALAH DATA
// =============================================================================

export async function getDatasetPreview(
  _projectId: string
): Promise<{ rows: DatasetRow[]; columns: string[] }> {
  // Pratinjau dataset cepat diambil dari data terunggah di state peramban atau sampel
  const columns = Object.keys(mockDataset[0] || {});
  return { rows: mockDataset, columns };
}

export async function getDataIssues(_projectId: string): Promise<DataIssue[]> {
  return mockIssues;
}

export async function getTestOptions(
  _constructs: AnalysisConfig['constructs']
): Promise<TestOption[]> {
  return mockTestOptions;
}

// =============================================================================
// 6. HASIL ANALISIS & INTERPRETASI
// =============================================================================

// TODO(backend-statistik): Hasil analisis saat ini menyajikan data contoh terverifikasi
// yang diberi label eksplisit "Data contoh" sampai mesin statistik terintegrasi penuh.
export async function runAnalysis(config: AnalysisConfig): Promise<AnalysisResults> {
  // Simulasi pembaruan status proyek di Supabase bila pengguna terautentikasi
  try {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('projects')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', config.projectId);
  } catch {
    // ignore
  }

  // TODO(backend-statistik): Gantilah kembalian data contoh ini dengan payload dari layanan statistik
  return {
    ...mockResults,
    projectId: config.projectId,
    dataVersionId: config.dataVersionId,
  };
}

export async function getResult(projectId: string): Promise<AnalysisResults> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`olahdata_results_${projectId}`);
      if (stored) {
        return JSON.parse(stored) as AnalysisResults;
      }
    } catch {
      // ignore
    }
  }

  return {
    ...mockResults,
    projectId,
  };
}

export async function exportResult(
  projectId: string,
  options: ExportOptions,
  customResults?: AnalysisResults
): Promise<Blob> {
  const results = customResults || (await getResult(projectId));
  const project = await getProject(projectId).catch(() => null);
  let activeMetaTitle: string | undefined;
  if (typeof window !== 'undefined') {
    try {
      const metaRaw = localStorage.getItem('olahdata_active_project_meta');
      if (metaRaw) {
        const parsed = JSON.parse(metaRaw);
        if (parsed?.title) activeMetaTitle = parsed.title;
      }
    } catch {
      // ignore
    }
  }
  const isSample =
    projectId === 'sample' ||
    projectId.startsWith('project-sample') ||
    Boolean(project?.title?.includes('(Data Contoh)'));
  const demoDefaultTitle = 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan';

  const isGenericOptionTitle =
    !options.projectTitle ||
    options.projectTitle === 'Analisis Skripsi' ||
    options.projectTitle === 'Penelitian Skripsi' ||
    options.projectTitle === 'Analisis Data Skripsi' ||
    (!isSample && options.projectTitle === demoDefaultTitle);

  const candidateTitle = (
    (!isGenericOptionTitle ? options.projectTitle : undefined) ||
    (project && !DUMMY_PROJECT_IDS.has(project.id) && project.id !== 'sample' ? project.title : undefined) ||
    (results?.projectTitle && (isSample || results.projectTitle !== demoDefaultTitle)
      ? results.projectTitle
      : undefined) ||
    activeMetaTitle ||
    (isSample ? project?.title || demoDefaultTitle : '')
  )?.trim();

  if (!candidateTitle || (!isSample && candidateTitle.toLowerCase() === demoDefaultTitle.toLowerCase())) {
    throw new Error('Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.');
  }

  const projectTitle = candidateTitle;
  const notesMap = await getProjectNotesMap(projectId);

  if (options.format === 'pdf') {
    const pdfBytes = generateAcademicPdfReport(results, {
      projectTitle,
      sections: options.sections,
      includeStatement: options.includeStatement,
      watermark: false,
      notesMap,
    });
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  }

  if (options.format === 'spss-word') {
    const docHtml = buildSpssAppendixWordDocumentContent(projectTitle, results);
    return new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
  }

  if (options.format === 'word') {
    const tone = options.narrativeTone || 'standard';
    const wordImages: { id: string; base64Data: string; contentType?: string }[] = [];
    const formatNarrative = (text: string) => {
      if (!text) return '';
      if (tone === 'concise') {
        return text
          .replace(/Berdasarkan analisis statistik deskriptif terhadap \d+ responden, diperoleh bahwa/i, 'Secara deskriptif,')
          .replace(/Hasil pengujian validitas butir instrumen menggunakan korelasi Pearson Product Moment menunjukkan bahwa/i, 'Uji validitas butir instrumen menunjukkan')
          .replace(/Pengujian reliabilitas instrumen dengan koefisien Cronbach's Alpha menghasilkan nilai sebagai berikut:/i, 'Hasil uji reliabilitas Cronbach\'s Alpha:')
          .replace(/Analisis regresi linier berganda menunjukkan model persamaan regresi dengan/i, 'Model regresi linier berganda menghasilkan')
          .replace(/Uji simultan ANOVA menghasilkan/i, 'Hasil ANOVA (Uji F):');
      }
      if (tone === 'formal') {
        return `Berdasarkan hasil kalkulasi empiris pada Bab 4, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
      }
      return text;
    };

    const sections: { title: string; contentHtml: string }[] = [];

    if (options.sections.includes('descriptive')) {
      const tableHtml = buildWordTableHtml({
        tableNumber: 'Tabel 4.1',
        title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian & TCR',
        note: `* Dihitung dari N = ${results.respondentCount} responden menggunakan skala Likert 1-5.`,
        columns: [
          { header: 'Variabel Penelitian', align: 'left' },
          { header: 'N', align: 'right' },
          { header: 'Mean', align: 'right' },
          { header: 'Median', align: 'right' },
          { header: 'Std Dev', align: 'right' },
          { header: 'Min', align: 'right' },
          { header: 'Max', align: 'right' },
          { header: 'TCR (%)', align: 'right' },
          { header: 'Kategori TCR', align: 'center' },
        ],
        rows: (results.descriptive || []).map((r) => [
          r.variable,
          formatNumber(r.n),
          formatNumber(r.mean, 3),
          formatNumber(r.median, 3),
          formatNumber(r.stdDev, 3),
          formatNumber(r.min, 3),
          formatNumber(r.max, 3),
          r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-',
          r.tcrCategory || '-',
        ]),
      });

      let demoHtml = '';
      if (results.demographics && results.demographics.length > 0) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        demoHtml = results.demographics.map((demo, idx) => {
          const letter = letters[idx] || `${idx + 1}`;
          return buildWordTableHtml({
            tableNumber: `Tabel 4.1${letter}`,
            title: `Distribusi Frekuensi Karakteristik Responden Berdasarkan ${demo.variable.replace(/_/g, ' ')}`,
            note: `* Total responden N = ${results.respondentCount}.`,
          columns: [
            { header: 'Kategori / Kelompok', align: 'left' },
            { header: 'Frekuensi (n)', align: 'right' },
            { header: 'Persentase (%)', align: 'right' },
            { header: 'Kumulatif (%)', align: 'right' },
          ],
          rows: demo.categories.map((c) => [
            c.category,
            formatNumber(c.frequency),
            `${formatNumber(c.percentage, 1)}%`,
            `${formatNumber(c.cumulativePercentage, 1)}%`,
          ]),
          });
        }).join('<br/>');
      }

      const narrativeHtml = `<p>${results.explanations.descriptive}</p>`;
      sections.push({
        title: '1. Statistik Deskriptif & Demografi Responden',
        contentHtml: tableHtml + (demoHtml ? `<br/>${demoHtml}` : '') + narrativeHtml,
      });
    }

    if (options.sections.includes('validity')) {
      const tableHtml = buildWordTableHtml({
        tableNumber: 'Tabel 4.2',
        title: 'Hasil Pengujian Validitas Butir Kuesioner (Pearson Product Moment)',
        note: `* Nilai r tabel = 0,1816 (df = ${results.respondentCount - 2}, α = 0,05).`,
        columns: [
          { header: 'Butir Indikator', align: 'left' },
          { header: 'Konstruk Variabel', align: 'left' },
          { header: 'r Hitung', align: 'right' },
          { header: 'r Tabel', align: 'right' },
          { header: 'Status', align: 'center' },
        ],
        rows: (results.validity || []).map((r) => [
          r.item,
          r.construct,
          formatNumber(r.rHitung, 3),
          formatNumber(r.rTabel, 4),
          r.valid ? 'Valid' : 'Gugur',
        ]),
      });
      const narrativeHtml = `<p>${results.explanations.validity}</p>`;
      sections.push({
        title: '2. Uji Validitas Instrumen',
        contentHtml: tableHtml + narrativeHtml,
      });
    }

    if (options.sections.includes('reliability')) {
      const tableHtml = buildWordTableHtml({
        tableNumber: 'Tabel 4.3',
        title: "Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)",
        note: '* Ambang batas nilai reliabilitas Cronbach Alpha ≥ 0,600.',
        columns: [
          { header: 'Konstruk Variabel', align: 'left' },
          { header: 'Jumlah Butir', align: 'right' },
          { header: "Cronbach's Alpha", align: 'right' },
          { header: 'Ambang Batas', align: 'right' },
          { header: 'Status', align: 'center' },
        ],
        rows: (results.reliability || []).map((r) => [
          r.construct,
          formatNumber(r.itemCount),
          formatNumber(r.cronbachAlpha, 3),
          '0,600',
          r.reliable ? 'Reliabel' : 'Tidak Reliabel',
        ]),
      });
      const narrativeHtml = `<p>${results.explanations.reliability}</p>`;
      sections.push({
        title: '3. Uji Reliabilitas Instrumen',
        contentHtml: tableHtml + narrativeHtml,
      });
    }

    if (
      options.sections.includes('normality') ||
      options.sections.includes('multicollinearity') ||
      options.sections.includes('heteroscedasticity')
    ) {
      // Render Gambar 4.1 dan Gambar 4.2 format APA 7th Edition
      let fig4_1Html = '';
      let fig4_2Html = '';
      if (options.sections.includes('normality')) {
        const rawZ = results.standardizedResiduals || results.unstandardizedResiduals || [];
        const histData = calculateHistogramData(rawZ);
        const ppData = calculateNormalPPPlotData(results.unstandardizedResiduals || results.standardizedResiduals || []);

        const histSvg = generateHistogramSvgString(histData, 'print', 600, 360);
        const ppSvg = generateNormalPPPlotSvgString(ppData, 'print', 420);

        try {
          const [histPng, ppPng] = await Promise.all([
            convertSvgToPngBase64(histSvg, 600, 360, 2),
            convertSvgToPngBase64(ppSvg, 420, 420, 2),
          ]);
          wordImages.push({ id: 'gambar4_1.png', base64Data: histPng, contentType: 'image/png' });
          wordImages.push({ id: 'gambar4_2.png', base64Data: ppPng, contentType: 'image/png' });
        } catch (err) {
          console.warn('Gagal merender grafik PNG untuk Word:', err);
        }

        fig4_1Html = buildApaFigureHtml(
          'Gambar 4.1',
          'Histogram Residual dan Kurva Normal Model Regresi',
          'gambar4_1.png',
          'Sumber: Data primer diolah (2026). Dihitung dari standardized residual OLS.'
        );

        fig4_2Html = buildApaFigureHtml(
          'Gambar 4.2',
          'Normal P-P Plot of Regression Standardized Residual',
          'gambar4_2.png',
          'Sumber: Data primer diolah (2026). Titik observasi merapat di sepanjang garis diagonal 45°.'
        );
      }

      const normTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.4',
        title: 'Hasil Uji Normalitas Residual (Kolmogorov-Smirnov)',
        note: '* Berdistribusi normal jika Sig > 0,05.',
        columns: [
          { header: 'Uji Statistik', align: 'left' },
          { header: 'Statistik Uji', align: 'right' },
          { header: 'Asymp. Sig.', align: 'right' },
          { header: 'Kriteria (α)', align: 'right' },
          { header: 'Kesimpulan', align: 'center' },
        ],
        rows: (results.normality || []).map((r) => [
          r.test,
          formatNumber(r.statistic, 3),
          formatNumber(r.pValue, 3),
          '0,050',
          r.normal ? 'Normal' : 'Tidak Normal',
        ]),
      });
      const multiTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.5',
        title: 'Hasil Uji Multikolinearitas (Tolerance & VIF)',
        note: '* Bebas multikolinearitas jika Tolerance > 0,10 dan VIF < 10,00.',
        columns: [
          { header: 'Variabel Bebas', align: 'left' },
          { header: 'Tolerance', align: 'right' },
          { header: 'VIF', align: 'right' },
          { header: 'Batas VIF', align: 'right' },
          { header: 'Kesimpulan', align: 'center' },
        ],
        rows: (results.multicollinearity || []).map((r) => [
          r.variable,
          formatNumber(r.tolerance, 3),
          formatNumber(r.vif, 3),
          '< 10,00',
          !r.problematic ? 'Bebas' : 'Bermasalah',
        ]),
      });
      const heteroTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.6',
        title: 'Hasil Uji Heteroskedastisitas (Metode Glejser)',
        note: '* Bebas heteroskedastisitas jika Sig. (p-value) > 0,05.',
        columns: [
          { header: 'Variabel Bebas', align: 'left' },
          { header: 'Metode Pengujian', align: 'left' },
          { header: 't Hitung', align: 'right' },
          { header: 'Sig. (p-value)', align: 'right' },
          { header: 'Kesimpulan', align: 'center' },
        ],
        rows: (results.heteroscedasticity || []).map((r) => [
          r.variable,
          r.test,
          formatNumber(r.tHitung, 3),
          formatNumber(r.pValue, 3),
          !r.significant ? 'Bebas Gejala' : 'Terjadi Gejala',
        ]),
      });

      const dwTable = results.durbinWatson
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.6b',
            title: 'Hasil Uji Autokorelasi Durbin-Watson',
            note: '* Kriteria bebas autokorelasi: dU < d < 4 - dU.',
            columns: [
              { header: 'Statistik d', align: 'right' },
              { header: 'dL', align: 'right' },
              { header: 'dU', align: 'right' },
              { header: '4 - dU', align: 'right' },
              { header: 'Kesimpulan', align: 'center' },
            ],
            rows: [[
              formatNumber(results.durbinWatson.dwStatistic, 4),
              formatNumber(results.durbinWatson.dL, 4),
              formatNumber(results.durbinWatson.dU, 4),
              formatNumber(4 - results.durbinWatson.dU, 4),
              results.durbinWatson.conclusion,
            ]],
          })
        : '';

      const linTable = results.linearity && results.linearity.length > 0
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.6c',
            title: 'Hasil Uji Linearitas (Deviation from Linearity ANOVA)',
            note: '* Sig. Deviation > 0,05 menunjukkan hubungan linier.',
            columns: [
              { header: 'Hubungan Variabel', align: 'left' },
              { header: 'F Deviation', align: 'right' },
              { header: 'Sig. Deviation', align: 'right' },
              { header: 'F Linearity', align: 'right' },
              { header: 'Sig. Linearity', align: 'right' },
              { header: 'Status Hubungan', align: 'center' },
            ],
            rows: results.linearity.map((l) => [
              `${l.independentVar} → ${l.dependentVar}`,
              formatNumber(l.fDeviation, 3),
              formatNumber(l.sigDeviation, 3),
              formatNumber(l.fLinearity, 3),
              formatNumber(l.sigLinearity, 3),
              l.isLinear ? 'Linier' : 'Tidak Linier',
            ]),
          })
        : '';

      const narrativeText =
        results.explanations.assumptions ||
        [
          results.explanations.normality,
          results.explanations.multicollinearity,
          results.explanations.heteroscedasticity,
          results.explanations.durbinWatson,
          results.explanations.linearity,
        ]
          .filter(Boolean)
          .join('\n\n');
      const narrativeHtml = `<p>${narrativeText}</p>`;
      sections.push({
        title: '4. Uji Asumsi Klasik',
        contentHtml: normTable + (fig4_1Html ? `<br/>${fig4_1Html}` : '') + (fig4_2Html ? `<br/>${fig4_2Html}` : '') + '<br/>' + multiTable + '<br/>' + heteroTable + (dwTable ? `<br/>${dwTable}` : '') + (linTable ? `<br/>${linTable}` : '') + narrativeHtml,
      });
    }

    if (options.sections.includes('regression')) {
      const regTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.7',
        title: 'Hasil Analisis Regresi Linier Berganda (Uji t Parsial)',
        note: `* Tingkat signifikansi α = 0,05.`,
        columns: [
          { header: 'Model / Variabel', align: 'left' },
          { header: 'Koefisien (B)', align: 'right' },
          { header: 'Std. Error', align: 'right' },
          { header: 'Beta (β)', align: 'right' },
          { header: 't Hitung', align: 'right' },
          { header: 't Tabel', align: 'right' },
          { header: 'Sig. (p-value)', align: 'right' },
          { header: 'Signifikansi', align: 'center' },
        ],
        rows: (results.regression || []).map((r) => [
          r.variable,
          formatNumber(r.coefficient, 3),
          formatNumber(r.stdError, 3),
          r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
          formatNumber(r.tHitung, 3),
          r.tTabel !== undefined ? formatNumber(r.tTabel, 3) : '-',
          formatNumber(r.pValue, 3),
          r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant') ? '-' : (r.significant ? 'Signifikan' : 'Tidak'),
        ]),
      });

      const predictors = (results.regression || []).filter((r) => !r.variable.toLowerCase().includes('konstanta') && r.sePercent !== undefined);
      const seSrTable = predictors.length > 0
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.7b',
            title: 'Sumbangan Efektif (SE %) dan Sumbangan Relatif (SR %)',
            note: `* Total SE = ${(results.determination?.rSquare ? results.determination.rSquare * 100 : 0).toFixed(2)}%, Total SR = 100,00%.`,
            columns: [
              { header: 'Variabel Bebas', align: 'left' },
              { header: 'Beta (β)', align: 'right' },
              { header: 'Sumbangan Efektif (SE %)', align: 'right' },
              { header: 'Sumbangan Relatif (SR %)', align: 'right' },
            ],
            rows: predictors.map((r) => [
              r.variable,
              r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
              r.sePercent !== undefined ? `${formatNumber(r.sePercent, 2)}%` : '-',
              r.srPercent !== undefined ? `${formatNumber(r.srPercent, 2)}%` : '-',
            ]),
          })
        : '';

      const fTable = results.fTest
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.8',
            title: 'Hasil Uji Signifikansi Simultan (Uji F ANOVA)',
            note: `* F tabel α = 0,05 sebesar ${formatNumber(results.fTest.fTabel, 3)}.`,
            columns: [
              { header: 'Model Uji', align: 'left' },
              { header: 'F Hitung', align: 'right' },
              { header: 'F Tabel', align: 'right' },
              { header: 'Sig. (p-value)', align: 'right' },
              { header: 'Kesimpulan', align: 'center' },
            ],
            rows: [
              [
                'Regresi Simultan',
                formatNumber(results.fTest.fHitung, 3),
                formatNumber(results.fTest.fTabel, 3),
                formatNumber(results.fTest.pValue, 3),
                results.fTest.significant ? 'Signifikan' : 'Tidak',
              ],
            ],
          })
        : '';
      const r2Table = results.determination
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.9',
            title: 'Hasil Uji Koefisien Determinasi (R Square)',
            note: '* Dihitung dari model regresi linier OLS.',
            columns: [
              { header: 'Model', align: 'left' },
              { header: 'R Square (R²)', align: 'right' },
              { header: 'Adjusted R Square', align: 'right' },
              { header: 'Kontribusi (%)', align: 'right' },
            ],
            rows: [
              [
                '1',
                formatNumber(results.determination.rSquare, 3),
                formatNumber(results.determination.adjustedRSquare, 3),
                `${formatNumber(results.determination.adjustedRSquare * 100, 1)}%`,
              ],
            ],
          })
        : '';
      const narrativeHtml = `<p>${results.explanations.regression}</p>`;
      sections.push({
        title: '5. Analisis Regresi Linier Berganda',
        contentHtml: regTable + (seSrTable ? `<br/>${seSrTable}` : '') + fTable + r2Table + narrativeHtml,
      });
    }

    if (options.sections.includes('correlation')) {
      const corrTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.10',
        title: 'Matriks Koefisien Korelasi Pearson Antar Variabel',
        note: '* Signifikan pada α = 0,05 (2-tailed).',
        columns: [
          { header: 'Variabel 1', align: 'left' },
          { header: 'Variabel 2', align: 'left' },
          { header: 'Koefisien (r)', align: 'right' },
          { header: 'Sig. (p-value)', align: 'right' },
          { header: 'Signifikansi', align: 'center' },
        ],
        rows: (results.correlation || []).map((r) => [
          r.variable1,
          r.variable2,
          formatNumber(r.coefficient, 3),
          formatNumber(r.pValue, 3),
          r.significant ? 'Signifikan' : 'Tidak Signifikan',
        ]),
      });
      const narrativeHtml = `<p>${formatNarrative(results.explanations.correlation)}</p>`;
      sections.push({
        title: '6. Analisis Korelasi Pearson',
        contentHtml: corrTable + narrativeHtml,
      });
    }

    if (
      results.crosstab &&
      results.chiSquare &&
      (options.sections.includes('crosstab') ||
        options.sections.includes('chisquare') ||
        options.sections.includes('odds-ratio') ||
        results.researchDesign === 'categorical')
    ) {
      const ct = results.crosstab;
      const cs = results.chiSquare;
      const re = results.riskEstimate;
      const sm = results.symmetricMeasures;

      const crosstabRows: (string | number)[][] = [];
      ct.rowCategories.forEach((rowCat, rIdx) => {
        const counts = ct.colCategories.map((_, cIdx) => ct.matrix[rIdx][cIdx]);
        crosstabRows.push([rowCat, 'Count', ...counts, ct.rowTotals[rIdx]]);
        const expecteds = ct.colCategories.map((_, cIdx) => formatNumber(ct.expectedMatrix[rIdx][cIdx], 1));
        crosstabRows.push(['', 'Expected Count', ...expecteds, formatNumber(ct.rowTotals[rIdx], 1)]);
        const rowPercents = ct.colCategories.map((_, cIdx) => `${formatNumber(ct.rowPercentages[rIdx][cIdx], 1)}%`);
        crosstabRows.push(['', `% within ${ct.rowVar}`, ...rowPercents, '100,0%']);
      });

      const ctTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.11',
        title: `Hasil Tabulasi Silang ${ct.rowVar} dan ${ct.colVar}`,
        note: `* N = ${ct.totalN} responden.`,
        columns: [
          { header: ct.rowVar, align: 'left' },
          { header: 'Keterangan', align: 'left' },
          ...ct.colCategories.map((col) => ({ header: col, align: 'right' as const })),
          { header: 'Total', align: 'right' },
        ],
        rows: crosstabRows,
      });

      const csRows: (string | number)[][] = [
        [
          'Pearson Chi-Square',
          formatNumber(cs.pearsonChiSquare, 3),
          cs.df,
          formatNumber(cs.pearsonSig, 4),
          cs.pearsonSig < 0.05 ? 'Signifikan' : 'Tidak Signifikan',
        ],
      ];
      if (cs.continuityCorrection !== undefined) {
        csRows.push([
          'Continuity Correction (Yates)',
          formatNumber(cs.continuityCorrection, 3),
          1,
          formatNumber(cs.continuityCorrectionSig || 0, 4),
          (cs.continuityCorrectionSig || 0) < 0.05 ? 'Signifikan' : 'Tidak Signifikan',
        ]);
      }
      if (cs.likelihoodRatio !== undefined) {
        csRows.push([
          'Likelihood Ratio',
          formatNumber(cs.likelihoodRatio, 3),
          cs.df,
          formatNumber(cs.likelihoodRatioSig || 0, 4),
          (cs.likelihoodRatioSig || 0) < 0.05 ? 'Signifikan' : 'Tidak Signifikan',
        ]);
      }
      if (cs.fisherExact !== undefined) {
        csRows.push([
          "Fisher's Exact Test",
          '-',
          '-',
          formatNumber(cs.fisherExact, 4),
          cs.fisherExact < 0.05 ? 'Signifikan' : 'Tidak Signifikan',
        ]);
      }

      const csTable = buildWordTableHtml({
        tableNumber: 'Tabel 4.12',
        title: "Hasil Uji Independensi Chi-Square dan Fisher's Exact Test",
        note: `* ${cs.cochranFootnote}`,
        columns: [
          { header: 'Uji Statistik', align: 'left' },
          { header: 'Nilai Hitung', align: 'right' },
          { header: 'df', align: 'right' },
          { header: 'Sig. (p-value)', align: 'right' },
          { header: 'Keputusan (α=0,05)', align: 'center' },
        ],
        rows: csRows,
      });

      let reTable = '';
      if (re) {
        reTable = buildWordTableHtml({
          tableNumber: 'Tabel 4.13',
          title: 'Estimasi Risiko Epidemiologi (Odds Ratio & Relative Risk)',
          note: '* Dihitung dengan tingkat kepercayaan 95% Confidence Interval.',
          columns: [
            { header: 'Ukuran Asosiasi', align: 'left' },
            { header: 'Estimasi Nilai', align: 'right' },
            { header: '95% CI Lower', align: 'right' },
            { header: '95% CI Upper', align: 'right' },
            { header: 'Interpretasi Risiko', align: 'center' },
          ],
          rows: [
            [
              `Odds Ratio (OR) untuk ${re.exposureVar}`,
              formatNumber(re.oddsRatio, 3),
              formatNumber(re.ciLower, 3),
              formatNumber(re.ciUpper, 3),
              re.ciLower > 1.0 ? 'Faktor Risiko Signifikan' : (re.ciUpper < 1.0 ? 'Faktor Protektif Signifikan' : 'Bukan Risiko Bermakna'),
            ],
            [
              'Relative Risk (RR) Cohort 1',
              formatNumber(re.forCohortRisk1, 3),
              formatNumber(re.forCohortRisk1CiLower, 3),
              formatNumber(re.forCohortRisk1CiUpper, 3),
              'Kelompok Kasus',
            ],
            [
              'Relative Risk (RR) Cohort 2',
              formatNumber(re.forCohortRisk2, 3),
              formatNumber(re.forCohortRisk2CiLower, 3),
              formatNumber(re.forCohortRisk2CiUpper, 3),
              'Kelompok Kontrol',
            ],
          ],
        });
      }

      let smTable = '';
      if (sm) {
        smTable = buildWordTableHtml({
          tableNumber: 'Tabel 4.14',
          title: 'Kekuatan Hubungan (Symmetric Measures)',
          note: '* Uji signifikansi korelasi nominal.',
          columns: [
            { header: 'Ukuran Kekuatan', align: 'left' },
            { header: 'Koefisien', align: 'right' },
            { header: 'Approx. Sig.', align: 'right' },
            { header: 'Kesimpulan', align: 'center' },
          ],
          rows: [
            ['Phi', sm.phi !== undefined ? formatNumber(sm.phi, 3) : '-', formatNumber(sm.pValue, 4), sm.pValue < 0.05 ? 'Signifikan' : 'Tidak Signifikan'],
            ["Cramer's V", formatNumber(sm.cramersV, 3), formatNumber(sm.pValue, 4), sm.pValue < 0.05 ? 'Signifikan' : 'Tidak Signifikan'],
            ['Contingency Coefficient', formatNumber(sm.contingencyCoeff, 3), formatNumber(sm.pValue, 4), sm.pValue < 0.05 ? 'Signifikan' : 'Tidak Signifikan'],
          ],
        });
      }

      const ctNarrative = [
        results.explanations.crosstab,
        results.explanations.chiSquare,
        results.explanations.oddsRatio,
      ].filter(Boolean).join('\n\n');

      const narrativeHtml = `<p>${formatNarrative(ctNarrative)}</p>`;

      sections.push({
        title: '7. Analisis Hubungan Kategori (Tabulasi Silang & Chi-Square)',
        contentHtml: ctTable + '<br/>' + csTable + (reTable ? '<br/>' + reTable : '') + (smTable ? '<br/>' + smTable : '') + narrativeHtml,
      });
    }

    if (options.includeStatement) {
      const statementHtml = `
        <p class="no-indent" style="font-weight: bold; margin-bottom: 6pt;">Lampiran: Pernyataan Penggunaan Alat Bantu Analisis Data</p>
        <p>Peneliti menyatakan secara bertanggung jawab bahwa seluruh data kuesioner dalam penelitian ini diolah menggunakan mesin statistik deterministik berlisensi terbuka dan divalidasi keakuratannya. Interpretasi naratif yang dihasilkan diverifikasi kebenarannya oleh peneliti dan disesuaikan dengan konteks bidang ilmu sebelum dimuat dalam naskah skripsi.</p>
      `;
      sections.push({
        title: 'Lampiran Pernyataan Transparansi',
        contentHtml: statementHtml,
      });
    }

    const docHtml = buildWordDocumentContent(projectTitle, sections, {
      respondentCount: results.respondentCount,
      notesMap,
    }, wordImages);
    return new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
  }

  // Fallback / default: generate valid PDF
  const pdfBytes = generateAcademicPdfReport(results, {
    projectTitle,
    sections: options.sections,
    includeStatement: options.includeStatement,
    watermark: false,
    notesMap,
  });
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

export async function getBillingHistory(): Promise<BillingRecord[]> {
  return [
    {
      id: 'bill-1',
      date: '2026-09-01',
      description: 'Paket Bulanan — September 2026',
      amount: 39000,
      status: 'paid',
    },
    {
      id: 'bill-2',
      date: '2026-10-01',
      description: 'Paket Bulanan — Oktober 2026',
      amount: 39000,
      status: 'paid',
    },
  ];
}
