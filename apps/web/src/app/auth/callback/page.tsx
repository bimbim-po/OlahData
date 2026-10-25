'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = React.useState('Memverifikasi autentikasi...');

  React.useEffect(() => {
    const handleAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/app';
      const error = searchParams.get('error_description') || searchParams.get('error');

      if (error) {
        console.error('[Auth Callback] Error:', error);
        router.push(`/masuk?error=${encodeURIComponent(error)}`);
        return;
      }

      // 1. Cek token di hash URL (#access_token=...&refresh_token=...&type=recovery)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          setStatusMessage('Menghubungkan sesi autentikasi...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!sessionError) {
            if (type === 'recovery') {
              router.push('/reset-sandi');
              return;
            }
            router.push(next.startsWith('/') ? next : '/app');
            return;
          }
        }
      }

      // 2. Cek kode PKCE di query parameter (?code=...)
      if (code) {
        try {
          setStatusMessage('Menukarkan kode sesi...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[Auth Callback] Code exchange error:', exchangeError.message);
            router.push(`/masuk?error=${encodeURIComponent('Sesi autentikasi telah kedaluwarsa. Silakan masuk kembali.')}`);
            return;
          }

          if (next.includes('reset-sandi')) {
            router.push('/reset-sandi');
            return;
          }

          router.push(next.startsWith('/') ? next : '/app');
          return;
        } catch (err) {
          console.error('[Auth Callback] Exchange exception:', err);
        }
      }

      // 3. Fallback jika sesi sudah aktif
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (next.includes('reset-sandi')) {
          router.push('/reset-sandi');
          return;
        }
        router.push(next.startsWith('/') ? next : '/app');
        return;
      }

      // Jika tidak ada parameter apa pun, arahkan ke login
      router.push('/masuk');
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <h2 className="text-sm font-semibold text-foreground">{statusMessage}</h2>
      <p className="text-xs text-muted-foreground mt-1">Mengalihkan ke halaman tujuan...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <h2 className="text-sm font-semibold text-foreground">Memuat autentikasi...</h2>
        </div>
      }
    >
      <CallbackContent />
    </React.Suspense>
  );
}
