import { NextRequest, NextResponse } from 'next/server';
import { saveDerivedDatasetVersionRepo } from '@/lib/db/repo';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;

  try {
    const body = await req.json();
    const { rows, reason } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Daftar nomor baris yang ingin dikecualikan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const { versionId, rowCount } = await saveDerivedDatasetVersionRepo(
      datasetId,
      rows,
      reason || 'Eksklusi baris dengan anomali data'
    );

    return NextResponse.json({
      success: true,
      message: `Versi turunan baru berhasil dibuat. ${rows.length} baris telah dikecualikan.`,
      newVersionId: versionId,
      remainingRows: rowCount,
    });
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Gagal membuat versi turunan dataset baru.' },
      { status: 500 }
    );
  }
}
