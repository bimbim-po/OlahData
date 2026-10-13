import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full focus:outline-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 text-muted-foreground text-2xl font-serif font-bold">
          404
        </div>
        <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
          Halaman yang Anda tuju tidak tersedia, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
        </p>

        <div className="w-full">
          <PageActions
            prevHref="/"
            prevLabel="Kembali ke Beranda"
            nextHref="/harga"
            nextLabel="Lihat Harga"
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
