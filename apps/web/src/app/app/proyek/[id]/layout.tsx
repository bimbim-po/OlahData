import * as React from 'react';

export function generateStaticParams() {
  return [
    { id: 'sample' },
    { id: 'project-1' },
    { id: 'project-sample' },
  ];
}

export default function ProyekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
