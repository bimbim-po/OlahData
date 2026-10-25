import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowRight,
  BookOpen,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bab4Preview } from '@/components/bab4-preview';
import { PricingCards } from '@/components/pricing-cards';
import { LiveDemo } from '@/components/live-demo';
import { PageActions } from '@/components/page-actions';

export const metadata: Metadata = {
  title: 'Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis | OlahData',
  description:
    'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor tabel Bab 4 Word standar skripsi.',
  keywords: [
    'olah data skripsi',
    'olah data kuesioner',
    'olah data spss online',
    'uji validitas dan reliabilitas kuesioner',
    'uji regresi linier berganda online',
    'uji asumsi klasik otomatis',
    'contoh bab 4 skripsi kuantitatif',
    'analisis data skripsi',
    'jasa olah data skripsi murah',
    'alternatif spss mahasiswa',
    'format tabel bab 4 word',
    'skala likert excel',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev/',
  },
  openGraph: {
    title: 'Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis | OlahData',
    description:
      'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor tabel Bab 4 Word standar skripsi.',
    url: 'https://olah-data.pages.dev/',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis | OlahData',
    description:
      'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor tabel Bab 4 Word standar skripsi.',
  },
};

// 3 Tahap Alur Uji Statistik Sesuai Pedoman Metodologi Skripsi
const STATISTICAL_TEST_PHASES = [
  {
    phaseNumber: '1',
    phaseTitle: 'Tahap 1: Uji Kualitas Instrumen dan Deskriptif',
    phaseBadge: 'Fase 1: Kuesioner dan Profil Data',
    description: 'Memastikan butir pernyataan kuesioner valid, reliabel, dan menggambarkan sebaran data sebelum pengujian model.',
    tests: [
      {
        name: 'Statistik Deskriptif',
        description: 'Mean, median, modus, standar deviasi, rentang skor (min-max), dan persentase sebaran frekuensi jawaban responden.',
        tag: 'Eksplorasi Data',
      },
      {
        name: 'Uji Validitas Butir Pertanyaan',
        description: 'Korelasi Pearson Product Moment (r-hitung dibandingkan r-tabel pada df = N-2) guna menguji ketepatan setiap butir kuesioner.',
        tag: 'Syarat Butir Valid',
      },
      {
        name: 'Uji Reliabilitas Konstruk',
        description: "Cronbach's Alpha per konstruk variabel (ambang batas kritis α > 0,70) untuk menguji konsistensi internal kuesioner.",
        tag: 'Syarat Konsistensi',
      },
    ],
  },
  {
    phaseNumber: '2',
    phaseTitle: 'Tahap 2: Uji Asumsi Klasik (Syarat Regresi)',
    phaseBadge: 'Fase 2: Prasyarat Ekonometrika',
    description: 'Memenuhi prasyarat ekonometrika agar estimator OLS bersifat BLUE (Best Linear Unbiased Estimator) dan bebas bias.',
    tests: [
      {
        name: 'Uji Normalitas Residual',
        description: 'One-Sample Kolmogorov-Smirnov, Lilliefors, dan Shapiro-Wilk untuk memeriksa sebaran normalitas data residual.',
        tag: 'Syarat Distribusi',
      },
      {
        name: 'Uji Multikolinearitas',
        description: 'Nilai Collinearity Tolerance (> 0,10) dan VIF (< 10) untuk memastikan tidak ada hubungan korelasi sempurna antar variabel bebas.',
        tag: 'Syarat Independensi',
      },
      {
        name: 'Uji Heteroskedastisitas',
        description: 'Uji Glejser, Uji Park, Uji White, dan Korelasi Rank Spearman untuk memastikan kesamaan varians residual.',
        tag: 'Syarat Homoskedastisitas',
      },
      {
        name: 'Uji Linearitas dan Autokorelasi',
        description: 'Uji F Linearitas dan Durbin-Watson (tabel dL dan dU) untuk memeriksa hubungan linier serta keteraturan residual.',
        tag: 'Syarat Model',
      },
    ],
  },
  {
    phaseNumber: '3',
    phaseTitle: 'Tahap 3: Uji Hipotesis dan Model Penelitian',
    phaseBadge: 'Fase 3: Pembuktian Hipotesis',
    description: 'Menjawab rumusan masalah dan hipotesis penelitian skripsi, mengukur kontribusi pengaruh, serta model analisis jalur lanjutan.',
    tests: [
      {
        name: 'Regresi Linier Berganda',
        description: 'Persamaan matematis OLS baku, koefisien B (unstandardized), standard error, dan standardized beta untuk pembuktian model.',
        tag: 'Model Inti',
      },
      {
        name: 'Uji t (Pengaruh Parsial)',
        description: 't-hitung dibandingkan t-tabel beserta p-value signifikansi untuk menentukan arah pengaruh masing-masing variabel bebas.',
        tag: 'Uji Parsial',
      },
      {
        name: 'Uji F (Pengaruh Simultan)',
        description: 'ANOVA F-hitung dibandingkan F-tabel untuk menguji signifikansi pengaruh seluruh variabel bebas secara bersamaan.',
        tag: 'Uji Bersama',
      },
      {
        name: 'Koefisien Determinasi (R²)',
        description: 'Nilai R, R Square, dan Adjusted R Square guna mengukur persentase sumbangan pengaruh variabel independen ke dependen.',
        tag: 'Kekuatan Model',
      },
      {
        name: 'Analisis Jalur Mediasi (Sobel Test)',
        description: 'Pengujian pengaruh langsung, pengaruh tidak langsung (indirect effect), dan uji Sobel untuk variabel perantara (intervening).',
        tag: 'Model Mediasi',
      },
      {
        name: 'Moderated Regression Analysis (MRA)',
        description: 'Evaluasi efek interaksi variabel moderasi dalam memperkuat atau memperlemah hubungan variabel bebas ke variabel terikat.',
        tag: 'Model Moderasi',
      },
    ],
  },
];

