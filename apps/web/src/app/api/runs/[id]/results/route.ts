import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisRunRepo } from '@/lib/db/repo';
import { mockResults } from '@/lib/mock/results';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params;
  const run = await getAnalysisRunRepo(runId);

  if (!run || !run.results) {
    return NextResponse.json(mockResults);
  }

  return NextResponse.json(run.results);
}
