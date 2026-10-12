'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Server,
  DollarSign,
  Sliders,
  ShieldAlert,
  LogOut,
  Calendar,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import type { AdminRoleT } from '@/lib/db.types';

interface AdminShellProps {
  children: React.ReactNode;
  adminEmail: string;
  adminRole: AdminRoleT;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/pelanggan', label: 'Pelanggan', icon: Users },
  { href: '/admin/langganan', label: 'Langganan & Pembayaran', icon: CreditCard },
  { href: '/admin/aktivitas', label: 'Aktivitas', icon: Activity },
  { href: '/admin/sistem', label: 'Analisis & Sistem', icon: Server },
  { href: '/admin/biaya', label: 'Biaya', icon: DollarSign },
  { href: '/admin/pengaturan', label: 'Pengaturan Produk', icon: Sliders },
  { href: '/admin/audit', label: 'Audit Log', icon: ShieldAlert },
];

export function AdminShell({ children, adminEmail, adminRole }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<'7d' | '30d' | '90d'>('30d');

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="h-16 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-serif font-bold text-base">
              Ω
            </div>
            <div>
              <div className="font-serif font-bold text-sm tracking-tight flex items-center gap-1.5">
                <span>OlahData</span>
                <span className="text-[10px] font-sans font-semibold uppercase px-1.5 py-0.2 rounded-sm bg-muted text-muted-foreground">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">Owner Console</p>
            </div>
          </div>
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-muted-foreground truncate max-w-[130px] font-mono text-[11px]">
                {adminEmail}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] uppercase font-mono px-1 py-0 border-emerald-600/40 text-emerald-600 dark:text-emerald-400"
              >
                {adminRole}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>MFA Terverifikasi</span>
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Keluar ke Situs Publik
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Badge
                variant={isProduction ? 'default' : 'secondary'}
                className={cn(
                  'text-[10px] font-mono uppercase tracking-wider',
                  isProduction
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                )}
              >
                {isProduction ? 'PROD' : 'DEV'}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Zona Waktu: Asia/Jakarta (WIB)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Date Range Selector */}
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
              <Calendar className="w-3.5 h-3.5 ml-2 mr-1 text-muted-foreground" />
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDateRange(r)}
                  className={cn(
                    'px-2 py-1 rounded-md transition-colors text-[11px] font-medium',
                    dateRange === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r === '7d' ? '7 Hari' : r === '30d' ? '30 Hari' : '90 Hari'}
                </button>
              ))}
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
