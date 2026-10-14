'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, FolderKanban, HelpCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageActions } from '@/components/page-actions';

export default function AccessDeniedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full font-sans my-12">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6 border border-destructive/20 shadow-xs">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-3 text-foreground">
        Akses Proyek Dibatasi
      </h1>

      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Anda tidak memiliki izin untuk mengakses tautan ini atau proyek yang Anda tuju tidak tersedia. Untuk menjaga integritas dan kerahasiaan penelitian akademik, data kuesioner hanya dapat diakses oleh pemilik akun yang sah.
      </p>

      {/* Navigasi Utama */}
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
            <span>Pusat Bantuan</span>
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
