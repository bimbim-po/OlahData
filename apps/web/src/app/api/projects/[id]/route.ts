import { NextRequest, NextResponse } from 'next/server';
import {
  getServerProjectSummary,
  updateServerProjectTitle,
  assertProjectOwnership,
  serverStore,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = resolveRequestUserId(req);
  const res = getServerProjectSummary(id, userId);

  if (!res.ok) {
    return NextResponse.json(
      { code: res.error.code, message: res.error.message },
      { status: res.error.status, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(res.data, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json();
    const res = updateServerProjectTitle({
      projectId: id,
      ownerId: userId,
      title: body?.title,
      department: body?.department,
    });

    if (!res.ok) {
      return NextResponse.json(
        { code: res.error.code, message: res.error.message },
        { status: res.error.status, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(res.data, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format permintaan pembaruan proyek tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = resolveRequestUserId(req);
  const access = assertProjectOwnership(id, userId);

  if (!access.ok) {
    return NextResponse.json(
      { code: access.error.code, message: access.error.message },
      { status: access.error.status, headers: NO_STORE_HEADERS }
    );
  }

  serverStore.projects.delete(id);
  return NextResponse.json(
    { success: true, message: 'Proyek berhasil dihapus.' },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
