import { NextRequest, NextResponse } from 'next/server';
import { getProjectByIdRepo, getDatasetRepo } from '@/lib/db/repo';
import type { DatasetRow } from '@/lib/api/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const project = await getProjectByIdRepo(projectId);

  if (!project) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Proyek penelitian tidak ditemukan.' },
      { status: 404 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let rows: DatasetRow[] = [];

    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { rows?: DatasetRow[] };
      rows = body.rows || [];
    } else {
      // Return existing/sample dataset rows
      const existing = await getDatasetRepo(projectId);
      rows = existing.rows;
    }

    const n_rows = rows.length;
    const n_cols = rows[0] ? Object.keys(rows[0]).length : 0;

    return NextResponse.json({
      dataset_id: `ds-${projectId}-v1`,
      version: 1,
      n_rows,
      n_cols,
      message: 'Dataset berhasil diunggah.',
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { code: 'UPLOAD_FAILED', message: 'Gagal memproses berkas dataset yang diunggah.' },
      { status: 500 }
    );
  }
}
