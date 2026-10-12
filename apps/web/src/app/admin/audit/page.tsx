'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  Lock,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string;
  ip: string | null;
  createdAt: string;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    adminEmail: 'bimdarmawa2@gmail.com',
    action: 'EXTEND_SUBSCRIPTION',
    entity: 'profiles',
    entityId: 'usr-001-ananda',
    before: { plan_expires_at: '2026-10-15T00:00:00Z' },
    after: { extendedDays: 30, newExpiry: '2026-11-14T00:00:00Z' },
    reason: 'Kompensasi perbaikan antrean analisis macet selama insiden 10 Okt.',
    ip: '180.244.135.22',
    createdAt: '2026-10-12T10:45:00Z',
  },
  {
    id: 'aud-002',
    adminEmail: 'vrimae23@gmail.com',
    action: 'UPDATE_APP_CONFIG',
    entity: 'app_config',
    entityId: 'data_retention_days',
    before: { value: 60 },
    after: { value: 90 },
    reason: 'Penyesuaian kebijakan retensi data kuesioner mahasiswa skripsi semester ganjil.',
    ip: '114.122.45.10',
    createdAt: '2026-10-11T16:20:00Z',
  },
  {
    id: 'aud-003',
    adminEmail: 'bimdarmawa2@gmail.com',
    action: 'UPDATE_PLAN_LIMIT',
    entity: 'plan_limits',
    entityId: 'free:max_respondents',
    before: { value: 150 },
    after: { value: 200 },
    reason: 'Menaikkan kuota responden free tier untuk onboarding mahasiswa baru.',
    ip: '180.244.135.22',
    createdAt: '2026-10-10T14:15:00Z',
  },
  {
    id: 'aud-004',
    adminEmail: 'bimdarmawa2@gmail.com',
    action: 'CHANGE_PLAN',
    entity: 'profiles',
    entityId: 'usr-003-rizky',
    before: { plan: 'free' },
    after: { plan: 'thesis' },
    reason: 'Aktivasi manual paket skripsi via transfer verifikasi bank darurat.',
    ip: '180.244.135.22',
    createdAt: '2026-10-09T09:30:00Z',
  },
  {
    id: 'aud-005',
    adminEmail: 'vrimae23@gmail.com',
    action: 'TOGGLE_FEATURE_FLAG',
    entity: 'app_config',
    entityId: 'enable_pdf_export',
    before: { value: false },
    after: { value: true },
    reason: 'Rilis fitur ekspor PDF berformat APA 7 ke pengguna publik.',
    ip: '114.122.45.10',
    createdAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'aud-006',
    adminEmail: 'bimdarmawa2@gmail.com',
    action: 'ADD_SUPPORT_NOTE',
    entity: 'support_notes',
    entityId: 'usr-002-siti',
    before: null,
    after: { note: 'Pengguna menanyakan interpretasi uji regresi moderasi.' },
    reason: 'Mencatat tiket keluhan via WhatsApp support.',
    ip: '180.244.135.22',
    createdAt: '2026-10-07T15:10:00Z',
  },
];

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [detailModal, setDetailModal] = useState<AuditLogEntry | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (selectedAction !== 'all' && l.action !== selectedAction) return false;
      if (selectedAdmin !== 'all' && l.adminEmail !== selectedAdmin) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inReason = l.reason.toLowerCase().includes(q);
        const inEntity = l.entity.toLowerCase().includes(q);
        const inEntityId = (l.entityId || '').toLowerCase().includes(q);
        const inAdmin = l.adminEmail.toLowerCase().includes(q);
        if (!inReason && !inEntity && !inEntityId && !inAdmin) return false;
      }
      return true;
    });
  }, [logs, selectedAction, selectedAdmin, search]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action)));
  }, [logs]);

  const uniqueAdmins = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.adminEmail)));
  }, [logs]);

  function handleExportCsv() {
    const headers = ['ID', 'Admin Email', 'Action', 'Entity', 'Entity ID', 'Reason', 'IP', 'Created At'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.adminEmail,
      l.action,
      l.entity,
      l.entityId || '',
      `"${l.reason.replace(/"/g, '""')}"`,
      l.ip || '',
      l.createdAt,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight">Audit Log Keamanan</h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs gap-1">
              <Lock className="w-3 h-3" /> WORM / Immutable
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Jejak permanen setiap mutasi administratif. Seluruh tindakan wajib menyertakan alasan dan tersimpan tanpa opsi hapus.
          </p>
        </div>
        <Button onClick={handleExportCsv} variant="outline" className="gap-2 text-xs shrink-0 self-start sm:self-auto">
          <Download className="w-3.5 h-3.5" />
          Ekspor Log (CSV)
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari alasan, entitas, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-xs"
              >
                <option value="all">Semua Jenis Aksi</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-xs"
              >
                <option value="all">Semua Admin</option>
                {uniqueAdmins.map((adm) => (
                  <option key={adm} value={adm}>
                    {adm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-sm font-medium">
                Riwayat Tindakan Administratif ({filteredLogs.length})
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-y border-border">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Waktu (WIB)</th>
                  <th className="py-2.5 px-4 font-medium">Admin</th>
                  <th className="py-2.5 px-4 font-medium">Aksi</th>
                  <th className="py-2.5 px-4 font-medium">Entitas & Target</th>
                  <th className="py-2.5 px-4 font-medium">Alasan Wajib</th>
                  <th className="py-2.5 px-4 font-medium">IP</th>
                  <th className="py-2.5 px-4 font-medium text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Tidak ada catatan audit yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{log.adminEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] tracking-tight bg-card"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-muted-foreground">{log.entity}</span>
                        {log.entityId && (
                          <span className="ml-1 font-mono text-[11px] text-foreground font-medium">
                            ({log.entityId})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={log.reason}>
                        <span className="text-foreground">{log.reason}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {log.ip || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailModal(log)}
                          className="h-7 px-2 text-[11px] gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Diff</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Snapshot Diff Modal */}
      {detailModal && (
        <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-base flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Detail Snapshot Audit #{detailModal.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Aksi: <strong className="font-mono">{detailModal.action}</strong> oleh{' '}
                <strong className="text-foreground">{detailModal.adminEmail}</strong> pada{' '}
                {new Date(detailModal.createdAt).toLocaleString('id-ID')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                <span className="text-muted-foreground block text-[11px] font-medium">Alasan Tindakan:</span>
                <p className="text-foreground italic">{detailModal.reason}</p>
                {detailModal.ip && (
                  <span className="text-[11px] font-mono text-muted-foreground block mt-1">
                    IP Pengakses: {detailModal.ip}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Sebelum (Before)</span>
                  <pre className="p-2.5 rounded-md bg-muted/60 border border-border font-mono text-[11px] text-foreground overflow-x-auto max-h-48">
                    {detailModal.before ? JSON.stringify(detailModal.before, null, 2) : 'null (Entitas baru / tanpa state awal)'}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Sesudah (After)</span>
                  <pre className="p-2.5 rounded-md bg-emerald-950/20 border border-emerald-800/30 font-mono text-[11px] text-foreground overflow-x-auto max-h-48">
                    {detailModal.after ? JSON.stringify(detailModal.after, null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
