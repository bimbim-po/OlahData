'use client';

import React from 'react';
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
} from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
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
    name: 'Proyek baru',
    shortName: 'Proyek baru',
    href: '/app/proyek/baru',
    icon: PlusCircle,
    isActive: (pathname: string) => pathname === '/app/proyek/baru',
  },
  {
    name: 'Riwayat',
    shortName: 'Riwayat',
    href: '/app/langganan',
    icon: CreditCard,
    isActive: (pathname: string) => pathname.startsWith('/app/langganan'),
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
    href: '/pernyataan-penggunaan',
    icon: BookOpen,
    isActive: (pathname: string) =>
      pathname.startsWith('/pernyataan-penggunaan') ||
      pathname.startsWith('/panduan'),
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

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

  // Logika tombol kembali konsisten pada halaman bertingkat
  const getParentRoute = () => {
    if (pathname === '/app/proyek/baru' || pathname.startsWith('/app/proyek/')) {
      return '/app';
    }
    if (pathname.startsWith('/app/langganan') || pathname.startsWith('/app/pengaturan')) {
      return '/app';
    }
    return null;
  };

  const parentRoute = getParentRoute();

  const renderBreadcrumb = () => {
    if (pathname === '/app') {
      return <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Meja Kerja Skripsi</h1>;
    }
    if (pathname === '/app/proyek/baru') {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">Unggah & Validasi Baru</span>
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
          <span className="font-semibold text-foreground truncate">Pemetaan & Analisis</span>
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
    if (pathname.startsWith('/app/langganan')) {
      return <h1 className="text-base sm:text-lg font-bold text-foreground">Langganan & Kuota</h1>;
    }
    if (pathname.startsWith('/app/pengaturan')) {
      return <h1 className="text-base sm:text-lg font-bold text-foreground">Pengaturan Akun</h1>;
    }
    return <span className="font-semibold text-foreground">OlahData</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar (lg:w-64) & Tablet Rail (md:w-20 lg:hidden) */}
      <aside className="hidden md:flex flex-col border-r border-sidebar-border bg-sidebar-bg shrink-0 h-screen sticky top-0 transition-all duration-200 md:w-20 lg:w-64">
        {/* Top Logo & App Title */}
        <div className="p-4 lg:p-6 border-b border-sidebar-border/70 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5 group w-full justify-center lg:justify-start">
            <div className="relative flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shrink-0">
              <LogoIcon size={32} />
            </div>
            <div className="hidden lg:block min-w-0">
              <div className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                {APP_NAME}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                v{APP_VERSION}
              </div>
            </div>
          </Link>
        </div>

        {/* Tombol Proyek Baru Selalu Terlihat */}
        <div className="p-3 lg:px-3 lg:pt-3 lg:pb-1">
          <Button
            asChild
            className="w-full justify-center lg:justify-start gap-2.5 font-bold shadow-xs min-h-[44px] h-11 rounded-lg"
          >
            <Link href="/app/proyek/baru" title="Mulai Proyek Baru">
              <PlusCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">Proyek Baru</span>
            </Link>
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 lg:px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors justify-center lg:justify-start ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="hidden lg:inline truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar User Summary */}
        <div className="p-3 lg:p-4 border-t border-sidebar-border/70 bg-secondary/30">
          <div className="hidden lg:flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Paket Anda</span>
            <Badge
              variant={user?.plan === 'monthly' || user?.plan === 'thesis' ? 'success' : 'secondary'}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              {getPlanBadgeLabel()}
            </Badge>
          </div>
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="hidden lg:block min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Mahasiswa'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.university || 'Perguruan Tinggi'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-border bg-card/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2">
          {/* Back Button (Mobile & Tablet) + Breadcrumbs / Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {parentRoute && (
              <Link
                href={parentRoute}
                className="inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors shrink-0 touch-manipulation cursor-pointer"
                aria-label="Kembali ke halaman sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0 flex-1 truncate">
              {renderBreadcrumb()}
            </div>
          </div>

          {/* Header Actions: Theme Toggle & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer touch-manipulation"
                  aria-label="Menu akun pengguna"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground truncate">
                      {user?.name || 'Mahasiswa Demo'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email || 'mahasiswa@kampus.ac.id'}
                    </p>
                    <p className="text-[11px] text-primary font-medium mt-1 truncate">
                      {user?.university || 'Universitas'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/langganan" className="flex items-center gap-2 w-full">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Langganan ({getPlanBadgeLabel()})</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/pengaturan" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
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

        {/* Page Content with bottom padding compensation for mobile bottom nav */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed Bottom 56-64px with Safe Area) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-1 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const isCreate = item.href === '/app/proyek/baru';
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] py-1 px-1 rounded-lg text-[10px] font-medium transition-all touch-manipulation ${
                active
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isCreate
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : active
                    ? 'bg-primary/10 text-primary'
                    : ''
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isCreate
                      ? 'text-primary-foreground'
                      : active
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <span className="truncate max-w-[64px]">{item.shortName}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
