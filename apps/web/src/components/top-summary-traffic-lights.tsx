'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResults } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';

interface TopSummaryTrafficLightsProps {
  results: AnalysisResults;
  className?: string;
  onJumpToTab?: (tabId: string) => void;
}

type LightStatus = 'passed' | 'warning' | 'violated';

interface TrafficLightCard {
  title: string;
  category: 'instrument' | 'assumptions' | 'hypotheses';
  status: LightStatus;
  statusBadge: string;
  metricHighlight: string;
  summary: string;
}

export function TopSummaryTrafficLights({
  results,
  className,
  onJumpToTab,
}: TopSummaryTrafficLightsProps) {
  // 1. Evaluasi Instrumen (Validitas & Reliabilitas)
  const evalInstrument = (): TrafficLightCard => {
    const valItems = results.validity || [];
    const relItems = results.reliability || [];
    const totalItems = valItems.length;
    const validCount = valItems.filter((v) => v.valid).length;
    const invalidCount = totalItems - validCount;

    const allReliable =
      relItems.length > 0 && relItems.every((r) => r.reliable);
    const minAlpha =
      relItems.length > 0
        ? Math.min(...relItems.map((r) => r.cronbachAlpha))
        : 0;

    let status: LightStatus = 'passed';
    let statusBadge = 'Valid & Reliabel';
    let metricHighlight = '';
    let summary = '';

    if (totalItems === 0 && relItems.length === 0) {
      return {
        title: 'Validitas & Reliabilitas',
        category: 'instrument',
        status: 'passed',
        statusBadge: 'Siap',
        metricHighlight: 'Instrumen Terkonfigurasi',
        summary: 'Data siap dianalisis untuk pengujian skripsi.',
      };
    }

    if (invalidCount === 0 && allReliable) {
      status = 'passed';
      statusBadge = 'Valid & Reliabel';
      metricHighlight = `${totalItems}/${totalItems} Butir Valid • Alpha ${formatNumber(minAlpha, 3)}`;
      summary = 'Semua butir instrumen valid dan konsisten mengukur variabel.';
    } else if (allReliable || minAlpha >= 0.6) {
      status = 'warning';
      statusBadge = 'Perlu Penyesuaian';
      metricHighlight = `${validCount}/${totalItems} Valid • ${invalidCount} Butir Gugur`;
      summary = `${invalidCount} butir tidak valid. Konstruk tetap reliabel jika butir dieliminasi.`;
    } else {
      status = 'violated';
      statusBadge = 'Belum Reliabel';
      metricHighlight = `Alpha Rendah (${formatNumber(minAlpha, 3)} < 0,600)`;
      summary = 'Instrumen belum memenuhi batas keandalan minimum.';
    }

    return {
      title: 'Validitas & Reliabilitas',
      category: 'instrument',
      status,
      statusBadge,
      metricHighlight,
      summary,
    };
  };

  // 2. Evaluasi Asumsi Klasik
  const evalAssumptions = (): TrafficLightCard => {
    const normality = results.normality || [];
    const multi = results.multicollinearity || [];
    const hetero = results.heteroscedasticity || [];

    const normPassed =
      normality.length > 0
        ? normality.every((n) => n.normal || n.pValue >= 0.05)
        : true;
    const multiPassed =
      multi.length > 0
        ? multi.every(
            (m) => !m.problematic && m.vif < 10 && m.tolerance > 0.1
          )
        : true;
    const heteroPassed =
      hetero.length > 0
        ? hetero.every((h) => !h.significant && h.pValue >= 0.05)
        : true;

    let status: LightStatus = 'passed';
    let statusBadge = 'Semua Terpenuhi';
    let metricHighlight = '';
    let summary = '';

    const issues: string[] = [];
    if (!normPassed) issues.push('Normalitas');
    if (!multiPassed) issues.push('Multikolinearitas (VIF)');
    if (!heteroPassed) issues.push('Heteroskedastisitas');

    if (issues.length === 0) {
      status = 'passed';
      statusBadge = 'Semua Terpenuhi';
      metricHighlight = 'Normalitas • Bebas VIF • Uji Glejser Lolos';
      summary = 'Residual berdistribusi normal, bebas multikolinearitas dan heteroskedastisitas.';
    } else if (issues.length === 1) {
      status = 'warning';
      statusBadge = '1 Catatan Asumsi';
      metricHighlight = `Periksa: ${issues[0]}`;
      summary = `Asumsi ${issues[0]} belum optimal pada taraf signifikansi α = 0,05.`;
    } else {
      status = 'violated';
      statusBadge = 'Perlu Perbaikan';
      metricHighlight = `Pelanggaran: ${issues.join(' & ')}`;
      summary = 'Model regresi mengalami beberapa pelanggaran asumsi klasik.';
    }

    return {
      title: 'Uji Asumsi Klasik',
      category: 'assumptions',
      status,
      statusBadge,
      metricHighlight,
      summary,
    };
  };

  // 3. Evaluasi Keputusan Hipotesis
  const evalHypotheses = (): TrafficLightCard => {
    const reg = results.regression || [];
    const fTest = results.fTest;
    const predictors = reg.filter(
      (r) =>
        !['(constant)', 'konstanta', 'constant'].includes(
          r.variable.toLowerCase()
        )
    );

    const sigPredictors = predictors.filter(
      (p) => p.significant || p.pValue < 0.05
    );
    const fSig = fTest ? fTest.significant || fTest.pValue < 0.05 : false;

    let status: LightStatus = 'passed';
    let statusBadge = 'Semua Diterima';
    let metricHighlight = '';
    let summary = '';

    if (predictors.length === 0) {
      return {
        title: 'Uji Hipotesis (t & F)',
        category: 'hypotheses',
        status: 'passed',
        statusBadge: 'Selesai',
        metricHighlight: 'Model Regresi Diestimasi',
        summary: 'Hasil estimasi model regresi siap dibahas.',
      };
    }

    if (sigPredictors.length === predictors.length && fSig) {
      status = 'passed';
      statusBadge = 'Semua Diterima';
      metricHighlight = `${predictors.length}/${predictors.length} Parsial Signifikan • Uji F Signifikan`;
      summary = 'Seluruh hipotesis penelitian terbukti berpengaruh nyata.';
    } else if (sigPredictors.length > 0 || fSig) {
      status = 'warning';
      statusBadge = 'Diterima Sebagian';
      metricHighlight = `${sigPredictors.length} dari ${predictors.length} Hipotesis Parsial Signifikan`;
      summary = `${sigPredictors.length} variabel berpengaruh signifikan, uji simultan F ${fSig ? 'lolos' : 'belum'}.`;
    } else {
      status = 'violated';
      statusBadge = 'Hipotesis Ditolak';
      metricHighlight = 'Tidak Ada Pengaruh Signifikan';
      summary = 'Tidak ditemukan pengaruh yang signifikan pada taraf α = 0,05.';
    }

    return {
      title: 'Uji Hipotesis (t & F)',
      category: 'hypotheses',
      status,
      statusBadge,
      metricHighlight,
      summary,
    };
  };

  const cards = [evalInstrument(), evalAssumptions(), evalHypotheses()];

  const getStatusIcon = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        );
      case 'warning':
        return (
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        );
      case 'violated':
        return (
          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
        );
    }
  };

  const getStatusBadgeClass = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
      case 'violated':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25';
    }
  };

  const getCardBorder = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return 'border-emerald-500/25 bg-emerald-50/30 dark:bg-emerald-950/15 hover:border-emerald-500/40';
      case 'warning':
        return 'border-amber-500/25 bg-amber-50/30 dark:bg-amber-950/15 hover:border-amber-500/40';
      case 'violated':
        return 'border-rose-500/25 bg-rose-50/30 dark:bg-rose-950/15 hover:border-rose-500/40';
    }
  };

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
          <span>Ringkasan Hasil Uji Bab 4</span>
          <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">
            (Kelayakan instrumen, asumsi klasik, dan hipotesis)
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.category}
            className={cn(
              'rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between transition-colors shadow-2xs',
              getCardBorder(card.status)
            )}
          >
            <div className="space-y-1.5">
              {/* Header Card: Judul & Badge Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {card.title}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0',
                    getStatusBadgeClass(card.status)
                  )}
                >
                  {getStatusIcon(card.status)}
                  {card.statusBadge}
                </span>
              </div>

              {/* Highlight Metrik Inti (Font Tebal, Jelas) */}
              <div className="text-xs sm:text-[13px] font-bold text-foreground tracking-tight pt-0.5">
                {card.metricHighlight}
              </div>

              {/* Ringkasan Singkat (Maksimal 1-2 Baris) */}
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {card.summary}
              </p>
            </div>

            {/* Action Link Menuju Tabel Terkait */}
            {onJumpToTab && (
              <div className="mt-2.5 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    if (card.category === 'instrument') onJumpToTab('validity');
                    else if (card.category === 'assumptions')
                      onJumpToTab('assumptions');
                    else if (card.category === 'hypotheses')
                      onJumpToTab('regression');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer group"
                >
                  <span>
                    {card.category === 'instrument'
                      ? 'Buka Tabel Validitas'
                      : card.category === 'assumptions'
                      ? 'Buka Asumsi Klasik'
                      : 'Buka Tabel Hipotesis'}
                  </span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
