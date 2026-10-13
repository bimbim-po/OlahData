import * as React from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative selection:bg-primary/20">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 focus:outline-none"
      >
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
