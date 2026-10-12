import { NextRequest, NextResponse } from 'next/server';
import { saveConstructsMappingRepo, getConstructsMappingRepo } from '@/lib/db/repo';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const constructs = await getConstructsMappingRepo(projectId);
  return NextResponse.json({ constructs });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { constructs } = body;

    if (!Array.isArray(constructs)) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Daftar konstruk tidak valid.' },
        { status: 400 }
      );
    }

    await saveConstructsMappingRepo(projectId, constructs);
    return NextResponse.json({ success: true, message: 'Pemetaan variabel konstruk berhasil disimpan.' });
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format data permintaan pemetaan tidak valid.' },
      { status: 400 }
    );
  }
}
