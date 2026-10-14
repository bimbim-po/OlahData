import * as React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Logo } from '@/components/logo';

export function SiteFooter() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="flex items-center group"
              aria-label={`${APP_NAME} - Beranda`}
            >
              <Logo size="md" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
              {COPY.footer.tagline}
            </p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-md border-l-2 border-border pl-3">
              Dirancang untuk transparansi akademik dan integritas ilmiah dalam penelitian skripsi kuantitatif mahasiswa tingkat akhir.
            </p>
          </div>

          {/* Kolom 1: Produk */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Produk
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/harga"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  href="/daftar"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Coba Gratis
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Bantuan */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Bantuan &amp; Etika
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/panduan"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Panduan Penggunaan
                </Link>
              </li>
              <li>
                <Link
                  href="/pernyataan-penggunaan"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Pernyataan Penggunaan Alat
                </Link>
              </li>
              <li>
                <a
                  href="mailto:institusi@olahdata.id"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Hubungi Tim Kampus
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/privasi"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/syarat"
                  className="text-muted-foreground transition-colors hover:text-foreground inline-flex py-0.5"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Integritas Ilmiah */}
        <div className="mt-8 pt-6 border-t border-border/60">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <strong className="text-foreground font-semibold">Prinsip Komputasi & AI:</strong> Seluruh angka statistik dihitung oleh mesin kalkulasi deterministik baku (bukan AI). Kecerdasan buatan hanya digunakan untuk membantu menyusun draf narasi interpretasi akademik dari angka yang telah terhitung.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
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

export { SiteFooter as Footer };
