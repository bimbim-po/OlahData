import Link from 'next/link';
import { Home, HelpCircle, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageActions } from '@/components/page-actions';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: `Halaman Tidak Ditemukan | ${APP_NAME}`,
  description: 'Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan di platform OlahData.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground font-sans">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full focus:outline-none my-12"
      >
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6 text-muted-foreground text-3xl font-serif font-bold border border-border">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2 text-foreground">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
          Mohon maaf, alamat halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau tautan yang Anda masukkan salah.
        </p>

        {/* 3 Navigasi Utama yang Diminta */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-8">
          <Button asChild variant="default" className="gap-2 font-semibold min-h-[44px]">
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
