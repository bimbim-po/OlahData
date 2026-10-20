/**
 * OlahData Error Monitoring Configuration (Sentry / Fallback)
 * Aturan Mutlak Keamanan:
 * - Sebelum payload dikirim ke pemantau error eksternal, seluruh data responden dieliminasi.
 * - Breadcrumbs dan event data disanitasi dari query kuesioner dan kredensial.
 */

export interface SentryEvent {
  message?: string;
  exception?: unknown;
  breadcrumbs?: Array<Record<string, unknown>>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
}

export function sanitizeSentryEvent(event: SentryEvent): SentryEvent {
  // 1. Bersihkan data user: hanya simpan ID, samarkan email
  if (event.user?.email) {
    const parts = event.user.email.split('@');
    event.user.email = `${parts[0].slice(0, 2)}***@${parts[1] || 'domain.com'}`;
  }

  // 2. Bersihkan extra payload dari baris data responden
  if (event.extra) {
    const forbidden = ['rows', 'data', 'answers', 'kuesioner', 'responses'];
    for (const key of forbidden) {
      if (key in event.extra) {
        delete event.extra[key];
      }
    }
  }

  // 3. Bersihkan breadcrumbs dari query data
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (b.data && typeof b.data === 'object') {
        const cleanData = { ...(b.data as Record<string, unknown>) };
        delete cleanData.body;
        delete cleanData.rows;
        delete cleanData.answers;
        return { ...b, data: cleanData };
      }
      return b;
    });
  }

  return event;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry) {
    const sentry = (window as unknown as { Sentry: { captureException: (e: unknown, ctx?: unknown) => void } }).Sentry;
    sentry.captureException(error, context);
    return;
  }
  // Fallback console error in development
  console.error('[ErrorTracker]', error, context);
}
