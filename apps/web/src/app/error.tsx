'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
        Terjadi Kendala pada Halaman
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Mohon maaf, sistem mengalami gangguan teknis sementara. Data dan progres skripsi Anda tetap tersimpan dengan aman.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Coba lagi</span>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke beranda</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/harga">
            <Tag className="w-4 h-4" />
            <span>Lihat harga</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
