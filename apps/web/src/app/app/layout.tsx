'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuthStore } from '@/stores/auth-store';

const emptySubscribe = () => () => {};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    // Initialize auth session
    useAuthStore.getState().loadSession();
    const current = useAuthStore.getState().user;
    if (!current) {
      // Create a default demo session so users can directly use the app
      useAuthStore.getState().login({
        id: 'user-demo-1',
        name: 'Budi Santoso',
        email: 'budi.santoso@kampus.ac.id',
        university: 'Universitas Indonesia',
        department: 'Manajemen',
        plan: 'free',
        createdAt: '2026-10-11T00:00:00Z',
      });
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Memuat OlahData...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
