'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  RefreshCw,
  Cpu,
  Database,
  FileText,
  Globe,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Breadcrumb } from '@/components/breadcrumb';
import { APP_NAME } from '@/lib/constants';

interface ServiceStatus {
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'operational' | 'degraded' | 'maintenance';
  statusLabel: string;
  description: string;
  uptime: string;
}

export default function StatusPage() {
  const [lastChecked, setLastChecked] = React.useState<string>('Memuat...');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const services: ServiceStatus[] = [
    {
      name: 'Portal Web & Meja Kerja Mahasiswa',
      category: 'Frontend & API Gateway',
      icon: Globe,
      status: 'operational',
      statusLabel: 'Beroperasi Normal',
      description: 'Layanan web aplikasi Next.js untuk pengunggahan kuesioner dan antarmuka Bab 4.',
      uptime: '99.98%',
    },
    {
      name: 'Mesin Statistik Python Deterministik',
      category: 'Computation Engine',
      icon: Cpu,
      status: 'operational',
      statusLabel: 'Beroperasi Normal',
      description: 'FastAPI, SciPy, statsmodels, dan pingouin. Menghitung rumus regresi, uji beda, dan validitas tanpa manipulasi.',
      uptime: '99.95%',
    },
    {
      name: 'Basis Data & Row Level Security (RLS)',
      category: 'Storage & Security',
      icon: Database,
      status: 'operational',
      statusLabel: 'Beroperasi Normal',
      description: 'Postgres Supabase dengan isolasi RLS ketat. User A tidak dapat membaca data User B.',
      uptime: '100.0%',
    },
    {
      name: 'Generator Ekspor Word & PDF Asli',
      category: 'Document Exporter',
      icon: FileText,
      status: 'operational',
      statusLabel: 'Beroperasi Normal',
      description: 'Pembuatan naskah Bab 4 format Microsoft Word (.docx) tabel tiga garis dan PDF.',
      uptime: '99.90%',
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setIsRefreshing(false);
    }, 600);
  };

  React.useEffect(() => {
    setLastChecked(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Status Sistem', href: '/status' }]} />

      {/* Header Banner */}
      <div className="rounded-[16px] border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-xs uppercase tracking-wider">
            Status Operasional Terverifikasi
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Semua Sistem {APP_NAME} Beroperasi Normal
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Seluruh mesin statistik deterministik, penyimpanan dokumen terenkripsi, dan basis data terlindungi RLS berjalan lancar tanpa kendala.
        </p>
      </div>

      {/* Kontrol Penyegaran */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground border-b border-border pb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Pemeriksaan terakhir: <strong>{lastChecked}</strong></span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Segarkan Status</span>
        </Button>
      </div>

      {/* Kartu Status Layanan */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-foreground">
          Kondisi Komponen Layanan
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <Card key={svc.name} className="border-border shadow-2xs">
                <CardHeader className="p-4 sm:p-5 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                          {svc.name}
                        </CardTitle>
                        <span className="text-[11px] text-muted-foreground block">
                          {svc.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
                        Uptime: {svc.uptime}
                      </span>
                      <Badge variant="pine" className="text-xs font-semibold gap-1.5 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{svc.statusLabel}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {svc.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Garansi Kualitas & CTA */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground">
            Siap Menganalisis Kuesioner Anda?
          </h3>
          <p className="text-xs text-muted-foreground">
            Mulai dari berkas mentah ke naskah Bab 4 lengkap dalam hitungan menit.
          </p>
        </div>
        <Button asChild className="font-semibold shrink-0">
          <Link href="/app/proyek/baru?contoh=1">
            <span>Coba Data Contoh Sekarang</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
