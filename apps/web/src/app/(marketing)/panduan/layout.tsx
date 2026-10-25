import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Panduan Lengkap Olah Data Skripsi Kuantitatif | ${APP_NAME}`,
  description:
    'Panduan metodologi langkah demi langkah olah data kuesioner skripsi kuantitatif online: cara uji validitas reliabilitas, uji asumsi klasik, regresi linier berganda, dan penyusunan draf Bab 4 Word.',
  keywords: [
    'panduan olah data skripsi',
    'cara olah data kuesioner',
    'tutorial uji validitas kuesioner',
    'cara uji reliabilitas cronbach alpha',
    'cara uji normalitas skripsi',
    'langkah uji regresi linier berganda',
    'panduan bab 4 skripsi kuantitatif',
    'format tabel word skripsi',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev/panduan',
  },
  openGraph: {
    title: `Panduan Lengkap Olah Data Skripsi Kuantitatif | ${APP_NAME}`,
    description:
      'Panduan metodologi langkah demi langkah olah data kuesioner skripsi kuantitatif online: cara uji validitas reliabilitas, uji asumsi klasik, regresi linier berganda, dan penyusunan draf Bab 4 Word.',
    url: 'https://olah-data.pages.dev/panduan',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Panduan Olah Data Skripsi Kuantitatif - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Panduan Lengkap Olah Data Skripsi Kuantitatif | ${APP_NAME}`,
    description:
      'Panduan metodologi langkah demi langkah olah data kuesioner skripsi kuantitatif online tanpa SPSS.',
    images: ['/og-image.png'],
  },
};

export default function PanduanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
