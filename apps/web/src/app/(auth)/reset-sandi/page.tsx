'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  Link2,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogoIcon } from '@/components/logo';
import { APP_NAME } from '@/lib/constants';

function ResetSandiContent() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sesi & status verifikasi token
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [hasActiveSession, setHasActiveSession] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  // Helper untuk menempelkan URL/link jika diarahkan ke localhost
  const [pastedUrl, setPastedUrl] = React.useState('');
  const [isVerifyingPasted, setIsVerifyingPasted] = React.useState(false);
  const [pasteError, setPasteError] = React.useState<string | null>(null);

  // 1. Inisialisasi & Deteksi Sesi Pemulihan Otomatis
  React.useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    const processAuth = async () => {
      try {
        // (a) Cek Hash URL (#access_token=...&refresh_token=...&type=recovery)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data?.session && isMounted) {
              setHasActiveSession(true);
              setUserEmail(data.session.user.email || null);
              setIsCheckingSession(false);
              return;
            }
          }
        }

        // (b) Cek Query Parameters (?code=...) untuk flow PKCE
        if (typeof window !== 'undefined' && window.location.search) {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          const errorDesc = searchParams.get('error_description') || searchParams.get('error');

          if (errorDesc && isMounted) {
            setErrorMessage(`Galat pemulihan: ${errorDesc}`);
          }

          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session && isMounted) {
              setHasActiveSession(true);
              setUserEmail(data.session.user.email || null);
              setIsCheckingSession(false);
              return;
            }
          }
        }

        // (c) Cek apakah sudah ada sesi aktif dari Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session && isMounted) {
          setHasActiveSession(true);
          setUserEmail(sessionData.session.user.email || null);
        }
      } catch (err) {
        console.error('[ResetSandi] Init error:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    processAuth();

    // (d) Berlangganan perubahan status autentikasi
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setHasActiveSession(true);
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fungsi untuk memproses URL yang ditempel oleh pengguna
  const handleVerifyPastedUrl = async () => {
    setPasteError(null);
    const raw = pastedUrl.trim();
    if (!raw) {
      setPasteError('Silakan tempel URL dari email atau peramban Anda.');
      return;
    }

    setIsVerifyingPasted(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // Coba ekstrak access_token dan refresh_token dari URL
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      if (raw.includes('#')) {
        const hashPart = raw.split('#')[1];
        const params = new URLSearchParams(hashPart);
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      if (!accessToken && raw.includes('access_token=')) {
        const matchAcc = raw.match(/access_token=([^&]+)/);
        const matchRef = raw.match(/refresh_token=([^&]+)/);
        if (matchAcc) accessToken = matchAcc[1];
        if (matchRef) refreshToken = matchRef ? matchRef[1] : '';
      }

      if (accessToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) throw error;
        if (data?.session) {
          setHasActiveSession(true);
          setUserEmail(data.session.user.email || null);
          return;
        }
      }

      // Coba ekstrak code PKCE
      let code: string | null = null;
      if (raw.includes('code=')) {
        const matchCode = raw.match(/code=([^&]+)/);
        if (matchCode) code = matchCode[1];
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (data?.session) {
          setHasActiveSession(true);
          setUserEmail(data.session.user.email || null);
          return;
        }
      }

      throw new Error(
        'Tautan tidak memuat token sesi yang valid. Pastikan Anda menyalin seluruh alamat URL dari bilah peramban setelah mengeklik email.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memverifikasi tautan yang ditempel.';
      setPasteError(msg);
    } finally {
      setIsVerifyingPasted(false);
    }
  };

  // 3. Simpan Kata Sandi Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Kata sandi baru minimal harus terdiri dari 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/app');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <LogoIcon size={36} />
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Buat Kata Sandi Baru
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {userEmail ? (
              <span>Mengatur ulang kata sandi untuk akun <strong className="text-foreground">{userEmail}</strong></span>
            ) : (
              'Masukkan kata sandi baru untuk mengamankan akun OlahData Anda.'
            )}
          </p>
        </div>

        <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 shadow-xs">
          {/* Status 1: Memeriksa Sesi */}
          {isCheckingSession ? (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                Memverifikasi tautan pemulihan akun...
              </p>
            </div>
          ) : isSuccess ? (
            /* Status 2: Berhasil Diperbarui */
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-base">
                  Kata Sandi Berhasil Diperbarui
                </h3>
                <p className="text-xs text-muted-foreground">
                  Akun Anda telah diamankan. Mengalihkan Anda langsung ke meja kerja...
                </p>
              </div>
              <Button asChild className="w-full font-semibold min-h-[44px]">
                <Link href="/app">
                  <span>Masuk ke Meja Kerja Sekarang</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : hasActiveSession ? (
            /* Status 3: Sesi Aktif Terverifikasi -> Tampilkan Formulir Kata Sandi Baru */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Kata Sandi Baru (Minimal 8 karakter)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="Minimal 8 karakter kuat"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 min-h-[44px]"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Ulangi Kata Sandi Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Ketik ulang kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 min-h-[44px]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold min-h-[44px] gap-2 shadow-xs"
              >
                {isLoading ? (
                  <span>Menyimpan Kata Sandi...</span>
                ) : (
                  <>
                    <span>Simpan Kata Sandi Baru</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Status 4: Belum Ada Sesi -> Bantuan Tempel Tautan / Hubungkan Ulang */
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  Tautan Pemulihan Belum Terhubung
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Jika saat membuka email tautan mengarahkan Anda ke <code>http://localhost:3000</code> dan halaman tidak terbuka, Anda cukup menyalin seluruh teks alamat dari peramban tersebut lalu tempel di bawah ini.
                </p>
              </div>

              {pasteError && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs leading-relaxed">
                  {pasteError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pastedUrl" className="text-xs font-semibold flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  Tempel URL dari Bilah Peramban / Email:
                </Label>
                <textarea
                  id="pastedUrl"
                  rows={3}
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="Contoh: http://localhost:3000/#access_token=eyJhbGci... atau tautan dari email"
                  className="w-full text-xs p-2.5 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="button"
                onClick={handleVerifyPastedUrl}
                disabled={isVerifyingPasted || !pastedUrl.trim()}
                className="w-full font-semibold min-h-[44px] gap-2 shadow-xs cursor-pointer"
              >
                {isVerifyingPasted ? (
                  <span>Memverifikasi Tautan...</span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Verifikasi Tautan & Buka Formulir</span>
                  </>
                )}
              </Button>

              <div className="pt-2 border-t border-border/60 text-center space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Belum meminta tautan pemulihan baru?
                </p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs min-h-[38px]">
                  <Link href="/lupa-sandi">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    <span>Kirim Ulang Email Pemulihan</span>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/masuk"
            className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetSandiPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <h2 className="text-sm font-semibold text-foreground">Memuat halaman...</h2>
        </div>
      }
    >
      <ResetSandiContent />
    </React.Suspense>
  );
}
