'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuthStore } from '@/stores/auth-store';

const emptySubscribe = () => () => {};

function AppLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background flex" aria-busy="true" aria-label="Memuat meja kerja">
      {/* Sidebar Skeleton (hidden on mobile) */}
      <div className="hidden md:flex w-64 flex-col border-r border-border p-4 space-y-6 shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-28 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/60 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/60 animate-pulse" />
          <div className="h-9 w-full rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="mt-auto pt-4 border-t border-border space-y-2">
          <div className="h-10 w-full rounded-md bg-muted/60 animate-pulse" />
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="h-5 w-36 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted/60 animate-pulse" />
          <div className="h-64 w-full rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted/50 animate-pulse" />
            <div className="h-10 w-full rounded bg-muted/50 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, login, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!ready) return;

    const isDemoMode = searchParams.get('contoh') === '1';

    // Periksa keberadaan sesi lokal langsung dari localStorage untuk mencegah bouncing
    let hasLocalSession = false;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('olahdata-session');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) hasLocalSession = true;
        }
      } catch {
        // ignore
      }
    }

    // Mode demo: buat sesi demo otomatis bila belum ada pengguna
    if (isDemoMode && !user && !isLoading) {
      login({
        id: 'user-demo-1',
        name: 'Mode Tamu (Demo)',
        email: 'demo@olahdata.id',
        university: 'Universitas Indonesia',
        department: 'Manajemen',
        plan: 'free',
        createdAt: '2026-10-11T00:00:00Z',
      });
      return;
    }

    // Bila belum login, tidak ada sesi lokal, dan bukan mode demo: arahkan ke /masuk?lanjut=<alamat asal>
    if (!isLoading && !user && !hasLocalSession && !isDemoMode) {
      const search = searchParams.toString();
      const returnUrl = search ? `${pathname}?${search}` : pathname;
      router.replace(`/masuk?lanjut=${encodeURIComponent(returnUrl)}`);
    }
  }, [ready, isLoading, user, searchParams, pathname, router, login]);

  const isDemoMode = searchParams.get('contoh') === '1';

  let hasLocalSession = false;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('olahdata-session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) hasLocalSession = true;
      }
    } catch {
      // ignore
    }
  }

  if (!ready || (isLoading && !user && !hasLocalSession) || (!user && !hasLocalSession && !isDemoMode)) {
    return <AppLayoutSkeleton />;
  }

  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<AppLayoutSkeleton />}>
      <AppAuthGuard>{children}</AppAuthGuard>
    </React.Suspense>
  );
}
