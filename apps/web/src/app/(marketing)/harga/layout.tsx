import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Pilihan Paket & Harga Meja Kerja | ${APP_NAME}`,
  description: 'Pilihan paket langganan olah data kuesioner skripsi terjangkau untuk mahasiswa. Fitur lengkap uji validitas, reliabilitas, regresi, dan ekspor dokumen Word.',
  openGraph: {
    title: `Pilihan Paket & Harga Meja Kerja | ${APP_NAME}`,
    description: 'Pilihan paket langganan olah data kuesioner skripsi terjangkau untuk mahasiswa. Fitur lengkap uji validitas, reliabilitas, regresi, dan ekspor dokumen Word.',
    url: 'https://olahdata.id/harga',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function HargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
