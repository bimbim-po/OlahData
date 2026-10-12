import { NextRequest, NextResponse } from 'next/server';
import { getProjectByIdRepo, deleteProjectRepo } from '@/lib/db/repo';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProjectByIdRepo(id);

  if (!project) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: 'Proyek penelitian tidak ditemukan.' },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteProjectRepo(id);
  return NextResponse.json({ success: true, message: 'Proyek berhasil dihapus.' });
}
