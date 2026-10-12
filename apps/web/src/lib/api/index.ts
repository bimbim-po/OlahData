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
} from './types';

import { mockProjects } from '../mock/projects';
import { mockDataset, mockIssues } from '../mock/dataset-contoh';
import { mockResults, mockTestOptions } from '../mock/results';

export async function login(email: string, _password: string): Promise<User> {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Mahasiswa Demo',
    email,
    university: 'Universitas Indonesia',
    department: 'Manajemen',
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
}

export async function register(name: string, email: string, _password: string, university: string): Promise<User> {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name,
    email,
    university,
    department: 'Manajemen',
    plan: 'free',
    createdAt: new Date().toISOString(),
  };
}

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

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredProjects(data);
        return data;
      }
    }
  } catch {
    // Fallback to local storage
  }
  return getStoredProjects();
}

export async function getProject(id: string): Promise<Project | undefined> {
  try {
    const res = await fetch(`/api/projects/${id}`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return getStoredProjects().find((p) => p.id === id);
}

export async function createProject(title: string, department: string, researchType: string): Promise<Project> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, department, researchType }),
    });
    if (res.ok) {
      const created = await res.json();
      const list = getStoredProjects();
      saveStoredProjects([created, ...list]);
      return created;
    }
  } catch {
    // Fallback
  }

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
  const sampleProject: Project = {
    id: `project-${Date.now()}`,
    title: 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan (Data Contoh)',
    department: 'Manajemen',
    researchType: 'Regresi Linier Berganda',
    respondentCount: 120,
    itemCount: 18,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataVersions: [
      {
        id: 'dv-sample-1',
        label: 'Versi awal',
        rowCount: 120,
        columnCount: 21,
        removedRows: [],
        createdAt: new Date().toISOString(),
      },
    ],
    currentDataVersion: 'dv-sample-1',
  };
  const list = getStoredProjects();
  saveStoredProjects([sampleProject, ...list]);
  return sampleProject;
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  } catch {
    // ignore
  }
  const list = getStoredProjects().filter((p) => p.id !== id);
  saveStoredProjects(list);
}

export async function deleteAllProjects(): Promise<void> {
  try {
    await fetch('/api/account/data', { method: 'DELETE' });
  } catch {
    // ignore
  }
  saveStoredProjects([]);
}

export async function getDatasetPreview(projectId: string): Promise<{ rows: DatasetRow[]; columns: string[] }> {
  try {
    const res = await fetch(`/api/datasets/${projectId}/preview`);
    if (res.ok) {
      const data = await res.json();
      return { rows: data.rows, columns: data.columns };
    }
  } catch {
    // Fallback
  }
  const columns = Object.keys(mockDataset[0] || {});
  return { rows: mockDataset, columns };
}

export async function getDataIssues(projectId: string): Promise<DataIssue[]> {
  try {
    const res = await fetch(`/api/datasets/${projectId}/validation`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return mockIssues;
}

export async function getTestOptions(_constructs: AnalysisConfig['constructs']): Promise<TestOption[]> {
  return mockTestOptions;
}

export async function runAnalysis(config: AnalysisConfig): Promise<AnalysisResults> {
  try {
    const res = await fetch(`/api/projects/${config.projectId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results) {
        return data.results;
      }
    }
  } catch {
    // Fallback
  }
  return mockResults;
}

export async function getResult(projectId: string): Promise<AnalysisResults> {
  try {
    const res = await fetch(`/api/results/${projectId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return { ...mockResults, projectId };
}

export async function exportResult(projectId: string, options: ExportOptions): Promise<Blob> {
  try {
    const res = await fetch(`/api/runs/run-${projectId}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (res.ok) {
      return await res.blob();
    }
  } catch {
    // Fallback
  }
  return new Blob(['DRAF HASIL PENGOLAHAN DATA OLAHDATA'], { type: 'application/octet-stream' });
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
