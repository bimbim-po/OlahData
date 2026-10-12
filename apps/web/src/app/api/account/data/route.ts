import { NextResponse } from 'next/server';
import { deleteAllProjects } from '@/lib/api';

export async function DELETE() {
  try {
    await deleteAllProjects();
    return NextResponse.json({
      success: true,
      message: 'Seluruh data proyek dan dataset pengguna telah berhasil dihapus secara permanen.',
    });
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Gagal menghapus data akun pengguna.' },
      { status: 500 }
    );
  }
}
