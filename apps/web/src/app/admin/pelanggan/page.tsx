'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Download,
  ExternalLink,
  ShieldAlert,
  Building,
  GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { CustomerRow } from '@/lib/admin/service';

const INITIAL_CUSTOMERS: CustomerRow[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nama: 'Budi Santoso',
    email: 'budi.santoso@ui.ac.id',
    prodi: 'Manajemen',
    kampus: 'Universitas Indonesia',
    plan: 'monthly',
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
    lastActive: '2026-10-12T08:30:00Z',
    projectsCount: 3,
    analysesCount: 8,
    totalPaid: 78000,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nama: 'Siti Rahma',
    email: 'siti.rahma@ugm.ac.id',
    prodi: 'Akuntansi',
    kampus: 'Universitas Gadjah Mada',
    plan: 'free',
    status: 'active',
    createdAt: '2026-09-15T14:20:00Z',
    lastActive: '2026-10-11T16:45:00Z',
    projectsCount: 1,
    analysesCount: 2,
    totalPaid: 0,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nama: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@itb.ac.id',
    prodi: 'Teknik Industri',
    kampus: 'Institut Teknologi Bandung',
    plan: 'thesis',
    status: 'active',
    createdAt: '2026-08-20T09:15:00Z',
    lastActive: '2026-10-12T11:00:00Z',
    projectsCount: 2,
    analysesCount: 12,
    totalPaid: 99000,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    nama: 'Dewi Lestari',
    email: 'dewi.lestari@undip.ac.id',
    prodi: 'Ilmu Komunikasi',
    kampus: 'Universitas Diponegoro',
    plan: 'free',
    status: 'active',
    createdAt: '2026-10-02T11:40:00Z',
    lastActive: '2026-10-05T14:10:00Z',
    projectsCount: 1,
    analysesCount: 1,
    totalPaid: 0,
    isTest: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    nama: 'Rian Pratama (Internal Tester)',
    email: 'rian.test@olahdata.internal',
    prodi: 'Sistem Informasi',
    kampus: 'Internal OlahData',
    plan: 'thesis',
    status: 'active',
    createdAt: '2026-08-01T08:00:00Z',
    lastActive: '2026-10-12T12:00:00Z',
    projectsCount: 10,
    analysesCount: 45,
    totalPaid: 0,
    isTest: true,
  },
];

export default function PelangganPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [excludeTest, setExcludeTest] = useState(true);

  const filteredCustomers = useMemo(() => {
    return INITIAL_CUSTOMERS.filter((c) => {
      if (excludeTest && c.isTest) return false;
      if (planFilter !== 'all' && c.plan !== planFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          c.nama.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.prodi.toLowerCase().includes(q) ||
          c.kampus.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [search, planFilter, excludeTest]);

  function exportMetadataCsv() {
    // Generates metadata CSV ONLY (Privacy compliant, NO respondent data)
    const headers = ['ID', 'Nama', 'Email', 'Prodi', 'Kampus', 'Paket', 'Status', 'Tanggal Daftar', 'Total Bayar (Rp)'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      `"${c.nama}"`,
      c.email,
      `"${c.prodi}"`,
      `"${c.kampus}"`,
      c.plan,
      c.status,
      c.createdAt.split('T')[0],
      c.totalPaid,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `metadata_pelanggan_olahdata_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Manajemen Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Daftar seluruh mahasiswa terdaftar, riwayat paket, dan ringkasan penggunaan (metadata saja).
          </p>
        </div>
        <Button onClick={exportMetadataCsv} variant="outline" size="sm" className="text-xs">
          <Download className="w-4 h-4 mr-1.5" />
          Ekspor CSV (Metadata Saja)
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, prodi, atau kampus..."
              className="pl-9 text-xs h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="all">Semua Paket</option>
                <option value="free">Paket Free (Rp0)</option>
                <option value="monthly">Paket Bulanan (Rp39.000)</option>
                <option value="thesis">Paket Skripsi (Rp99.000)</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={excludeTest}
                onCheckedChange={(val) => setExcludeTest(Boolean(val))}
              />
              <span>Sembunyikan Akun Uji</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Nama Mahasiswa</th>
                <th className="px-4 py-3">Prodi & Kampus</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3 text-right">Proyek / Uji</th>
                <th className="px-4 py-3 text-right">Total Bayar</th>
                <th className="px-4 py-3">Terdaftar</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada pelanggan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.nama}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{c.email}</div>
                      {c.isTest && (
                        <Badge variant="outline" className="mt-1 text-[9px] text-amber-600 border-amber-400">
                          Akun Uji
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-foreground">
                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{c.prodi}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span>{c.kampus}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={
                          c.plan === 'monthly'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : c.plan === 'thesis'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {c.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold">{c.projectsCount}</span>
                      <span className="text-muted-foreground text-[11px]"> / {c.analysesCount} uji</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono">
                      Rp{c.totalPaid.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {c.createdAt.split('T')[0]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href={`/admin/pelanggan/${c.id}`} className="flex items-center gap-1">
                          <span>Detail</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
