'use client';

import * as React from 'react';
import { Cpu, Bot, CheckCircle2, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/copy';
import { mockResults } from '@/lib/mock/results';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

type ActiveTab = 'regression' | 'validity';

export function Bab4Preview() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('regression');
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: `${label} berhasil disalin`,
      description: 'Format siap ditempel ke dokumen naskah Bab 4 Anda.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Top Header / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-muted/30 px-4 py-3 sm:px-6 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contoh Naskah Bab 4:
          </span>
          <div className="inline-flex rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('regression')}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                activeTab === 'regression'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Regresi Berganda
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validity')}
              className={cn(
                'rounded-md px-3 py-1 font-medium transition-all cursor-pointer',
                activeTab === 'validity'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Uji Validitas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span>N = 117 Responden (Skala Likert 1-5)</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Table Area */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-foreground text-sm sm:text-base">
                {activeTab === 'regression'
                  ? 'Tabel 4.15 Hasil Uji Regresi Linier Berganda'
                  : 'Tabel 4.8 Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)'}
              </span>
            </div>

            {/* MANDATORY BADGE 1: Dihitung oleh mesin statistik */}
            <Badge variant="engine" className="gap-1.5 py-1 px-2.5 font-medium text-xs">
              <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {COPY.badges.computedByEngine}
            </Badge>
          </div>

          {/* Realistic Journal Table */}
          <div className="overflow-x-auto rounded-lg border border-border/80 bg-background/50">
            {activeTab === 'regression' ? (
              <table className="table-journal min-w-full text-left">
                <thead>
                  <tr className="bg-muted/40 text-foreground font-semibold">
                    <th className="py-2.5 px-3">Variabel</th>
                    <th className="py-2.5 px-3 text-right">Koefisien (B)</th>
                    <th className="py-2.5 px-3 text-right">Std. Error</th>
                    <th className="py-2.5 px-3 text-right">t Hitung</th>
                    <th className="py-2.5 px-3 text-right">Sig. (p)</th>
                    <th className="py-2.5 px-3 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-xs sm:text-sm tabular-nums">
                  {(mockResults.regression ?? []).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-foreground">
                        {row.variable}
                      </td>
                      <td className="py-2 px-3 text-right text-foreground">
                        {formatNumber(row.coefficient, 3)}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {formatNumber(row.stdError, 3)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-primary">
                        {formatNumber(row.tHitung, 3)}
                      </td>
                      <td className="py-2 px-3 text-right text-foreground">
                        {formatNumber(row.pValue, 3)}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Signifikan
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 text-xs text-muted-foreground font-sans">
                    <td colSpan={6} className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-4 text-xs font-mono">
                        <span>F Hitung = <strong>48,652</strong> (Sig = 0,000)</span>
                        <span>R² = <strong>0,460</strong></span>
                        <span>Adjusted R² = <strong>0,451</strong></span>
                        <span>F Tabel = <strong>3,076</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="table-journal min-w-full text-left">
                <thead>
                  <tr className="bg-muted/40 text-foreground font-semibold">
                    <th className="py-2.5 px-3">Item Pernyataan</th>
                    <th className="py-2.5 px-3 text-right">r Hitung</th>
                    <th className="py-2.5 px-3 text-right">r Tabel (α=0,05)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-xs sm:text-sm tabular-nums">
                  {(mockResults.validity ?? []).slice(0, 6).map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-foreground">
                        {row.item} (Indikator #{i + 1})
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-primary">
                        {formatNumber(row.rHitung, 3)}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {formatNumber(row.rTabel, 4)}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Sumber: Data primer diolah dengan mesin statistik {COPY.badges.computedByEngine} (2024). Format baku APA 7th Edition.
          </p>
        </div>

        {/* Narrative Box with Mandatory Badge 2 */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* MANDATORY BADGE 2: Penjelasan ditulis AI dari angka di tabel */}
            <Badge variant="ai" className="gap-1.5 py-1 px-2.5 font-medium text-xs">
              <Bot className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              {COPY.badges.writtenByAI}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleCopy(
                  activeTab === 'regression'
                    ? (mockResults.explanations?.regression ?? '')
                    : (mockResults.explanations?.validity ?? ''),
                  'Paragraf penjelasan'
                )
              }
              className="h-7 text-xs gap-1 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Paragraf'}</span>
            </Button>
          </div>

          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans space-y-2">
            <p>
              {activeTab === 'regression'
                ? (mockResults.explanations?.regression ?? '')
                : (mockResults.explanations?.validity ?? '')}
            </p>
          </div>

          <div className="border-t border-amber-200/60 dark:border-amber-900/40 pt-2 text-[11px] text-amber-800/80 dark:text-amber-400/80">
            Penjelasan dibuat secara objektif berdasarkan angka aktual pada tabel di atas. Siap digunakan sebagai draf interpretasi Bab 4 skripsi Anda.
          </div>
        </div>
      </div>
    </div>
  );
}
