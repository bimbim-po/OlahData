import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Pilihan Paket & Investasi Meja Kerja Skripsi | ${APP_NAME}`,
  description:
    'Pilihan paket langganan olah data kuesioner skripsi terjangkau untuk mahasiswa. Akses lengkap uji validitas, reliabilitas, asumsi klasik, regresi, mediasi, dan ekspor Word tanpa batasan revisi.',
  keywords: [
    'harga olah data skripsi',
    'biaya olah data kuesioner',
    'jasa olah data skripsi murah',
    'paket olah data mahasiswa',
    'alternatif spss hemat',
    'tarif olah data kuantitatif',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev/harga',
  },
  openGraph: {
    title: `Pilihan Paket & Investasi Meja Kerja Skripsi | ${APP_NAME}`,
    description:
      'Pilihan paket langganan olah data kuesioner skripsi terjangkau untuk mahasiswa. Akses lengkap uji validitas, reliabilitas, asumsi klasik, regresi, dan ekspor Word.',
    url: 'https://olah-data.pages.dev/harga',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pilihan Paket OlahData Skripsi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Pilihan Paket & Investasi Meja Kerja Skripsi | ${APP_NAME}`,
    description:
      'Pilihan paket langganan olah data kuesioner skripsi terjangkau untuk mahasiswa tingkat akhir.',
    images: ['/og-image.png'],
  },
};

export default function HargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
