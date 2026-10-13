import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from './admin';

export { getSupabaseAdminClient };

/**
 * Membuat Klien Supabase Server berbasis cookie (@supabase/ssr).
 * Digunakan di Server Components, Server Actions, dan Route Handlers.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Abaikan jika dipanggil dari Server Component murni
        }
      },
    },
  });
}

let syncServerClient: SupabaseClient | null = null;

/**
 * Klien Supabase Server standar (fallback non-cookie / tokenless).
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (syncServerClient) return syncServerClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon';

  syncServerClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  return syncServerClient;
}
