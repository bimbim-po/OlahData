import * as React from 'react';
import type { Metadata } from 'next';
import { assertAdminServer } from '@/lib/admin/auth';
import { AdminShell } from '@/components/admin/admin-shell';

export const metadata: Metadata = {
  title: 'Admin Console — OlahData',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stealth security: verifies session, whitelist email, verification, and MFA.
  // Throws notFound() if unauthorized so non-admins receive a genuine 404.
  const session = await assertAdminServer();

  return (
    <AdminShell adminEmail={session.email} adminRole={session.role}>
      {children}
    </AdminShell>
  );
}
