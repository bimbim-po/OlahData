import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Masuk ke Meja Kerja | ${APP_NAME}`,
  description: 'Masuk ke meja kerja OlahData. Lanjutkan pengolahan data kuesioner skripsi, evaluasi hasil uji asumsi klasik, dan ekspor tabel Bab 4 berstandar akademik APA.',
  openGraph: {
    title: `Masuk ke Meja Kerja | ${APP_NAME}`,
    description: 'Masuk ke meja kerja OlahData. Lanjutkan pengolahan data kuesioner skripsi, evaluasi hasil uji asumsi klasik, dan ekspor tabel Bab 4 berstandar akademik APA.',
    url: 'https://olahdata.id/masuk',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function MasukLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
