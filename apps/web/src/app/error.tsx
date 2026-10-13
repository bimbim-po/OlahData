'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageActions } from '@/components/page-actions';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to console in dev
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full focus:outline-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
          Terjadi Kendala pada Halaman
        </h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
          Mohon maaf, sistem mengalami gangguan teknis sementara. Data dan progres skripsi Anda tetap tersimpan dengan aman.
        </p>

        <div className="mb-6">
          <Button
            type="button"
            onClick={() => reset()}
            variant="default"
            className="gap-2 cursor-pointer font-semibold min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba muat ulang</span>
          </Button>
        </div>

        <div className="w-full">
          <PageActions
            prevHref="/"
            prevLabel="Kembali ke Beranda"
            nextHref="/harga"
            nextLabel="Lihat Pilihan Harga"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
