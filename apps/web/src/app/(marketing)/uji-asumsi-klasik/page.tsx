import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Uji Asumsi Klasik Online: Normalitas, Multikolinearitas, Heteroskedastisitas | OlahData',
  description:
    'Aplikasi uji asumsi klasik regresi linier berganda online otomatis tanpa SPSS. Uji Normalitas (Kolmogorov-Smirnov), Multikolinearitas (VIF & Tolerance), dan Heteroskedastisitas (Uji Glejser) lengkap dengan draf Bab 4 Word.',
  keywords: [
    'uji asumsi klasik online',
    'uji normalitas kolmogorov smirnov online',
    'uji multikolinearitas vif tolerance',
    'uji heteroskedastisitas glejser online',
    'uji asumsi klasik regresi linier',
    'syarat uji regresi linier berganda',
    'cara uji asumsi klasik skripsi',
    'solusi data residual tidak normal',
    'uji glejser otomatis',
  ],
  alternates: {
    canonical: 'https://olahdata.vrimae.com/uji-asumsi-klasik',
  },
  openGraph: {
    title: 'Uji Asumsi Klasik Online: Normalitas, Multikolinearitas, Heteroskedastisitas | OlahData',
    description:
      'Aplikasi uji asumsi klasik regresi linier berganda online tanpa SPSS. Uji Normalitas, Multikolinearitas VIF, dan Heteroskedastisitas Glejser otomatis.',
    url: 'https://olahdata.vrimae.com/uji-asumsi-klasik',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: 'https://olahdata.vrimae.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Uji Asumsi Klasik Online - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uji Asumsi Klasik Online Otomatis | OlahData',
    description:
      'Uji asumsi klasik regresi linier berganda online tanpa SPSS. Normalitas, VIF, Glejser otomatis.',
    images: ['https://olahdata.vrimae.com/og-image.png'],
  },
};

export default function UjiAsumsiKlasikPage() {
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
            item: 'https://olahdata.vrimae.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Uji Asumsi Klasik',
            item: 'https://olahdata.vrimae.com/uji-asumsi-klasik',
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'Cara Uji Asumsi Klasik Regresi Linier Berganda Online',
        description:
          'Panduan memenuhi prasyarat ekonometrika model regresi OLS agar bersifat BLUE (Best Linear Unbiased Estimator).',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Pemeriksaan Normalitas Residual',
            text: 'Menguji apakah nilai residual dari model regresi berdistribusi normal menggunakan uji Kolmogorov-Smirnov atau Lilliefors (Sig > 0.05).',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Pemeriksaan Multikolinearitas',
            text: 'Memastikan tidak ada korelasi tinggi antar variabel bebas melalui nilai VIF < 10 dan Tolerance > 0.10.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Pemeriksaan Heteroskedastisitas',
            text: 'Memastikan varians residual bersifat konstan (homoskedastis) melalui Uji Glejser dengan nilai p-value seluruh variabel > 0.05.',
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
            <li className="text-slate-900 dark:text-slate-200 font-medium">Uji Asumsi Klasik</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold rounded-lg w-fit mb-4">
            <Layers className="h-4 w-4" />
            <span>Fase 2 Prasyarat Model Ekonometrika (BLUE)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
            Aplikasi Uji Asumsi Klasik Online Otomatis untuk Skripsi
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Sebelum menguji hipotesis regresi linier berganda, model penelitian Anda wajib memenuhi uji asumsi klasik agar tidak bias. OlahData memproses Uji Normalitas Residual (Kolmogorov-Smirnov), Uji Multikolinearitas (VIF &amp; Tolerance), dan Uji Heteroskedastisitas (Glejser) secara simultan dengan draf teks interpretasi ilmiah bahasa Indonesia.
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
                Unggah File Tabulasi Anda
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Rincian 3 Uji Inti */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            3 Uji Wajib
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Kriteria Lolos Uji Asumsi Klasik Skripsi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                1. Uji Normalitas Residual
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Menguji apakah data residual berdistribusi normal menggunakan uji One-Sample Kolmogorov-Smirnov atau Lilliefors.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Syarat: Asymp. Sig &gt; 0,05 (Residual Normal)
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                2. Uji Multikolinearitas
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Memastikan tidak ada hubungan linear sempurna antar sesama variabel bebas (independen) dalam persamaan regresi.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Syarat: VIF &lt; 10 &amp; Tolerance &gt; 0,10 (Bebas Multikol)
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                3. Uji Heteroskedastisitas (Glejser)
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Meregresikan nilai absolut residual (|e|) terhadap seluruh variabel independen untuk menguji kesamaan varians.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Syarat: Seluruh Sig &gt; 0,05 (Bebas Heteroskedastisitas)
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Periksa Kesiapan Asumsi Model Penelitian Anda
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Dapatkan laporan uji asumsi klasik lengkap dengan stempel verifikasi untuk lembar lampiran skripsi Anda.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold text-sm rounded-xl justify-center shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/uji-regresi-linier-berganda">
                Lanjut ke Uji Regresi Linier &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
