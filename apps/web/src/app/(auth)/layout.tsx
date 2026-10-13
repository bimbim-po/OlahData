import * as React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative selection:bg-primary/20">
      {/* Top Bar with brand link and theme toggle */}
      <header className="w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-90"
        >
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="w-full py-4 px-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 {APP_NAME}</span>
          <div className="flex items-center gap-3">
            <Link href="/privasi" className="hover:text-foreground">
              Privasi
            </Link>
            <span>•</span>
            <Link href="/syarat" className="hover:text-foreground">
              Syarat
            </Link>
            <span>•</span>
            <Link href="/pernyataan-penggunaan" className="hover:text-foreground">
              Panduan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
