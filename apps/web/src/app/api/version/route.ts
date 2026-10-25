import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/constants';
import { NO_STORE_HEADERS } from '@/lib/server/sync-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      service: 'olahdata-web',
      version: APP_VERSION,
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || `build-${APP_VERSION}-sync-s1-s5`,
      commitSha: process.env.CF_PAGES_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'sync-s1-s5-verified',
      builtAt: process.env.NEXT_PUBLIC_BUILT_AT || new Date().toISOString(),
      syncSpecVersion: 'S1-S5-v1',
      status: 'healthy',
    },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    }
  );
}
