import type { Metadata } from 'next';
import { Figtree, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';
import { UpgradeCheckoutModal } from '@/components/upgrade-checkout-modal';
import './globals.css';

const figtree = Figtree({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://olah-data.pages.dev'),
  title: {
    default: `${APP_NAME} — Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi.',
  keywords: [
    'olah data skripsi',
    'olah data kuesioner',
    'olah data spss online',
    'uji validitas dan reliabilitas',
    'uji regresi linier berganda',
    'uji asumsi klasik otomatis',
    'bab 4 skripsi kuantitatif',
    'analisis data skripsi',
    'jasa olah data skripsi murah',
    'aplikasi olah data kuesioner',
    'alternatif spss mahasiswa',
    'format tabel bab 4 word',
  ],
  authors: [{ name: 'OlahData Team' }],
  creator: 'OlahData',
  publisher: 'OlahData',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://olah-data.pages.dev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: `${APP_NAME} — Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis`,
    description: 'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi.',
    url: 'https://olah-data.pages.dev',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis`,
    description: 'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${figtree.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <Toaster>
            {children}
            <UpgradeCheckoutModal />
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
