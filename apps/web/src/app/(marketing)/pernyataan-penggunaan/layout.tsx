import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Format Pernyataan Penggunaan Alat Skripsi | ${APP_NAME}`,
  description: 'Format baku pernyataan penggunaan alat olah data untuk lampiran skripsi. Menegaskan kejujuran akademik, orisinalitas data responden, dan jejak hitung baku.',
  openGraph: {
    title: `Format Pernyataan Penggunaan Alat Skripsi | ${APP_NAME}`,
    description: 'Format baku pernyataan penggunaan alat olah data untuk lampiran skripsi. Menegaskan kejujuran akademik, orisinalitas data responden, dan jejak hitung baku.',
    url: 'https://olahdata.id/pernyataan-penggunaan',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function PernyataanPenggunaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
