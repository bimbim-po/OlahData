const STATS_SERVICE_URL = process.env.STATS_SERVICE_URL || 'http://127.0.0.1:8000';
const STATS_SERVICE_KEY = process.env.STATS_SERVICE_KEY || 'dev-stats-secret-key-12345';

async function parseJsonResponse<T>(res: Response, defaultErrorMsg: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let detail = defaultErrorMsg;
    if (contentType.includes('application/json')) {
      const errJson = (await res.json().catch(() => null)) as { detail?: string } | null;
      if (errJson?.detail) detail = errJson.detail;
    } else {
      const text = await res.text().catch(() => '');
      if (text) detail = text.slice(0, 150);
    }
    throw new Error(`[HTTP ${res.status}] ${detail}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Respon server tidak valid: diharapkan JSON, diterima ${contentType || 'tipe kosong'}.`);
  }

  return res.json() as Promise<T>;
}

export async function callStatsValidate(
  payload: {
    rows: Record<string, unknown>[];
    scale_min?: number;
    scale_max?: number;
    item_columns?: string[];
  },
  signal?: AbortSignal
): Promise<{ issues: Record<string, unknown>[] }> {
  try {
    const res = await fetch(`${STATS_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': STATS_SERVICE_KEY,
      },
      body: JSON.stringify(payload),
      signal,
    });

    return await parseJsonResponse<{ issues: Record<string, unknown>[] }>(
      res,
      'Gagal memvalidasi dataset pada layanan statistik.'
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Layanan statistik offline atau tidak merespons.';
    throw new Error(`Koneksi ke mesin statistik gagal: ${msg}`);
  }
}

export async function callStatsAnalyze(
  payload: {
    rows: Record<string, unknown>[];
    constructs: Record<string, unknown>[];
    selectedTests: string[];
    significanceLevel?: number;
    projectId?: string;
    dataVersionId?: string;
  },
  signal?: AbortSignal
): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${STATS_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': STATS_SERVICE_KEY,
      },
      body: JSON.stringify(payload),
      signal,
    });

    return await parseJsonResponse<Record<string, unknown>>(
      res,
      'Gagal melakukan kalkulasi statistik deterministik.'
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Layanan statistik offline atau tidak merespons.';
    throw new Error(`Koneksi ke mesin statistik gagal: ${msg}`);
  }
}

export async function callStatsExport(
  payload: {
    format: 'docx' | 'pdf';
    results: Record<string, unknown>;
    projectTitle?: string;
    includeDeclaration?: boolean;
    watermark?: boolean;
    tableId?: string;
  },
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  try {
    const res = await fetch(`${STATS_SERVICE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': STATS_SERVICE_KEY,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let detail = 'Gagal menghasilkan dokumen ekspor.';
      if (contentType.includes('application/json')) {
        const errJson = (await res.json().catch(() => null)) as { detail?: string } | null;
        if (errJson?.detail) detail = errJson.detail;
      }
      throw new Error(`[HTTP ${res.status}] ${detail}`);
    }

    return await res.arrayBuffer();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Layanan pembuatan dokumen ekspor tidak merespons.';
    throw new Error(`Ekspor dokumen gagal: ${msg}`);
  }
}
