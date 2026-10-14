'use client';

import Link from 'next/link';
import { Home, HelpCircle, FolderKanban, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageActions } from '@/components/page-actions';

export default function AppNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full font-sans my-8">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6 text-muted-foreground text-3xl font-serif font-bold border border-border">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 text-foreground">
        Halaman Aplikasi Tidak Ditemukan
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Halaman di dalam ruang kerja OlahData yang Anda tuju tidak tersedia atau tautan proyek yang dibuka tidak ditemukan.
      </p>

      {/* 3 Navigasi Utama */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-8">
        <Button asChild variant="default" className="gap-2 font-semibold min-h-[44px]">
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

        <Button asChild variant="outline" className="gap-2 font-semibold min-h-[44px]">
          <Link href="/">
            <Home className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>
      </div>

      <div className="w-full pt-6 border-t border-border">
        <PageActions
          prevHref="/app"
          prevLabel="Kembali ke Meja Kerja"
          nextHref="/app/bantuan"
          nextLabel="Buka Pusat Bantuan"
        />
      </div>
    </div>
  );
}
