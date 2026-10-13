import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Daftar Akun Baru | ${APP_NAME}`,
  description: 'Daftar akun OlahData gratis untuk mahasiswa. Mulai uji kuesioner skripsi kuantitatif, analisis validitas, dan susun draf Bab 4 secara praktis dan terstruktur.',
  openGraph: {
    title: `Daftar Akun Baru | ${APP_NAME}`,
    description: 'Daftar akun OlahData gratis untuk mahasiswa. Mulai uji kuesioner skripsi kuantitatif, analisis validitas, dan susun draf Bab 4 secara praktis dan terstruktur.',
    url: 'https://olahdata.id/daftar',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
