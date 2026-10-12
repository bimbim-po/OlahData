import * as React from 'react';

export function generateStaticParams() {
  return [
    { id: '00000000-0000-0000-0000-000000000001' },
    { id: '00000000-0000-0000-0000-000000000002' },
    { id: 'sample' },
  ];
}

export default function PelangganDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
