import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const statsEngineUrl = process.env.STATS_ENGINE_URL || 'http://127.0.0.1:8000';

  let statsEngineStatus = 'unreachable';
  let statsLatency = -1;

  try {
    const statsStart = Date.now();
    const res = await fetch(`${statsEngineUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    statsLatency = Date.now() - statsStart;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      statsEngineStatus = data.status === 'ok' ? 'operational' : 'degraded';
    }
  } catch {
    statsEngineStatus = 'down_or_local_fallback';
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const overallStatus =
    statsEngineStatus === 'operational' && supabaseConfigured
      ? 'operational'
      : statsEngineStatus === 'down_or_local_fallback' && !supabaseConfigured
      ? 'offline_demo_mode'
      : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    services: {
      web: {
        status: 'operational',
        latencyMs: Date.now() - startTime,
      },
      statsEngine: {
        status: statsEngineStatus,
        latencyMs: statsLatency,
        url: statsEngineUrl.replace(/\/\/[^@]+@/, '//'),
      },
      database: {
        configured: supabaseConfigured,
        status: supabaseConfigured ? 'connected' : 'unconfigured_local_mode',
      },
      storagePurgeQueue: {
        status: 'operational',
      },
    },
  });
}
