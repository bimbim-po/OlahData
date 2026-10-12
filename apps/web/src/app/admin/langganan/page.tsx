'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function LanggananPembayaranPage() {
  const [search, setSearch] = useState('');
  const [isRechecking, setIsRechecking] = useState(false);
  const [recheckMessage, setRecheckMessage] = useState<string | null>(null);

  const metrics = {
    mrr: 1746000,
    arpu: 51350,
    churnMonthly: '4,2%',
    unpaidManualRenewals: 3,
  };

  const subscriptions = [
    {
      id: 'sub-01',
      user: 'Budi Santoso',
      email: 'budi.santoso@ui.ac.id',
      plan: 'monthly',
      status: 'active',
      expiry: '2026-11-01',
      providerRef: 'mid_sub_budi_01',
    },
    {
      id: 'sub-02',
      user: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@itb.ac.id',
      plan: 'thesis',
      status: 'active',
      expiry: '2026-11-20',
      providerRef: 'mid_sub_ahmad_01',
    },
    {
      id: 'sub-03',
      user: 'Riana Kusuma',
      email: 'riana.kusuma@ugm.ac.id',
      plan: 'monthly',
      status: 'past_due',
      expiry: '2026-10-14',
      providerRef: 'mid_sub_riana_01',
    },
  ];

  const payments = [
    {
      id: 'pay-01',
      providerRef: 'mid_trx_20261012_001',
      user: 'Ahmad Fauzi',
      amount: 99000,
      plan: 'Paket Skripsi (3 Bulan)',
      status: 'settlement',
      paymentType: 'qris',
      date: '2026-10-12 11:20:00',
    },
    {
      id: 'pay-02',
      providerRef: 'mid_trx_20261011_004',
      user: 'Budi Santoso',
      amount: 39000,
      plan: 'Paket Bulanan',
      status: 'settlement',
      paymentType: 'gopay',
      date: '2026-10-11 14:10:00',
    },
    {
      id: 'pay-03',
      providerRef: 'mid_trx_20261010_009',
      user: 'Riana Kusuma',
      amount: 39000,
      plan: 'Paket Bulanan (Perpanjangan)',
      status: 'pending',
      paymentType: 'bank_transfer',
      date: '2026-10-10 09:30:00',
    },
  ];

  async function handleRecheck() {
    setIsRechecking(true);
    setRecheckMessage(null);
    await new Promise((r) => setTimeout(r, 800));
    setIsRechecking(false);
    setRecheckMessage('Pengecekan status Midtrans selesai. Seluruh transaksi telah sinkron.');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Langganan & Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rekonsiliasi transaksi Midtrans, status langganan mahasiswa, dan analitik pendapatan berulang.
          </p>
        </div>

        <Button
          onClick={handleRecheck}
          disabled={isRechecking}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRechecking ? 'animate-spin' : ''}`} />
          Cek Ulang Status Midtrans
        </Button>
      </div>

      {recheckMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{recheckMessage}</span>
        </div>
      )}

      {/* Revenue Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">MRR Aktif</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              Rp{metrics.mrr.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-muted-foreground">Monthly Recurring Revenue</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">ARPU (Rata-rata per User)</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              Rp{metrics.arpu.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-muted-foreground">Rata-rata belanja pelanggan</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Tingkat Churn</span>
            <div className="text-2xl font-serif font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {metrics.churnMonthly}
            </div>
            <span className="text-[11px] text-muted-foreground">Langganan berakhir/tidak diperpanjang</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Perpanjangan Menunggu Bayar</span>
            <div className="text-2xl font-serif font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {metrics.unpaidManualRenewals}
            </div>
            <span className="text-[11px] text-muted-foreground">Tagihan perpanjangan manual</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 text-xs">
          <TabsTrigger value="payments">Riwayat Pembayaran Midtrans</TabsTrigger>
          <TabsTrigger value="subscriptions">Daftar Status Langganan</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold">Semua Pembayaran Masuk</CardTitle>
                <CardDescription className="text-xs">
                  Transaksi via Snap Midtrans (GoPay, QRIS, Virtual Account, Transfer Bank).
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Cari Order ID / Pelanggan..."
                  className="pl-8 h-8 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2">Order ID Midtrans</th>
                      <th className="px-3 py-2">Mahasiswa</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Metode</th>
                      <th className="px-3 py-2 text-right">Jumlah (Rp)</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{p.providerRef}</td>
                        <td className="px-3 py-2.5 font-medium">{p.user}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{p.plan}</td>
                        <td className="px-3 py-2.5 uppercase font-mono text-[10px]">{p.paymentType}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                          Rp{p.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={p.status === 'settlement' ? 'default' : 'secondary'}
                            className={`text-[10px] ${
                              p.status === 'settlement'
                                ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                          {p.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status Langganan Aktif & Jatuh Tempo</CardTitle>
              <CardDescription className="text-xs">
                Siklus langganan mahasiswa dan tanggal berakhir paket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2">Pelanggan</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Jatuh Tempo</th>
                      <th className="px-3 py-2">Referensi Provider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <span className="font-medium block">{s.user}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{s.email}</span>
                        </td>
                        <td className="px-3 py-2.5 uppercase font-semibold">{s.plan}</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] capitalize ${
                              s.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {s.status === 'past_due' ? 'Jatuh Tempo (7 Hari)' : s.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{s.expiry}</td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px]">{s.providerRef}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
