import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisRunRepo } from '@/lib/db/repo';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;
  const run = await getAnalysisRunRepo(runId);

  if (!run) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Sesi kalkulasi statistik tidak ditemukan.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: run.id,
    projectId: run.projectId,
    status: run.status,
    progress: 100,
  });
}
