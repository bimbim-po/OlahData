'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FolderKanban,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeToggle } from '@/components/theme-toggle';
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
    href: '/app',
    icon: FolderKanban,
    isActive: (pathname: string) => pathname === '/app' || pathname.startsWith('/app/proyek'),
  },
  {
    name: 'Panduan',
    href: '/pernyataan-penggunaan',
    icon: BookOpen,
    isActive: (pathname: string) => pathname.startsWith('/pernyataan-penggunaan') || pathname.startsWith('/panduan'),
  },
  {
    name: 'Langganan',
    href: '/app/langganan',
    icon: CreditCard,
    isActive: (pathname: string) => pathname.startsWith('/app/langganan'),
  },
  {
    name: 'Pengaturan',
    href: '/app/pengaturan',
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith('/app/pengaturan'),
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

  const renderBreadcrumb = () => {
    if (pathname === '/app') {
      return <span className="font-semibold text-foreground">Proyek Saya</span>;
    }
    if (pathname === '/app/proyek/baru') {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">Proyek Baru</span>
        </div>
      );
    }
    if (pathname.startsWith('/app/proyek/')) {
      return (
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            Proyek
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
            Detail Analisis
          </span>
        </div>
      );
    }
    if (pathname.startsWith('/app/langganan')) {
      return <span className="font-semibold text-foreground">Langganan</span>;
    }
    if (pathname.startsWith('/app/pengaturan')) {
      return <span className="font-semibold text-foreground">Pengaturan</span>;
    }
    return <span className="font-semibold text-foreground">Dashboard</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar (w-64) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar-bg shrink-0 h-screen sticky top-0">
        {/* Top Logo & App Title */}
        <div className="p-6 border-b border-sidebar-border/70 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif font-bold text-lg shadow-sm">
              OD
            </div>
            <div>
              <div className="font-serif font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                {APP_NAME}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                v{APP_VERSION}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar User Summary */}
        <div className="p-4 border-t border-sidebar-border/70 bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Paket Anda</span>
            <Badge
              variant={user?.plan === 'monthly' || user?.plan === 'thesis' ? 'success' : 'secondary'}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              {getPlanBadgeLabel()}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
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
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          {/* Breadcrumbs / Title */}
          <div className="flex items-center gap-2 min-w-0">
            {renderBreadcrumb()}
          </div>

          {/* Header Actions: Theme Toggle & User Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
                      {user?.university || 'Universitas Indonesia'}
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

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (< 768px) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-card/95 backdrop-blur-md px-2 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[60px] py-1 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                active
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
