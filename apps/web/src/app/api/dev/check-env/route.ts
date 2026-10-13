import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Endpoint hanya tersedia di lingkungan pengembang' }, { status: 403 });
  }

  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
  );

  const hasAdminEmails = Boolean(
    process.env.ADMIN_EMAILS &&
    process.env.ADMIN_EMAILS.trim().length > 0
  );

  return NextResponse.json({
    status: 'ok',
    hasServiceRoleKey,
    hasAdminEmails,
  });
}
