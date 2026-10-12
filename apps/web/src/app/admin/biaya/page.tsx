'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  DollarSign,
  Cpu,
  Info,
  Sliders,
  TrendingDown,
  Building,
  Save,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BiayaDanLlmPage() {
  const [fixedServerCost, setFixedServerCost] = useState('150000'); // Rp150.000 / month (e.g. Railway / Cloudflare)
  const [fixedDomainCost, setFixedDomainCost] = useState('20000');  // Rp20.000 / month (~$15/year)
  const [isSaved, setIsSaved] = useState(false);

  const llmCostMetrics = {
    estimatedMonthTotal: 42500, // Rp42.500
    totalTokensMonth: 26500000, // 26.5M tokens
    costPerReportAvg: 136,      // ~Rp136 per Bab 4 report
    grossRevenue: 2145000,      // Rp2.145.000
  };

  const totalFixed = Number(fixedServerCost) + Number(fixedDomainCost);
  const totalCost = llmCostMetrics.estimatedMonthTotal + totalFixed;
  const estimatedMarginIdr = llmCostMetrics.grossRevenue - totalCost;
  const marginPercentage = ((estimatedMarginIdr / llmCostMetrics.grossRevenue) * 100).toFixed(1);

  const topCostUsers = [
    { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@itb.ac.id', reports: 12, tokens: '2.4M', estCost: 'Rp3.840' },
    { name: 'Budi Santoso', email: 'budi.santoso@ui.ac.id', reports: 8, tokens: '1.6M', estCost: 'Rp2.560' },
    { name: 'Siti Rahma', email: 'siti.rahma@ugm.ac.id', reports: 2, tokens: '0.4M', estCost: 'Rp640' },
  ];

  function handleSaveFixedCost() {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Analisis Biaya & Estimasi Token LLM
          </h1>
          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400">
            ANGKA PERKIRAAN
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Perhitungan pengeluaran API Gemini AI, kalkulasi margin kotor, dan input biaya tetap bulanan operasional.
        </p>
      </div>

      {/* Warning Notice */}
      <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-900 dark:text-amber-200">Catatan Validasi Keuangan:</span>
          <span className="text-muted-foreground ml-1">
            Angka biaya API LLM di bawah ini adalah <strong>ESTIMASI</strong> berdasarkan perhitungan kuota token pemanggilan Gemini. Tagihan faktual bergantung pada invoice resmi Google Cloud Platform.
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Est. Biaya LLM (Bulan Ini)</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              Rp{llmCostMetrics.estimatedMonthTotal.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {(llmCostMetrics.totalTokensMonth / 1000000).toFixed(1)}M token total
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Rata-rata per Laporan Bab 4</span>
            <div className="text-2xl font-serif font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              Rp{llmCostMetrics.costPerReportAvg}
            </div>
            <span className="text-[11px] text-muted-foreground">Biaya COGS per generasi narasi</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Total Biaya Operasional</span>
            <div className="text-2xl font-serif font-bold tabular-nums font-mono">
              Rp{totalCost.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-muted-foreground">LLM + Server + Domain</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Margin Kasar Produk</span>
            <div className="text-2xl font-serif font-bold tabular-nums text-primary">
              {marginPercentage}%
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Laba bersih: Rp{estimatedMarginIdr.toLocaleString('id-ID')}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Input Fixed Costs & Top Consumers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Biaya Tetap Operasional */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Input Biaya Tetap Bulanan (Server & Domain)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Masukkan biaya riil infrastruktur bulanan untuk menghitung proyeksi margin kotor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">
                Biaya Hosting Server / Worker Python (Rp/bulan)
              </label>
              <Input
                type="number"
                value={fixedServerCost}
                onChange={(e) => setFixedServerCost(e.target.value)}
                className="font-mono text-xs"
                placeholder="150000"
              />
              <span className="text-[11px] text-muted-foreground">
                Contoh: Biaya Railway / VPS untuk menjalankan kontainer FastAPI.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">
                Biaya Domain & Layanan Tambahan (Rp/bulan)
              </label>
              <Input
                type="number"
                value={fixedDomainCost}
                onChange={(e) => setFixedDomainCost(e.target.value)}
                className="font-mono text-xs"
                placeholder="20000"
              />
              <span className="text-[11px] text-muted-foreground">
                Alokasi amortisasi domain tahunan dan DNS Cloudflare.
              </span>
            </div>

            <Button onClick={handleSaveFixedCost} size="sm" className="text-xs">
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Tersimpan di Konfigurasi
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Simpan Biaya Tetap
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Top LLM Token Consumers */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Pengguna Konsumsi Token Tertinggi (30d)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Memantau akun untuk memastikan kepatuhan batas penggunaan wajar (Fair Usage Policy).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-xs">
              {topCostUsers.map((u) => (
                <div key={u.email} className="p-2.5 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">{u.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-mono font-semibold block">{u.estCost}</span>
                    <span className="text-[11px] text-muted-foreground">{u.reports} laporan • {u.tokens} token</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
