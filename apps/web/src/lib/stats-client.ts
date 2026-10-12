const STATS_SERVICE_URL = process.env.STATS_SERVICE_URL || 'http://127.0.0.1:8000';
const STATS_SERVICE_KEY = process.env.STATS_SERVICE_KEY || 'dev-stats-secret-key-12345';

export async function callStatsValidate(payload: {
  rows: Record<string, unknown>[];
  scale_min?: number;
  scale_max?: number;
  item_columns?: string[];
}): Promise<{ issues: Record<string, unknown>[] }> {
  const res = await fetch(`${STATS_SERVICE_URL}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': STATS_SERVICE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: 'Galat pada layanan statistik' }))) as { detail?: string };
    throw new Error(err.detail || 'Gagal memvalidasi dataset');
  }

  return res.json();
}

export async function callStatsAnalyze(payload: {
  rows: Record<string, unknown>[];
  constructs: Record<string, unknown>[];
  selectedTests: string[];
  significanceLevel?: number;
  projectId?: string;
  dataVersionId?: string;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${STATS_SERVICE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': STATS_SERVICE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: 'Galat pada layanan statistik' }))) as { detail?: string };
    throw new Error(err.detail || 'Gagal melakukan kalkulasi statistik');
  }

  return res.json();
}

export async function callStatsExport(payload: {
  format: 'docx' | 'pdf';
  results: Record<string, unknown>;
  projectTitle?: string;
  includeDeclaration?: boolean;
  watermark?: boolean;
}): Promise<ArrayBuffer> {
  const res = await fetch(`${STATS_SERVICE_URL}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': STATS_SERVICE_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: 'Galat pembuatan file ekspor' }))) as { detail?: string };
    throw new Error(err.detail || 'Gagal menghasilkan dokumen ekspor');
  }

  return res.arrayBuffer();
}
