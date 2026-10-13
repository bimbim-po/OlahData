'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated, loadSession } = useAuthStore();

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const navLinks = [
    { href: '/', label: COPY.nav.beranda },
    { href: '/harga', label: COPY.nav.harga },
    { href: '/pernyataan-penggunaan', label: 'Panduan Penggunaan' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center group transition-opacity hover:opacity-90 shrink-0"
        >
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action buttons */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button asChild size="sm" className="gap-1.5 font-medium">
              <Link href="/app">
                <span>Buka Aplikasi</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/masuk">{COPY.nav.masuk}</Link>
              </Button>
              <Button asChild size="sm" className="font-medium">
                <Link href="/daftar">{COPY.nav.daftar}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-1.5 md:hidden shrink-0">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            className="text-foreground h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 min-h-[44px] flex items-center text-base font-medium transition-colors touch-manipulation',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2.5">
              {isAuthenticated ? (
                <Button asChild className="w-full justify-center min-h-[44px] text-base" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/app">
                    Buka Aplikasi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full justify-center min-h-[44px] text-base" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/masuk">{COPY.nav.masuk}</Link>
                  </Button>
                  <Button asChild className="w-full justify-center min-h-[44px] text-base" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/daftar">{COPY.nav.daftar}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
