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
  Laptop,
  HelpCircle,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Alternatif Jamovi Online Terbaik untuk Olah Data Skripsi Kuantitatif | OlahData',
  description:
    'Aplikasi olah data kuantitatif online pengganti Jamovi terbaik tanpa instalasi berat. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi, dan draf naskah Bab 4 Word standar skripsi.',
  keywords: [
    'alternatif jamovi',
    'jamovi online',
    'jamovi indonesia',
    'jamovi vs spss',
    'download jamovi alternatif',
    'olah data kuantitatif jamovi',
    'cara olah data jamovi skripsi',
    'software statistik pengganti jamovi',
    'uji validitas reliabilitas jamovi',
    'regresi linier jamovi bab 4',
  ],
  alternates: {
    canonical: 'https://olahdata.vrimae.com/alternatif-jamovi',
  },
  openGraph: {
    title: 'Alternatif Jamovi Online Terbaik untuk Olah Data Skripsi Kuantitatif | OlahData',
    description:
      'Aplikasi olah data kuantitatif online pengganti Jamovi tanpa instalasi. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi, dan draf naskah Bab 4 Word.',
    url: 'https://olahdata.vrimae.com/alternatif-jamovi',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: 'https://olahdata.vrimae.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Alternatif Jamovi Online - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alternatif Jamovi Online Terbaik untuk Olah Data Skripsi Kuantitatif | OlahData',
    description:
      'Aplikasi olah data kuantitatif online pengganti Jamovi tanpa instalasi. Buat draf Bab 4 Word otomatis.',
    images: ['https://olahdata.vrimae.com/og-image.png'],
  },
};

