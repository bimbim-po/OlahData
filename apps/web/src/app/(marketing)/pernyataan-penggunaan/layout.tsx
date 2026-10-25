import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Format Pernyataan Penggunaan Alat Skripsi | ${APP_NAME}`,
  description:
    'Templat resmi lembar transparansi akademik dan pernyataan penggunaan alat bantu komputasi skripsi untuk disertakan pada lembar lampiran ujian sidang.',
  keywords: [
    'pernyataan penggunaan alat skripsi',
    'lembar transparansi komputasi skripsi',
    'etika olah data skripsi',
    'lampiran sidang skripsi',
  ],
  alternates: {
    canonical: 'https://olah-data.pages.dev/pernyataan-penggunaan',
  },
  openGraph: {
    title: `Format Pernyataan Penggunaan Alat Skripsi | ${APP_NAME}`,
    description:
      'Templat resmi lembar transparansi akademik dan pernyataan penggunaan alat bantu komputasi skripsi.',
    url: 'https://olah-data.pages.dev/pernyataan-penggunaan',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'article',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Format Pernyataan Penggunaan Alat - OlahData',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Format Pernyataan Penggunaan Alat Skripsi | ${APP_NAME}`,
    description:
      'Templat resmi lembar transparansi akademik dan etika riset skripsi.',
    images: ['/og-image.png'],
  },
};

export default function PernyataanPenggunaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
