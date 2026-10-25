'use client';

import * as React from 'react';
import { useEffect } from 'react';

interface ProyekPageProps {
  params: Promise<{ id: string }>;
}

export default function ProyekIndexPage({ params }: ProyekPageProps) {
  const resolved = React.use(params);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/app\/proyek\/([^/]+)/);
      const trueId = match && match[1] ? match[1] : resolved.id;
      window.location.replace(`/app/proyek/${trueId}/analisis${window.location.search || ''}`);
    }
  }, [resolved.id]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Mengarahkan ke meja kerja analisis...
    </div>
  );
}