export default function MarketingPage() {
  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'OlahData',
    alternateName: 'Aplikasi Olah Data Skripsi Kuantitatif',
    url: 'https://olah-data.pages.dev',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      description: 'Gratis coba dengan dataset contoh kuesioner skripsi',
    },
    featureList: [
      'Uji Validitas Pearson Product Moment',
      'Uji Reliabilitas Cronbach Alpha',
      'Statistik Deskriptif Kuesioner',
      'Uji Normalitas Kolmogorov-Smirnov',
      'Uji Multikolinearitas VIF & Tolerance',
      'Uji Heteroskedastisitas Glejser',
      'Regresi Linier Berganda & Uji Hipotesis (t, F, R Square)',
      'Ekspor Tabel Bab 4 Standar APA 7th ke Microsoft Word (.docx)',
      'Pendamping Ujian Sidang Skripsi & Jejak Audit SHA-256',
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: COPY.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="flex flex-col pb-20">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* 1. HERO SECTION: DUA KOLOM DENGAN GAP LEGA & ALIGNMENT OPTIS */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Kolom Kiri: Teks Rata Kiri & Aksi Cepat */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium rounded-lg w-fit mb-4 shadow-2xs">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span>Meja Kerja Analisis Skripsi Kuantitatif</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.15]">
              <span className="block text-primary text-xl sm:text-2xl font-bold tracking-normal mb-2">
                Aplikasi Olah Data Skripsi Kuantitatif
              </span>
              {COPY.hero.title}
            </h1>

            <p className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {COPY.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl shadow-sm">
                <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                  <span>{COPY.hero.ctaPrimary}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <Link prefetch={false} href="/app/proyek/baru">
                  {COPY.hero.ctaSecondary}
                </Link>
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Angka terverifikasi deterministik
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Data responden tidak diubah
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Format standar APA 7th
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Demo Hidup Bertransformasi dengan Step-Tabs & Auto-Cycle */}
          <div className="lg:col-span-7 w-full">
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* 2. ALUR KERJA METODOLOGI (EDITORIAL CHECKLIST) */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Eyebrow, H2, Subtitle, mb-12/16 */}
        <div className="mb-12 md:mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span>Sistematika Penelitian</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.howItWorks.title}
          </h2>
          <p className="mt-3 md:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Empat tahapan sistematis dari tabulasi mentah hingga lembar lampiran skripsi siap sidang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {COPY.howItWorks.steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-full shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                  <span className="font-bold text-primary">Langkah {step.number}</span>
                  <span>Tahap {step.number} dari 4</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CONTOH TABEL BAB 4 DENGAN PENJELASAN (INTERACTIVE DEMO) */}
      <section id="contoh-hasil" className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
        {/* Section Title Block */}
        <div className="mb-12 md:mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span>Standar Jurnal Ilmiah</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Format Tabel Bab 4 Siap Salin ke Word
          </h2>
          <p className="mt-3 md:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Tabel jurnal ilmiah standar APA 7th Edition tanpa garis vertikal, dilengkapi interpretasi naratif bahasa Indonesia baku.
          </p>
        </div>

        {/* Interactive Bab 4 Preview Component */}
        <div className="max-w-5xl mx-auto">
          <Bab4Preview />
        </div>
      </section>

      {/* 4. DAFTAR UJI STATISTIK: RESTRUKTURISASI 3 TAHAP ALUR SKRIPSI */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold rounded-lg mb-3 shadow-2xs">
            <Layers className="h-4 w-4" />
            <span>Urutan Otomatis Sesuai Pedoman Skripsi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            12 Uji Statistik Skripsi Lengkap: Validitas, Reliabilitas, Asumsi Klasik, &amp; Regresi
          </h2>
          <p className="mt-3 md:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Seluruh pengujian statistik yang dipersyaratkan dalam skripsi kuantitatif manajemen, psikologi, pendidikan, dan ilmu sosial disusun berurutan mengikuti kaidah metodologi penelitian baku.
          </p>
        </div>

        <div className="space-y-14 md:space-y-16">
          {STATISTICAL_TEST_PHASES.map((phase) => (
            <div key={phase.phaseNumber} className="space-y-6">
              {/* Header Tahap */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 shadow-xs">
                    {phase.phaseNumber}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {phase.phaseTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {phase.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-medium self-start sm:self-auto py-1 px-3 rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  {phase.phaseBadge}
                </Badge>
              </div>

              {/* Cards Grid Uji Statistik (gap-6 untuk kartu kecil) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {phase.tests.map((test, index) => (
                  <Card
                    key={index}
                    className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs h-full flex flex-col justify-between hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">
                          {test.tag}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-primary/70 shrink-0" />
                      </div>
                      <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {test.name}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {test.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. YANG TIDAK KAMI LAKUKAN (KOMITMEN INTEGRITAS AKADEMIK) */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-[#F7B3AF] dark:border-red-900/60 bg-[#FDEEED]/40 dark:bg-red-950/20 p-8 sm:p-12 space-y-8 shadow-xs">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-[#E8574F] shrink-0 mt-1" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8A1E18] dark:text-red-300 mb-1">
                Komitmen Integritas Akademik
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {COPY.notDoing.title}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Kejujuran ilmiah adalah landasan kelulusan Anda. {APP_NAME} memegang teguh batasan etika penelitian berikut:
              </p>
            </div>
          </div>

          {/* Large Cards Grid (gap-8) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
            {COPY.notDoing.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between h-full shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2 text-[#E8574F] text-xs font-bold mb-2">
                    <span>✕</span>
                    <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>
              Ingin menyertakan lembar keterangan transparan di lampiran skripsi Anda?
            </span>
            <Button asChild variant="link" className="text-xs sm:text-sm font-semibold text-primary p-0 h-auto">
              <Link prefetch={false} href="/pernyataan-penggunaan">
                Lihat Format Pernyataan Penggunaan Alat &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION PREVIEW */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Rata Tengah */}
        <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span>Investasi Kelulusan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.pricing.title}
          </h2>
          <p className="mt-3 md:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {COPY.pricing.subtitle}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <PricingCards />
        </div>
      </section>

      {/* 7. TRUST CALLOUT BOX: STANDAR SIDANG & AUDIT DOSEN PEMBIMBING */}
      <section className="py-16 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-xs">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Standar Ujian Sidang Skripsi</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
              Takut ditanya Dosen Pembimbing saat bimbingan dan sidang?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Setiap hasil analisis di {APP_NAME} dilengkapi <strong>Lampiran Output Statistik Lengkap</strong> (setara tabel rincian SPSS, JASP, dan Stata) beserta penjabaran rumus matematika, derajat kebebasan (df), nilai kritis r/t/F tabel, dan stempel jejak audit SHA-256 yang siap Anda cetak untuk lembar lampiran skripsi.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
            <Button asChild size="lg" className="font-semibold text-xs sm:text-sm px-6 h-12 rounded-xl shadow-xs">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-xs sm:text-sm px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <Link prefetch={false} href="/pernyataan-penggunaan">
                Format Lembar Pernyataan &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Rata Tengah */}
        <div className="mb-12 md:mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span>Tanya Jawab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.faq.title}
          </h2>
          <p className="mt-3 md:mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Hal-hal yang sering ditanyakan mahasiswa sebelum memulai analisis kuesioner.
          </p>
        </div>

        {/* Accordion FAQ: max-w-3xl, py-5 px-6, space-y-4 */}
        <div className="max-w-3xl mx-auto space-y-4">
          {COPY.faq.items.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
              open={idx === 0}
            >
              <summary className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-4">
                <p>{item.a}</p>
                {idx === 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                    <Link
                      href="#contoh-hasil"
                      className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline text-xs"
                    >
                      <span>Lihat contoh cara memeriksa hasil di tabel Bab 4</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 9. CTA FOOTER SECTION */}
      <section className="py-20 md:py-28 lg:py-32 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 sm:p-12 lg:p-16 text-center space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Buka meja kerja skripsi Anda hari ini
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Tanpa instalasi perangkat lunak berat, tanpa lisensi mahal, dan tanpa rumus yang membingungkan. Mulai dengan dataset kuesioner Anda sendiri atau pelajari data simulasi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto font-semibold text-sm px-6 h-12 rounded-xl shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba dengan data contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-sm px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs">
              <Link prefetch={false} href="/pernyataan-penggunaan">
                Format Lampiran Skripsi
              </Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
            {COPY.reassurance.saved}
          </p>
        </div>

        {/* PageActions Navigasi Halaman */}
        <div className="mt-12">
          <PageActions
            nextHref="/harga"
            nextLabel="Lihat Pilihan Harga"
          />
        </div>
      </section>
    </div>
  );
}
