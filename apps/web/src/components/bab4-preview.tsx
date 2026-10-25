'use client';

import * as React from 'react';
import { Table as TableIcon, Copy, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/copy';
import { mockResults } from '@/lib/mock/results';
import { formatNumber, formatPValue, getSignificanceLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { copyWordTable, copyWordNarrative } from '@/lib/word-table';

type ActiveTab = 'regression' | 'reliability' | 'validity';

export function Bab4Preview() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('regression');
  const [copied, setCopied] = React.useState(false);
  const [activeNumber, setActiveNumber] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (text: string, label: string) => {
    await copyWordNarrative(text, label);
    setCopied(true);
    toast({
      title: `${label} berhasil disalin`,
      description: 'Format siap Anda tempelkan langsung ke dokumen Bab 4 skripsi Anda.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTableWord = async () => {
    let success = false;
    if (activeTab === 'regression') {
      const columns = [
        { header: 'Variabel', align: 'left' as const },
        { header: 'Koefisien (B)', align: 'right' as const },
        { header: 'Std. Error', align: 'right' as const },
        { header: 't Hitung', align: 'right' as const },
        { header: 'Sig. (p)', align: 'right' as const },
        { header: 'Keterangan', align: 'center' as const },
      ];
      const rows = (mockResults.regression ?? []).map((r) => [
        r.variable,
        formatNumber(r.coefficient, 3),
        formatNumber(r.stdError, 3),
        formatNumber(r.tHitung, 3),
        formatPValue(r.pValue, 3),
        getSignificanceLabel(r.pValue, 0.05, r.variable.includes('Konstanta')),
      ]);
      success = await copyWordTable({
        tableNumber: 'Tabel 4.15',
        title: 'Hasil Uji Regresi Linier Berganda',
        note: 'N = 100 responden, k = 2 prediktor, F Hitung = 30,525 (p < 0,001), R² = 0,386, Adjusted R² = 0,374, F Tabel = 3,090',
        columns,
        rows,
      });
    } else if (activeTab === 'reliability') {
      const columns = [
        { header: 'Konstruk Variabel', align: 'left' as const },
        { header: 'Jumlah Butir Valid', align: 'right' as const },
        { header: "Cronbach's Alpha", align: 'right' as const },
        { header: 'Batas Kritis (α)', align: 'right' as const },
        { header: 'Status', align: 'center' as const },
      ];
      const rows = [
        ['Kualitas Layanan (X1)', '4', '0,796', '0,700', 'Reliabel'],
        ['Kepuasan Pelanggan (X2)', '5', '0,753', '0,700', 'Reliabel'],
        ['Loyalitas Pelanggan (Y)', '5', '0,826', '0,700', 'Reliabel'],
      ];
      success = await copyWordTable({
        tableNumber: 'Tabel 4.9',
        title: "Hasil Uji Reliabilitas Cronbach's Alpha",
        note: "N = 100 responden, Total Butir Instrumen = 14 butir valid, Kriteria: Cronbach's Alpha > 0,700",
        columns,
        rows,
      });
    } else {
      const columns = [
        { header: 'Item Pernyataan', align: 'left' as const },
        { header: 'r Hitung', align: 'right' as const },
        { header: 'r Tabel (α=0,05)', align: 'right' as const },
        { header: 'Sig. (p)', align: 'right' as const },
        { header: 'Status', align: 'center' as const },
      ];
      const rows = (mockResults.validity ?? []).slice(0, 5).map((r) => [
        r.item,
        formatNumber(r.rHitung, 3),
        formatNumber(r.rTabel, 4),
        r.rHitung < 0 ? '0,641' : '< 0,001',
        r.valid ? 'Valid' : 'Gugur',
      ]);
      success = await copyWordTable({
        tableNumber: 'Tabel 4.8',
        title: 'Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)',
        note: 'N = 100 responden, df = 98, r Tabel (α=0,05) = 0,1966',
        columns,
        rows,
      });
    }

    if (success) {
      toast({
        title: COPY.layers.copied,
        description: 'Tabel berformat APA Word berhasil disalin. Tempelkan (Ctrl+V) langsung ke lembar Microsoft Word.',
        variant: 'success',
      });
    }
  };

  const reliabilityNarrative = "Berdasarkan Tabel 4.9, pengujian reliabilitas instrumen dengan koefisien Cronbach's Alpha menghasilkan nilai sebesar 0,796 pada variabel Kualitas Layanan (X1) dengan 4 butir pernyataan valid, 0,753 pada variabel Kepuasan Pelanggan (X2) dengan 5 butir pernyataan, dan 0,826 pada variabel Loyalitas Pelanggan (Y) dengan 5 butir pernyataan (total 14 butir instrumen valid). Mengingat nilai Cronbach's Alpha seluruh konstruk berada di atas batas kritis 0,700, instrumen penelitian dinyatakan reliabel dan memiliki konsistensi internal yang tinggi untuk analisis hipotesis.";

  // Render tokens with connected number highlighting
  const narrativeText =
    activeTab === 'regression'
      ? (mockResults.explanations?.regression ?? '')
      : activeTab === 'reliability'
      ? reliabilityNarrative
      : (mockResults.explanations?.validity ?? '');

  const narrativeTokens = React.useMemo(() => {
    const regex = /(\b\d+(?:,\d+)?%?|\b\d+\b)/g;
    const parts: { text: string; isNumber: boolean; raw: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(narrativeText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: narrativeText.slice(lastIndex, match.index),
          isNumber: false,
          raw: '',
        });
      }
      const numStr = match[0];
      parts.push({
        text: numStr,
        isNumber: true,
        raw: numStr.replace('%', '').trim(),
      });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < narrativeText.length) {
      parts.push({
        text: narrativeText.slice(lastIndex),
        isNumber: false,
        raw: '',
      });
    }
    return parts;
  }, [narrativeText]);

  const isMatched = (val: string | number) => {
    if (!activeNumber) return false;
    const s = String(val).trim();
    return s === activeNumber || (s.length > 0 && activeNumber.length > 0 && (s.includes(activeNumber) || activeNumber.includes(s)));
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden font-sans">
      {/* Tab Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="inline-flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('regression');
              setActiveNumber(null);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'regression'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            Regresi Berganda
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('reliability');
              setActiveNumber(null);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'reliability'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            Uji Reliabilitas
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('validity');
              setActiveNumber(null);
            }}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'validity'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            Uji Validitas Item
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="mint" className="text-xs font-medium py-1 px-2.5 rounded-lg">
            {COPY.badges.computedByEngine}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTableWord}
            className="h-9 text-xs gap-2 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
            title="Salin tabel format tab-separated untuk Microsoft Word"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Salin Tabel Word</span>
          </Button>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 space-y-6">
        {/* Table Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {activeTab === 'regression'
                ? 'Tabel 4.15 Hasil Analisis Regresi Linier Berganda'
                : activeTab === 'reliability'
                ? "Tabel 4.9 Hasil Uji Reliabilitas Cronbach's Alpha"
                : 'Tabel 4.8 Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)'}
            </h3>
            <span className="text-xs font-mono whitespace-normal sm:whitespace-nowrap">Format Baku APA 7th Edition</span>
          </div>

          <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800/90 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
            {activeTab === 'regression' ? (
              <table className="table-journal min-w-full text-left text-xs sm:text-sm font-sans">
                <thead>
                  <tr className="border-t-2 border-b-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold">
                    <th className="px-4 py-3 text-left">Variabel</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Koefisien (B)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Std. Error</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">t Hitung</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Sig. (p)</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(mockResults.regression ?? []).map((row, i) => {
                    const isConst = row.variable.includes('Konstanta');
                    const tStr = formatNumber(row.tHitung, 3);
                    const bStr = formatNumber(row.coefficient, 3);
                    const pStr = formatPValue(row.pValue, 3);
                    const sigLabel = getSignificanceLabel(row.pValue, 0.05, isConst);
                    const isTMatched = isMatched(tStr);
                    const isBMatched = isMatched(bStr);

                    return (
                      <tr key={i} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap text-left">
                          {row.variable}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                            isBMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                          )}
                          onMouseEnter={() => setActiveNumber(bStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === bStr ? null : bStr)}
                        >
                          {bStr}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {formatNumber(row.stdError, 3)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                            isTMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                          )}
                          onMouseEnter={() => setActiveNumber(tStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === tStr ? null : tStr)}
                        >
                          {tStr}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200 whitespace-nowrap tabular-nums">
                          {pStr}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isConst ? (
                            <span className="text-slate-400 text-xs">—</span>
                          ) : row.pValue < 0.05 ? (
                            <span className="text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                              {sigLabel}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                              {sigLabel}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-slate-900 dark:border-slate-100">
                    <td colSpan={6} className="p-2 sm:p-3">
                      {/* Baris Ringkasan Statistik Kaki Tabel (N=100, F Hitung, R2) */}
                      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg text-xs sm:text-sm tabular-nums text-slate-700 dark:text-slate-300">
                        <span className="whitespace-nowrap">N = <strong>100</strong> responden</span>
                        <span className="whitespace-nowrap">Prediktor (k) = <strong>2</strong></span>
                        <span className="whitespace-nowrap">F Hitung = <strong>30,525</strong> (p &lt; 0,001)</span>
                        <span className="whitespace-nowrap">R² = <strong>0,386</strong></span>
                        <span className="whitespace-nowrap">Adjusted R² = <strong>0,374</strong></span>
                        <span className="whitespace-nowrap">F Tabel = <strong>3,090</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : activeTab === 'reliability' ? (
              <table className="table-journal min-w-full text-left text-xs sm:text-sm font-sans">
                <thead>
                  <tr className="border-t-2 border-b-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold">
                    <th className="px-4 py-3 text-left">Konstruk Variabel</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Jumlah Butir Valid</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Cronbach&apos;s Alpha</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Batas Kritis (α)</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[
                    { construct: 'Kualitas Layanan (X1)', items: 4, alpha: '0,796', cut: '0,700', status: 'Reliabel' },
                    { construct: 'Kepuasan Pelanggan (X2)', items: 5, alpha: '0,753', cut: '0,700', status: 'Reliabel' },
                    { construct: 'Loyalitas Pelanggan (Y)', items: 5, alpha: '0,826', cut: '0,700', status: 'Reliabel' },
                  ].map((row, i) => {
                    const matched = isMatched(row.alpha);
                    return (
                      <tr key={i} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap text-left">
                          {row.construct}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {row.items}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                            matched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                          )}
                          onMouseEnter={() => setActiveNumber(row.alpha)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === row.alpha ? null : row.alpha)}
                        >
                          {row.alpha}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {row.cut}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                            <Check className="h-3.5 w-3.5" />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-slate-900 dark:border-slate-100">
                    <td colSpan={5} className="p-2 sm:p-3">
                      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg text-xs sm:text-sm tabular-nums text-slate-700 dark:text-slate-300">
                        <span className="whitespace-nowrap">N = <strong>100</strong> responden</span>
                        <span className="whitespace-nowrap">Total Butir Instrumen = <strong>14</strong> butir valid</span>
                        <span className="whitespace-nowrap">Kriteria Reliabilitas: <strong>Cronbach&apos;s Alpha &gt; 0,700</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="table-journal min-w-full text-left text-xs sm:text-sm font-sans">
                <thead>
                  <tr className="border-t-2 border-b-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 font-semibold">
                    <th className="px-4 py-3 text-left">Item Pernyataan</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">r Hitung</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">r Tabel (α=0,05)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap tabular-nums">Sig. (p)</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(mockResults.validity ?? []).slice(0, 5).map((row, i) => {
                    const rStr = formatNumber(row.rHitung, 3);
                    const matched = isMatched(rStr);
                    const pValStr = row.rHitung < 0 ? '0,641' : '< 0,001';

                    return (
                      <tr key={i} className="border-b border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap text-left">
                          {row.item} (Indikator #{i + 1})
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                            matched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                          )}
                          onMouseEnter={() => setActiveNumber(rStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === rStr ? null : rStr)}
                        >
                          {rStr}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {formatNumber(row.rTabel, 4)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {pValStr}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {row.valid ? (
                            <span className="text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                              Valid
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-[#8A1E18] bg-[#FDEEED] px-2.5 py-0.5 rounded-md">
                              Gugur
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-slate-900 dark:border-slate-100">
                    <td colSpan={5} className="p-2 sm:p-3">
                      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg text-xs sm:text-sm tabular-nums text-slate-700 dark:text-slate-300">
                        <span className="whitespace-nowrap">N = <strong>100</strong> responden</span>
                        <span className="whitespace-nowrap">Derajat Kebebasan (df) = <strong>98</strong></span>
                        <span className="whitespace-nowrap">r Tabel (α=0,05) = <strong>0,1966</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Sumber: Data primer diolah (2026). Dihitung dengan mesin statistik deterministik baku. Format tabel standar APA 7th Edition.
          </p>
        </div>

        {/* Lapis 3: Kotak Draf Narasi Bab 4 dengan Spasi Longgar Leading-8 */}
        <div className="mt-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
            <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md">
              {COPY.layers.aiNote}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(narrativeText, 'Paragraf penjelasan')}
              className="h-9 text-xs gap-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              <span>{copied ? 'Tersalin' : 'Salin Paragraf'}</span>
            </Button>
          </div>

          <div className="text-sm leading-8 text-slate-700 dark:text-slate-300 font-sans max-w-[72ch] select-text">
            {narrativeTokens.map((token, idx) => {
              if (!token.isNumber || !token.raw) {
                return <span key={idx}>{token.text}</span>;
              }
              const active = isMatched(token.raw);
              return (
                <button
                  type="button"
                  key={idx}
                  onMouseEnter={() => setActiveNumber(token.raw)}
                  onMouseLeave={() => setActiveNumber(null)}
                  onClick={() => setActiveNumber(activeNumber === token.raw ? null : token.raw)}
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 mx-0.5 text-xs sm:text-sm font-semibold rounded-md transition-all tabular-nums cursor-pointer select-text border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
                    'hover:bg-[#FFE14D]/40 hover:border-[#FFE14D] hover:text-[#243044]',
                    active && 'bg-[#FFE14D] border-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] shadow-xs scale-105'
                  )}
                  title={`Sorot nilai ${token.text} di tabel di atas`}
                >
                  {token.text}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>
              Arahkan kursor atau sentuh angka bertinta untuk menyorot sel asalnya di lembar tabel di atas secara langsung.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
