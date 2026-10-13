import * as React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Logo } from '@/components/logo';

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center group">
              <Logo size="md" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
              {COPY.footer.tagline}
            </p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-md border-l-2 border-border pl-3">
              Dirancang untuk transparansi akademik dan integritas ilmiah dalam penelitian skripsi kuantitatif mahasiswa tingkat akhir.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {COPY.footer.links.product}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {COPY.nav.beranda}
                </Link>
              </li>
              <li>
                <Link
                  href="/harga"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {COPY.nav.harga}
                </Link>
              </li>
              <li>
                <Link
                  href="/pernyataan-penggunaan"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Panduan Penggunaan Alat
                </Link>
              </li>
              <li>
                <Link
                  href="/daftar"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Coba Gratis
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {COPY.footer.links.legal}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privasi"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/syarat"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  href="/pernyataan-penggunaan"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Transparansi & Etika
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic disclaimer */}
          <div className="md:col-span-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Integritas Ilmiah
            </h4>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Semua kalkulasi dilakukan oleh mesin statistik deterministik. Hasil disajikan secara objektif sesuai kaidah ilmiah untuk membantu proses verifikasi mandiri.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} {APP_NAME}. Hak cipta dilindungi.
          </p>
          <p className="text-center sm:text-right">
            Dibuat untuk mempermudah riset kuantitatif di perguruan tinggi Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
