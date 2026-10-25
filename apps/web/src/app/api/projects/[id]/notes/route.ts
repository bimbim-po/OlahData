import { NextRequest, NextResponse } from 'next/server';
import {
  getServerProjectNotes,
  upsertServerProjectNote,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const userId = resolveRequestUserId(req);
  const sectionId = req.nextUrl.searchParams.get('sectionId') || undefined;

  const res = getServerProjectNotes({
    projectId,
    ownerId: userId,
    sectionId,
  });

  if (!res.ok) {
    return NextResponse.json(
      { code: res.error.code, message: res.error.message },
      { status: res.error.status, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { notes: res.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json();
    const res = upsertServerProjectNote({
      projectId,
      ownerId: userId,
      sectionId: body?.sectionId,
      text: body?.text,
      expectedVersion:
        typeof body?.version === 'number' ? body.version : undefined,
      forceOverwrite: Boolean(body?.forceOverwrite),
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
        note: res.data,
        version: res.data.version,
        updatedAt: res.data.updatedAt,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format data catatan pembahasan tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
