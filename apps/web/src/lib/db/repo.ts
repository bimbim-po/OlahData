import type { Project, DatasetRow, AnalysisResults, Construct, ProjectStatus } from '@/lib/api/types';
import {
  computeEffectiveN,
  serverStore,
  listServerProjectsForUser,
  getServerProjectSummary,
  createServerProject,
  mutateDatasetRowExclusions,
} from '@/lib/server/sync-engine';

const DEFAULT_SERVER_USER_ID = 'user-authenticated-default';

function toProjectStatus(status: string): ProjectStatus {
  if (status === 'completed') return 'completed';
  if (status === 'running' || status === 'analyzing') return 'analyzing';
  return 'draft';
}

const constructsMap = new Map<string, Construct[]>();

export async function getProjectsRepo(ownerId: string = DEFAULT_SERVER_USER_ID): Promise<Project[]> {
  const res = listServerProjectsForUser(ownerId);
  if (!res.ok) return [];

  return res.data.map((dto) => ({
    id: dto.id,
    title: dto.title,
    department: dto.department,
    researchType: dto.researchType,
    respondentCount: dto.respondentCount,
    itemCount: dto.itemCount,
    status: toProjectStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    dataVersions: dto.dataset.id
      ? [
          {
            id: dto.dataset.id,
            label:
              dto.dataset.excluded_count > 0
                ? 'Versi Turunan (Pembersihan)'
                : 'Versi Awal (Original)',
            rowCount: dto.dataset.n,
            columnCount: dto.itemCount,
            removedRows: dto.dataset.excluded_rows,
            createdAt: dto.dataset.uploaded_at || dto.createdAt,
          },
        ]
      : [],
    currentDataVersion: dto.dataset.id || '',
  }));
}

export async function getProjectByIdRepo(
  id: string,
  ownerId: string = DEFAULT_SERVER_USER_ID
): Promise<Project | null> {
  const res = getServerProjectSummary(id, ownerId);
  if (!res.ok) return null;

  const dto = res.data;
  return {
    id: dto.id,
    title: dto.title,
    department: dto.department,
    researchType: dto.researchType,
    respondentCount: dto.respondentCount,
    itemCount: dto.itemCount,
    status: toProjectStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    dataVersions: dto.dataset.id
      ? [
          {
            id: dto.dataset.id,
            label:
              dto.dataset.excluded_count > 0
                ? 'Versi Turunan (Pembersihan)'
                : 'Versi Awal (Original)',
            rowCount: dto.dataset.n,
            columnCount: dto.itemCount,
            removedRows: dto.dataset.excluded_rows,
            createdAt: dto.dataset.uploaded_at || dto.createdAt,
          },
        ]
      : [],
    currentDataVersion: dto.dataset.id || '',
  };
}

export async function createProjectRepo(
  title: string,
  department: string,
  researchType: string,
  ownerId: string = DEFAULT_SERVER_USER_ID,
  isSample: boolean = false
): Promise<Project> {
  const res = createServerProject({
    ownerId,
    title,
    department,
    researchType,
    isSample,
  });

  if (!res.ok) {
    const err = new Error(res.error.message) as Error & { status?: number; code?: string };
    err.status = res.error.status;
    err.code = res.error.code;
    throw err;
  }

  const dto = res.data;
  return {
    id: dto.id,
    title: dto.title,
    department: dto.department,
    researchType: dto.researchType,
    respondentCount: dto.respondentCount,
    itemCount: dto.itemCount,
    status: toProjectStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    dataVersions: [],
    currentDataVersion: '',
  };
}

export async function deleteProjectRepo(
  id: string,
  ownerId: string = DEFAULT_SERVER_USER_ID
): Promise<boolean> {
  const existing = serverStore.projects.get(id);
  if (!existing || existing.ownerId !== ownerId) return false;
  serverStore.projects.delete(id);
  return true;
}

export async function getDatasetRepo(
  projectId: string
): Promise<{ rows: DatasetRow[]; columns: string[]; excludedRows: number[]; effectiveN: number }> {
  const dsId = serverStore.projectLatestDataset.get(projectId);
  const ds = dsId ? serverStore.datasets.get(dsId) : undefined;
  if (!ds) {
    return { rows: [], columns: [], excludedRows: [], effectiveN: 0 };
  }
  const rows = (ds.rows || []) as DatasetRow[];
  const columns =
    ds.columnMeta.length > 0
      ? ds.columnMeta.map((c) => c.name)
      : Object.keys(rows[0] || {});
  const effectiveN = computeEffectiveN(ds.rowCount, ds.excludedRows);
  return {
    rows,
    columns,
    excludedRows: ds.excludedRows,
    effectiveN,
  };
}

export async function saveDerivedDatasetVersionRepo(
  datasetId: string,
  rowsToRemove: number[],
  reason: string,
  ownerId: string = DEFAULT_SERVER_USER_ID
): Promise<{ versionId: string; rowCount: number; excludedCount: number }> {
  const res = mutateDatasetRowExclusions({
    datasetId,
    ownerId,
    action: 'exclude',
    rowIndices: rowsToRemove,
    reason,
  });

  if (!res.ok) {
    const err = new Error(res.error.message) as Error & { status?: number; code?: string };
    err.status = res.error.status;
    err.code = res.error.code;
    throw err;
  }

  return {
    versionId: res.data.datasetId,
    rowCount: res.data.n,
    excludedCount: res.data.excludedCount,
  };
}

export async function saveConstructsMappingRepo(
  projectId: string,
  constructs: Construct[]
): Promise<void> {
  constructsMap.set(projectId, constructs);
}

export async function getConstructsMappingRepo(projectId: string): Promise<Construct[]> {
  return constructsMap.get(projectId) || [];
}

export async function saveAnalysisRunRepo(
  runId: string,
  _projectId: string,
  results: AnalysisResults
): Promise<void> {
  serverStore.results.set(runId, results);
}

export async function getAnalysisRunRepo(
  runId: string
): Promise<{ id: string; runId: string; projectId: string; status: string; createdAt: string; results: AnalysisResults } | null> {
  const run = serverStore.runs.get(runId);
  const results = serverStore.results.get(runId);
  if (!run || !results) return null;
  return {
    id: run.id,
    runId: run.id,
    projectId: run.projectId,
    status: run.status,
    createdAt: run.startedAt,
    results,
  };
}

export async function getLatestResultsForProjectRepo(
  projectId: string
): Promise<AnalysisResults | null> {
  const runs = Array.from(serverStore.runs.values())
    .filter((r) => r.projectId === projectId && r.status === 'succeeded')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  if (runs.length === 0) return null;
  return serverStore.results.get(runs[0].id) || null;
}
