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
  metadataBase: new URL('https://olahdata.id'),
  title: {
    default: `${APP_NAME} — Olah Data Kuesioner Skripsi Kuantitatif Tanpa SPSS`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Olah data kuesioner skripsi kuantitatif mudah dan akurat. Hasilkan tabel Bab 4 standar APA 7th serta draf penjelasan otomatis tanpa software statistik rumit.',
  openGraph: {
    title: `${APP_NAME} — Olah Data Kuesioner Skripsi Kuantitatif Tanpa SPSS`,
    description: 'Olah data kuesioner skripsi kuantitatif mudah dan akurat. Hasilkan tabel Bab 4 standar APA 7th serta draf penjelasan otomatis tanpa software statistik rumit.',
    url: 'https://olahdata.id',
    siteName: APP_NAME,
    locale: 'id_ID',
    type: 'website',
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
