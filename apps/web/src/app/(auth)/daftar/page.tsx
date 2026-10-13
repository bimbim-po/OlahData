'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
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
      router.push(lanjut);
    } catch {
      toast({
        title: 'Pendaftaran gagal',
        description: 'Terjadi kendala saat mendaftarkan akun. Silakan coba lagi.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    toast({
      title: COPY.auth.googleToast,
      description: 'Silakan isi formulir pendaftaran akun berikut.',
      variant: 'default',
    });
  };

  const masukHref = lanjut !== '/app' ? `/masuk?lanjut=${encodeURIComponent(lanjut)}` : '/masuk';

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl">
      <CardHeader className="space-y-1.5 p-6 sm:p-8 pb-4 text-center">
        <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Buat Akun {APP_NAME}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Mulai analisis data kuesioner skripsi Anda secara gratis
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 pt-2 space-y-4">
        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2.5 font-medium py-2.5 h-11 border-border"
          onClick={handleGoogleRegister}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{COPY.auth.googleButton}</span>
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              atau daftar dengan email
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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
              {...register('name')}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium mt-1">
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
              {...register('email')}
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium mt-1">
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
              {...register('university')}
              className={errors.university ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.university && (
              <p className="text-xs text-destructive font-medium mt-1">
                {errors.university.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              {COPY.auth.password}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('password')}
              className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Gunakan minimal 8 karakter (disarankan memadukan huruf dan angka demi keamanan).
            </p>
            {errors.password && (
              <p className="text-xs text-destructive font-medium mt-1">
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
              />
              <label
                htmlFor="agreeTerms"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
              >
                Saya telah membaca dan menyetujui{' '}
                <Link
                  href="/syarat"
                  target="_blank"
                  className="text-primary underline font-medium hover:opacity-85"
                >
                  Syarat & Ketentuan
                </Link>{' '}
                serta{' '}
                <Link
                  href="/privasi"
                  target="_blank"
                  className="text-primary underline font-medium hover:opacity-85"
                >
                  Kebijakan Privasi
                </Link>{' '}
                {APP_NAME}.
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-destructive font-medium mt-1.5">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full font-semibold h-10 mt-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Membuat akun...</span>
              </>
            ) : (
              <>
                <span>{COPY.auth.daftar}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
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
