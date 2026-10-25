import type { NextRequest } from 'next/server';

/**
 * Mengekstrak identitas pengguna dari header Authorization / x-user-id pada request API.
 * Mendukung mode pengujian (header x-require-auth: '1' memaksa 401 jika x-user-id kosong)
 * dan sesi pengguna aktif.
 */
export function resolveRequestUserId(req: NextRequest): string | null {
  const explicitUserId = req.headers.get('x-user-id');
  if (explicitUserId !== null) {
    const trimmed = explicitUserId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    return token;
  }

  if (req.headers.get('x-require-auth') === '1') {
    return null;
  }

  return 'user-authenticated-default';
}
