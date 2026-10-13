import { z } from 'zod';

/**
 * Validasi Variabel Lingkungan OlahData dengan Zod.
 * Aturan Keamanan:
 * - Jangan pernah menampilkan nilai variabel ke pesan galat atau log.
 * - Berikan nama variabel secara eksplisit dalam bahasa Indonesia saat ada yang kosong/salah.
 */

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({
      required_error: 'Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL wajib diisi.',
    })
    .min(1, 'Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL tidak boleh kosong.')
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      'Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL harus berupa URL yang valid (diawali https:// atau http://), bukan API key token.'
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({
      required_error: 'Variabel lingkungan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi.',
    })
    .min(1, 'Variabel lingkungan NEXT_PUBLIC_SUPABASE_ANON_KEY tidak boleh kosong.'),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional(),
  ADMIN_EMAILS: z
    .string()
    .optional(),
});

function getEnvData() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  };
}

export function validateEnv() {
  const isServer = typeof window === 'undefined';
  const data = getEnvData();

  if (isServer) {
    const result = serverEnvSchema.safeParse(data);
    if (!result.success) {
      const messages = result.error.errors
        .map((err) => `- [${err.path.join('.')}]: ${err.message}`)
        .join('\n');
      console.error(`\n[Konfigurasi Lingkungan Galat]\n${messages}\n`);
      throw new Error(`Konfigurasi lingkungan server tidak valid:\n${messages}`);
    }
    return result.data;
  } else {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    if (!result.success) {
      const messages = result.error.errors
        .map((err) => `- [${err.path.join('.')}]: ${err.message}`)
        .join('\n');
      console.error(`\n[Konfigurasi Lingkungan Klien Galat]\n${messages}\n`);
      throw new Error(`Konfigurasi lingkungan peramban tidak valid:\n${messages}`);
    }
    return result.data;
  }
}

// Fallback aman untuk ekspor statis atau SSR
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    const val = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!val) {
      throw new Error('Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi di .env.local');
    }
    return val;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string {
    const val = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!val) {
      throw new Error('Variabel lingkungan NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi di .env.local');
    }
    return val;
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    if (typeof window !== 'undefined') {
      throw new Error('Keamanan Kritis: SUPABASE_SERVICE_ROLE_KEY tidak boleh diakses dari sisi peramban/klien!');
    }
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get ADMIN_EMAILS(): string {
    return process.env.ADMIN_EMAILS || '';
  },
};
