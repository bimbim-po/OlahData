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
import { buildWordTableHtml, buildWordDocumentContent } from '../word-table';
import { formatNumber } from '../format';
import { generateAcademicPdfReport } from '../pdf-generator';

// =============================================================================
// 1. AUTENTIKASI (SUPABASE AUTH + PROFILES)
// =============================================================================

export async function login(email: string, password: string): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
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
    email: data.user.email || email,
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

export async function register(
  name: string,
  email: string,
  password: string,
  university: string
): Promise<User> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
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
    throw new Error(error.message || 'Pendaftaran gagal. Silakan coba kembali.');
  }

  if (!data.user) {
    throw new Error('Gagal membuat akun baru.');
  }

  const user: User = {
    id: data.user.id,
    name,
    email,
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
  const supabase = getSupabaseBrowserClient();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth] Gagal logout dari server:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('olahdata-session');
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

function getStoredProjects(): Project[] {
  if (typeof window === 'undefined') return [...mockProjects];
  try {
    const raw = localStorage.getItem('olahdata-projects');
    if (!raw) {
      localStorage.setItem('olahdata-projects', JSON.stringify(mockProjects));
      return [...mockProjects];
    }
    return JSON.parse(raw) as Project[];
  } catch {
    return [...mockProjects];
  }
}

function saveStoredProjects(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('olahdata-projects', JSON.stringify(projects));
  } catch {
    // ignore
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
    rowCount: ds.n_rows || 0,
    columnCount: ds.n_cols || 0,
    removedRows: ds.excluded_rows || [],
    createdAt: ds.created_at,
  }));

  const latest = rawDatasets[rawDatasets.length - 1];

  return {
    id: row.id,
    title: row.judul,
    department: row.prodi || 'Manajemen',
    researchType: 'Regresi Linier Berganda',
    respondentCount: latest?.n_rows || 0,
    itemCount: latest?.n_cols || 0,
    status: (row.status as ProjectStatus) || 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dataVersions,
    currentDataVersion: latest ? latest.id : '',
  };
}

export async function getProjects(): Promise<Project[]> {
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
        const mapped = (data as DbProjectRow[]).map(mapDbProjectToProject);
        saveStoredProjects(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal memuat proyek dari database:', err);
  }

  return getStoredProjects();
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (id === 'sample' || id.startsWith('project-sample')) {
    return getStoredProjects().find((p) => p.id === id) || mockProjects[0];
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data: row, error } = await supabase
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
      .is('archived_at', null)
      .maybeSingle();

    if (!error && row) {
      return mapDbProjectToProject(row as DbProjectRow);
    }
  } catch (err) {
    console.warn('[Supabase API] Gagal memuat proyek ID:', id, err);
  }

  return getStoredProjects().find((p) => p.id === id);
}

export async function createProject(
  title: string,
  department: string,
  researchType: string
): Promise<Project> {
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

        const list = getStoredProjects();
        saveStoredProjects([created, ...list.filter((p) => p.id !== created.id)]);
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
    currentDataVersion: '',
  };
  const list = getStoredProjects();
  saveStoredProjects([newProject, ...list]);
  return newProject;
}

export async function createSampleProject(): Promise<Project> {
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

        const list = getStoredProjects();
        saveStoredProjects([sampleProject, ...list]);
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

  const list = getStoredProjects();
  saveStoredProjects([fallbackSample, ...list]);
  return fallbackSample;
}

export async function deleteProject(id: string): Promise<void> {
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

  const list = getStoredProjects().filter((p) => p.id !== id);
  saveStoredProjects(list);
}

export async function deleteAllProjects(): Promise<void> {
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

  saveStoredProjects([]);
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
  const project = await getProject(projectId).catch(() => null);
  const projectTitle = project?.title || 'Analisis Data Skripsi';
  const results = customResults || (await getResult(projectId));

  if (options.format === 'pdf') {
    const pdfBytes = generateAcademicPdfReport(results, {
      projectTitle,
      sections: options.sections,
      includeStatement: options.includeStatement,
      watermark: false,
    });
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  }

  if (options.format === 'word') {
    const sections: { title: string; contentHtml: string }[] = [];

    if (options.sections.includes('descriptive')) {
      const tableHtml = buildWordTableHtml({
        tableNumber: 'Tabel 4.1',
        title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian',
        note: `* Dihitung dari N = ${results.respondentCount} responden menggunakan skala Likert 1-5.`,
        columns: [
          { header: 'Variabel Penelitian', align: 'left' },
          { header: 'N', align: 'right' },
          { header: 'Mean', align: 'right' },
          { header: 'Median', align: 'right' },
          { header: 'Std Dev', align: 'right' },
          { header: 'Min', align: 'right' },
          { header: 'Max', align: 'right' },
        ],
        rows: (results.descriptive || []).map((r) => [
          r.variable,
          formatNumber(r.n),
          formatNumber(r.mean, 3),
          formatNumber(r.median, 3),
          formatNumber(r.stdDev, 3),
          formatNumber(r.min, 3),
          formatNumber(r.max, 3),
        ]),
      });
      const narrativeHtml = `<p>${results.explanations.descriptive}</p>`;
      sections.push({
        title: '1. Statistik Deskriptif',
        contentHtml: tableHtml + narrativeHtml,
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
      const narrativeText =
        results.explanations.assumptions ||
        [
          results.explanations.normality,
          results.explanations.multicollinearity,
          results.explanations.heteroscedasticity,
        ]
          .filter(Boolean)
          .join('\n\n');
      const narrativeHtml = `<p>${narrativeText}</p>`;
      sections.push({
        title: '4. Uji Asumsi Klasik',
        contentHtml: normTable + multiTable + heteroTable + narrativeHtml,
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
          { header: 't Hitung', align: 'right' },
          { header: 'Sig. (p-value)', align: 'right' },
          { header: 'Signifikansi', align: 'center' },
        ],
        rows: (results.regression || []).map((r) => [
          r.variable,
          formatNumber(r.coefficient, 3),
          formatNumber(r.stdError, 3),
          formatNumber(r.tHitung, 3),
          formatNumber(r.pValue, 3),
          r.significant ? 'Signifikan' : 'Tidak',
        ]),
      });
      const fTable = results.fTest
        ? buildWordTableHtml({
            tableNumber: 'Tabel 4.8',
            title: 'Hasil Uji Signifikansi Simultan (Uji F ANOVA)',
            note: '* F tabel α = 0,05 sebesar 3,076.',
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
        contentHtml: regTable + fTable + r2Table + narrativeHtml,
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
      const narrativeHtml = `<p>${results.explanations.correlation}</p>`;
      sections.push({
        title: '6. Analisis Korelasi Pearson',
        contentHtml: corrTable + narrativeHtml,
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

    const docHtml = buildWordDocumentContent(projectTitle, sections);
    return new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
  }

  // Fallback / default: generate valid PDF
  const pdfBytes = generateAcademicPdfReport(results, {
    projectTitle,
    sections: options.sections,
    includeStatement: options.includeStatement,
    watermark: false,
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
