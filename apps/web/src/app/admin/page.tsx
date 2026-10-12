import * as React from 'react';
import { getAdminOverview } from '@/lib/admin/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';
import { OverviewCharts } from '@/components/admin/overview-charts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview({ preset: '30d' });
  const { kpis } = overview;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Ringkasan Operasional OlahData
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pemantauan kesehatan sistem, metrik operasional, dan kepatuhan privasi (30 hari terakhir).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono bg-muted/40 border-border">
            Metadata Mode &bull; Zero Raw Data Access
          </Badge>
        </div>
      </div>

      {/* 1. DENSE TYPOGRAPHY SUMMARY ROW (4 PRIMARY OPERATIONAL PILLARS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: MRR */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pendapatan Berulang (MRR)
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.mrr.value}
            </span>
            {kpis.mrr.changePct !== undefined && (
              <span className={cn(
                'text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-xs',
                kpis.mrr.trend === 'up' ? 'text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' : 'text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-950/40'
              )}>
                {kpis.mrr.trend === 'up' ? '▲' : '▼'} {Math.abs(kpis.mrr.changePct)}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between tabular-nums">
            <span>Total periode:</span>
            <span className="font-medium text-foreground">{kpis.periodRevenue.value}</span>
          </div>
        </div>

        {/* Pillar 2: Active Subscribers */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pelanggan Berbayar Aktif
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.activePaidSubscribers.value}
            </span>
            {kpis.activePaidSubscribers.changePct !== undefined && (
              <span className={cn(
                'text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-xs',
                kpis.activePaidSubscribers.trend === 'up' ? 'text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' : 'text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-950/40'
              )}>
                {kpis.activePaidSubscribers.trend === 'up' ? '▲' : '▼'} {Math.abs(kpis.activePaidSubscribers.changePct)}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between tabular-nums">
            <span>Konversi aktivasi:</span>
            <span className="font-medium text-foreground">{kpis.conversionRate.value}</span>
          </div>
        </div>

        {/* Pillar 3: Calculation Engine Reliability */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Keandalan Mesin Hitung
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.successfulRuns.value}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-xs tabular-nums">
              {100 - (Number(String(kpis.runFailureRate.value).replace('%', '')) || 0)}% Sukses
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between tabular-nums">
            <span>Tingkat galat:</span>
            <span className="font-medium text-foreground">{kpis.runFailureRate.value}</span>
          </div>
        </div>

        {/* Pillar 4: Gross Margin & Token Cost */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estimasi Margin Operasional
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.estimatedGrossMargin.value}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Sehat
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50 flex justify-between tabular-nums">
            <span>Biaya token narasi:</span>
            <span className="font-medium text-foreground">{kpis.estimatedLlmCost.value}</span>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY QUICK-SCAN METRICS STRIP */}
      <div className="rounded-md border border-border bg-muted/30 p-3 flex flex-wrap items-center justify-between gap-4 text-xs tabular-nums">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pendaftaran Baru:</span>
          <span className="font-bold text-foreground">{kpis.newSignups.value}</span>
        </div>
        <div className="h-4 w-px bg-border/80 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pengguna Aktif Harian (DAU):</span>
          <span className="font-bold text-foreground">{kpis.dau.value}</span>
        </div>
        <div className="h-4 w-px bg-border/80 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Pengguna Aktif Bulanan (MAU):</span>
          <span className="font-bold text-foreground">{kpis.mau.value}</span>
        </div>
        <div className="h-4 w-px bg-border/80 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rasio Churn:</span>
          <span className="font-bold text-foreground">{kpis.churnRate.value}</span>
        </div>
      </div>

      {/* 3. ATTENTION ITEMS (PERLU PERHATIAN SEGERA) */}
      {overview.attentionItems.length > 0 && (
        <Card className="border-amber-400/50 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 rounded-md">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-sm font-semibold">Perlu Perhatian Segera</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Item yang memerlukan pemantauan operasional atau respon tim pemilik produk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 px-4 sm:px-5 pb-4">
            {overview.attentionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xs bg-card border border-border/70 text-xs"
              >
                {item.severity === 'error' && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                {item.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                {item.severity === 'info' && <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 4. VISUAL ANALYTICS CHARTS */}
      <OverviewCharts
        dailyActivity={overview.charts.dailyActivity}
        weeklyMrr={overview.charts.weeklyMrr}
      />

      {/* 5. ACTIVATION CONVERSION FUNNEL */}
      <Card className="border-border rounded-md">
        <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Funnel Aktivasi Mahasiswa</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Perjalanan mahasiswa: Pendaftaran &rarr; Buat Proyek &rarr; Unggah Data &rarr; Analisis Sukses &rarr; Langganan/Bayar
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-5">
          <div className="space-y-2.5">
            {overview.charts.funnel.map((item, idx) => {
              const maxCount = overview.charts.funnel[0].count;
              const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));

              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.stage}</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="font-semibold">{item.count.toLocaleString('id-ID')}</span>
                      {idx > 0 && (
                        <span className="text-[11px] text-destructive">
                          -{item.dropPct}% drop-off
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted/60 rounded-xs overflow-hidden p-0.5">
                    <div
                      className="h-full bg-primary rounded-xs transition-all flex items-center px-2 text-[10px] text-primary-foreground font-mono"
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 20 && `${widthPct}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
