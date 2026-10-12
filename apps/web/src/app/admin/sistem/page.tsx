'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Clock,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SistemDanAnalisisPage() {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retrySuccess, setRetrySuccess] = useState<string | null>(null);

  const systemStatus = {
    pythonEngine: { status: 'healthy', version: '1.0.0-beta', latencyMs: 14, host: 'FastAPI Python 3.10' },
    supabaseDb: { status: 'healthy', latencyMs: 22, host: 'Postgres 15 with RLS' },
    geminiApi: { status: 'healthy', latencyMs: 420, model: 'gemini-2.5-pro' },
  };

  const queueMetrics = {
    depth: 0,
    running: 1,
    avgDurationP50: '3,8 dtk',
    avgDurationP95: '6,2 dtk',
  };

  const testBreakdown = [
    { name: 'Uji Validasi (Pearson Correlation)', total: 320, failRate: '0,0%' },
    { name: 'Uji Reliabilitas (Cronbach Alpha)', total: 320, failRate: '0,0%' },
    { name: 'Uji Normalitas (Kolmogorov-Smirnov)', total: 318, failRate: '0,6%' },
    { name: 'Uji Multikolinearitas (VIF / Tolerance)', total: 316, failRate: '0,0%' },
    { name: 'Uji Heteroskedastisitas (Glejser)', total: 315, failRate: '0,3%' },
    { name: 'Regresi Linier Berganda (OLS)', total: 312, failRate: '0,0%' },
  ];

  const numberGuardStats = {
    passRate: '97,8%',
    totalChecked: 312,
    rejectedAttempts: 7,
    avgAttempts: '1,02',
    topRejectionReason: 'Format angka koma desimal tidak sesuai tabel Bab 4',
  };

  const [failedRuns, setFailedRuns] = useState([
    {
      id: 'r-fail-001',
      userId: '00000000-0000-0000-0000-000000000004',
      userName: 'Dewi Lestari',
      tests: ['normality'],
      errorCode: 'INSUFFICIENT_VARIANCE',
      errorMessage: 'Varians nilai jawaban pada kolom X1_3 bernilai 0 (semua responden menjawab angka yang sama)',
      createdAt: '2026-10-10 14:20:00',
    },
  ]);

  async function handleRetry(runId: string) {
    setRetryingId(runId);
    await new Promise((r) => setTimeout(r, 1000));
    setFailedRuns((prev) => prev.filter((r) => r.id !== runId));
    setRetryingId(null);
    setRetrySuccess(`Run ${runId} berhasil dikembalikan ke antrean queued untuk diproses ulang oleh worker.`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
          Kesehatan Sistem & Mesin Statistik
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Pemantauan antrean analisis deterministik, uptime microservice, dan statistik Penjaga Angka (Number Guard).
        </p>
      </div>

      {retrySuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs">
          <Check className="w-4 h-4 shrink-0" />
          <span>{retrySuccess}</span>
        </div>
      )}

      {/* Services Health Check Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold">Mesin Statistik (Python)</CardTitle>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
              ONLINE
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1 text-xs">
            <div className="text-lg font-serif font-bold">FastAPI {systemStatus.pythonEngine.version}</div>
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Latency: {systemStatus.pythonEngine.latencyMs} ms</span>
              <span className="font-mono">Port 8000</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold">Database (Supabase)</CardTitle>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
              ONLINE
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1 text-xs">
            <div className="text-lg font-serif font-bold">PostgreSQL 15</div>
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Latency: {systemStatus.supabaseDb.latencyMs} ms</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% RLS Aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold">Penyedia LLM (Gemini)</CardTitle>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px]">
              CONNECTED
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1 text-xs">
            <div className="text-lg font-serif font-bold">{systemStatus.geminiApi.model}</div>
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Response Time: {systemStatus.geminiApi.latencyMs} ms</span>
              <span>Guard Aktif</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue & Duration Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Kedalaman Antrean</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              {queueMetrics.depth} run
            </div>
            <span className="text-[11px] text-muted-foreground">Tugas queued saat ini</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Sedang Berjalan</span>
            <div className="text-2xl font-serif font-bold tabular-nums text-primary">
              {queueMetrics.running} run
            </div>
            <span className="text-[11px] text-muted-foreground">Worker paralel aktif</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Durasi Median (p50)</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              {queueMetrics.avgDurationP50}
            </div>
            <span className="text-[11px] text-muted-foreground">Rata-rata 50% eksekusi</span>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground">Durasi Batas Atas (p95)</span>
            <div className="text-2xl font-serif font-bold tabular-nums">
              {queueMetrics.avgDurationP95}
            </div>
            <span className="text-[11px] text-muted-foreground">Batas 95% beban dataset besar</span>
          </CardContent>
        </Card>
      </div>

      {/* Number Guard Integrity & Test Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Number Guard Performance */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">Integritas Penjaga Angka (Number Guard)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Mekanisme pencegah halusinasi AI: memvalidasi bahwa angka pada narasi Bab 4 persis sama dengan tabel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground">Tingkat Lolos Validasi (Pass Rate)</span>
              <span className="text-base font-serif font-bold text-emerald-600 dark:text-emerald-400">
                {numberGuardStats.passRate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg border border-border">
                <span className="text-[11px] text-muted-foreground block">Total Diperiksa</span>
                <span className="text-sm font-semibold tabular-nums">{numberGuardStats.totalChecked}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border">
                <span className="text-[11px] text-muted-foreground block">Percobaan Rata-Rata</span>
                <span className="text-sm font-semibold tabular-nums">{numberGuardStats.avgAttempts}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-[11px]">
              <span className="font-semibold block text-amber-800 dark:text-amber-300">Penyebab Penolakan Terbanyak:</span>
              <span className="text-muted-foreground">{numberGuardStats.topRejectionReason}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statistical Tests Breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Tingkat Keberhasilan per Modul Uji</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Distribusi kalkulasi statistik deterministik pada dataset responden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-xs">
              {testBreakdown.map((t) => (
                <div key={t.name} className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <span className="font-medium text-foreground">{t.name}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-muted-foreground font-mono">{t.total} run</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      Gagal: {t.failRate}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Runs List (Zero respondent data leak!) */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Daftar Analisis Gagal (Metadata Saja)</CardTitle>
              <CardDescription className="text-xs">
                Mencatat kode galat teknis tanpa memuat nilai sel data responden.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {failedRuns.length} gagal
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {failedRuns.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Tidak ada analisis yang gagal saat ini. Sistem berjalan optimal.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {failedRuns.map((r) => (
                <div key={r.id} className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-destructive">{r.errorCode}</span>
                      <span className="text-muted-foreground">• Pengguna: {r.userName}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{r.createdAt}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{r.errorMessage}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">Run ID: {r.id}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleRetry(r.id)}
                      disabled={retryingId === r.id}
                    >
                      <RotateCcw className={`w-3 h-3 mr-1 ${retryingId === r.id ? 'animate-spin' : ''}`} />
                      Ulangi Run (Tercatat)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
