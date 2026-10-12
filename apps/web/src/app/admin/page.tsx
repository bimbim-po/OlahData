import * as React from 'react';
import { getAdminOverview } from '@/lib/admin/service';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { OverviewCharts } from '@/components/admin/overview-charts';

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview({ preset: '30d' });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
          Ringkasan Eksekutif
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Pemantauan metrik operasional, traksi pengguna, dan pendapatan OlahData (30 hari terakhir).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard metric={overview.kpis.mrr} />
        <KpiCard metric={overview.kpis.periodRevenue} />
        <KpiCard metric={overview.kpis.activePaidSubscribers} />
        <KpiCard metric={overview.kpis.conversionRate} />
        <KpiCard metric={overview.kpis.newSignups} />
        <KpiCard metric={overview.kpis.dau} />
        <KpiCard metric={overview.kpis.successfulRuns} />
        <KpiCard metric={overview.kpis.runFailureRate} />
        <KpiCard metric={overview.kpis.churnRate} />
        <KpiCard metric={overview.kpis.estimatedLlmCost} />
        <KpiCard metric={overview.kpis.estimatedGrossMargin} />
        <KpiCard metric={overview.kpis.mau} />
      </div>

      {/* Attention Items (Perlu Perhatian) */}
      {overview.attentionItems.length > 0 && (
        <Card className="border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-sm font-semibold">Perlu Perhatian Segera</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Item yang memerlukan pemantauan atau tindak lanjut tim operasional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {overview.attentionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/60 text-xs"
              >
                {item.severity === 'error' && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                {item.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                {item.severity === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Visual Analytics Charts (Client Component) */}
      <OverviewCharts
        dailyActivity={overview.charts.dailyActivity}
        weeklyMrr={overview.charts.weeklyMrr}
      />

      {/* Activation Conversion Funnel */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Funnel Aktivasi Mahasiswa</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Perjalanan mahasiswa: Pendaftaran → Buat Proyek → Unggah Data → Analisis Sukses → Langganan/Bayar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
                        <span className="text-[11px] text-red-600 dark:text-red-400">
                          -{item.dropPct}% drop-off
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-5 w-full bg-muted/60 rounded-md overflow-hidden p-0.5">
                    <div
                      className="h-full bg-primary/80 rounded-sm transition-all flex items-center px-2 text-[10px] text-primary-foreground font-mono"
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
