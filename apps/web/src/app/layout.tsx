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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://olahdata.vrimae.com'),
  title: {
    default: `Olah Data Skripsi Kuantitatif Online [Gratis] — Alternatif Jamovi & SPSS | ${APP_NAME}`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS & Jamovi. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi dalam 60 detik.',
  verification: {
    google: 's9WY1v_Nd5OwIIxm18HwdUCJ5yHI9OHud39eehL8TJU',
  },
  keywords: [
    'olah data kuantitatif',
    'aplikasi olah data kuantitatif',
    'olah data skripsi',
    'olah data kuesioner',
    'alternatif jamovi',
    'jamovi online',
    'jamovi vs spss',
    'cara olah data jamovi',
    'alternatif spss online',
    'olah data spss online',
    'cara olah data skripsi kuantitatif',
    'uji validitas dan reliabilitas kuesioner',
    'uji validitas pearson online',
    'uji reliabilitas cronbach alpha online',
    'uji regresi linier berganda online',
    'uji asumsi klasik otomatis',
    'uji normalitas kolmogorov smirnov',
    'uji multikolinearitas vif tolerance',
    'uji heteroskedastisitas glejser',
    'sobel test mediasi online',
    'moderated regression analysis mra',
    'contoh bab 4 skripsi kuantitatif',
    'buat bab 4 otomatis word',
    'format tabel bab 4 word apa 7th',
    'analisis data skripsi kuantitatif',
    'jasa olah data skripsi murah',
    'aplikasi olah data kuesioner skala likert',
    'alternatif spss mahasiswa gratis',
    'software olah data kuantitatif online',
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
    canonical: 'https://olahdata.vrimae.com',
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
    url: 'https://olahdata.vrimae.com',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OlahData - Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Olah Data Skripsi Kuantitatif & Buat Bab 4 Otomatis`,
    description: 'Aplikasi olah data kuesioner skripsi kuantitatif online tanpa SPSS. Otomatis uji validitas, reliabilitas, asumsi klasik, regresi linier, dan draf Bab 4 Word standar skripsi.',
    images: ['/og-image.png'],
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
      <head>
        <meta
          name="google-site-verification"
          content="s9WY1v_Nd5OwIIxm18HwdUCJ5yHI9OHud39eehL8TJU"
        />
      </head>
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
