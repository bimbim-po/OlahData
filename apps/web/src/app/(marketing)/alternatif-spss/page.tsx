import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  AlertTriangle,
  Lock,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Alternatif SPSS Online Terbaik untuk Mahasiswa & Skripsi | OlahData',
  description:
    'Aplikasi olah data kuesioner skripsi online alternatif SPSS terbaik. Tanpa software bajakan crack, tanpa instalasi rumit. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi, dan draf Bab 4 Word.',
  keywords: [
    'alternatif spss',
    'olah data spss online',
    'spss online gratis',
    'alternatif spss mahasiswa',
    'download spss alternatif',
    'cara olah data tanpa spss',
    'spss kuantitatif skripsi',
    'software statistik pengganti spss',
    'jasa olah data spss online',
  ],
  alternates: {
    canonical: 'https://olahdata.vrimae.com/alternatif-spss',
  },
  openGraph: {
    title: 'Alternatif SPSS Online Terbaik untuk Mahasiswa & Skripsi | OlahData',
    description:
      'Aplikasi olah data kuesioner skripsi online alternatif SPSS terbaik. Tanpa software crack berbahaya, langsung menghasilkan tabel APA 7th dan draf Bab 4 Word.',
    url: 'https://olahdata.vrimae.com/alternatif-spss',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: 'https://olahdata.vrimae.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Alternatif SPSS Online - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alternatif SPSS Online Terbaik untuk Mahasiswa & Skripsi | OlahData',
    description:
      'Olah data kuesioner skripsi online tanpa SPSS crack. Otomatis draf Bab 4 Word standar skripsi.',
    images: ['https://olahdata.vrimae.com/og-image.png'],
  },
};

export default function AlternatifSpssPage() {
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
            name: 'Alternatif SPSS',
            item: 'https://olahdata.vrimae.com/alternatif-spss',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'OlahData - Alternatif SPSS Online',
        operatingSystem: 'Web Browser, Windows, macOS, Android, iOS',
        applicationCategory: 'EducationalApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IDR',
        },
        description:
          'Alternatif SPSS online berbasis peramban web modern tanpa instalasi lisensi mahal atau bahaya crack berbahaya.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Apakah hasil perhitungan OlahData sama dengan IBM SPSS?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya, OlahData menggunakan formulasi ekonometrika deterministik baku yang menghasilkan koefisien regresi, Pearson r, Cronbach Alpha, VIF, dan nilai Glejser yang identik dengan output SPSS.',
            },
          },
          {
            '@type': 'Question',
            name: 'Mengapa mahasiswa sebaiknya menghindari software SPSS bajakan/crack?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'SPSS bajakan sering disusupi malware dan ransomware yang dapat merusak skripsi di laptop. Selain itu, SPSS menghasilkan tabel kotak rapat yang sering dicoret dan ditolak oleh dosen penguji.',
            },
          },
        ],
      },
    ],
  };

  const spssComparison = [
    {
      kebutuhan: 'Lisensi & Keamanan',
      olahdata: '100% Legal & Aman di Web Browser (Bebas virus/malware crack)',
      spss: 'Lisensi resmi sangat mahal (jutaan rupiah), crack rentan virus',
    },
    {
      kebutuhan: 'Output Format Tabel',
      olahdata: 'Standar Jurnal Ilmiah APA 7th (Garis horizontal saja, siap Word)',
      spss: 'Garis kotak rapat vertikal & horizontal (sering ditolak dosen)',
    },
    {
      kebutuhan: 'Draf Penjelasan Skripsi',
      olahdata: 'Otomatis dibuatkan paragraf interpretasi akademik Bab 4',
      spss: 'Hanya angka mentah, mahasiswa mengetik sendiri dari nol',
    },
    {
      kebutuhan: 'Kemudahan Penggunaan',
      olahdata: 'Wizard interaktif 4 langkah berbahasa Indonesia praktis',
      spss: 'Banyak menu membingungkan, rawan error sintaks',
    },
    {
      kebutuhan: 'Pembersihan Data Anomali',
      olahdata: 'Deteksi otomatis baris bolong, skor ekstrem, dan butir terbalik',
      spss: 'Harus filter manual menggunakan rumus Transform/Compute',
    },
  ];

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
            <li className="text-slate-900 dark:text-slate-200 font-medium">Alternatif SPSS</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold rounded-lg w-fit mb-4">
            <ShieldCheck className="h-4 w-4" />
            <span>Alternatif SPSS Legal, Praktis, &amp; 100% Online</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
            Alternatif SPSS Online Terbaik untuk Olah Data Skripsi Mahasiswa
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Lupakan instalasi software SPSS bajakan yang berisiko merusak laptop Anda. OlahData memberikan kemudahan olah data kuesioner kuantitatif online dengan akurasi matematis setara SPSS, ditambah draf naskah Bab 4 dan format tabel APA 7th yang siap disalin ke Microsoft Word.
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
                Unggah File Excel Kuesioner
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Bebas crack &amp; virus ransomware
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Tabel standar APA 7th tanpa garis vertikal
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Presisi rumus baku identik output SPSS
            </span>
          </div>
        </div>
      </section>

      {/* Bahaya SPSS Crack */}
      <section className="py-12 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-8 flex flex-col md:flex-row items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Bahaya Menggunakan Software SPSS Bajakan (Crack) untuk Skripsi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Banyak mahasiswa mengunduh file crack SPSS dari situs tidak resmi. File tersebut kerap disusupi program jahat (Trojan/Ransomware) yang dapat mengunci berkas dokumen skripsi Anda di saat-saat genting menjelang sidang. OlahData hadir sebagai alternatif online berbasis komputasi modern yang aman, legal, dan dapat diakses dari perangkat mana saja.
            </p>
          </div>
        </div>
      </section>

      {/* Tabel Komparasi */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Perbandingan Nyata
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Perbandingan OlahData vs IBM SPSS
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Lihat bagaimana OlahData menyelesaikan kendala yang selama ini mempersulit mahasiswa saat menggunakan SPSS.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                  <th className="py-4 px-5 font-semibold text-slate-900 dark:text-slate-100 w-1/3">
                    Aspek Analisis
                  </th>
                  <th className="py-4 px-5 font-bold text-primary w-1/3 bg-primary/5">
                    OlahData (Online)
                  </th>
                  <th className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 w-1/3">
                    IBM SPSS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {spssComparison.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {item.kebutuhan}
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{item.olahdata}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item.spss}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Selesaikan Olah Data Kuesioner Tanpa Hambatan
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Tak perlu lagi menunggu jasa olah data berhari-hari. Dapatkan hasil instan, transparan, dan terverifikasi dalam 60 detik.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold text-sm rounded-xl justify-center shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Simulasi Gratis</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/alternatif-jamovi">
                Lihat Juga Komparasi Jamovi &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
