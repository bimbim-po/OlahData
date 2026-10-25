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
    <div
      className="spss-paper-container space-y-8 w-full max-w-full font-mono text-xs p-6 sm:p-8 rounded-2xl bg-white text-slate-950 shadow-md border border-slate-200 dark:bg-white dark:text-slate-950 dark:border-slate-200 [&_th]:text-slate-900 [&_th]:border-zinc-800 [&_td]:text-slate-900 [&_td]:border-zinc-800 [&_h3]:text-slate-900 [&_h4]:text-slate-900 [&_p]:text-slate-600 [&_span]:text-slate-800 [&_table]:bg-white [&_table]:border-zinc-900 [&_tr]:hover:bg-zinc-100/60"
      style={{ colorScheme: 'light' }}
    >
      {/* Banner Identitas SPSS Lampiran */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-100 border-2 border-zinc-300 rounded-lg text-slate-900">
        <div>
          <span className="font-bold text-zinc-900 text-sm tracking-wide flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded-xs">
              SPSS
            </span>
            IBM SPSS Statistics - Output Viewer (.spv)
          </span>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            Format tabel lampiran resmi skripsi dengan garis kotak tegas, font tabular-nums, dan catatan kaki standar SPSS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="bg-white text-zinc-800 border-zinc-300 text-[11px] font-mono">
            N = {results.respondentCount}
          </Badge>
          <Badge variant="outline" className="bg-white text-zinc-800 border-zinc-300 text-[11px] font-mono">
            df = {results.respondentCount - indepList.length - 1}
          </Badge>
        </div>
      </div>

      {/* 1. RELIABILITY: Case Processing Summary & Reliability Statistics */}
      {results.reliability && results.reliability.length > 0 && (
        <div id="spss-reliability" className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Scale: Reliability (Uji Reliabilitas dan Item-Total)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-reliability', 'Reliability')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
            <div key={rel.construct} className="space-y-4 pl-2 border-l-2 border-zinc-200">
              <h4 className="font-bold text-zinc-900 text-xs">
                {rel.construct}
              </h4>

              {/* Case Processing Summary Table */}
              <div className="space-y-1">
                <span className="font-bold text-zinc-700 block text-[11px]">
                  Case Processing Summary
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[340px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-900">
                        <th className="border border-zinc-900 p-1.5 font-bold"></th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">N</th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-900 p-1.5 pl-3">Cases Valid</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{results.respondentCount}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">100.0</td>
                      </tr>
                      <tr>
                        <td className="border border-zinc-900 p-1.5 pl-3">Excluded</td>
                        <td className="border border-zinc-900 p-1.5 text-right">0</td>
                        <td className="border border-zinc-900 p-1.5 text-right">.0</td>
                      </tr>
                      <tr className="border-t-2 border-zinc-900 font-bold">
                        <td className="border border-zinc-900 p-1.5 pl-3">Total</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{results.respondentCount}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">100.0</td>
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
                <span className="font-bold text-zinc-700 block text-[11px]">
                  Reliability Statistics
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[280px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-900">
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">Cronbach&apos;s Alpha</th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">N of Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(rel.cronbachAlpha, 3) && 'bg-amber-200'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(rel.cronbachAlpha, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(rel.cronbachAlpha, 3)}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right">
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
                  <span className="font-bold text-zinc-700 block text-[11px]">
                    Item-Total Statistics
                  </span>
                  <div className="overflow-x-auto">
                    <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[550px]">
                      <thead>
                        <tr className="bg-zinc-100 border-b border-zinc-900">
                          <th className="border border-zinc-900 p-1.5 font-bold">Butir</th>
                          <th className="border border-zinc-900 p-1.5 text-right font-bold">Scale Mean if Item Deleted</th>
                          <th className="border border-zinc-900 p-1.5 text-right font-bold">Scale Variance if Item Deleted</th>
                          <th className="border border-zinc-900 p-1.5 text-right font-bold">Corrected Item-Total Correlation</th>
                          <th className="border border-zinc-900 p-1.5 text-right font-bold">Cronbach&apos;s Alpha if Item Deleted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rel.itemTotalStats.map((itemStat) => (
                          <tr key={itemStat.item} className="hover:bg-zinc-50">
                            <td className="border border-zinc-900 p-1.5 font-bold">{itemStat.item}</td>
                            <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(itemStat.scaleMean, 3)}</td>
                            <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(itemStat.scaleVariance, 3)}</td>
                            <td
                              className={cn(
                                'border border-zinc-900 p-1.5 text-right transition-colors',
                                highlightedValue === formatNumber(itemStat.correctedItemTotalCorrelation, 3) && 'bg-amber-200'
                              )}
                              onMouseEnter={() => onHoverNumber?.(formatNumber(itemStat.correctedItemTotalCorrelation, 3))}
                              onMouseLeave={() => onHoverNumber?.(null)}
                            >
                              {formatNumber(itemStat.correctedItemTotalCorrelation, 3)}
                            </td>
                            <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(itemStat.cronbachAlphaIfDeleted, 3)}</td>
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
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">
              NPar Tests: One-Sample Kolmogorov-Smirnov Test
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-normality', 'Normality KS')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
            <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[460px]">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-900">
                  <th className="border border-zinc-900 p-1.5 font-bold" colSpan={2}>
                    One-Sample Kolmogorov-Smirnov Test
                  </th>
                  <th className="border border-zinc-900 p-1.5 text-right font-bold">
                    Unstandardized Residual
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-900 p-1.5" colSpan={2}>N</td>
                  <td className="border border-zinc-900 p-1.5 text-right">{results.respondentCount}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 p-1.5" rowSpan={2}>Normal Parameters a,b</td>
                  <td className="border border-zinc-900 p-1.5 pl-3">Mean</td>
                  <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.normality[0]?.mean ?? 0, 4)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 p-1.5 pl-3">Std. Deviation</td>
                  <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.normality[0]?.stdDev ?? 1, 4)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 p-1.5" rowSpan={3}>Most Extreme Differences</td>
                  <td className="border border-zinc-900 p-1.5 pl-3">Absolute</td>
                  <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.normality[0]?.absoluteDiff ?? results.normality[0]?.statistic ?? 0, 3)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 p-1.5 pl-3">Positive</td>
                  <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.normality[0]?.positiveDiff ?? results.normality[0]?.statistic ?? 0, 3)}</td>
                </tr>
                <tr>
                  <td className="border border-zinc-900 p-1.5 pl-3">Negative</td>
                  <td className="border border-zinc-900 p-1.5 text-right">-{formatNumber(Math.abs(results.normality[0]?.negativeDiff ?? (results.normality[0]?.statistic ?? 0) * 0.8), 3)}</td>
                </tr>
                <tr className="border-t-2 border-zinc-900 font-bold">
                  <td className="border border-zinc-900 p-1.5" colSpan={2}>Test Statistic</td>
                  <td
                    className={cn(
                      'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                      activeVal === formatNumber(results.normality[0]?.statistic ?? 0, 3) && 'bg-amber-200'
                    )}
                    onMouseEnter={() => onHoverNumber?.(formatNumber(results.normality?.[0]?.statistic ?? 0, 3))}
                    onMouseLeave={() => onHoverNumber?.(null)}
                  >
                    {formatNumber(results.normality[0]?.statistic ?? 0, 3)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="border border-zinc-900 p-1.5" colSpan={2}>Asymp. Sig. (2-tailed)</td>
                  <td
                    className={cn(
                      'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                      activeVal === formatNumber(results.normality[0]?.pValue ?? 0, 3) && 'bg-amber-200'
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
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">
              Means: Linearity (Test for Linearity / Deviation from Linearity)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-linearity', 'Linearity')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
              <span className="font-bold text-zinc-700 block text-[11px]">
                ANOVA Table: {lin.dependentVar} * {lin.independentVar}
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[580px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th className="border border-zinc-900 p-1.5 font-bold" colSpan={2}></th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Sum of Squares</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">df</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean Square</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">F</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-zinc-900 p-1.5 font-bold" rowSpan={3}>Between Groups</td>
                      <td className="border border-zinc-900 p-1.5 pl-3">(Combined)</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.ssLinearity + lin.ssDeviation, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{lin.dfLinearity + lin.dfDeviation}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber((lin.ssLinearity + lin.ssDeviation) / (lin.dfLinearity + lin.dfDeviation), 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(((lin.ssLinearity + lin.ssDeviation) / (lin.dfLinearity + lin.dfDeviation)) / Math.max(1e-12, lin.msWithin), 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">.000</td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-900 p-1.5 pl-6">Linearity</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.ssLinearity, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{lin.dfLinearity}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.msLinearity, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.fLinearity, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.sigLinearity, 3)}</td>
                    </tr>
                    <tr className="bg-amber-500/10 font-semibold">
                      <td className="border border-zinc-900 p-1.5 pl-6">Deviation from Linearity</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.ssDeviation, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{lin.dfDeviation}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.msDeviation, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.fDeviation, 3)}</td>
                      <td
                        className={cn(
                          'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                          highlightedValue === formatNumber(lin.sigDeviation, 3) && 'bg-amber-200'
                        )}
                        onMouseEnter={() => onHoverNumber?.(formatNumber(lin.sigDeviation, 3))}
                        onMouseLeave={() => onHoverNumber?.(null)}
                      >
                        {formatNumber(lin.sigDeviation, 3)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-zinc-900 p-1.5 font-bold" colSpan={2}>Within Groups</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.ssWithin, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{lin.dfWithin}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.msWithin, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 p-1.5 text-right"></td>
                    </tr>
                    <tr className="border-t-2 border-zinc-900 font-bold">
                      <td className="border border-zinc-900 p-1.5" colSpan={2}>Total</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(lin.ssLinearity + lin.ssDeviation + lin.ssWithin, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{lin.dfLinearity + lin.dfDeviation + lin.dfWithin}</td>
                      <td className="border border-zinc-900 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 p-1.5 text-right"></td>
                      <td className="border border-zinc-900 p-1.5 text-right"></td>
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
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">
              Regression: Linier Berganda (OLS)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-regression', 'Regression OLS')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
            <span className="font-bold text-zinc-700 block text-[11px]">
              Model Summary b
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold">Model</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">R</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">R Square</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Adjusted R Square</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Error of the Estimate</th>
                    {results.durbinWatson && (
                      <th className="border border-zinc-900 p-1.5 text-right font-bold bg-amber-500/10">Durbin-Watson</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-zinc-900 p-1.5 font-bold">1</td>
                    <td
                      className={cn(
                        'border border-zinc-900 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(rVal, 3) && 'bg-amber-200'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(rVal, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(rVal, 3)} a
                    </td>
                    <td
                      className={cn(
                        'border border-zinc-900 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(results.determination?.rSquare || 0, 3) && 'bg-amber-200'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(results.determination?.rSquare || 0, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(results.determination?.rSquare || 0, 3)}
                    </td>
                    <td
                      className={cn(
                        'border border-zinc-900 p-1.5 text-right transition-colors',
                        highlightedValue === formatNumber(results.determination?.adjustedRSquare || 0, 3) && 'bg-amber-200'
                      )}
                      onMouseEnter={() => onHoverNumber?.(formatNumber(results.determination?.adjustedRSquare || 0, 3))}
                      onMouseLeave={() => onHoverNumber?.(null)}
                    >
                      {formatNumber(results.determination?.adjustedRSquare || 0, 3)}
                    </td>
                    <td className="border border-zinc-900 p-1.5 text-right">
                      {formatNumber(results.determination?.stdError || 0, 3)}
                    </td>
                    {results.durbinWatson && (
                      <td
                        className={cn(
                          'border border-zinc-900 p-1.5 text-right font-bold transition-colors bg-amber-500/10',
                          highlightedValue === formatNumber(results.durbinWatson.dwStatistic, 3) && 'bg-amber-300'
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
              <span className="font-bold text-zinc-700 block text-[11px]">
                ANOVA a
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[500px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th className="border border-zinc-900 p-1.5 font-bold">Model</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Sum of Squares</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">df</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean Square</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">F</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.anova.map((an) => (
                      <tr key={an.source} className={an.source === 'Total' ? 'border-t-2 border-zinc-900 font-bold' : ''}>
                        <td className="border border-zinc-900 p-1.5 font-bold">
                          {an.source === 'Regression' ? '1 Regression' : an.source}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(an.sumOfSquares, 3)}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{an.df}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{an.meanSquare > 0 ? formatNumber(an.meanSquare, 3) : ''}</td>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            an.fValue > 0 && highlightedValue === formatNumber(an.fValue, 3) && 'bg-amber-200'
                          )}
                          onMouseEnter={() => an.fValue > 0 && onHoverNumber?.(formatNumber(an.fValue, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {an.fValue > 0 ? formatNumber(an.fValue, 3) : ''}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            an.source === 'Regression' && highlightedValue === formatNumber(an.pValue, 3) && 'bg-amber-200'
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
            <span className="font-bold text-zinc-700 block text-[11px]">
              Coefficients a
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[640px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold" rowSpan={2}>Model</th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold" colSpan={2}>
                      Unstandardized Coefficients
                    </th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold">
                      Standardized Coefficients
                    </th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold" rowSpan={2}>t</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold" rowSpan={2}>Sig.</th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold" colSpan={2}>
                      Collinearity Statistics
                    </th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1 text-right font-bold">B</th>
                    <th className="border border-zinc-900 p-1 text-right font-bold">Std. Error</th>
                    <th className="border border-zinc-900 p-1 text-right font-bold">Beta</th>
                    <th className="border border-zinc-900 p-1 text-right font-bold">Tolerance</th>
                    <th className="border border-zinc-900 p-1 text-right font-bold">VIF</th>
                  </tr>
                </thead>
                <tbody>
                  {results.regression.map((reg) => {
                    const multi = results.multicollinearity?.find((m) => m.variable === reg.variable);
                    const isConst = reg.variable === '(Konstanta)';

                    return (
                      <tr key={reg.variable} className="hover:bg-zinc-50">
                        <td className="border border-zinc-900 p-1.5 font-bold">
                          {isConst ? '1 (Constant)' : reg.variable}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.coefficient, 3) && 'bg-amber-200'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.coefficient, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(reg.coefficient, 3)}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right">
                          {formatNumber(reg.stdError, 3)}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right font-bold">
                          {reg.standardizedBeta !== undefined ? formatNumber(reg.standardizedBeta, 3) : ''}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.tHitung, 3) && 'bg-amber-200'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.tHitung, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {formatNumber(reg.tHitung, 3)}
                        </td>
                        <td
                          className={cn(
                            'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                            highlightedValue === formatNumber(reg.pValue, 3) && 'bg-amber-200'
                          )}
                          onMouseEnter={() => onHoverNumber?.(formatNumber(reg.pValue, 3))}
                          onMouseLeave={() => onHoverNumber?.(null)}
                        >
                          {reg.pValue < 0.001 ? '.000' : formatNumber(reg.pValue, 3)}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right">
                          {multi ? formatNumber(multi.tolerance, 3) : ''}
                        </td>
                        <td className="border border-zinc-900 p-1.5 text-right">
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
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">
              Regression: Glejser Test (Heteroskedastisitas)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-heteroscedasticity', 'Glejser Test')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-heteroscedasticity' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <span className="font-bold text-zinc-700 block text-[11px]">
            Coefficients a
          </span>
          <div className="overflow-x-auto">
            <table className="border-collapse border border-zinc-900 bg-white text-left min-w-[480px]">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-900">
                  <th className="border border-zinc-900 p-1.5 font-bold">Model</th>
                  <th className="border border-zinc-900 p-1.5 text-right font-bold">t</th>
                  <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                </tr>
              </thead>
              <tbody>
                {results.heteroscedasticity.map((het) => (
                  <tr key={het.variable} className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5 font-bold">{het.variable}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(het.tHitung, 3)}</td>
                    <td
                      className={cn(
                        'border border-zinc-900 p-1.5 text-right font-bold transition-colors',
                        highlightedValue === formatNumber(het.pValue, 3) && 'bg-amber-200'
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
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
            <h3 className="font-bold text-sm text-zinc-800 uppercase tracking-wider">
              Frequencies: Profil Demografi Responden
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-demographics', 'Demographics')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
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
                <span className="font-bold text-zinc-700 block text-[11px]">
                  {demo.variable}
                </span>
                <div className="overflow-x-auto">
                  <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[300px]">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-900">
                        <th className="border border-zinc-900 p-1.5 font-bold">Kategori</th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">Frequency</th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">Percent</th>
                        <th className="border border-zinc-900 p-1.5 text-right font-bold">Cumulative %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demo.categories.map((cat) => (
                        <tr key={cat.category} className="hover:bg-zinc-50">
                          <td className="border border-zinc-900 p-1.5 pl-3">{cat.category}</td>
                          <td className="border border-zinc-900 p-1.5 text-right">{cat.frequency}</td>
                          <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(cat.percentage, 1)}</td>
                          <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(cat.cumulativePercentage, 1)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-zinc-900 font-bold">
                        <td className="border border-zinc-900 p-1.5 pl-3">Total</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{demo.totalN}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">100.0</td>
                        <td className="border border-zinc-900 p-1.5 text-right">100.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. PAIRED SAMPLES T-TEST & N-GAIN (SPSS FORMAT) */}
      {results.pairedTTest && (
        <div id="spss-paired-ttest" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-1">
            <h3 className="font-bold text-zinc-900 text-sm">
              T-Test (Paired Samples)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-paired-ttest', 'Paired Samples Test')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-paired-ttest' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {/* Paired Samples Statistics */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Paired Samples Statistics
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold" colSpan={2}>Variable</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">N</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Deviation</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Error Mean</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5 font-semibold" rowSpan={2}>Pair 1</td>
                    <td className="border border-zinc-900 p-1.5">{results.pairedTTest.preVar}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.meanPre, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.pairedTTest.n}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdDevPre, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdDevPre / Math.sqrt(results.pairedTTest.n), 3)}</td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">{results.pairedTTest.postVar}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.meanPost, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.pairedTTest.n}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdDevPost, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdDevPost / Math.sqrt(results.pairedTTest.n), 3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Paired Samples Correlations */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Paired Samples Correlations
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[400px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold">Pair</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">N</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Correlation</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">{results.pairedTTest.preVar} dan {results.pairedTTest.postVar}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.pairedTTest.n}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.correlation, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.sigCorrelation, 3)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Paired Samples Test */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Paired Samples Test
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold" rowSpan={2}>Pair 1</th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold" colSpan={5}>Paired Differences</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold" rowSpan={2}>t</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold" rowSpan={2}>df</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold" rowSpan={2}>Sig. (2-tailed)</th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900 text-[10px]">
                    <th className="border border-zinc-900 p-1 text-right">Mean</th>
                    <th className="border border-zinc-900 p-1 text-right">Std. Deviation</th>
                    <th className="border border-zinc-900 p-1 text-right">Std. Error Mean</th>
                    <th className="border border-zinc-900 p-1 text-right">95% CI Lower</th>
                    <th className="border border-zinc-900 p-1 text-right">95% CI Upper</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">{results.pairedTTest.postVar} - {results.pairedTTest.preVar}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.meanDiff, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdDevDiff, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.stdErrorDiff, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.ciLower, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.pairedTTest.ciUpper, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.pairedTTest.tHitung, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.pairedTTest.df}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.pairedTTest.pValue, 4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. INDEPENDENT SAMPLES T-TEST (SPSS FORMAT) */}
      {results.independentTTest && (
        <div id="spss-independent-ttest" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-1">
            <h3 className="font-bold text-zinc-900 text-sm">
              T-Test (Independent Samples)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-independent-ttest', 'Independent Samples Test')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-independent-ttest' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {/* Group Statistics */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Group Statistics
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold">Variable</th>
                    <th className="border border-zinc-900 p-1.5 font-bold">{results.independentTTest.groupVar}</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">N</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Deviation</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Error Mean</th>
                  </tr>
                </thead>
                <tbody>
                  {results.independentTTest.groups.map((grp) => (
                    <tr key={grp.groupName} className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">{results.independentTTest!.testVar}</td>
                      <td className="border border-zinc-900 p-1.5 font-semibold">{grp.groupName}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{grp.n}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(grp.mean, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(grp.stdDev, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(grp.stdError, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Independent Samples Test */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Independent Samples Test
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[760px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold" colSpan={2} rowSpan={2}>
                      {results.independentTTest.testVar}
                    </th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold" colSpan={2}>
                      Levene&apos;s Test for Equality of Variances
                    </th>
                    <th className="border border-zinc-900 p-1.5 text-center font-bold" colSpan={7}>
                      t-test for Equality of Means
                    </th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900 text-[10px]">
                    <th className="border border-zinc-900 p-1 text-right">F</th>
                    <th className="border border-zinc-900 p-1 text-right">Sig.</th>
                    <th className="border border-zinc-900 p-1 text-right">t</th>
                    <th className="border border-zinc-900 p-1 text-right">df</th>
                    <th className="border border-zinc-900 p-1 text-right">Sig. (2-tailed)</th>
                    <th className="border border-zinc-900 p-1 text-right">Mean Diff</th>
                    <th className="border border-zinc-900 p-1 text-right">Std. Error</th>
                    <th className="border border-zinc-900 p-1 text-right">95% CI Lower</th>
                    <th className="border border-zinc-900 p-1 text-right">95% CI Upper</th>
                  </tr>
                </thead>
                <tbody>
                  {results.independentTTest.rows.map((row) => (
                    <tr
                      key={row.assumption}
                      className={cn(
                        'hover:bg-zinc-50',
                        row.isRecommended && 'bg-amber-50/50 font-semibold'
                      )}
                    >
                      <td className="border border-zinc-900 p-1.5" colSpan={2}>
                        {row.assumption} {row.isRecommended && '★'}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {row.assumption === 'Equal variances assumed'
                          ? formatNumber(results.independentTTest!.levene.fStatistic, 3)
                          : ''}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {row.assumption === 'Equal variances assumed'
                          ? formatNumber(results.independentTTest!.levene.pValue, 3)
                          : ''}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">
                        {formatNumber(row.tHitung, 3)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {formatNumber(row.df, 2)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">
                        {formatNumber(row.pValue, 4)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {formatNumber(row.meanDiff, 3)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {formatNumber(row.stdErrorDiff, 3)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {formatNumber(row.ciLower, 3)}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right">
                        {formatNumber(row.ciUpper, 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-zinc-500 mt-1">
                ★ Menunjukkan baris pengujian yang valid dibaca berdasarkan signifikansi Uji Levene ({results.independentTTest.levene.equalVariancesAssumed ? 'Sig. > 0,05: Equal variances assumed' : 'Sig. ≤ 0,05: Equal variances not assumed'}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 10. ONE-WAY ANOVA (SPSS FORMAT) */}
      {results.oneWayAnova && (
        <div id="spss-oneway-anova" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-1">
            <h3 className="font-bold text-zinc-900 text-sm">
              Oneway (Analysis of Variance)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-oneway-anova', 'ANOVA')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-oneway-anova' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              ANOVA ({results.oneWayAnova.dependentVar})
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold">Source</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Sum of Squares</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">df</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean Square</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">F</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">Between Groups</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.oneWayAnova.ssBetween, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.oneWayAnova.dfBetween}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.oneWayAnova.msBetween, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.oneWayAnova.fHitung, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.oneWayAnova.pValue, 4)}</td>
                  </tr>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">Within Groups</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.oneWayAnova.ssWithin, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.oneWayAnova.dfWithin}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.oneWayAnova.msWithin, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right">-</td>
                  </tr>
                  <tr className="border-t-2 border-zinc-900 font-bold">
                    <td className="border border-zinc-900 p-1.5">Total</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.oneWayAnova.ssTotal, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.oneWayAnova.dfTotal}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Post-Hoc Tukey HSD */}
          {results.oneWayAnova.postHocTukey && results.oneWayAnova.postHocTukey.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="font-bold text-zinc-700 block text-[11px]">
                Post Hoc Tests - Multiple Comparisons (Tukey HSD)
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[550px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th className="border border-zinc-900 p-1.5 font-bold">(I) Group</th>
                      <th className="border border-zinc-900 p-1.5 font-bold">(J) Group</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Mean Difference (I-J)</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Std. Error</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Sig.</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">95% CI Lower</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">95% CI Upper</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.oneWayAnova.postHocTukey.map((th) => (
                      <tr key={`${th.groupI}-${th.groupJ}`} className="hover:bg-zinc-50">
                        <td className="border border-zinc-900 p-1.5 font-semibold">{th.groupI}</td>
                        <td className="border border-zinc-900 p-1.5">{th.groupJ}</td>
                        <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(th.meanDiff, 3)}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(th.stdError, 3)}</td>
                        <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(th.pValue, 4)}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(th.ciLower, 3)}</td>
                        <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(th.ciUpper, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 11. NON-PARAMETRIC TESTS (SPSS NPAR TESTS FORMAT) */}
      {results.nonParametric && (
        <div id="spss-npar-tests" className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-1">
            <h3 className="font-bold text-zinc-900 text-sm">
              NPar Tests ({results.nonParametric.testName})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-npar-tests', results.nonParametric!.testName)}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-npar-tests' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Test Statistics (a)
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[350px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold">Statistic</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">{results.nonParametric.dependentVar}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">{results.nonParametric.testName}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.nonParametric.statistic, 3)}</td>
                  </tr>
                  {results.nonParametric.zValue !== undefined && (
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Z</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.nonParametric.zValue, 3)}</td>
                    </tr>
                  )}
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">Asymp. Sig. (2-tailed)</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.nonParametric.pValue, 4)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-zinc-500 mt-1">
                a. Grouping Variable: {results.nonParametric.groupVar || 'Sample Pair'}. {results.nonParametric.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 12. CROSSTABULATION & CHI-SQUARE (SPSS CROSSTABS FORMAT) */}
      {results.crosstab && results.chiSquare && (
        <div id="spss-crosstabs" className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-1">
            <h3 className="font-bold text-zinc-900 text-sm">
              Crosstabs ({results.crosstab.rowVar} * {results.crosstab.colVar})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyTable('spss-crosstabs', 'Crosstabs & Chi-Square')}
              className="h-7 text-[11px] px-2 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              {copiedSection === 'spss-crosstabs' ? (
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              Salin Output
            </Button>
          </div>

          {/* Case Processing Summary */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Case Processing Summary
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th rowSpan={3} className="border border-zinc-900 p-1.5 font-bold"></th>
                    <th colSpan={6} className="border border-zinc-900 p-1.5 text-center font-bold">Cases</th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th colSpan={2} className="border border-zinc-900 p-1.5 text-center font-bold">Valid</th>
                    <th colSpan={2} className="border border-zinc-900 p-1.5 text-center font-bold">Missing</th>
                    <th colSpan={2} className="border border-zinc-900 p-1.5 text-center font-bold">Total</th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1 text-right font-semibold">N</th>
                    <th className="border border-zinc-900 p-1 text-right font-semibold">Percent</th>
                    <th className="border border-zinc-900 p-1 text-right font-semibold">N</th>
                    <th className="border border-zinc-900 p-1 text-right font-semibold">Percent</th>
                    <th className="border border-zinc-900 p-1 text-right font-semibold">N</th>
                    <th className="border border-zinc-900 p-1 text-right font-semibold">Percent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5 font-semibold">
                      {results.crosstab.rowVar} * {results.crosstab.colVar}
                    </td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.crosstab.totalN}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">100.0%</td>
                    <td className="border border-zinc-900 p-1.5 text-right">0</td>
                    <td className="border border-zinc-900 p-1.5 text-right">0.0%</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.crosstab.totalN}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Crosstabulation Table */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              {results.crosstab.rowVar} * {results.crosstab.colVar} Crosstabulation
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[650px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th colSpan={2} rowSpan={2} className="border border-zinc-900 p-1.5 font-bold"></th>
                    <th colSpan={results.crosstab.colCategories.length} className="border border-zinc-900 p-1.5 text-center font-bold">
                      {results.crosstab.colVar}
                    </th>
                    <th rowSpan={2} className="border border-zinc-900 p-1.5 text-right font-bold">Total</th>
                  </tr>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    {results.crosstab.colCategories.map((col) => (
                      <th key={col} className="border border-zinc-900 p-1.5 text-right font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.crosstab.rowCategories.map((rowCat, rIdx) => {
                    const rowTotalCount = results.crosstab!.rowTotals[rIdx];
                    return (
                      <React.Fragment key={rowCat}>
                        <tr className="hover:bg-zinc-50">
                          <td rowSpan={4} className="border border-zinc-900 p-1.5 font-bold align-top">
                            {rowCat}
                          </td>
                          <td className="border border-zinc-900 p-1 text-zinc-700">Count</td>
                          {results.crosstab!.colCategories.map((_, cIdx) => (
                            <td key={cIdx} className="border border-zinc-900 p-1 text-right font-semibold">
                              {results.crosstab!.matrix[rIdx][cIdx]}
                            </td>
                          ))}
                          <td className="border border-zinc-900 p-1 text-right font-bold">
                            {rowTotalCount}
                          </td>
                        </tr>
                        <tr className="hover:bg-zinc-50">
                          <td className="border border-zinc-900 p-1 text-zinc-700">Expected Count</td>
                          {results.crosstab!.colCategories.map((_, cIdx) => (
                            <td key={cIdx} className="border border-zinc-900 p-1 text-right text-zinc-600">
                              {formatNumber(results.crosstab!.expectedMatrix[rIdx][cIdx], 1)}
                            </td>
                          ))}
                          <td className="border border-zinc-900 p-1 text-right text-zinc-600 font-semibold">
                            {formatNumber(rowTotalCount, 1)}
                          </td>
                        </tr>
                        <tr className="hover:bg-zinc-50">
                          <td className="border border-zinc-900 p-1 text-zinc-700">% within {results.crosstab!.rowVar}</td>
                          {results.crosstab!.colCategories.map((_, cIdx) => (
                            <td key={cIdx} className="border border-zinc-900 p-1 text-right">
                              {formatNumber(results.crosstab!.rowPercentages[rIdx][cIdx], 1)}%
                            </td>
                          ))}
                          <td className="border border-zinc-900 p-1 text-right">100.0%</td>
                        </tr>
                        <tr className="hover:bg-zinc-50">
                          <td className="border border-zinc-900 p-1 text-zinc-700">% of Total</td>
                          {results.crosstab!.colCategories.map((_, cIdx) => (
                            <td key={cIdx} className="border border-zinc-900 p-1 text-right text-zinc-500">
                              {formatNumber(results.crosstab!.totalPercentages[rIdx][cIdx], 1)}%
                            </td>
                          ))}
                          <td className="border border-zinc-900 p-1 text-right text-zinc-500">
                            {formatNumber((rowTotalCount / results.crosstab!.totalN) * 100, 1)}%
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {/* Total Summary Row */}
                  <tr className="bg-zinc-50 font-bold">
                    <td rowSpan={4} className="border border-zinc-900 p-1.5 align-top">
                      Total
                    </td>
                    <td className="border border-zinc-900 p-1 font-semibold">Count</td>
                    {results.crosstab.colCategories.map((_, cIdx) => (
                      <td key={cIdx} className="border border-zinc-900 p-1 text-right">
                        {results.crosstab!.colTotals[cIdx]}
                      </td>
                    ))}
                    <td className="border border-zinc-900 p-1 text-right">
                      {results.crosstab.totalN}
                    </td>
                  </tr>
                  <tr className="bg-zinc-50">
                    <td className="border border-zinc-900 p-1 text-zinc-700">Expected Count</td>
                    {results.crosstab.colCategories.map((_, cIdx) => (
                      <td key={cIdx} className="border border-zinc-900 p-1 text-right text-zinc-600">
                        {formatNumber(results.crosstab!.colTotals[cIdx], 1)}
                      </td>
                    ))}
                    <td className="border border-zinc-900 p-1 text-right text-zinc-600 font-bold">
                      {formatNumber(results.crosstab.totalN, 1)}
                    </td>
                  </tr>
                  <tr className="bg-zinc-50">
                    <td className="border border-zinc-900 p-1 text-zinc-700">% within {results.crosstab.rowVar}</td>
                    {results.crosstab.colCategories.map((_, cIdx) => (
                      <td key={cIdx} className="border border-zinc-900 p-1 text-right">
                        {formatNumber((results.crosstab!.colTotals[cIdx] / results.crosstab!.totalN) * 100, 1)}%
                      </td>
                    ))}
                    <td className="border border-zinc-900 p-1 text-right">100.0%</td>
                  </tr>
                  <tr className="bg-zinc-50">
                    <td className="border border-zinc-900 p-1 text-zinc-700">% of Total</td>
                    {results.crosstab.colCategories.map((_, cIdx) => (
                      <td key={cIdx} className="border border-zinc-900 p-1 text-right text-zinc-500">
                        {formatNumber((results.crosstab!.colTotals[cIdx] / results.crosstab!.totalN) * 100, 1)}%
                      </td>
                    ))}
                    <td className="border border-zinc-900 p-1 text-right text-zinc-500">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chi-Square Tests Table */}
          <div className="space-y-1">
            <span className="font-bold text-zinc-700 block text-[11px]">
              Chi-Square Tests
            </span>
            <div className="overflow-x-auto">
              <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[650px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-900">
                    <th className="border border-zinc-900 p-1.5 font-bold"></th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Value</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">df</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Asymptotic Significance (2-sided)</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Exact Sig. (2-sided)</th>
                    <th className="border border-zinc-900 p-1.5 text-right font-bold">Exact Sig. (1-sided)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5 font-semibold">Pearson Chi-Square</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.pearsonChiSquare, 3)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right">{results.chiSquare.df}</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.pearsonSig, 4)}</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                  </tr>
                  {results.chiSquare.continuityCorrection !== undefined && (
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Continuity Correction (b)</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.continuityCorrection, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">1</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.continuityCorrectionSig || 0, 4)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    </tr>
                  )}
                  {results.chiSquare.likelihoodRatio !== undefined && (
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Likelihood Ratio</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.likelihoodRatio, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{results.chiSquare.df}</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.likelihoodRatioSig || 0, 4)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    </tr>
                  )}
                  {results.chiSquare.fisherExact !== undefined && (
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Fisher&apos;s Exact Test</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.fisherExact, 4)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.chiSquare.fisherExact1Sided || results.chiSquare.fisherExact / 2, 4)}</td>
                    </tr>
                  )}
                  <tr className="hover:bg-zinc-50">
                    <td className="border border-zinc-900 p-1.5">N of Valid Cases</td>
                    <td className="border border-zinc-900 p-1.5 text-right font-semibold">{results.chiSquare.totalN}</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-zinc-600 mt-1 space-y-0.5">
                <p>{results.chiSquare.cochranFootnote}</p>
                {results.chiSquare.continuityCorrection !== undefined && (
                  <p>b. Computed only for a 2x2 table</p>
                )}
              </div>
            </div>
          </div>

          {/* Risk Estimate Table (if 2x2) */}
          {results.riskEstimate && (
            <div className="space-y-1">
              <span className="font-bold text-zinc-700 block text-[11px]">
                Risk Estimate
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[550px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th rowSpan={2} className="border border-zinc-900 p-1.5 font-bold"></th>
                      <th rowSpan={2} className="border border-zinc-900 p-1.5 text-right font-bold">Value</th>
                      <th colSpan={2} className="border border-zinc-900 p-1.5 text-center font-bold">95% Confidence Interval</th>
                    </tr>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th className="border border-zinc-900 p-1 text-right font-semibold">Lower</th>
                      <th className="border border-zinc-900 p-1 text-right font-semibold">Upper</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5 font-semibold">
                        Odds Ratio for {results.riskEstimate.exposureVar} ({results.crosstab.rowCategories[0]} / {results.crosstab.rowCategories[1]})
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.riskEstimate.oddsRatio, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.ciLower, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.ciUpper, 3)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">
                        For cohort {results.riskEstimate.outcomeVar} = {results.crosstab.colCategories[0]}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.riskEstimate.forCohortRisk1, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.forCohortRisk1CiLower, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.forCohortRisk1CiUpper, 3)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">
                        For cohort {results.riskEstimate.outcomeVar} = {results.crosstab.colCategories[1]}
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.riskEstimate.forCohortRisk2, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.forCohortRisk2CiLower, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right">{formatNumber(results.riskEstimate.forCohortRisk2CiUpper, 3)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">N of Valid Cases</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-semibold">{results.riskEstimate.totalN}</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Symmetric Measures Table */}
          {results.symmetricMeasures && (
            <div className="space-y-1">
              <span className="font-bold text-zinc-700 block text-[11px]">
                Symmetric Measures
              </span>
              <div className="overflow-x-auto">
                <table className="border-collapse border border-zinc-900 bg-white text-left w-full min-w-[450px]">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-900">
                      <th colSpan={2} className="border border-zinc-900 p-1.5 font-bold"></th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Value</th>
                      <th className="border border-zinc-900 p-1.5 text-right font-bold">Approximate Significance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-zinc-50">
                      <td rowSpan={3} className="border border-zinc-900 p-1.5 font-semibold align-top">
                        Nominal by Nominal
                      </td>
                      <td className="border border-zinc-900 p-1.5">Phi</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{results.symmetricMeasures.phi !== undefined ? formatNumber(results.symmetricMeasures.phi, 3) : '.'}</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.symmetricMeasures.pValue, 4)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Cramer&apos;s V</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.symmetricMeasures.cramersV, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.symmetricMeasures.pValue, 4)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td className="border border-zinc-900 p-1.5">Contingency Coefficient</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.symmetricMeasures.contingencyCoeff, 3)}</td>
                      <td className="border border-zinc-900 p-1.5 text-right font-bold">{formatNumber(results.symmetricMeasures.pValue, 4)}</td>
                    </tr>
                    <tr className="hover:bg-zinc-50">
                      <td colSpan={2} className="border border-zinc-900 p-1.5 font-semibold">
                        N of Valid Cases
                      </td>
                      <td className="border border-zinc-900 p-1.5 text-right font-semibold">{results.symmetricMeasures.totalN}</td>
                      <td className="border border-zinc-900 p-1.5 text-right text-zinc-400">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
