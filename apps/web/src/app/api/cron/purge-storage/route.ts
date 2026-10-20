import { NextRequest, NextResponse } from 'next/server';
import { executeStoragePurge } from '@/lib/storage-purge';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verifikasi otorisasi cron (CRON_SECRET atau Service Role Key)
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
  }

  const result = await executeStoragePurge(100);

  return NextResponse.json({
    success: true,
    event: 'STORAGE_PURGE_CRON',
    timestamp: new Date().toISOString(),
    result,
  });
}
