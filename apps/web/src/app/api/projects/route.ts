import { NextRequest, NextResponse } from 'next/server';
import {
  listServerProjectsForUser,
  createServerProject,
  NO_STORE_HEADERS,
} from '@/lib/server/sync-engine';
import { resolveRequestUserId } from '@/lib/server/request-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = resolveRequestUserId(req);
  const res = listServerProjectsForUser(userId);

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

export async function POST(req: NextRequest) {
  const userId = resolveRequestUserId(req);

  try {
    const body = await req.json();
    const { id, title, department, researchType, isSample } = body || {};

    const res = createServerProject({
      id,
      ownerId: userId,
      title,
      department: department || 'Program Studi Umum',
      researchType: researchType || 'Regresi Linier Berganda',
      isSample: Boolean(isSample),
    });

    if (!res.ok) {
      return NextResponse.json(
        { code: res.error.code, message: res.error.message },
        { status: res.error.status, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(res.data, {
      status: 201,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: 'Format data permintaan proyek tidak valid.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }
}
