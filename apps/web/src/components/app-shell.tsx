'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderKanban,
  PlusCircle,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ChevronLeftSquare,
  ChevronRightSquare,
  History,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoIcon } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    name: 'Proyek',
    shortName: 'Proyek',
    href: '/app',
    icon: FolderKanban,
    isActive: (pathname: string) =>
      pathname === '/app' ||
      (pathname.startsWith('/app/proyek') && pathname !== '/app/proyek/baru'),
  },
  {
    name: 'Riwayat analisis',
    shortName: 'Riwayat',
    href: '/app/riwayat',
    icon: History,
    isActive: (pathname: string) => pathname.startsWith('/app/riwayat'),
  },
  {
    name: 'Pengaturan',
    shortName: 'Pengaturan',
    href: '/app/pengaturan',
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith('/app/pengaturan'),
  },
  {
    name: 'Bantuan',
    shortName: 'Bantuan',
    href: '/app/bantuan',
    icon: BookOpen,
    isActive: (pathname: string) => pathname.startsWith('/app/bantuan'),
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getPlanBadgeLabel = () => {
    if (!user) return 'Coba Gratis';
    if (user.plan === 'monthly') return 'Bulanan';
    if (user.plan === 'thesis') return 'Paket Skripsi';
    return 'Coba Gratis';
  };

  const getUserInitials = () => {
    if (!user?.name) return 'OD';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const getParentRoute = () => {
    if (
      pathname === '/app/proyek/baru' ||
      pathname.startsWith('/app/proyek/') ||
      pathname.startsWith('/app/riwayat') ||
      pathname.startsWith('/app/bantuan') ||
      pathname.startsWith('/app/langganan') ||
      pathname.startsWith('/app/pengaturan')
    ) {
      return '/app';
    }
    return null;
  };

  const parentRoute = getParentRoute();

  const renderBreadcrumb = () => {
    if (pathname === '/app') {
      return (
        <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
          Proyek
        </h1>
      );
    }
    if (pathname === '/app/proyek/baru') {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Proyek Baru</span>
        </div>
      );
    }
    if (pathname.includes('/analisis')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Pemetaan &amp; Analisis</span>
        </div>
      );
    }
    if (pathname.includes('/hasil')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Hasil Bab 4</span>
        </div>
      );
    }
    if (pathname.startsWith('/app/riwayat')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Riwayat Analisis</span>
        </div>
      );
    }
    if (pathname.startsWith('/app/bantuan')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Pusat Bantuan</span>
        </div>
      );
    }
    if (pathname.startsWith('/app/langganan')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Langganan &amp; Kuota</span>
        </div>
      );
    }
    if (pathname.startsWith('/app/pengaturan')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Pengaturan Akun</span>
        </div>
      );
    }
    return <span className="font-semibold text-foreground">OlahData</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased w-full max-w-full overflow-x-clip">
      {/* Desktop Sidebar (Lebar tetap 240px di desktop, bisa diciutkan jadi ikon) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar-bg shrink-0 h-[100dvh] fixed top-0 left-0 bottom-0 transition-all duration-200 z-30 select-none',
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        {/* Top Header: Logo OlahData & Collapse Toggle */}
        <div className="p-4 border-b border-sidebar-border/70 flex items-center justify-between gap-2">
          <Link href="/app" className="flex items-center gap-2.5 group min-w-0 overflow-hidden">
            <div className="p-1 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shrink-0">
              <LogoIcon size={30} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                  {APP_NAME}
                </div>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
            title={isCollapsed ? 'Perlebar bilah samping' : 'Ciutkan bilah samping'}
            aria-label="Ciutkan atau perlebar sidebar"
          >
            {isCollapsed ? (
              <ChevronRightSquare className="h-4 w-4" />
            ) : (
              <ChevronLeftSquare className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Tombol Proyek Baru */}
        <div className="p-3">
          <Button
            asChild
            className={cn(
              'w-full justify-center gap-2 font-bold shadow-xs min-h-[44px] h-10 rounded-lg',
              !isCollapsed && 'justify-start px-3'
            )}
          >
            <Link href="/app/proyek/baru" title="Mulai Proyek Baru">
              <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>Proyek Baru</span>}
            </Link>
          </Button>
        </div>

        {/* Menu Navigasi Utama */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer relative',
                  isCollapsed ? 'justify-center px-0' : 'justify-start',
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    active ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bagian Bawah: Paket & Akun Pengguna ala Gemini */}
        <div className="p-3 border-t border-sidebar-border/70 space-y-2">
          {/* Item Paket Minimalis ala Gemini */}
          {!isCollapsed ? (
            <Link
              href="/harga"
              className="flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-muted/70 transition-colors text-foreground group border border-border/50 bg-card/40"
              title="Kelola & tingkatkan paket langganan"
            >
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/15 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    {user?.plan === 'monthly' || user?.plan === 'thesis' ? 'Paket Skripsi' : 'Upgrade Paket'}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border/60 shrink-0">
                    {getPlanBadgeLabel()}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                  {user?.plan === 'monthly' || user?.plan === 'thesis' ? 'Akses penuh seluruh uji' : 'Buka semua fitur Bab 4'}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          ) : (
            <Link
              href="/harga"
              className="flex justify-center p-2 rounded-lg hover:bg-muted transition-colors"
              title={`Paket: ${getPlanBadgeLabel()} - Klik untuk tingkatkan`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
            </Link>
          )}

          {/* Profil Akun Pengguna dengan Tooltip Penuh & Truncate Rapi */}
          <div
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors',
              isCollapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px] font-semibold text-foreground truncate"
                  title={user?.name || 'Mahasiswa'}
                >
                  {user?.name || 'Mahasiswa'}
                </p>
                <p
                  className="text-[13px] text-muted-foreground truncate"
                  title={user?.email || 'mahasiswa@kampus.ac.id'}
                >
                  {user?.email || 'mahasiswa@kampus.ac.id'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 w-full max-w-full transition-all duration-200',
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'
        )}
      >
        {/* Sticky Header Meja Kerja */}
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2">
          {/* Breadcrumb / Nav Back */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {parentRoute && (
              <Link
                href={parentRoute}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0 touch-manipulation cursor-pointer"
                aria-label="Kembali ke halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            <div className="min-w-0 flex-1 truncate" title="Navigasi Halaman">
              {renderBreadcrumb()}
            </div>
          </div>

          {/* Header Controls: Theme & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer touch-manipulation"
                  aria-label="Menu akun pengguna"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground truncate" title={user?.name || 'Mahasiswa'}>
                      {user?.name || 'Mahasiswa Demo'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate" title={user?.email || 'mahasiswa@kampus.ac.id'}>
                      {user?.email || 'mahasiswa@kampus.ac.id'}
                    </p>
                    <p className="text-[13px] text-primary font-medium mt-1 truncate">
                      {user?.university || 'Perguruan Tinggi'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/riwayat" className="flex items-center gap-2 w-full">
                    <History className="h-4 w-4 text-primary" />
                    <span>Riwayat Analisis</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/langganan" className="flex items-center gap-2 w-full">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Langganan &amp; Kuota ({getPlanBadgeLabel()})</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/bantuan" className="flex items-center gap-2 w-full">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Pusat Bantuan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/pengaturan" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Pengaturan Akun</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content: Lebar penuh max-w-[1440px] dengan padding fluid clamp(16px, 3vw, 40px) */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[clamp(16px,3vw,40px)] py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Di bawah 1024px / lg) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-1 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const isCreate = item.href === '/app/proyek/baru';
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 px-1 rounded-lg text-[13px] font-medium transition-all touch-manipulation',
                active
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  isCreate
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : active
                    ? 'bg-primary/10 text-primary'
                    : ''
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    isCreate
                      ? 'text-primary-foreground'
                      : active
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className="truncate max-w-[72px] text-[13px]">{item.shortName}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
