import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Klien Supabase untuk peramban (browser/klien).
 * Menggunakan kredensial publik anon key dan aman dijalankan di sisi klien.
 * Mengelola cookie autentikasi secara otomatis untuk persistensi sesi.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      '[Supabase Client Error] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi di .env.local'
    );
  }

  browserClient = createBrowserClient(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder-anon-key'
  );

  return browserClient;
}

export const supabase = {
  get client(): SupabaseClient {
    return getSupabaseBrowserClient();
  },
};
