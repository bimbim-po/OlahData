'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { register as apiRegister } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';
import { PageActions } from '@/components/page-actions';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Nama lengkap minimal 2 karakter' }),
  email: z
    .string()
    .min(1, { message: 'Alamat email wajib diisi' })
    .email({ message: 'Format alamat email belum tepat (contoh: nama@kampus.ac.id)' }),
  university: z
    .string()
    .min(2, { message: 'Nama perguruan tinggi / universitas wajib diisi' }),
  password: z
    .string()
    .min(8, { message: 'Kata sandi minimal 8 karakter demi keamanan akun Anda' }),
  agreeTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Anda wajib menyetujui Syarat & Ketentuan serta Kebijakan Privasi',
    }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function DaftarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lanjut = searchParams.get('lanjut') || '/app';
  const { toast } = useToast();
  const authLogin = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      email: '',
      university: '',
      password: '',
      agreeTerms: false,
    },
  });

  const agreeTerms = watch('agreeTerms');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const user = await apiRegister(data.name, data.email, data.password, data.university);
      authLogin(user);
      toast({
        title: 'Akun berhasil dibuat',
        description: `Selamat datang di ${APP_NAME}, ${user.name}!`,
        variant: 'success',
      });
      // Navigasi penuh agar sesi tersinkronisasi bersih tanpa race condition di halaman statis
      window.location.href = lanjut;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mendaftarkan akun. Silakan coba lagi.';
      toast({
        title: 'Pendaftaran gagal',
        description: msg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const masukHref = lanjut !== '/app' ? `/masuk?lanjut=${encodeURIComponent(lanjut)}` : '/masuk';

  return (
    <div className="w-full space-y-6">
      <Card className="border-border bg-card shadow-sm rounded-2xl">
        <CardHeader className="space-y-1.5 p-6 sm:p-8 pb-4 text-center">
          <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Buat Akun {APP_NAME}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Mulai analisis data kuesioner skripsi Anda secara gratis
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-2">
          {/* Form Fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                {COPY.auth.name}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Fulan bin Fulan"
                autoComplete="name"
                disabled={isLoading}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                {...register('name')}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="text-xs text-destructive font-medium mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              <Label htmlFor="university" className="text-xs font-semibold text-foreground">
                {COPY.auth.university}
              </Label>
              <Input
                id="university"
                type="text"
                placeholder="Universitas Indonesia, dsb."
                disabled={isLoading}
                aria-invalid={errors.university ? 'true' : 'false'}
                aria-describedby={errors.university ? 'university-error' : undefined}
                {...register('university')}
                className={errors.university ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {errors.university && (
                <p id="university-error" role="alert" className="text-xs text-destructive font-medium mt-1">
                  {errors.university.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                {COPY.auth.password}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
              <p id="password-hint" className="text-[11px] text-muted-foreground mt-1">
                Gunakan minimal 8 karakter (disarankan memadukan huruf dan angka demi keamanan).
              </p>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox Persetujuan Syarat & Privasi */}
            <div className="pt-2">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="agreeTerms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) =>
                    setValue('agreeTerms', checked === true, { shouldValidate: true })
                  }
                  className="mt-0.5"
                  disabled={isLoading}
                  aria-invalid={errors.agreeTerms ? 'true' : 'false'}
                  aria-describedby={errors.agreeTerms ? 'agreeTerms-error' : undefined}
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  Saya telah membaca dan menyetujui{' '}
                  <Link
                    href="/syarat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium hover:opacity-85"
                  >
                    Syarat & Ketentuan
                  </Link>{' '}
                  serta{' '}
                  <Link
                    href="/privasi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium hover:opacity-85"
                  >
                    Kebijakan Privasi
                  </Link>{' '}
                  {APP_NAME}.
                </label>
              </div>
              {errors.agreeTerms && (
                <p id="agreeTerms-error" role="alert" className="text-xs text-destructive font-medium mt-1.5">
                  {errors.agreeTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold h-11 min-h-[44px] mt-3 cursor-pointer shadow-xs"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Membuat akun..."
            >
              <span>{COPY.auth.daftar}</span>
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="p-6 sm:p-8 pt-0 flex justify-center text-xs text-muted-foreground border-t border-border/50 mt-2">
          <p>
            {COPY.auth.hasAccount}{' '}
            <Link
              href={masukHref}
              className="font-semibold text-primary underline underline-offset-4 hover:opacity-85"
            >
              {COPY.auth.masuk}
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref="/harga"
        prevLabel="Kembali ke Harga"
        nextHref="/masuk"
        nextLabel="Sudah Punya Akun? Masuk"
      />
    </div>
  );
}

export default function DaftarPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border-border bg-card shadow-sm rounded-2xl p-8 text-center">
          <div className="h-6 w-32 bg-muted rounded mx-auto animate-pulse mb-4" />
          <div className="h-10 w-full bg-muted/60 rounded animate-pulse" />
        </Card>
      }
    >
      <DaftarForm />
    </React.Suspense>
  );
}
