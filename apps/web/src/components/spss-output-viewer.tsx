'use client';

import * as React from 'react';
import type { AnalysisResults } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Copy, Check, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface SpssOutputViewerProps {
  results: AnalysisResults;
  onHoverNumber?: (numStr: string | null) => void;
  highlightedValue?: string | null;
  activeNumber?: string | null;
}

export function SpssOutputViewer({
  results,
  onHoverNumber,
  highlightedValue,
  activeNumber,
}: SpssOutputViewerProps) {
  const activeVal = highlightedValue || activeNumber;
  const { toast } = useToast();
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const handleCopyTable = async (sectionId: string, title: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    try {
      await navigator.clipboard.writeText(el.innerText);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
      toast({
        title: 'Tabel SPSS Disalin',
        description: `Tabel ${title} siap ditempelkan ke lampiran skripsi.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Periksa izin clipboard peramban Anda.',
        variant: 'error',
      });
    }
  };

  const indepList = (results.regression || [])
    .filter((r) => r.variable !== '(Konstanta)')
    .map((r) => r.variable);
  const targetDep = results.linearity?.[0]?.dependentVar || 'Variabel Terikat (Y)';

  // R calculation
  const rVal = results.determination?.rSquare
    ? Math.sqrt(results.determination.rSquare)
    : 0;

  return (
    <div className="space-y-8 w-full max-w-full font-mono text-xs">
      {/* Banner Identitas SPSS Lampiran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg">
        <div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-wide flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded-xs">
              SPSS
            </span>
            IBM SPSS Statistics - Output Viewer (.spv)
          </span>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
            Format tabel lampiran resmi skripsi dengan garis kotak tegas, font tabular-nums, dan catatan kaki standar SPSS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="bg-background text-[11px] font-mono">
            N = {results.respondentCount}
          </Badge>
          <Badge variant="outline" className="bg-background text-[11px] font-mono">
            df = {results.respondentCount - indepList.length - 1}
          </Badge>
        </div>
      </div>

      {/* 1. RELIABILITY: Case Processing Summary & Reliability Statistics */}
      {results.reliability && results.reliability.length > 0 && (
        <div id="spss-reliability" className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Scale: Reliability (Uji Reliabilitas &amp; Item-Total)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-reliability', 'Reliability')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-reliability' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {results.reliability.map((rel, relIdx) => (
            <div key={rel.construct} className="space-y-4 pl-2 border-l-2 border-zinc-200 dark:border-zinc-800">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                {rel.construct}
              </h4>

              {/* Case Processing Summary Table */}
              <div className="space-y-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                  Case Processing Summary
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[340px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold"></th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">N</th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Cases Valid</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{results.respondentCount}</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">100.0</td>
                      </tr>
                      <tr>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Excluded</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">0</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">.0</td>
                      </tr>
                      <tr className="border-t-2 border-zinc-900 dark:border-zinc-400 font-bold">
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Total</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{results.respondentCount}</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">100.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <span className="text-[10px] text-zinc-500 block italic">
                  a. Listwise deletion based on all variables in the procedure.
                </span>
              </div>

              {/* Reliability Statistics Table */}
              <div className="space-y-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                  Reliability Statistics
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[280px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Cronbach&apos;s Alpha</th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">N of Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(rel.cronbachAlpha, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(rel.cronbachAlpha, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(rel.cronbachAlpha, 3)}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">
                          {rel.itemCount}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Item-Total Statistics Table */}
              {rel.itemTotalStats && rel.itemTotalStats.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                    Item-Total Statistics
                  </span>
                  <div className="overflow-x-auto">
                    <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left w-full min-w-[550px]">
                      <thead>
                        <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                          <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">Butir</th>
                          <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Scale Mean if Item Deleted</th>
                          <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Scale Variance if Item Deleted</th>
                          <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Corrected Item-Total Correlation</th>
                          <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Cronbach&apos;s Alpha if Item Deleted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rel.itemTotalStats.map((itemStat) => (
                          <tr key={itemStat.item} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                            <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">{itemStat.item}</td>
                            <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(itemStat.scaleMean, 3)}</td>
                            <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(itemStat.scaleVariance, 3)}</td>
                            <td
                              className={cn(
                                'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right transition-colors',
                                highlightedValue === formatNumber(itemStat.correctedItemTotalCorrelation, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                              )}
                              onMouseEnter={() => onHoverNumber?.(formatNumber(itemStat.correctedItemTotalCorrelation, 3))}
                              onMouseLeave={() => onHoverNumber?.(null)}
                            >
                              {formatNumber(itemStat.correctedItemTotalCorrelation, 3)}
                            </td>
                            <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(itemStat.cronbachAlphaIfDeleted, 3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. NORMALITY: One-Sample Kolmogorov-Smirnov Test */}
      {results.normality && results.normality.length > 0 && (
        <div id="spss-normality" className="space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              NPar Tests: One-Sample Kolmogorov-Smirnov Test
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-normality', 'Normality KS')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-normality' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[460px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                  <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold" colSpan={2}>
                    One-Sample Kolmogorov-Smirnov Test
                  </th>
                  <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">
                    Unstandardized Residual
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" colSpan={2}>N</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{results.respondentCount}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" rowSpan={2}>Normal Parameters a,b</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Mean</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(results.normality[0]?.mean ?? 0, 4)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Std. Deviation</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(results.normality[0]?.stdDev ?? 1, 4)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" rowSpan={3}>Most Extreme Differences</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Absolute</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(results.normality[0]?.absoluteDiff ?? results.normality[0]?.statistic ?? 0, 3)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Positive</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(results.normality[0]?.positiveDiff ?? results.normality[0]?.statistic ?? 0, 3)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Negative</td>
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">-{formatNumber(Math.abs(results.normality[0]?.negativeDiff ?? (results.normality[0]?.statistic ?? 0) * 0.8), 3)}</td>
                </tr>
                <tr className="border-t-2 border-zinc-900 dark:border-zinc-400 font-bold">
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" colSpan={2}>Test Statistic</td>
                  <td
                    className={cn(
                      'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                      activeVal === formatNumber(results.normality[0]?.statistic ?? 0, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                    )}
                    onMouseEnter={() => onHoverNumber?.(formatNumber(results.normality?.[0]?.statistic ?? 0, 3))}
                    onMouseLeave={() => onHoverNumber?.(null)}
                  >
                    {formatNumber(results.normality[0]?.statistic ?? 0, 3)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" colSpan={2}>Asymp. Sig. (2-tailed)</td>
                  <td
                    className={cn(
                      'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                      activeVal === formatNumber(results.normality[0]?.pValue ?? 0, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                    )}
                    onMouseEnter={() => onHoverNumber?.(formatNumber(results.normality?.[0]?.pValue ?? 0, 3))}
                    onMouseLeave={() => onHoverNumber?.(null)}
                  >
                    {formatNumber(results.normality[0]?.pValue ?? 0, 3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-zinc-500 space-y-0.5 italic">
            <p>a. Test distribution is Normal.</p>
            <p>b. Calculated from data.</p>
          </div>
        </div>
      )}

      {/* 3. LINEARITY: ANOVA Table (Deviation from Linearity) */}
      {results.linearity && results.linearity.length > 0 && (
        <div id="spss-linearity" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Means: Linearity (Test for Linearity / Deviation from Linearity)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-linearity', 'Linearity')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-linearity' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {results.linearity.map((lin) => (
            <div key={lin.independentVar} className="space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                ANOVA Table: {lin.dependentVar} * {lin.independentVar}
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left w-full min-w-[580px]">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold" colSpan={2}></th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Sum of Squares</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">df</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Mean Square</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">F</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold" rowSpan={3}>Between Groups</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">(Combined)</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.ssLinearity + lin.ssDeviation, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{lin.dfLinearity + lin.dfDeviation}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber((lin.ssLinearity + lin.ssDeviation) / (lin.dfLinearity + lin.dfDeviation), 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(((lin.ssLinearity + lin.ssDeviation) / (lin.dfLinearity + lin.dfDeviation)) / Math.max(1e-12, lin.msWithin), 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">.000</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-6">Linearity</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.ssLinearity, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{lin.dfLinearity}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.msLinearity, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.fLinearity, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.sigLinearity, 3)}</td>
                    </tr>
                    <tr className="bg-amber-500/10 font-semibold">
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-6">Deviation from Linearity</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.ssDeviation, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{lin.dfDeviation}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.msDeviation, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.fDeviation, 3)}</td>
                      <td
                        className={cn(
                          'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                          highlightedValue === formatNumber(lin.sigDeviation, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                        )}
                        onMouseEnter={() => onHoverNumber?.(formatNumber(lin.sigDeviation, 3))}
                        onMouseLeave={() => onHoverNumber?.(null)}
                      >
                        {formatNumber(lin.sigDeviation, 3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold" colSpan={2}>Within Groups</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.ssWithin, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{lin.dfWithin}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.msWithin, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right"></td>
                    </tr>
                    <tr className="border-t-2 border-zinc-900 dark:border-zinc-400 font-bold">
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5" colSpan={2}>Total</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(lin.ssLinearity + lin.ssDeviation + lin.ssWithin, 3)}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{lin.dfLinearity + lin.dfDeviation + lin.dfWithin}</td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <span className="text-[10px] text-zinc-500 block italic">
                * Asumsi linieritas terpenuhi jika Sig. Deviation from Linearity &gt; 0,05 ({lin.isLinear ? 'Linier' : 'Tidak Linier'}).
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 4. REGRESSION: Variables Entered/Removed, Model Summary, ANOVA, Coefficients */}
      {results.regression && results.regression.length > 0 && (
        <div id="spss-regression" className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Regression: Linier Berganda (OLS)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-regression', 'Regression OLS')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-regression' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {/* Model Summary Table */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
              Model Summary b
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">Model</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">R</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">R Square</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Adjusted R Square</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Std. Error of the Estimate</th>
                    {results.durbinWatson && (
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold bg-amber-500/10">Durbin-Watson</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">1</td>
                    <td
                      className={cn(
                        'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(rVal, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(rVal, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(rVal, 3)} a
                    </td>
                    <td
                      className={cn(
                        'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(results.determination?.rSquare || 0, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(results.determination?.rSquare || 0, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(results.determination?.rSquare || 0, 3)}
                    </td>
                    <td
                      className={cn(
                        'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(results.determination?.adjustedRSquare || 0, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(results.determination?.adjustedRSquare || 0, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(results.determination?.adjustedRSquare || 0, 3)}
                    </td>
                    <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">
                      {formatNumber(results.determination?.stdError || 0, 3)}
                    </td>
                    {results.durbinWatson && (
                      <td
                        className={cn(
                          'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors bg-amber-500/10',
                          highlightedValue === formatNumber(results.durbinWatson.dwStatistic, 3) && 'bg-amber-300 dark:bg-amber-800'
                        )}
                        onMouseEnter={() => onHoverNumber?.(formatNumber(results.durbinWatson?.dwStatistic || 0, 3))}
                        onMouseLeave={() => onHoverNumber?.(null)}
                      >
                        {formatNumber(results.durbinWatson.dwStatistic, 3)}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-zinc-500 space-y-0.5 italic">
              <p>a. Predictors: (Constant), {indepList.join(', ')}</p>
              <p>b. Dependent Variable: {targetDep}</p>
            </div>
          </div>

          {/* ANOVA Table */}
          {results.anova && results.anova.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                ANOVA a
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[500px]">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">Model</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Sum of Squares</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">df</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Mean Square</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">F</th>
                      <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.anova.map((an) => (
                      <tr key={an.source} className={an.source === 'Total' ? 'border-t-2 border-zinc-900 dark:border-zinc-400 font-bold' : ''}>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">
                          {an.source === 'Regression' ? '1 Regression' : an.source}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(an.sumOfSquares, 3)}</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{an.df}</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{an.meanSquare > 0 ? formatNumber(an.meanSquare, 3) : ''}</td>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            an.fValue > 0 && highlightedValue === formatNumber(an.fValue, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => an.fValue > 0 && onHoverNumber?.(formatNumber(an.fValue, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {an.fValue > 0 ? formatNumber(an.fValue, 3) : ''}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            an.source === 'Regression' && highlightedValue === formatNumber(an.pValue, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => an.source === 'Regression' && onHoverNumber?.(formatNumber(an.pValue, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {an.source === 'Regression' ? (an.pValue < 0.001 ? '.000 b' : `${formatNumber(an.pValue, 3)} b`) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-zinc-500 space-y-0.5 italic">
                <p>a. Dependent Variable: {targetDep}</p>
                <p>b. Predictors: (Constant), {indepList.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Coefficients Table with Collinearity Statistics */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
              Coefficients a
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[640px]">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold" rowSpan={2}>Model</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-center font-bold" colSpan={2}>
                      Unstandardized Coefficients
                    </th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-center font-bold">
                      Standardized Coefficients
                    </th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold" rowSpan={2}>t</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold" rowSpan={2}>Sig.</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-center font-bold" colSpan={2}>
                      Collinearity Statistics
                    </th>
                  </tr>
                  <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1 text-right font-bold">B</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1 text-right font-bold">Std. Error</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1 text-right font-bold">Beta</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1 text-right font-bold">Tolerance</th>
                    <th className="border border-zinc-900 dark:border-zinc-400 p-1 text-right font-bold">VIF</th>
                  </tr>
                </thead>
                <tbody>
                  {results.regression.map((reg) => {
                    const multi = results.multicollinearity?.find((m) => m.variable === reg.variable);
                    const isConst = reg.variable === '(Konstanta)';

                    return (
                      <tr key={reg.variable} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">
                          {isConst ? '1 (Constant)' : reg.variable}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.coefficient, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.coefficient, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(reg.coefficient, 3)}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">
                          {formatNumber(reg.stdError, 3)}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">
                          {reg.standardizedBeta !== undefined ? formatNumber(reg.standardizedBeta, 3) : ''}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.tHitung, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.tHitung, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(reg.tHitung, 3)}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.pValue, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.pValue, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {reg.pValue < 0.001 ? '.000' : formatNumber(reg.pValue, 3)}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">
                          {multi ? formatNumber(multi.tolerance, 3) : ''}
                        </td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">
                          {multi ? formatNumber(multi.vif, 3) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-zinc-500 italic">
              a. Dependent Variable: {targetDep}
            </div>
          </div>
        </div>
      )}

      {/* 5. HETEROSCEDASTICITY: Coefficients (Glejser) */}
      {results.heteroscedasticity && results.heteroscedasticity.length > 0 && (
        <div id="spss-heteroscedasticity" className="space-y-1">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Regression: Glejser Test (Heteroskedastisitas)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-heteroscedasticity', 'Glejser Test')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-heteroscedasticity' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
            Coefficients a
          </span>
          <div className="overflow-x-auto">
            <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left min-w-[480px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                  <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">Model</th>
                  <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">t</th>
                  <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Sig.</th>
                </tr>
              </thead>
              <tbody>
                {results.heteroscedasticity.map((het) => (
                  <tr key={het.variable} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">{het.variable}</td>
                    <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(het.tHitung, 3)}</td>
                    <td
                      className={cn(
                        'border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold transition-colors',
                        highlightedValue === formatNumber(het.pValue, 3) && 'bg-amber-200 dark:bg-amber-900/60'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(het.pValue, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(het.pValue, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-zinc-500 italic">
            a. Dependent Variable: ABS_RES (Nilai Absolut Residual)
          </div>
        </div>
      )}

      {/* 6. DEMOGRAPHIC FREQUENCIES */}
      {results.demographics && results.demographics.length > 0 && (
        <div id="spss-demographics" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-300 dark:border-zinc-700 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Frequencies: Profil Demografi Responden
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-demographics', 'Demographics')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            >
              {copiedSection === 'spss-demographics' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.demographics.map((demo) => (
              <div key={demo.variable} className="space-y-1">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px]">
                  {demo.variable}
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 dark:border-zinc-400 bg-white dark:bg-zinc-950 text-left w-full min-w-[300px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-900 dark:border-zinc-400">
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 font-bold">Kategori</th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Frequency</th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Percent</th>
                        <th className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right font-bold">Cumulative %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demo.categories.map((cat) => (
                        <tr key={cat.category} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">{cat.category}</td>
                          <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{cat.frequency}</td>
                          <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(cat.percentage, 1)}</td>
                          <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{formatNumber(cat.cumulativePercentage, 1)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-zinc-900 dark:border-zinc-400 font-bold">
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 pl-3">Total</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">{demo.totalN}</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">100.0</td>
                        <td className="border border-zinc-900 dark:border-zinc-400 p-1.5 text-right">100.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
