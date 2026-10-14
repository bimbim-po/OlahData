'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home, HelpCircle, FolderKanban } from 'lucide-react';
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
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground font-sans">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full focus:outline-none my-12"
      >
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6 border border-destructive/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 text-foreground">
          Terjadi Kendala pada Halaman
        </h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
          Mohon maaf, sistem mengalami gangguan teknis sementara. Data dan progres skripsi Anda tetap aman tersimpan.
        </p>

        {/* 3 Navigasi Utama + Tombol Muat Ulang */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-8">
          <Button
            type="button"
            onClick={() => reset()}
            variant="default"
            className="gap-2 cursor-pointer font-semibold min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </Button>

          <Button asChild variant="outline" className="gap-2 font-semibold min-h-[44px]">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2 font-semibold min-h-[44px]">
            <Link href="/app">
              <FolderKanban className="h-4 w-4" />
              <span>Proyek Saya</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2 font-semibold min-h-[44px]">
            <Link href="/app/bantuan">
              <HelpCircle className="h-4 w-4" />
              <span>Buka Bantuan</span>
            </Link>
          </Button>
        </div>

        <div className="w-full pt-6 border-t border-border">
          <PageActions
            prevHref="/"
            prevLabel="Kembali ke Beranda"
            nextHref="/app/bantuan"
            nextLabel="Buka Pusat Bantuan"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
