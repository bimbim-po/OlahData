import { NextRequest, NextResponse } from 'next/server';
import { getDatasetRepo } from '@/lib/db/repo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = parseInt(searchParams.get('size') || '50', 10);

  const dataset = await getDatasetRepo(datasetId);
  const start = (page - 1) * size;
  const paginatedRows = dataset.rows.slice(start, start + size);

  return NextResponse.json({
    totalRows: dataset.rows.length,
    page,
    size,
    columns: dataset.columns,
    rows: paginatedRows,
  });
}
