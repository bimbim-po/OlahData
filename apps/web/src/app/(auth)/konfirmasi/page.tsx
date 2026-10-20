'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/logo';
import { APP_NAME } from '@/lib/constants';

export default function KonfirmasiEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <LogoIcon size={36} />
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 shadow-xs space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Email Berhasil Terverifikasi
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Akun mahasiswa Anda kini telah aktif sepenuhnya. Anda dapat langsung mengunggah kuesioner atau mencoba olah data dengan data contoh.
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <Button asChild className="w-full font-semibold min-h-[44px]">
              <Link href="/app">
                <span>Masuk ke Meja Kerja</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full font-medium min-h-[44px]">
              <Link href="/app/proyek/baru?contoh=1">
                <span>Coba dengan Data Contoh (60 Detik)</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          {APP_NAME} menjunjung integritas ilmiah • Angka deterministik cocok SPSS 100%
        </div>
      </div>
    </div>
  );
}
