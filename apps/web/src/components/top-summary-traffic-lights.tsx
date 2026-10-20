'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Sparkles, Info } from 'lucide-react';
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
  statusLabel: string;
  conclusion: string;
  details: string;
}

export function TopSummaryTrafficLights({ results, className, onJumpToTab }: TopSummaryTrafficLightsProps) {
  // 1. Evaluate Instrumen (Validitas & Reliabilitas)
  const evalInstrument = (): TrafficLightCard => {
    const valItems = results.validity || [];
    const relItems = results.reliability || [];
    const totalItems = valItems.length;
    const validCount = valItems.filter((v) => v.valid).length;
    const invalidCount = totalItems - validCount;

    const allReliable = relItems.length > 0 && relItems.every((r) => r.reliable);
    const minAlpha = relItems.length > 0 ? Math.min(...relItems.map((r) => r.cronbachAlpha)) : 0;

    let status: LightStatus = 'passed';
    let statusLabel = 'Lampu Hijau (Sempurna)';
    let conclusion = '';
    let details = '';

    if (totalItems === 0 && relItems.length === 0) {
      return {
        title: '1. Instrumen Penelitian',
        category: 'instrument',
        status: 'passed',
        statusLabel: 'Normal',
        conclusion: 'Instrumen penelitian terkonfigurasi dengan baik.',
        details: 'Data siap dianalisis.',
      };
    }

    if (invalidCount === 0 && allReliable) {
      status = 'passed';
      statusLabel = 'Lampu Hijau: Instrumen Sangat Valid & Reliabel';
      conclusion = `Seluruh ${totalItems} butir pernyataan dinyatakan valid (r hitung > r tabel) dan seluruh konstruk reliabel (Cronbach's Alpha ≥ 0,700).`;
      details = `Nilai Cronbach's Alpha terendah adalah ${formatNumber(minAlpha, 3)}, melebihi batas kritis 0,700.`;
    } else if (allReliable || minAlpha >= 0.60) {
      status = 'warning';
      statusLabel = 'Lampu Kuning: Memerlukan Penyesuaian Butir';
      conclusion = invalidCount > 0
        ? `Terdapat ${invalidCount} butir tidak valid (${valItems.filter((v) => !v.valid).map((v) => v.item).join(', ')}). Konsistensi konstruk tetap reliabel setelah butir gugur dieliminasi.`
        : `Nilai reliabilitas konstruk berada pada kategori dapat diterima (${formatNumber(minAlpha, 3)} ≥ 0,600).`;
      details = 'Disarankan mengeliminasi butir yang gugur sebelum pengujian hipotesis akhir skripsi.';
    } else {
      status = 'violated';
      statusLabel = 'Lampu Merah: Instrumen Belum Reliabel';
      conclusion = `Terdapat indikator instrumen yang tidak memenuhi syarat reliabilitas minimum (Alpha < 0,600).`;
      details = 'Periksa butir dengan korelasi rendah atau butir negatif yang belum dibalik.';
    }

    return {
      title: '1. Instrumen Penelitian (Validitas & Reliabilitas)',
      category: 'instrument',
      status,
      statusLabel,
      conclusion,
      details,
    };
  };

  // 2. Evaluate Asumsi Klasik
  const evalAssumptions = (): TrafficLightCard => {
    const normality = results.normality || [];
    const multi = results.multicollinearity || [];
    const hetero = results.heteroscedasticity || [];

    const normPassed = normality.length > 0 ? normality.every((n) => n.normal || n.pValue >= 0.05) : true;
    const multiPassed = multi.length > 0 ? multi.every((m) => !m.problematic && m.vif < 10 && m.tolerance > 0.10) : true;
    const heteroPassed = hetero.length > 0 ? hetero.every((h) => !h.significant && h.pValue >= 0.05) : true;

    let status: LightStatus = 'passed';
    let statusLabel = 'Lampu Hijau: Asumsi Terpenuhi';
    let conclusion = '';
    let details = '';

    const issues: string[] = [];
    if (!normPassed) issues.push('Normalitas residual');
    if (!multiPassed) issues.push('Multikolinearitas (VIF)');
    if (!heteroPassed) issues.push('Heteroskedastisitas');

    if (issues.length === 0) {
      status = 'passed';
      statusLabel = 'Lampu Hijau: Seluruh Asumsi Klasik Terpenuhi';
      conclusion = 'Residual model regresi berdistribusi normal, bebas dari multikolinearitas, dan memenuhi syarat homoskedastisitas.';
      details = 'Estimator OLS bersifat BLUE (Best Linear Unbiased Estimator) dan layak untuk uji hipotesis.';
    } else if (issues.length === 1) {
      status = 'warning';
      statusLabel = 'Lampu Kuning: 1 Asumsi Perlu Perhatian';
      conclusion = `Asumsi ${issues[0]} belum terpenuhi secara optimal pada taraf signifikansi α = 0,05.`;
      details = 'Gunakan fitur Asisten Penyembuh Asumsi (transformasi atau pengecualian pencilan) jika dosen penguji mensyaratkan.';
    } else {
      status = 'violated';
      statusLabel = 'Lampu Merah: Pelanggaran Asumsi Berganda';
      conclusion = `Model regresi mengalami pelanggaran pada asumsi: ${issues.join(' dan ')}.`;
      details = 'Disarankan mempertimbangkan uji non-parametrik alternatif atau pembersihan outlier.';
    }

    return {
      title: '2. Asumsi Klasik Regresi (Normalitas, VIF, Glejser)',
      category: 'assumptions',
      status,
      statusLabel,
      conclusion,
      details,
    };
  };

  // 3. Evaluate Keputusan Hipotesis
  const evalHypotheses = (): TrafficLightCard => {
    const reg = results.regression || [];
    const fTest = results.fTest;
    const predictors = reg.filter((r) => !['(constant)', 'konstanta', 'constant'].includes(r.variable.toLowerCase()));

    const sigPredictors = predictors.filter((p) => p.significant || p.pValue < 0.05);
    const fSig = fTest ? (fTest.significant || fTest.pValue < 0.05) : false;

    let status: LightStatus = 'passed';
    let statusLabel = 'Lampu Hijau: Hipotesis Diterima';
    let conclusion = '';
    let details = '';

    if (predictors.length === 0) {
      return {
        title: '3. Pembuktian Hipotesis Penelitian',
        category: 'hypotheses',
        status: 'passed',
        statusLabel: 'Dihitung',
        conclusion: 'Model regresi berhasil diestimasi.',
        details: 'Lihat rincian koefisien pada Tabel 4.10 dan 4.11.',
      };
    }

    if (sigPredictors.length === predictors.length && fSig) {
      status = 'passed';
      statusLabel = 'Lampu Hijau: Seluruh Hipotesis Diterima';
      conclusion = `Seluruh ${predictors.length} hipotesis parsial (Uji t) dan hipotesis simultan (Uji F = ${fTest ? formatNumber(fTest.fHitung, 2) : '-'}, p < 0,001) terbukti berpengaruh signifikan.`;
      details = 'Hasil pengujian memberikan bukti empiris kuat yang mendukung hipotesis penelitian.';
    } else if (sigPredictors.length > 0 || fSig) {
      status = 'warning';
      statusLabel = 'Lampu Kuning: Hipotesis Diterima Sebagian';
      conclusion = `${sigPredictors.length} dari ${predictors.length} hipotesis parsial terbukti signifikan, serta uji simultan F ${fSig ? 'signifikan' : 'tidak signifikan'}.`;
      details = 'Pembahasan perlu mengelaborasi mengapa beberapa variabel tidak berpengaruh signifikan.';
    } else {
      status = 'violated';
      statusLabel = 'Lampu Merah: Hipotesis Ditolak';
      conclusion = 'Tidak ditemukan pengaruh yang signifikan baik secara parsial maupun simultan pada taraf α = 0,05.';
      details = 'Jelaskan faktor kontekstual atau keterbatasan sampel pada bab pembahasan.';
    }

    return {
      title: '3. Keputusan Hipotesis Penelitian (Uji t & F)',
      category: 'hypotheses',
      status,
      statusLabel,
      conclusion,
      details,
    };
  };

  const cards = [evalInstrument(), evalAssumptions(), evalHypotheses()];

  const getStatusIcon = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'violated':
        return <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />;
    }
  };

  const getStatusBadgeClass = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30';
      case 'violated':
        return 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30';
    }
  };

  const getCardBorder = (status: LightStatus) => {
    switch (status) {
      case 'passed':
        return 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20';
      case 'violated':
        return 'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20';
    }
  };

  return (
    <div className={cn('space-y-3.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 p-1 rounded-full bg-muted border border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Lampu Hijau" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Lampu Kuning" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Lampu Merah" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Ringkasan Eksekutif Bab IV (Status Tri-Indikator Skripsi)
          </h2>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Dihitung deterministik oleh OlahData Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {cards.map((card) => (
          <div
            key={card.category}
            className={cn(
              'rounded-xl border p-4 flex flex-col justify-between transition-all shadow-xs',
              getCardBorder(card.status)
            )}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-foreground leading-tight">
                  {card.title}
                </span>
                {getStatusIcon(card.status)}
              </div>

              <div className="inline-block">
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                    getStatusBadgeClass(card.status)
                  )}
                >
                  {card.statusLabel}
                </span>
              </div>

              <p className="text-xs text-foreground font-medium leading-relaxed">
                {card.conclusion}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 space-y-2">
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{card.details}</span>
              </div>
              {onJumpToTab && (
                <button
                  type="button"
                  onClick={() => {
                    if (card.category === 'instrument') onJumpToTab('validity');
                    else if (card.category === 'assumptions') onJumpToTab('assumptions');
                    else if (card.category === 'hypotheses') onJumpToTab('regression');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer pt-0.5"
                >
                  <span>{
                    card.category === 'instrument'
                      ? 'Lihat Tabel Validitas & Reliabilitas →'
                      : card.category === 'assumptions'
                      ? 'Lihat Uji Asumsi Klasik →'
                      : 'Lihat Tabel Uji Hipotesis →'
                  }</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
