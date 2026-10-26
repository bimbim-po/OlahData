import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Info,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Uji Validitas & Reliabilitas Kuesioner Online (Pearson & Cronbach Alpha) | OlahData',
  description:
    'Aplikasi uji validitas dan reliabilitas kuesioner skala Likert online otomatis tanpa SPSS. Hitung Pearson Product Moment (r-hitung vs r-tabel) dan Cronbach Alpha per konstruk lengkap dengan draf naskah Bab 4.',
  keywords: [
    'uji validitas dan reliabilitas online',
    'uji validitas kuesioner skala likert',
    'uji validitas pearson online',
    'cara uji reliabilitas cronbach alpha',
    'r hitung r tabel otomatis',
    'uji instrumen kuesioner skripsi',
    'syarat butir kuesioner valid',
    'ambang batas cronbach alpha 0.7',
    'uji validitas tanpa spss',
  ],
  alternates: {
    canonical: 'https://olahdata.vrimae.com/uji-validitas-reliabilitas',
  },
  openGraph: {
    title: 'Uji Validitas & Reliabilitas Kuesioner Online (Pearson & Cronbach Alpha) | OlahData',
    description:
      'Aplikasi uji validitas dan reliabilitas kuesioner skala Likert online otomatis tanpa SPSS. Pearson r-hitung vs r-tabel dan Cronbach Alpha siap ekspor ke Word.',
    url: 'https://olahdata.vrimae.com/uji-validitas-reliabilitas',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: 'https://olahdata.vrimae.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Uji Validitas dan Reliabilitas Kuesioner Online - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uji Validitas & Reliabilitas Kuesioner Online | OlahData',
    description:
      'Hitung Pearson Product Moment dan Cronbach Alpha kuesioner skripsi otomatis online tanpa SPSS.',
    images: ['https://olahdata.vrimae.com/og-image.png'],
  },
};

export default function UjiValiditasReliabilitasPage() {
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
            name: 'Uji Validitas & Reliabilitas',
            item: 'https://olahdata.vrimae.com/uji-validitas-reliabilitas',
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'Cara Uji Validitas dan Reliabilitas Kuesioner Skripsi Online',
        description:
          'Langkah-langkah menguji validitas Pearson Product Moment dan reliabilitas Cronbach Alpha secara otomatis.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Unggah Tabulasi Excel Kuesioner',
            text: 'Unggah berkas kuesioner skala Likert dalam format .xlsx atau .csv.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Petakan Butir ke Konstruk Variabel',
            text: 'Tentukan butir-butir pernyataan yang masuk ke dalam variabel X1, X2, dan Y.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Kalkulasi Otomatis',
            text: 'Sistem langsung menghitung r-hitung dibandingkan r-tabel (df = N-2) dan Cronbach Alpha (>0.70).',
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
            <li className="text-slate-900 dark:text-slate-200 font-medium">Uji Validitas &amp; Reliabilitas</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold rounded-lg w-fit mb-4">
            <BarChart3 className="h-4 w-4" />
            <span>Fase 1 Kualitas Instrumen Skripsi Kuantitatif</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
            Uji Validitas &amp; Reliabilitas Kuesioner Online Otomatis
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Pastikan butir kuesioner skala Likert skripsi Anda sahih dan andal. OlahData menghitung korelasi Pearson Product Moment, r-tabel otomatis berdasarkan jumlah sampel (df = N-2), serta koefisien Cronbach&apos;s Alpha per variabel lengkap dengan draf penjelasan Bab 4 siap salin ke Word.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl shadow-sm justify-center">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Kuesioner Contoh</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/app/proyek/baru">
                Uji Kuesioner Sendiri (.xlsx / .csv)
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Ketentuan Metodologi */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Kaidah Metodologi
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Kriteria Baku Uji Validitas &amp; Reliabilitas Skripsi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              1. Uji Validitas (Pearson Product Moment)
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Uji validitas mengukur ketepatan butir pertanyaan dalam mengukur apa yang ingin diukur. Butir dinyatakan <strong>Valid</strong> apabila nilai koefisien korelasi $r$-hitung lebih besar daripada $r$-tabel pada tingkat signifikansi 5% $(\alpha = 0,05)$ dengan derajat kebebasan $df = N - 2$.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Rumus: r_hitung &gt; r_tabel (df = N-2, α = 0.05) &amp; p &lt; 0.05
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              2. Uji Reliabilitas (Cronbach&apos;s Alpha)
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Uji reliabilitas menguji konsistensi internal kuesioner ketika diujikan berulang kali. Menurut kaidah metodologi baku (Hair et al. dan Nunnally), suatu instrumen variabel dinyatakan <strong>Reliabel</strong> apabila koefisien Alpha Cronbach bernilai lebih dari <strong>0,70</strong> (atau batas moderat 0,60).
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs font-mono text-primary">
              Standar: Cronbach&apos;s Alpha (α) &gt; 0.70 (Sangat Andal)
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Uji Instrumen Kuesioner Anda Sekarang
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Tak perlu rumus manual di Excel atau syntax rumit di SPSS. Unggah data tabulasi Anda dan peroleh tabel standar APA 7th dalam hitungan detik.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold text-sm rounded-xl justify-center shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/uji-asumsi-klasik">
                Lanjut ke Uji Asumsi Klasik &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
