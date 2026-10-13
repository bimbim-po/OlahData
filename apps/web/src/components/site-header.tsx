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

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { isAuthenticated, loadSession } = useAuthStore();

  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Pantau scroll untuk memberikan bayangan tipis
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tutup menu mobile ketika navigasi berpindah
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Kunci scroll body saat menu mobile terbuka
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Focus trap dan tombol Escape untuk menu mobile
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuTriggerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusableElements = mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/harga', label: 'Harga' },
    { href: '/pernyataan-penggunaan', label: 'Panduan Penggunaan' },
  ];

  return (
    <>
      {/* Aksesibilitas: Lewati ke konten utama */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-background focus:text-primary focus:font-semibold focus:border-2 focus:border-primary focus:rounded-md focus:shadow-lg focus:outline-none"
      >
        Lewati ke konten utama
      </a>

      <header
        className={cn(
          'sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 transition-all duration-200 border-b',
          isScrolled
            ? 'border-border shadow-xs'
            : 'border-border/60 shadow-none'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Logo ke Beranda */}
          <Link
            href="/"
            className="flex items-center group transition-opacity hover:opacity-90 shrink-0"
            aria-label={`${APP_NAME} - Beranda`}
          >
            <Logo size="sm" className="sm:hidden" />
            <Logo size="md" className="hidden sm:inline-flex" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 lg:gap-2"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3.5 py-2 text-sm font-medium transition-colors relative min-h-[40px] inline-flex items-center',
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

          {/* Right Action buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <Button asChild size="sm" className="gap-1.5 font-semibold min-h-[40px]">
                <Link href="/app">
                  <span>Buka Aplikasi</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="font-medium text-foreground min-h-[40px]"
                >
                  <Link href="/masuk">Masuk</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="font-semibold shadow-xs min-h-[40px]"
                >
                  <Link href="/daftar">Daftar gratis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-1 md:hidden shrink-0">
            <ThemeToggle />
            <Button
              ref={menuTriggerRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-panel"
              className="text-foreground h-10 w-10 min-h-[40px] min-w-[40px] sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px] touch-manipulation cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Full Screen Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-panel"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi mobile"
          className="fixed inset-0 z-50 md:hidden bg-background flex flex-col animate-in fade-in duration-200"
        >
          {/* Header Mobile Drawer */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center"
            >
              <Logo size="md" />
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                menuTriggerRef.current?.focus();
              }}
              aria-label="Tutup menu navigasi"
              className="min-h-[44px] px-3 gap-1.5 font-medium cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>Tutup</span>
            </Button>
          </div>

          {/* Links list */}
          <nav
            aria-label="Navigasi Menu Mobile"
            className="flex-1 overflow-y-auto px-5 py-6 space-y-2 flex flex-col justify-start"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-xl px-4 py-3.5 min-h-[48px] flex items-center text-base font-medium transition-colors touch-manipulation',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-6 mt-4 border-t border-border flex flex-col gap-3">
              {isAuthenticated ? (
                <Button
                  asChild
                  className="w-full justify-center min-h-[48px] text-base font-semibold shadow-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/app">
                    <span>Buka Aplikasi</span>
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-center min-h-[48px] text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/masuk">Masuk</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full justify-center min-h-[48px] text-base font-semibold shadow-xs"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/daftar">Daftar gratis</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export { SiteHeader as Navbar };
