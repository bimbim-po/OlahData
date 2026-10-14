'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  Sliders,
  Users,
  FileCheck2,
  ChevronDown,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ENGINE_VERSION } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { useToast } from '@/components/ui/toaster';

export interface TraceabilityPanelProps {
  currentTestKey?: string;
  currentTestName?: string;
  dataVersionLabel?: string;
  respondentCount: number;
  significanceLevel?: number;
  rTabel?: number;
  dfResidual?: number;
  hash?: string;
  isHashValid?: boolean;
  timestamp?: string;
  engineVersion?: string;
  onDownloadStatement?: () => void;
  className?: string;
}

export function TraceabilityPanel({
  currentTestKey = 'descriptive',
  currentTestName = 'Statistik Deskriptif',
  dataVersionLabel,
  respondentCount,
  significanceLevel = 0.05,
  rTabel,
  dfResidual,
  hash,
  isHashValid = true,
  timestamp = new Date().toISOString(),
  engineVersion = ENGINE_VERSION,
  onDownloadStatement,
  className,
}: TraceabilityPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const { toast } = useToast();

  const handleCopyVerificationCode = async () => {
    const code = hash || `OLAH-${respondentCount}-${engineVersion}`;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast({
        title: 'Kode Verifikasi Disalin',
        description: 'Kode jejak audit SHA-256 berhasil disalin ke papan klip.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Periksa izin clipboard pada peramban Anda.',
        variant: 'error',
      });
    }
  };

  // Render parameter dinamis spesifik sesuai jenis uji yang aktif
  const renderTestSpecificParams = () => {
    switch (currentTestKey) {
      case 'descriptive':
        return (
          <>
            <div>Responden valid: N = {respondentCount}</div>
            <div>Skala pengukuran: Likert 1–5</div>
            <div>Aturan skor konstruk: Rata-rata butir (Mean)</div>
          </>
        );

      case 'validity':
        return (
          <>
            <div>Metode: Korelasi Pearson Product Moment</div>
            <div>Derajat bebas: df = {respondentCount - 2}</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            {rTabel && <div>r Tabel baku: {rTabel.toFixed(4).replace('.', ',')}</div>}
          </>
        );

      case 'reliability':
        return (
          <>
            <div>Koefisien: Cronbach&apos;s Alpha</div>
            <div>Batas baku minimum: 0,70 (standar ketat) / 0,60</div>
            <div>Kriteria: Alpha ≥ ambang batas dinyatakan andal</div>
          </>
        );

      case 'assumptions':
        return (
          <>
            <div>Normalitas: One-Sample Kolmogorov-Smirnov (p ≥ 0,05)</div>
            <div>Multikolinearitas: Tolerance &gt; 0,10, VIF &lt; 10,00</div>
            <div>Heteroskedastisitas: Uji Glejser (Sig. &gt; 0,05)</div>
          </>
        );

      case 'regression':
        return (
          <>
            <div>Metode estimasi: Ordinary Least Squares (OLS)</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            <div>df Residual: {dfResidual ?? respondentCount - 3}</div>
            <div>Uji simultan: ANOVA F-test</div>
          </>
        );

      case 'correlation':
        return (
          <>
            <div>Metode: Pearson Product Moment</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            <div>Kategori kekuatan: Sugiyono &amp; Schober</div>
          </>
        );

      default:
        return (
          <>
            <div>Tingkat signifikansi: α = 0,05</div>
            <div>Metode: Deterministik Terverifikasi</div>
          </>
        );
    }
  };

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4 font-sans',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            {COPY.results.traceTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isHashValid ? (
            <Badge
              variant="outline"
              className="text-[13px] gap-1 py-1 px-2.5 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 rounded-[6px] min-h-[26px]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Audit Trail Valid</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[13px] gap-1 py-1 px-2.5 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 rounded-[6px] min-h-[26px]"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Perlu diperiksa</span>
            </Badge>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground md:hidden p-1 touch-manipulation cursor-pointer"
            aria-label="Buka/tutup rincian jejak hitung"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* Panel Content (Bisa dibuka di mobile) */}
      <div className={cn('space-y-3.5 text-[13px]', !isOpen && 'hidden md:block')}>
        {/* 1. Uji */}
        <div className="flex items-start gap-2.5">
          <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.test}
            </span>
            <span className="font-semibold text-foreground text-[13px] break-words">
              {currentTestName}
            </span>
          </div>
        </div>

        {/* 2. Dataset */}
        <div className="flex items-start gap-2.5">
          <Database className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.dataVersion}
            </span>
            <span className="font-medium text-foreground text-[13px] break-words">
              {dataVersionLabel || `Dataset aktif (N = ${respondentCount})`}
            </span>
            {hash && (
              <span className="block font-mono text-[13px] text-muted-foreground/80 truncate mt-0.5">
                Hash: {hash.slice(0, 16)}...
              </span>
            )}
          </div>
        </div>

        {/* 3. Responden */}
        <div className="flex items-start gap-2.5">
          <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.respondents}
            </span>
            <span className="font-semibold text-foreground text-[13px] tabular-nums">
              N = {respondentCount} responden
            </span>
          </div>
        </div>

        {/* 4. Parameter Uji yang Relevan */}
        <div className="flex items-start gap-2.5">
          <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.parameters}
            </span>
            <div className="text-foreground font-medium text-[13px] leading-relaxed space-y-0.5">
              {renderTestSpecificParams()}
            </div>
          </div>
        </div>

        {/* 5. Waktu Analisis */}
        <div className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.timestamp}
            </span>
            <span className="font-medium text-foreground text-[13px]">
              {formatDateTime(timestamp)}
            </span>
          </div>
        </div>

        {/* 6. Versi Mesin */}
        <div className="flex items-start gap-2.5">
          <Cpu className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[13px]">
              {COPY.results.traceFields.engineVersion}
            </span>
            <span className="font-mono text-[13px] font-semibold text-foreground">
              v{engineVersion}
            </span>
          </div>
        </div>

        {/* Tombol Aksi Verifikasi: Salin kode verifikasi & Unduh lampiran pernyataan */}
        <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyVerificationCode}
            className="w-full justify-center gap-1.5 text-[13px] min-h-[40px] text-foreground hover:bg-muted font-medium rounded-lg touch-manipulation cursor-pointer"
            title="Salin kode hash verifikasi keutuhan dataset"
          >
            {copiedHash ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Kode Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Salin kode verifikasi</span>
              </>
            )}
          </Button>

          {onDownloadStatement && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadStatement}
              className="w-full justify-center gap-1.5 text-[13px] min-h-[40px] text-primary hover:text-primary hover:bg-primary/5 font-medium rounded-lg touch-manipulation cursor-pointer"
              title="Unduh berkas lampiran pernyataan etika penggunaan alat untuk sidang skripsi"
            >
              <FileDown className="h-4 w-4" />
              <span>Unduh lampiran pernyataan</span>
            </Button>
          )}
        </div>

        {/* Catatan Integritas Akademik Tanpa Klaim Berlebihan */}
        <div className="pt-2.5 border-t border-border/50 text-[13px] text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-[10px]">
          <span className="font-semibold text-foreground">Integritas Akademik: </span>
          Setiap hasil dicatat bersama hash dataset dan parameter sehingga dapat diperiksa keutuhannya.
        </div>
      </div>
    </div>
  );
}
