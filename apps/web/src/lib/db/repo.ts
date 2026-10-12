import { getSupabaseServerClient, getSupabaseAdminClient } from '../supabase/server';
import type { Project, AnalysisResults, DataIssue, DatasetRow, Construct, SubscriptionPlan } from '../api/types';
import { mockProjects } from '../mock/projects';
import { mockDataset, mockIssues } from '../mock/dataset-contoh';
import { mockResults } from '../mock/results';

// In-memory persistent cache for resilience when Supabase local container is offline
class MemoryStore {
  projects: Map<string, Project> = new Map();
  datasets: Map<string, { rows: DatasetRow[]; columns: string[]; excludedRows: number[] }> = new Map();
  runs: Map<string, { id: string; projectId: string; status: string; results?: AnalysisResults }> = new Map();
  constructs: Map<string, Construct[]> = new Map();
  plan: SubscriptionPlan = 'free';

  constructor() {
    // Seed initial demo project
    for (const p of mockProjects) {
      this.projects.set(p.id, { ...p });
      this.datasets.set(p.id, {
        rows: [...mockDataset],
        columns: Object.keys(mockDataset[0] || {}),
        excludedRows: p.dataVersions[0]?.removedRows || [],
      });
      this.runs.set(`run-${p.id}`, {
        id: `run-${p.id}`,
        projectId: p.id,
        status: 'succeeded',
        results: { ...mockResults, projectId: p.id },
      });
    }
  }
}

const memoryStore = new MemoryStore();

export async function getProjectsRepo(ownerId = '00000000-0000-0000-0000-000000000001'): Promise<Project[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as Array<{ id: string; judul: string; prodi?: string; status?: Project['status']; created_at: string; updated_at: string }>).map((d) => ({
        id: d.id,
        title: d.judul,
        department: d.prodi || 'Manajemen',
        researchType: 'Regresi Linier Berganda',
        respondentCount: 117,
        itemCount: 18,
        status: d.status || 'completed',
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        dataVersions: [
          {
            id: `dv-${d.id}-1`,
            label: 'Versi Awal',
            rowCount: 120,
            columnCount: 21,
            removedRows: [],
            createdAt: d.created_at,
          },
        ],
        currentDataVersion: `dv-${d.id}-1`,
      }));
    }
  } catch {
    // Fallback to memory store
  }
  return Array.from(memoryStore.projects.values());
}

export async function getProjectByIdRepo(id: string): Promise<Project | undefined> {
  const projects = await getProjectsRepo();
  return projects.find((p) => p.id === id) || memoryStore.projects.get(id);
}

export async function createProjectRepo(
  title: string,
  department: string,
  researchType: string,
  ownerId = '00000000-0000-0000-0000-000000000001'
): Promise<Project> {
  const id = `project-${Date.now()}`;
  const now = new Date().toISOString();

  const newProject: Project = {
    id,
    title,
    department,
    researchType,
    respondentCount: 0,
    itemCount: 0,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    dataVersions: [],
    currentDataVersion: '',
  };

  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('projects').insert({
      id,
      owner_id: ownerId,
      judul: title,
      prodi: department,
      status: 'draft',
    });
  } catch {
    // ignore
  }

  memoryStore.projects.set(id, newProject);
  return newProject;
}

export async function deleteProjectRepo(id: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('projects').update({ archived_at: new Date().toISOString() }).eq('id', id);
  } catch {
    // ignore
  }
  memoryStore.projects.delete(id);
}

export async function getDatasetRepo(projectId: string): Promise<{ rows: DatasetRow[]; columns: string[] }> {
  const ds = memoryStore.datasets.get(projectId);
  if (ds) {
    return { rows: ds.rows, columns: ds.columns };
  }
  return { rows: [...mockDataset], columns: Object.keys(mockDataset[0] || {}) };
}

export async function saveDerivedDatasetVersionRepo(
  projectId: string,
  excludedRows: number[],
  note = 'Pengecualian baris bermasalah'
): Promise<{ versionId: string; rowCount: number }> {
  const base = await getDatasetRepo(projectId);
  const filtered = base.rows.filter((_, idx) => !excludedRows.includes(idx + 1));
  const versionId = `dv-${Date.now()}`;

  memoryStore.datasets.set(versionId, {
    rows: filtered,
    columns: base.columns,
    excludedRows,
  });

  const proj = memoryStore.projects.get(projectId);
  if (proj) {
    proj.dataVersions.push({
      id: versionId,
      label: `Versi Bersih (${note})`,
      rowCount: filtered.length,
      columnCount: base.columns.length,
      removedRows: excludedRows,
      createdAt: new Date().toISOString(),
    });
    proj.currentDataVersion = versionId;
    proj.respondentCount = filtered.length;
  }

  return { versionId, rowCount: filtered.length };
}

export async function saveConstructsMappingRepo(projectId: string, constructs: Construct[]): Promise<void> {
  memoryStore.constructs.set(projectId, constructs);
}

export async function getConstructsMappingRepo(projectId: string): Promise<Construct[]> {
  return (
    memoryStore.constructs.get(projectId) || [
      { id: 'c1', name: 'Kualitas Layanan', items: ['KL1', 'KL2', 'KL3', 'KL4', 'KL5', 'KL6'], role: 'independent' },
      { id: 'c2', name: 'Kepuasan Pelanggan', items: ['KP1', 'KP2', 'KP3', 'KP4', 'KP5', 'KP6'], role: 'independent' },
      { id: 'c3', name: 'Loyalitas Pelanggan', items: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5', 'LO6'], role: 'dependent' },
    ]
  );
}

export async function saveAnalysisRunRepo(runId: string, projectId: string, results: AnalysisResults): Promise<void> {
  memoryStore.runs.set(runId, {
    id: runId,
    projectId,
    status: 'succeeded',
    results,
  });
  const p = memoryStore.projects.get(projectId);
  if (p) {
    p.status = 'completed';
    p.updatedAt = new Date().toISOString();
  }
}

export async function getAnalysisRunRepo(runId: string): Promise<{ id: string; projectId: string; status: string; results?: AnalysisResults } | undefined> {
  return memoryStore.runs.get(runId);
}

export async function getLatestResultsForProjectRepo(projectId: string): Promise<AnalysisResults | undefined> {
  // Find latest run for this project
  for (const r of Array.from(memoryStore.runs.values()).reverse()) {
    if (r.projectId === projectId && r.results) {
      return r.results;
    }
  }
  return { ...mockResults, projectId };
}
