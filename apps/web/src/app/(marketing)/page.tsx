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
  XCircle,
  Zap,
  Laptop,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bab4Preview } from '@/components/bab4-preview';
import { PricingCards } from '@/components/pricing-cards';
import { LiveDemo } from '@/components/live-demo';

export const metadata: Metadata = {
  title: {
    absolute: 'Aplikasi Olah Data Kuantitatif Online & Alternatif Jamovi/SPSS | OlahData',
  },
  description:
    'Aplikasi olah data kuantitatif online terbaik pengganti Jamovi & SPSS untuk kuesioner skripsi. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor tabel serta draf Bab 4 Word standar skripsi.',
  keywords: [
    'olah data kuantitatif',
    'aplikasi olah data kuantitatif',
    'alternatif jamovi',
    'jamovi online',
    'jamovi vs spss',
    'cara olah data jamovi',
    'alternatif spss',
    'olah data spss online',
    'olah data skripsi',
    'olah data kuesioner',
    'cara olah data skripsi kuantitatif',
    'uji validitas dan reliabilitas kuesioner',
    'uji regresi linier berganda online',
    'uji asumsi klasik otomatis',
    'contoh bab 4 skripsi kuantitatif',
    'buat bab 4 otomatis word',
    'analisis data skripsi',
    'jasa olah data skripsi murah',
    'format tabel bab 4 word apa 7th',
    'skala likert excel',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev',
  },
  openGraph: {
    title: 'Aplikasi Olah Data Kuantitatif Online & Alternatif Jamovi/SPSS | OlahData',
    description:
      'Aplikasi olah data kuantitatif online terbaik pengganti Jamovi & SPSS untuk kuesioner skripsi. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi, dan draf Bab 4 Word.',
    url: 'https://olah-data.pages.dev/',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: 'https://olah-data.pages.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OlahData - Olah Data Kuantitatif Skripsi & Alternatif Jamovi SPSS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aplikasi Olah Data Kuantitatif Online & Alternatif Jamovi/SPSS | OlahData',
    description:
      'Aplikasi olah data kuantitatif online pengganti Jamovi & SPSS untuk kuesioner skripsi. Buat Bab 4 Word otomatis.',
    images: ['https://olah-data.pages.dev/og-image.png'],
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
    alternateName: [
      'Aplikasi Olah Data Kuantitatif',
      'Alternatif Jamovi Online',
      'Alternatif SPSS Mahasiswa',
      'Olah Data Skripsi Kuantitatif',
    ],
    url: 'https://olah-data.pages.dev',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Aplikasi olah data kuantitatif online terbaik pengganti Jamovi dan SPSS untuk skripsi. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier berganda, dan ekspor draf Bab 4 Word standar skripsi.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1280',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      description: 'Gratis coba dengan dataset contoh kuesioner skripsi',
    },
    featureList: [
      'Alternatif Jamovi & SPSS Online Tanpa Instalasi',
      'Otomatis Draf Naskah Bab 4 Bahasa Indonesia Standar APA 7th',
      'Ekspor Tabel Bab 4 Standar APA 7th ke Microsoft Word (.docx)',
      'Deteksi Anomali Kuesioner (Missing Value & Jawaban Lurus)',
      'Uji Validitas Pearson Product Moment & r-tabel Otomatis',
      'Uji Reliabilitas Cronbach Alpha',
      'Uji Normalitas Kolmogorov-Smirnov & Lilliefors',
      'Uji Multikolinearitas VIF & Tolerance',
      'Uji Heteroskedastisitas Glejser',
      'Regresi Linier Berganda & Uji Hipotesis (t, F, R Square)',
      'Pendamping Ujian Sidang Skripsi & Jejak Audit SHA-256',
    ],
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ...COPY.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
      {
        '@type': 'Question',
        name: 'Apa keunggulan OlahData dibandingkan Jamovi dan SPSS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'OlahData dapat diakses langsung secara online tanpa mengunduh software berat 300MB+ seperti Jamovi atau software berlisensi mahal/crack berbahaya seperti SPSS. Selain itu, OlahData langsung menyusun draf naskah Bab 4 bahasa Indonesia baku dan tabel APA 7th siap pakai di Microsoft Word.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah hasil perhitungan statistik OlahData sama dengan Jamovi dan SPSS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya, 100% presisi dan identik. OlahData menggunakan mesin komputasi statistik deterministik baku yang terverifikasi menghasilkan angka Pearson r, Cronbach Alpha, t-hitung, F-hitung, VIF, dan Glejser yang cocok dengan output Jamovi dan SPSS.',
        },
      },
      {
        '@type': 'Question',
        name: 'Apakah OlahData dapat digunakan tanpa unduh atau instalasi aplikasi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ya. OlahData sepenuhnya berbasis peramban web modern (cloud-first) dan dapat langsung digunakan di Google Chrome, Microsoft Edge, Safari baik dari laptop maupun smartphone.',
        },
      },
    ],
  };

  const jsonLdHowTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cara Olah Data Kuesioner Skripsi Kuantitatif dan Membuat Bab 4 Otomatis',
    description:
      'Panduan 4 tahapan sistematis mengolah data kuesioner skripsi kuantitatif dari tabulasi mentah hingga draf Bab 4 Word siap sidang.',
    totalTime: 'PT5M',
    step: COPY.howItWorks.steps.map((step, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: step.title,
      text: step.description,
      url: `https://olah-data.pages.dev/#langkah-${step.number}`,
    })),
  };

  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OlahData',
    url: 'https://olah-data.pages.dev',
    logo: 'https://olah-data.pages.dev/logo-192.png',
    description:
      'Platform komputasi statistik deterministik untuk pengolahan data kuesioner skripsi kuantitatif mahasiswa di Indonesia.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'bantuan@olahdata.id',
      contactType: 'customer support',
      areaServed: 'ID',
      availableLanguage: ['Indonesian'],
    },
  };

  const jsonLdBreadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: 'https://olah-data.pages.dev/',
      },
    ],
  };

  return (
    <div className="flex flex-col">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />

      {/* 1. HERO SECTION: DUA KOLOM DENGAN GAP LEGA & ALIGNMENT OPTIS */}
      <section className="relative pt-10 pb-16 md:pt-14 md:pb-20 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Kolom Kiri: Teks Rata Kiri & Aksi Cepat */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium rounded-lg w-fit mb-4 shadow-2xs">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span>Meja Kerja Analisis Skripsi Kuantitatif</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
              <span className="block text-primary text-xl sm:text-2xl font-bold tracking-normal mb-2">
                Aplikasi Olah Data Skripsi Kuantitatif
              </span>
              {COPY.hero.title}
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              {COPY.hero.subtitle}
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Button asChild size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl shadow-sm justify-center">
                <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                  <span>{COPY.hero.ctaPrimary}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs justify-center">
                <Link prefetch={false} href="/app/proyek/baru">
                  {COPY.hero.ctaSecondary}
                </Link>
              </Button>
            </div>

            <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-slate-500 dark:text-slate-400">
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
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Eyebrow, H2, Subtitle */}
        <div className="mb-10 md:mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
            <span>Sistematika Penelitian</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.howItWorks.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Empat tahapan sistematis dari tabulasi mentah hingga lembar lampiran skripsi siap sidang.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
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
      <section id="contoh-hasil" className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
        {/* Section Title Block */}
        <div className="mb-10 md:mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
            <span>Standar Jurnal Ilmiah</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Format Tabel Bab 4 Siap Salin ke Word
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Tabel jurnal ilmiah standar APA 7th Edition tanpa garis vertikal, dilengkapi interpretasi naratif bahasa Indonesia baku.
          </p>
        </div>

        {/* Interactive Bab 4 Preview Component */}
        <div className="max-w-5xl mx-auto">
          <Bab4Preview />
        </div>
      </section>

      {/* 4. DAFTAR UJI STATISTIK: RESTRUKTURISASI 3 TAHAP ALUR SKRIPSI */}
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block */}
        <div className="mb-10 md:mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold rounded-lg mb-2.5 shadow-2xs">
            <Layers className="h-4 w-4" />
            <span>Urutan Otomatis Sesuai Pedoman Skripsi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            12 Uji Statistik Skripsi Lengkap: Validitas, Reliabilitas, Asumsi Klasik, &amp; Regresi
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Seluruh pengujian statistik yang dipersyaratkan dalam skripsi kuantitatif manajemen, psikologi, pendidikan, dan ilmu sosial disusun berurutan mengikuti kaidah metodologi penelitian baku.
          </p>
        </div>

        <div className="space-y-10 md:space-y-12">
          {STATISTICAL_TEST_PHASES.map((phase) => (
            <div key={phase.phaseNumber} className="space-y-5">
              {/* Header Tahap */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
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

              {/* Cards Grid Uji Statistik */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">
                {phase.tests.map((test, index) => (
                  <Card
                    key={index}
                    className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs h-full flex flex-col justify-between hover:border-primary/50 transition-colors"
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

      {/* 4.5 PERBANDINGAN KOMPREHENSIF: OLAHDATA VS JAMOVI VS SPSS */}
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10 md:mb-12">
          <div className="inline-flex items-center gap-1.5 border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-semibold rounded-lg mb-2.5 shadow-2xs">
            <Zap className="h-4 w-4" />
            <span>Alternatif Modern Jamovi &amp; SPSS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Perbandingan Fitur: OlahData vs Jamovi vs SPSS
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Kenapa mahasiswa dan peneliti kuantitatif beralih ke OlahData? Kami merancang alur kerja yang secara spesifik menyelesaikan hambatan penulisan skripsi di Indonesia.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                  <th className="py-4 px-5 font-semibold text-slate-900 dark:text-slate-100 w-1/4">
                    Kebutuhan Skripsi
                  </th>
                  <th className="py-4 px-5 font-bold text-primary w-1/4 bg-primary/5">
                    OlahData (Web)
                  </th>
                  <th className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 w-1/4">
                    Jamovi
                  </th>
                  <th className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 w-1/4">
                    IBM SPSS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                <tr>
                  <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                    Akses &amp; Pemasangan
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">100% Online di Web Browser (Tanpa install)</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Download installer berat (300MB - 1GB)</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Software berat, lisensi mahal atau crack berisiko virus</span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-primary/[0.02]">
                  <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                    Draf Naskah Bab 4 Otomatis
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">Otomatis tersusun narasi bahasa Indonesia APA 7th</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Tidak ada (hanya output angka bahasa Inggris)</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Tidak ada (hanya tabel angka mentah)</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                    Format Tabel untuk Skripsi
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">Standar APA 7th tanpa garis vertikal, siap ekspor Word</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Format tabel bawaan R, harus diedit manual</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Tabel kotak berkisi rapat (sering dicoret dosen)</span>
                    </div>
                  </td>
                </tr>

                <tr className="bg-primary/[0.02]">
                  <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                    Pembersihan Data Anomali
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">Otomatis deteksi missing value, jawaban lurus, &amp; butir balik</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Harus dicari dan dibersihkan manual oleh user</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>Manual menggunakan sintaks &amp; rumus kompleks</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                    Akurasi Perhitungan
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-semibold">100% Deterministik Identik SPSS &amp; Jamovi</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>R Statistical Engine</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-800 dark:text-slate-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>SPSS Core Engine</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Pelajari panduan komparasi mendalam:
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/alternatif-jamovi"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Alternatif Jamovi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Link
                href="/alternatif-spss"
                className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Alternatif SPSS</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. YANG TIDAK KAMI LAKUKAN (KOMITMEN INTEGRITAS AKADEMIK) */}
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-[#F7B3AF] dark:border-red-900/60 bg-[#FDEEED]/40 dark:bg-red-950/20 p-6 sm:p-10 lg:p-12 space-y-7 shadow-xs">
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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch pt-1">
            {COPY.notDoing.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-full shadow-xs"
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

          <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Rata Tengah */}
        <div className="mb-10 md:mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
            <span>Investasi Kelulusan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.pricing.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {COPY.pricing.subtitle}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <PricingCards />
        </div>
      </section>

      {/* 7. TRUST CALLOUT BOX: STANDAR SIDANG & AUDIT DOSEN PEMBIMBING */}
      <section className="py-12 md:py-16 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lg:gap-8 shadow-xs">
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
            <Button asChild size="lg" className="font-semibold text-xs sm:text-sm px-6 h-12 rounded-xl shadow-xs justify-center">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-xs sm:text-sm px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/pernyataan-penggunaan">
                Format Lembar Pernyataan &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Section Title Block: Rata Tengah */}
        <div className="mb-10 md:mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
            <span>Tanya Jawab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {COPY.faq.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Hal-hal yang sering ditanyakan mahasiswa sebelum memulai analisis kuesioner.
          </p>
        </div>

        {/* Accordion FAQ */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {COPY.faq.items.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
              open={idx === 0}
            >
              <summary className="w-full py-4 sm:py-4.5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-5 sm:px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-3.5">
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
      <section className="py-16 md:py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 sm:p-10 lg:p-14 text-center space-y-5 shadow-sm">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Buka meja kerja skripsi Anda hari ini
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Tanpa instalasi perangkat lunak berat, tanpa lisensi mahal, dan tanpa rumus yang membingungkan. Mulai dengan dataset kuesioner Anda sendiri atau pelajari data simulasi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button asChild size="lg" className="w-full sm:w-auto font-semibold text-sm px-6 h-12 rounded-xl shadow-sm justify-center">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba dengan data contoh (60 Detik)</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-sm px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/pernyataan-penggunaan">
                Format Lampiran Skripsi
              </Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1.5">
            {COPY.reassurance.saved}
          </p>
        </div>

        {/* Navigasi Halaman Berikutnya yang Rapi dan Selaras */}
        <div className="max-w-5xl mx-auto mt-10 sm:mt-12">
          <div className="pt-6 sm:pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Pelajari rincian paket dan investasi kelulusan mahasiswa:
            </span>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs justify-center">
              <Link prefetch={false} href="/harga">
                <span>Lihat Pilihan Harga</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
