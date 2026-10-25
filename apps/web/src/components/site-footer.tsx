import * as React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Logo } from '@/components/logo';

export function SiteFooter() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:gap-16 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="flex items-center group"
              aria-label={`${APP_NAME} - Beranda`}
            >
              <Logo size="md" />
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              {COPY.footer.tagline}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md border-l-2 border-primary/40 pl-3">
              Dirancang untuk transparansi akademik dan integritas ilmiah dalam penelitian skripsi kuantitatif mahasiswa tingkat akhir.
            </p>
          </div>

          {/* Kolom 1: Produk */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Produk
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/harga"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  href="/daftar"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Coba Gratis
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 2: Bantuan */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Bantuan dan Etika
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/panduan"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Panduan Penggunaan
                </Link>
              </li>
              <li>
                <Link
                  href="/pernyataan-penggunaan"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Pernyataan Penggunaan Alat
                </Link>
              </li>
              <li>
                <a
                  href="mailto:institusi@olahdata.id"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Hubungi Tim Kampus
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Legal
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/privasi"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/syarat"
                  className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-slate-100 inline-flex py-0.5"
                >
                  Syarat dan Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Kotak Disclaimer Prinsip Komputasi & AI dalam Callout Box yang Rapi */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/70 my-8 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <p>
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">Prinsip Komputasi dan AI:</strong> Seluruh angka statistik dihitung oleh mesin kalkulasi deterministik baku (bukan AI). Kecerdasan buatan hanya digunakan untuk membantu menyusun draf narasi interpretasi akademik dari angka yang telah terhitung.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
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
