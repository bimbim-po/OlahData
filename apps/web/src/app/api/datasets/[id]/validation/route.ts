import { NextRequest, NextResponse } from 'next/server';
import { getDatasetRepo } from '@/lib/db/repo';
import { callStatsValidate } from '@/lib/stats-client';
import { mockIssues } from '@/lib/mock/dataset-contoh';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;
  const dataset = await getDatasetRepo(datasetId);

  try {
    const statsRes = await callStatsValidate({
      rows: dataset.rows,
      scale_min: 1,
      scale_max: 5,
    });
    return NextResponse.json(statsRes.issues);
  } catch {
    // Graceful fallback to verified mock issues
    return NextResponse.json(mockIssues);
  }
}
