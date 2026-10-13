import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Klien Supabase Admin dengan Service Role Key.
 * ATURAN KEAMANAN MUTLAK:
 * - HANYA boleh dipanggil di lingkungan server (Route Handlers, Server Actions, Background Workers).
 * - DILARANG KERAS diimpor atau dieksekusi di komponen peramban/klien.
 * - Memiliki kemampuan bypass RLS (Row Level Security).
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'PELANGGARAN KEAMANAN: getSupabaseAdminClient (service role) dilarang keras dipanggil di sisi peramban/klien!'
    );
  }

  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Konfigurasi Gagal: NEXT_PUBLIC_SUPABASE_URL belum diatur.');
  }

  if (!serviceRoleKey) {
    throw new Error('Konfigurasi Gagal: SUPABASE_SERVICE_ROLE_KEY belum diatur di variabel lingkungan server.');
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
