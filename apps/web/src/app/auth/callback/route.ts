import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/app';
  const error = searchParams.get('error_description') || searchParams.get('error');

  if (error) {
    console.error('[Auth Callback] Error received:', error);
    return NextResponse.redirect(`${origin}/masuk?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange failed:', exchangeError.message);
        return NextResponse.redirect(`${origin}/masuk?error=${encodeURIComponent('Sesi autentikasi telah kedaluwarsa. Silakan masuk kembali.')}`);
      }
    } catch (err) {
      console.error('[Auth Callback] Unexpected error during code exchange:', err);
    }
  }

  // Redirect to target destination after successful authentication
  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/app'}`);
}
