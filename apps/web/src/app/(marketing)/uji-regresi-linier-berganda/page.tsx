import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  FileText,
  BookOpen,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Uji Regresi Linier Berganda Online, Uji t, Uji F, & Draf Bab 4 | OlahData',
  description:
    'Aplikasi analisis regresi linier berganda online untuk skripsi kuantitatif tanpa SPSS. Lengkap dengan Uji t (pengaruh parsial), Uji F (ANOVA simultan), R Square, dan draf naskah Bab 4 Word standar APA 7th.',
  keywords: [
    'uji regresi linier berganda online',
    'uji t parsial skripsi',
    'uji f simultan anova',
    'koefisien determinasi r square',
    'persamaan regresi kuantitatif',
    'interpretasi regresi bab 4 skripsi',
    'analisis regresi linier berganda spss online',
    'uji hipotesis skripsi online',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev/uji-regresi-linier-berganda',
  },
  openGraph: {
    title: 'Uji Regresi Linier Berganda Online, Uji t, Uji F, & Draf Bab 4 | OlahData',
    description:
      'Aplikasi analisis regresi linier berganda online untuk skripsi. Uji t parsial, Uji F simultan, R Square, dan draf naskah Bab 4 Word.',
    url: 'https://olah-data.pages.dev/uji-regresi-linier-berganda',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: 'https://olah-data.pages.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Uji Regresi Linier Berganda Online - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uji Regresi Linier Berganda Online & Bab 4 Otomatis | OlahData',
    description:
      'Hitung regresi linier berganda, uji t, uji F, R Square, dan draf Bab 4 Word otomatis.',
    images: ['https://olah-data.pages.dev/og-image.png'],
  },
};

export default function UjiRegresiLinierBergandaPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Beranda',
            item: 'https://olah-data.pages.dev/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Uji Regresi Linier Berganda',
            item: 'https://olah-data.pages.dev/uji-regresi-linier-berganda',
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'Cara Menjalankan Analisis Regresi Linier Berganda dan Pembuktian Hipotesis Skripsi',
        description:
          'Langkah-langkah menganalisis pengaruh variabel independen terhadap variabel dependen melalui Uji t, Uji F, dan Koefisien Determinasi.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Penyusunan Persamaan Model Regresi OLS',
            text: 'Mendapatkan nilai konstanta (a) dan koefisien regresi (b1, b2, ...) untuk menyusun persamaan Y = a + b1X1 + b2X2 + e.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Uji Parsial (Uji t)',
            text: 'Membandingkan nilai t-hitung dengan t-tabel beserta nilai p-value signifikansi (p < 0.05) untuk membuktikan apakah hipotesis diterima atau ditolak.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Uji Simultan (Uji F ANOVA)',
            text: 'Membandingkan F-hitung dengan F-tabel untuk membuktikan apakah seluruh variabel independen secara bersama-sama berpengaruh signifikan terhadap variabel dependen.',
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative pt-10 pb-16 md:pt-14 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Beranda
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 dark:text-slate-200 font-medium">Uji Regresi Linier Berganda</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold rounded-lg w-fit mb-4">
            <BarChart3 className="h-4 w-4" />
            <span>Fase 3 Pembuktian Hipotesis Penelitian Skripsi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
            Uji Regresi Linier Berganda Online &amp; Draf Naskah Bab 4 Word
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Selesaikan analisis regresi linier berganda skripsi Anda dalam hitungan detik. OlahData menghitung persamaan regresi OLS, koefisien determinasi ($R^2$ &amp; Adjusted $R^2$), Uji t parsial (arah hubungan &amp; signifikansi), serta Uji F ANOVA simultan lengkap dengan narasi akademik Bab 4 yang siap disalin ke Microsoft Word.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl shadow-sm justify-center">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/app/proyek/baru">
                Analisis Kuesioner Anda (.xlsx)
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 Komponen Output Regresi */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Komponen Inti
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Output Pengujian Hipotesis yang Anda Dapatkan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              1. Persamaan Regresi OLS
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Menampilkan nilai konstanta ($\alpha$), koefisien unstandardized ($B$), standard error, dan standardized beta ($\beta$) untuk menyusun model matematis: $Y = \alpha + \beta_1 X_1 + \beta_2 X_2 + e$.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Format: APA 7th Edition tanpa garis vertikal
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              2. Uji Parsial (Uji t) &amp; Pembuktian Hipotesis
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Otomatis membandingkan $t$-hitung dengan $t$-tabel pada $df = N - k - 1$ serta menyimpulkan status penerimaan hipotesis ($H_1, H_2, ...$) jika $p$-value &lt; 0,05.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Kaidah: t_hitung &gt; t_tabel &amp; Sig &lt; 0.05 -&gt; Hipotesis Diterima
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              3. Uji Simultan (Uji F ANOVA)
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Tabel ANOVA yang membandingkan $F$-hitung dengan $F$-tabel guna membuktikan apakah variabel independen secara serempak berpengaruh terhadap variabel terikat.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Kaidah: F_hitung &gt; F_tabel &amp; Sig &lt; 0.05 -&gt; Pengaruh Serempak
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              4. Koefisien Determinasi ($R^2$)
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Mengukur persentase kontribusi sumbangan variabel bebas terhadap variasi variabel terikat melalui nilai $R$, $R$ Square, dan Adjusted $R$ Square.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Nilai: Draf narasi langsung menyebutkan persentase kontribusi (misal 68.4%)
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Buktikan Hipotesis Skripsi Anda Sekarang
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Tak perlu repot menyusun tabel Word dari awal. OlahData mengekspor seluruh bab analisis dalam format dokumen Microsoft Word (.docx) siap pakai.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold text-sm rounded-xl justify-center shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/alternatif-jamovi">
                Bandingkan dengan Jamovi &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
