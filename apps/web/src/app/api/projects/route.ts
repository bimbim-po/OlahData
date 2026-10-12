import { NextRequest, NextResponse } from 'next/server';
import { getProjectsRepo, createProjectRepo } from '@/lib/db/repo';

export async function GET() {
  try {
    const projects = await getProjectsRepo();
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Gagal memuat daftar proyek penelitian.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, department, researchType } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Judul penelitian wajib diisi.' },
        { status: 400 }
      );
    }

    const project = await createProjectRepo(
      title.trim(),
      department || 'Program Studi Umum',
      researchType || 'Regresi Linier Berganda'
    );

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format data permintaan tidak valid.' },
      { status: 400 }
    );
  }
}