export default function AlternatifJamoviPage() {
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
            name: 'Alternatif Jamovi',
            item: 'https://olahdata.vrimae.com/alternatif-jamovi',
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'OlahData - Alternatif Jamovi Online',
        operatingSystem: 'Web Browser, Windows, macOS, Android, iOS',
        applicationCategory: 'EducationalApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IDR',
        },
        description:
          'Alternatif Jamovi online berbasis web browser untuk olah data kuesioner skripsi kuantitatif dengan penyusunan draf Bab 4 otomatis.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Mengapa memilih OlahData dibandingkan Jamovi untuk skripsi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Jamovi memerlukan unduhan installer 300MB+ dan hanya memberikan angka mentah dalam bahasa Inggris tanpa narasi penjelasan. OlahData 100% online di browser dan langsung menyusun draf Bab 4 bahasa Indonesia standar APA 7th lengkap dengan ekspor Word (.docx).',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah hasil perhitungan OlahData sama akuratnya dengan Jamovi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya, hasil kalkulasi OlahData menggunakan algoritma deterministik baku yang terverifikasi menghasilkan angka Pearson r, Cronbach Alpha, t-hitung, F-hitung, dan p-value yang identik dengan Jamovi dan SPSS.',
            },
          },
        ],
      },
    ],
  };

  const comparisonRows = [
    {
      feature: 'Metode Penggunaan',
      olahdata: '100% Online di Web Browser (HP, Laptop, Mac, Chromebook)',
      jamovi: 'Wajib download dan install aplikasi (300MB - 1GB)',
      highlight: true,
    },
    {
      feature: 'Draf Naskah Bab 4 Skripsi',
      olahdata: 'Otomatis tersusun dalam bahasa akademik Indonesia baku (APA 7th)',
      jamovi: 'Tidak ada (hanya tabel angka dalam bahasa Inggris)',
      highlight: true,
    },
    {
      feature: 'Format Tabel untuk Skripsi',
      olahdata: 'Tabel APA 7th Edition tanpa garis vertikal, siap diekspor ke Word',
      jamovi: 'Format tabel R dasar, harus diformat manual ulang di Word',
      highlight: false,
    },
    {
      feature: 'Pembersihan Data Kuesioner',
      olahdata: 'Otomatis deteksi data bolong (missing value), varians nol & butir negatif',
      jamovi: 'Harus diperiksa dan dibersihkan manual oleh pengguna',
      highlight: true,
    },
    {
      feature: 'Alur Analisis Lengkap',
      olahdata: '1 Kali Klik langsung menghitung Validitas, Reliabilitas, Asumsi & Regresi',
      jamovi: 'Harus memilih dan mengklik menu uji satu per satu',
      highlight: false,
    },
    {
      feature: 'Persiapan Ujian Sidang',
      olahdata: 'Dilengkapi simulasi tanya jawab dosen & jejak audit SHA-256',
      jamovi: 'Tidak tersedia panduan bimbingan atau ujian sidang',
      highlight: true,
    },
    {
      feature: 'Akurasi Perhitungan',
      olahdata: '100% Deterministik Identik SPSS & Jamovi (Bukan tebakan AI)',
      jamovi: 'Berbasis R Core Statistics',
      highlight: false,
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
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Beranda
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 dark:text-slate-200 font-medium">Alternatif Jamovi</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary font-semibold rounded-lg w-fit mb-4">
            <Zap className="h-4 w-4" />
            <span>Alternatif Jamovi Online Terbaik di Indonesia</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.18]">
            Alternatif Jamovi Online untuk Olah Data Skripsi Kuantitatif
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            Ingin mengolah data kuesioner skripsi tanpa harus mengunduh dan menginstal software Jamovi yang berat? OlahData hadir sebagai aplikasi olah data kuantitatif berbasis web browser: langsung menghasilkan uji statistik lengkap, tabel APA 7th, dan draf naskah Bab 4 Word siap sidang.
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
                Unggah Berkas Kuesioner Anda
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Tanpa install software
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Ekspor Word (.docx) siap cetak
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Akurasi terverifikasi identik Jamovi &amp; SPSS
            </span>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Tabel Komparasi
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Perbandingan OlahData vs Jamovi Desktop
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Mengapa ribuan mahasiswa tingkat akhir beralih dari Jamovi ke OlahData untuk menyelesaikan skripsi kuantitatif mereka.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                  <th className="py-4 px-5 font-semibold text-slate-900 dark:text-slate-100 w-1/3">
                    Fitur &amp; Kebutuhan Skripsi
                  </th>
                  <th className="py-4 px-5 font-bold text-primary w-1/3 bg-primary/5">
                    OlahData (Web Online)
                  </th>
                  <th className="py-4 px-5 font-semibold text-slate-600 dark:text-slate-400 w-1/3">
                    Jamovi (Desktop App)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className={row.highlight ? 'bg-primary/[0.02]' : ''}>
                    <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 dark:text-slate-200 bg-primary/5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium">{row.olahdata}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{row.jamovi}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4 Keunggulan Utama */}
      <section className="py-14 md:py-18 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Keunggulan Utama
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Kenapa OlahData Jauh Lebih Praktis dari Jamovi?
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Jamovi memang perangkat lunak statistik gratis yang bagus, namun Jamovi dirancang untuk statistik umum dan bukan disesuaikan dengan format skripsi Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
              <Laptop className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              1. 100% Berbasis Browser Tanpa Instalasi
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Anda tidak perlu memusingkan spesifikasi laptop, sistem operasi Windows vs macOS yang sering bermasalah saat install modul Jamovi, atau laptop kampus yang dikunci admin. Cukup buka browser dan data kuesioner Anda langsung terolah.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              2. Draf Narasi Bab 4 Bahasa Indonesia Siap Salin
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Kelemahan terbesar Jamovi adalah hanya menyajikan tabel angka dan istilah bahasa Inggris seperti <em>p-value, estimate, SE</em>. Mahasiswa masih harus mengetik berjam-jam untuk menjelaskan maknanya. Di OlahData, setiap tabel sudah disertai draf kalimat akademik bahasa Indonesia yang siap disalin ke Word.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              3. Pembersihan Otomatis Skala Likert
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Di Jamovi, jika ada responden yang mengisi jawaban bolong atau jawaban seragam tanpa variasi, analisis bisa langsung error atau hasil uji reliabilitas anjlok. OlahData mendeteksi anomali ini sebelum pengujian dan memberi opsi pembersihan otomatis.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              4. Siap Mempertanggungjawabkan di Depan Penguji
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              OlahData dilengkapi rincian Jejak Hitung matematis, nilai kritis r-tabel, t-tabel, F-tabel, serta simulasi pertanyaan dosen penguji sehingga Anda percaya diri saat ujian pendadaran atau sidang skripsi.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 md:py-20 border-t border-slate-200/70 dark:border-slate-800/70 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Tinggalkan Kerumitan Jamovi, Selesaikan Bab 4 Hari Ini
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Mulai dengan dataset contoh atau unggah file tabulasi Excel kuesioner Anda sendiri. Selesai dalam 60 detik tanpa ribet instalasi.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold text-sm rounded-xl justify-center shadow-sm">
              <Link prefetch={false} href="/app/proyek/baru?contoh=1">
                <span>Coba Data Contoh Sekarang</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs justify-center">
              <Link prefetch={false} href="/alternatif-spss">
                Bandingkan Juga dengan SPSS &rarr;
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
