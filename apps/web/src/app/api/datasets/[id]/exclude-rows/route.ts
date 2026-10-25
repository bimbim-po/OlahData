import { NextRequest, NextResponse } from 'next/server';
import {
  mutateDatasetRowExclusions,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json();
    const rowIndices = Array.isArray(body?.rows)
      ? body.rows
      : typeof body?.rowIndex === 'number'
      ? [body.rowIndex]
      : [];

    const res = mutateDatasetRowExclusions({
      datasetId,
      ownerId: userId,
      action: 'exclude',
      rowIndices,
      reason: body?.reason || 'Eksklusi baris dengan anomali data',
      minRequiredN: typeof body?.minRequiredN === 'number' ? body.minRequiredN : undefined,
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          code: res.error.code,
          message: res.error.message,
          ...(res.error.details || {}),
        },
        { status: res.error.status, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${rowIndices.length} baris telah dikecualikan. Jumlah responden aktif kini N = ${res.data.n}.`,
        newVersionId: res.data.datasetId,
        remainingRows: res.data.n,
        n: res.data.n,
        row_count: res.data.rowCount,
        excluded_count: res.data.excludedCount,
        excluded_rows: res.data.excludedRows,
        content_hash: res.data.contentHash,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format permintaan eksklusi baris tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json().catch(() => ({}));
    const queryRowIdx = req.nextUrl.searchParams.get('rowIndex');
    const rowIndices = Array.isArray(body?.rows)
      ? body.rows
      : typeof body?.rowIndex === 'number'
      ? [body.rowIndex]
      : queryRowIdx !== null
      ? [Number(queryRowIdx)]
      : [];

    const res = mutateDatasetRowExclusions({
      datasetId,
      ownerId: userId,
      action: 'restore',
      rowIndices,
      reason: 'Pemulihan baris responden',
    });

    if (!res.ok) {
      return NextResponse.json(
        { code: res.error.code, message: res.error.message },
        { status: res.error.status, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Baris responden berhasil dipulihkan. Jumlah responden aktif kini N = ${res.data.n}.`,
        remainingRows: res.data.n,
        n: res.data.n,
        row_count: res.data.rowCount,
        excluded_count: res.data.excludedCount,
        excluded_rows: res.data.excludedRows,
        content_hash: res.data.contentHash,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format permintaan pemulihan baris tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
