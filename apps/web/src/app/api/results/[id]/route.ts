import { NextRequest, NextResponse } from 'next/server';
import { getLatestResultsForProjectRepo } from '@/lib/db/repo';
import { mockResults } from '@/lib/mock/results';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const results = await getLatestResultsForProjectRepo(projectId);

  if (!results) {
    return NextResponse.json(mockResults);
  }

  return NextResponse.json(results);
}
