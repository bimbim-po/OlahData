'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogoIcon } from '@/components/logo';
import { APP_NAME } from '@/lib/constants';

export default function LupaSandiPage() {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Harap masukkan alamat email kampus atau pribadi yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?next=/reset-sandi`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirimkan tautan pemulihan kata sandi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <LogoIcon size={36} />
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Pemulihan Kata Sandi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Masukkan email akun terdaftar Anda untuk menerima tautan pembuatan kata sandi baru.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 shadow-xs">
          {isSuccess ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-foreground text-base">
                  Tautan Pemulihan Terkirim
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kami telah mengirimkan petunjuk pemulihan kata sandi ke <strong className="text-foreground">{email}</strong>. Silakan periksa folder kotak masuk atau spam Anda.
                </p>
              </div>
              <Button asChild className="w-full font-semibold min-h-[44px]">
                <Link href="/masuk">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-xs leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Alamat Email Akun
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="nama@kampus.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 min-h-[44px]"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full font-semibold min-h-[44px] gap-2 shadow-xs"
              >
                {isLoading ? (
                  <span>Mengirim Tautan...</span>
                ) : (
                  <>
                    <span>Kirim Tautan Pemulihan</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/masuk"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Ingat kata sandi? Masuk sekarang</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          Data akun Anda dilindungi enkripsi standar industri • Tanpa manipulasi data riset
        </div>
      </div>
    </div>
  );
}
