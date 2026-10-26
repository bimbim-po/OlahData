'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { COPY } from '@/lib/copy';
import { login } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { PageActions } from '@/components/page-actions';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Alamat email wajib diisi' })
    .email({ message: 'Format alamat email tidak valid' }),
  password: z
    .string()
    .min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

function MasukForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lanjut = searchParams.get('lanjut') || '/app';
  const { toast } = useToast();
  const authLogin = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      setIsLoading(true);
      const user = await login(data.email, data.password);
      authLogin(user);
      toast({
        title: 'Berhasil masuk',
        description: `Selamat datang kembali, ${user.name}!`,
        variant: 'success',
      });
      // Navigasi penuh agar sesi tersinkronisasi bersih tanpa race condition di halaman statis
      window.location.href = lanjut;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat memproses login. Silakan periksa kredensial Anda.';
      setAuthError(msg);
      toast({
        title: 'Gagal masuk',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const daftarHref = lanjut !== '/app' ? `/daftar?lanjut=${encodeURIComponent(lanjut)}` : '/daftar';

  return (
    <div className="w-full space-y-6">
      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader className="space-y-1.5 p-6 sm:p-8 pb-4 text-center">
          <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {COPY.auth.masuk}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Lanjutkan pengolahan data kuesioner skripsi Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-2">
          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {authError && (
              <div
                role="alert"
                className="p-3.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl font-medium leading-relaxed"
              >
                {authError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                {COPY.auth.email}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@kampus.ac.id"
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {COPY.auth.password}
                </Label>
                <Link
                  href="/lupa-sandi"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {COPY.auth.forgotPassword}
                </Link>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  className={errors.password ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold h-11 min-h-[44px] mt-2 cursor-pointer shadow-xs"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Memproses..."
            >
              <span>{COPY.auth.masuk}</span>
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-6 sm:p-8 pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 mt-2">
          <p>
            {COPY.auth.noAccount}{' '}
            <Link
              href={daftarHref}
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-85"
            >
              {COPY.auth.daftar}
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Shortcut Callout Coba Langsung dengan Data Contoh (Tanpa Login) */}
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground">
            Belum punya akun atau ingin langsung mencoba?
          </p>
          <p className="text-xs text-muted-foreground">
            Jalankan uji validitas, reliabilitas, dan regresi langsung dengan data kuesioner contoh tanpa perlu login.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="whitespace-nowrap shrink-0 text-xs font-semibold border-primary/30 hover:bg-primary/10">
          <Link href="/app/proyek/baru?contoh=1">
            <span>Coba Data Contoh &rarr;</span>
          </Link>
        </Button>
      </div>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/"
        prevLabel="Kembali ke Beranda"
        nextHref="/daftar"
        nextLabel="Belum Punya Akun? Daftar Gratis"
      />
    </div>
  );
}

export default function MasukPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border-border bg-card shadow-sm rounded-2xl p-8 text-center">
          <div className="h-6 w-32 bg-muted rounded mx-auto animate-pulse mb-4" />
          <div className="h-10 w-full bg-muted/60 rounded animate-pulse" />
        </Card>
      }
    >
      <MasukForm />
    </React.Suspense>
  );
}
