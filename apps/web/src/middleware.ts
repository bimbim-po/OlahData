import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory sliding window rate limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Bersihkan data lama tiap 5 menit
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function getRateLimitRule(pathname: string): { limit: number; windowMs: number } | null {
  if (pathname.startsWith('/api/waitlist')) {
    return { limit: 5, windowMs: 10 * 60 * 1000 }; // 5 req per 10 menit
  }
  if (pathname.startsWith('/api/problem-reports')) {
    return { limit: 5, windowMs: 10 * 60 * 1000 }; // 5 req per 10 menit
  }
  if (pathname.startsWith('/api/ekspor')) {
    return { limit: 20, windowMs: 10 * 60 * 1000 }; // 20 ekspor per 10 menit
  }
  if (pathname.includes('/datasets')) {
    return { limit: 15, windowMs: 10 * 60 * 1000 }; // 15 unggahan per 10 menit
  }
  return null;
}

function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [k, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
    lastCleanup = now;
  }

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // 1. Pemeriksaan Batas Laju (Rate Limiting) pada Rute API Sensitif
  const rateLimitRule = getRateLimitRule(pathname);
  if (rateLimitRule) {
    const rateLimitKey = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`;
    const { allowed, remaining } = checkRateLimit(rateLimitKey, rateLimitRule.limit, rateLimitRule.windowMs);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Batas laju permintaan terlampaui (Rate Limit Exceeded). Harap tunggu beberapa saat sebelum mencoba kembali.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '600',
            'X-RateLimit-Limit': String(rateLimitRule.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  const response = NextResponse.next();

  // 2. Terapkan Header Keamanan Standar Produksi
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
  ],
};
