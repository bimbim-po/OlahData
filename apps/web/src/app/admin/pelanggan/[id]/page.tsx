'use client';

import * as React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  ShieldCheck,
  Building,
  GraduationCap,
  Clock,
  Layers,
  Activity,
  FileText,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActionDialog } from '@/components/admin/action-dialog';

export default function PelangganDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = (params?.id as string) || '00000000-0000-0000-0000-000000000001';

  // State for active action dialog
  const [actionType, setActionType] = useState<
    'extend' | 'change_plan' | 'refund' | 'suspend' | 'note' | 'delete' | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mock detail data
  const customer = {
    id: customerId,
    nama: 'Budi Santoso',
    email: 'budi.santoso@ui.ac.id',
    prodi: 'Manajemen Pemasaran',
    kampus: 'Universitas Indonesia',
    plan: 'monthly',
    status: 'active',
    createdAt: '2026-09-01T10:00:00Z',
    planExpiresAt: '2026-11-01T10:00:00Z',
    totalPaid: 78000,
  };

  const subscriptions = [
    {
      id: 'sub-001',
      plan: 'monthly',
      status: 'active',
      currentPeriodEnd: '2026-11-01T10:00:00Z',
      provider: 'midtrans',
      providerRef: 'mid_sub_budi_01',
    },
  ];

  const payments = [
    {
      id: 'pay-001',
      amountIdr: 39000,
      status: 'paid',
      providerRef: 'trx_mid_budi_sep2026',
      paidAt: '2026-09-01T10:05:00Z',
    },
    {
      id: 'pay-002',
      amountIdr: 39000,
      status: 'paid',
      providerRef: 'trx_mid_budi_okt2026',
      paidAt: '2026-10-01T11:20:00Z',
    },
  ];

  // PRIVACY RULE: Only metadata! No respondent rows, no cells, no user text.
  // Note: judul skripsi is user content -> masked / labelled as Proyek ID per privacy requirement.
  const projectsMetadata = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      researchType: 'Regresi Linier Berganda',
      status: 'completed',
      nRows: 120,
      nCols: 21,
      createdAt: '2026-09-10T10:00:00Z',
      datasetKind: 'derived',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      researchType: 'Regresi Linier Berganda',
      status: 'draft',
      nRows: 150,
      nCols: 18,
      createdAt: '2026-10-05T14:30:00Z',
      datasetKind: 'original',
    },
  ];

  const recentEvents = [
    { id: 'ev-1', event: 'login', props: { method: 'email' }, createdAt: '2026-10-12T08:30:00Z' },
    { id: 'ev-2', event: 'analysis_succeeded', props: { tests_count: 9, duration_seconds: 4.2 }, createdAt: '2026-10-11T16:00:00Z' },
    { id: 'ev-3', event: 'export_created', props: { format: 'docx', watermark: false }, createdAt: '2026-10-11T16:15:00Z' },
    { id: 'ev-4', event: 'dataset_uploaded', props: { n_rows: 150, n_cols: 18 }, createdAt: '2026-10-05T14:35:00Z' },
  ];

  const [notes, setNotes] = useState([
    {
      id: 'not-1',
      adminEmail: 'bimdarmawa2@gmail.com',
      note: 'Mahasiswa menghubungi via email mengonfirmasi pembayaran paket bulanan kedua berhasil.',
      createdAt: '2026-10-01T11:30:00Z',
    },
  ]);

  const auditHistory = [
    {
      id: 'aud-1',
      adminEmail: 'bimdarmawa2@gmail.com',
      action: 'EXTEND_SUBSCRIPTION',
      reason: 'Kompensasi kendala teknis antrean worker statistik.',
      createdAt: '2026-09-15T09:00:00Z',
    },
  ];

  async function handleActionConfirm(data: { reason: string; payload: Record<string, unknown> }) {
    if (actionType === 'note') {
      setNotes((prev) => [
        {
          id: `not-${Date.now()}`,
          adminEmail: 'bimdarmawa2@gmail.com',
          note: String(data.payload.note || ''),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSuccessMessage('Catatan dukungan berhasil ditambahkan dan dicatat di audit log.');
    } else if (actionType === 'extend') {
      setSuccessMessage(`Berhasil memperpanjang masa aktif selama ${data.payload.days} hari.`);
    } else if (actionType === 'change_plan') {
      setSuccessMessage(`Paket berhasil diubah menjadi ${data.payload.plan}.`);
    } else if (actionType === 'delete') {
      setSuccessMessage('Akun pengguna berhasil dihapus secara permanen.');
      setTimeout(() => router.push('/admin/pelanggan'), 1500);
    } else {
      setSuccessMessage('Tindakan berhasil diproses dan dicatat dalam audit log.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
            <Link href="/admin/pelanggan">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                {customer.nama}
              </h1>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {customer.plan}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              ID: {customer.id}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setActionType('extend')}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Perpanjang Masa Aktif
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setActionType('change_plan')}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Ubah Paket
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setActionType('note')}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Catatan
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="text-xs"
            onClick={() => setActionType('delete')}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Hapus Akun
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Institusi & Prodi</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{customer.prodi}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Building className="w-3 h-3" />
              <span>{customer.kampus}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Masa Aktif Paket</span>
            <div className="text-sm font-semibold capitalize flex items-center gap-1.5">
              <span>Paket {customer.plan}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Berlaku hingga: {customer.planExpiresAt.split('T')[0]}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Total Transaksi</span>
            <div className="text-lg font-serif font-bold tabular-nums">
              Rp{customer.totalPaid.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {payments.length} transaksi pembayaran
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Pendaftaran</span>
            <div className="text-xs font-semibold tabular-nums">
              {customer.createdAt.split('T')[0]}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Email: {customer.email}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 text-xs">
          <TabsTrigger value="projects">Proyek (Metadata Saja)</TabsTrigger>
          <TabsTrigger value="billing">Langganan & Tagihan</TabsTrigger>
          <TabsTrigger value="activity">Timeline Aktivitas</TabsTrigger>
          <TabsTrigger value="notes">Catatan Dukungan ({notes.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Admin</TabsTrigger>
        </TabsList>

        {/* Tab 1: Proyek (METADATA SAJA) */}
        <TabsContent value="projects">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Daftar Proyek Penelitian Mahasiswa</CardTitle>
                  <CardDescription className="text-xs">
                    Mematuhi privasi ketat: hanya menampilkan metadata matriks data tanpa isi sel responden.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-[10px] text-muted-foreground">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Isi Responden Terproteksi</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2">Pengenal Proyek</th>
                      <th className="px-3 py-2">Metode Uji</th>
                      <th className="px-3 py-2 text-right">Ukuran Data</th>
                      <th className="px-3 py-2">Versi Dataset</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projectsMetadata.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          Proyek #{p.id.substring(0, 8)}
                          <span className="block text-[10px] text-muted-foreground/80 italic">
                            {/* TODO: Tampilkan judul asli hanya jika mahasiswa memberi izin pada tiket dukungan */}
                            [Judul Disamarkan Sesuai Kebijakan Privasi]
                          </span>
                        </td>
                        <td className="px-3 py-2.5">{p.researchType}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-mono">
                          {p.nRows} baris × {p.nCols} kolom
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {p.datasetKind}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                          {p.createdAt.split('T')[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Billing & Payments */}
        <TabsContent value="billing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Riwayat Langganan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {subscriptions.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold uppercase">{s.plan}</p>
                      <p className="text-muted-foreground text-[11px] font-mono">{s.providerRef}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Riwayat Pembayaran (Midtrans)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {payments.map((pay) => (
                  <div key={pay.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold tabular-nums font-mono">
                        Rp{pay.amountIdr.toLocaleString('id-ID')}
                      </p>
                      <p className="text-muted-foreground text-[11px] font-mono">{pay.providerRef}</p>
                    </div>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
                      {pay.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Activity Timeline */}
        <TabsContent value="activity">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Timeline Aktivitas Pengguna (app_events)</CardTitle>
              <CardDescription className="text-xs">
                Log audit kejadian interaksi pengguna (metadata murni).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-md border border-border/50 text-xs">
                    <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground font-mono">{ev.event}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {ev.createdAt.replace('T', ' ').substring(0, 19)} WIB
                        </span>
                      </div>
                      <pre className="mt-1 p-1.5 rounded bg-muted/60 text-[10px] font-mono overflow-x-auto text-muted-foreground">
                        {JSON.stringify(ev.props)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Support Notes */}
        <TabsContent value="notes">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Catatan Dukungan Internal</CardTitle>
              <CardDescription className="text-xs">
                Catatan khusus tim admin tentang kendala atau permintaan mahasiswa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono font-medium">{n.adminEmail}</span>
                    <span className="tabular-nums">{n.createdAt.replace('T', ' ').substring(0, 16)}</span>
                  </div>
                  <p className="text-foreground">{n.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Admin Audit Log for this user */}
        <TabsContent value="audit">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Jejak Audit Tindakan Admin</CardTitle>
              <CardDescription className="text-xs">
                Setiap perubahan pada akun ini tercatat permanen di admin_audit_log beserta alasan wajibnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {auditHistory.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {a.action}
                      </Badge>
                      <span className="text-muted-foreground tabular-nums">
                        {a.createdAt.replace('T', ' ').substring(0, 16)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      Oleh: <span className="font-mono text-foreground">{a.adminEmail}</span>
                    </p>
                    <p className="text-foreground font-medium">
                      Alasan: &ldquo;{a.reason}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <ActionDialog
        open={actionType === 'extend'}
        onOpenChange={(open) => !open && setActionType(null)}
        title="Perpanjang Masa Aktif Pelanggan"
        description="Tambahkan durasi langganan mahasiswa secara manual (misal sebagai kompensasi atau aktivasi offline)."
        actionLabel="Simpan Perpanjangan"
        fields={[
          {
            id: 'days',
            label: 'Jumlah Hari Perpanjangan',
            type: 'number',
            defaultValue: 30,
          },
        ]}
        onConfirm={handleActionConfirm}
      />

      <ActionDialog
        open={actionType === 'change_plan'}
        onOpenChange={(open) => !open && setActionType(null)}
        title="Ubah Paket Pelanggan"
        description="Ganti tingkatan paket mahasiswa. Tindakan ini akan dicatat ke admin_audit_log."
        actionLabel="Perbarui Paket"
        fields={[
          {
            id: 'plan',
            label: 'Pilih Paket Baru',
            type: 'select',
            defaultValue: 'monthly',
            options: [
              { label: 'Paket Gratis (Free)', value: 'free' },
              { label: 'Paket Bulanan (Monthly — Rp39.000)', value: 'monthly' },
              { label: 'Paket Skripsi (Thesis — Rp99.000)', value: 'thesis' },
            ],
          },
        ]}
        onConfirm={handleActionConfirm}
      />

      <ActionDialog
        open={actionType === 'note'}
        onOpenChange={(open) => !open && setActionType(null)}
        title="Tambah Catatan Dukungan Internal"
        description="Catatan ini hanya dapat dilihat oleh tim admin dan tidak dikirimkan ke mahasiswa."
        actionLabel="Simpan Catatan"
        fields={[
          {
            id: 'note',
            label: 'Isi Catatan Bantuan',
            type: 'text',
            defaultValue: '',
          },
        ]}
        onConfirm={handleActionConfirm}
      />

      <ActionDialog
        open={actionType === 'delete'}
        onOpenChange={(open) => !open && setActionType(null)}
        title="Hapus Akun Pengguna Permanen"
        description="Tindakan ini akan menghapus akun dan seluruh metadata proyek terkait sesuai permintaan hak privasi mahasiswa. Ketikkan ID pengguna untuk konfirmasi."
        actionLabel="Hapus Akun Sekarang"
        variant="destructive"
        requireIdConfirmation={customer.id}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
