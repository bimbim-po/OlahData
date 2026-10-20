/**
 * OlahData Structured Logger
 * Aturan Mutlak: Mutlak bebas dari data tanggapan kuesioner responden.
 * Seluruh data baris (rows, data, answers, kuesioner) secara otomatis disaring keluar.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogMeta {
  userId?: string;
  projectId?: string;
  path?: string;
  latencyMs?: number;
  statusCode?: number;
  action?: string;
  [key: string]: unknown;
}

const FORBIDDEN_KEYS = new Set([
  'rows',
  'data',
  'answers',
  'kuesioner',
  'jawaban',
  'items',
  'responses',
  'values',
  'token',
  'password',
  'secret',
  'key',
]);

function sanitizeMeta(meta?: LogMeta): Record<string, unknown> {
  if (!meta) return {};
  const clean: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(meta)) {
    const lowerKey = k.toLowerCase();
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      continue;
    }
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      clean[k] = sanitizeMeta(v as LogMeta);
    } else if (!Array.isArray(v) || (Array.isArray(v) && typeof v[0] !== 'object')) {
      clean[k] = v;
    }
  }

  return clean;
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'info' as LogLevel,
      service: 'olahdata-web',
      message,
      ...sanitizeMeta(meta),
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, meta?: LogMeta) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'warn' as LogLevel,
      service: 'olahdata-web',
      message,
      ...sanitizeMeta(meta),
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, error?: unknown, meta?: LogMeta) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'error' as LogLevel,
      service: 'olahdata-web',
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
      ...sanitizeMeta(meta),
    };
    console.error(JSON.stringify(entry));
  },
};
