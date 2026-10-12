'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Clock,
  Database,
  Cpu,
  Sliders,
  Users,
  FileCheck2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ENGINE_VERSION } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { COPY } from '@/lib/copy';

export interface TraceabilityPanelProps {
  currentTestName?: string;
  dataVersionLabel?: string;
  respondentCount?: number;
  significanceLevel?: number;
  additionalParameters?: Record<string, string | number>;
  timestamp?: string;
  engineVersion?: string;
  className?: string;
}

export function TraceabilityPanel({
  currentTestName = 'Regresi Linier Berganda (OLS)',
  dataVersionLabel = 'dv-2 (117 responden, 3 baris dihapus)',
  respondentCount = 117,
  significanceLevel = 0.05,
  additionalParameters,
  timestamp = '2024-10-01T14:30:00Z',
  engineVersion = ENGINE_VERSION,
  className,
}: TraceabilityPanelProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 font-sans',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {COPY.results.traceTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[11px] gap-1 py-0.5 px-2 font-medium bg-muted/40 border-border rounded-[6px]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Audit Trail Valid</span>
          </Badge>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground md:hidden p-1"
            aria-label="Buka/tutup jejak hitung"
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

      {/* Panel Content */}
      <div className={cn('space-y-3 text-xs', !isOpen && 'hidden md:block')}>
        {/* Test Name */}
        <div className="flex items-start gap-2.5">
          <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.test}
            </span>
            <span className="font-semibold text-foreground text-xs break-words">
              {currentTestName}
            </span>
          </div>
        </div>

        {/* Dataset Version */}
        <div className="flex items-start gap-2.5">
          <Database className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.dataVersion}
            </span>
            <span className="font-semibold text-foreground text-xs font-mono break-all">
              {dataVersionLabel}
            </span>
          </div>
        </div>

        {/* Respondent Count */}
        <div className="flex items-start gap-2.5">
          <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.respondents}
            </span>
            <span className="font-semibold text-foreground text-xs tabular-nums">
              N = {respondentCount} responden
            </span>
          </div>
        </div>

        {/* Parameters */}
        <div className="flex items-start gap-2.5">
          <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.parameters}
            </span>
            <div className="text-foreground font-medium text-xs leading-relaxed">
              <div>Tingkat signifikansi: α = {significanceLevel}</div>
              <div>Metode: Ordinary Least Squares (OLS)</div>
              {additionalParameters &&
                Object.entries(additionalParameters).map(([k, v]) => (
                  <div key={k}>
                    {k}: {String(v)}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.timestamp}
            </span>
            <span className="font-medium text-foreground text-xs">
              {formatDateTime(timestamp)}
            </span>
          </div>
        </div>

        {/* Engine Version */}
        <div className="flex items-start gap-2.5">
          <Cpu className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground block text-[11px]">
              {COPY.results.traceFields.engineVersion}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              v{engineVersion}
            </span>
          </div>
        </div>

        {/* Academic Note */}
        <div className="pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed bg-muted/40 p-2.5 rounded-xs">
          <span className="font-semibold text-foreground">Integritas Akademik: </span>
          Setiap proses analisis direkam dengan hash kriptografis untuk mencegah p-hacking dan manipulasi data pada sidang skripsi.
        </div>
      </div>
    </div>
  );
}
