'use client';

import * as React from 'react';
import { Table as TableIcon, Copy, Check, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COPY } from '@/lib/copy';
import { mockResults } from '@/lib/mock/results';
import { formatNumber } from '@/lib/format';
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
        formatNumber(r.pValue, 3),
        'Signifikan',
      ]);
      success = await copyWordTable({
        tableNumber: 'Tabel 4.15',
        title: 'Hasil Uji Regresi Linier Berganda',
        note: 'N = 120 responden, k = 2 prediktor, F Hitung = 70,824, R² = 0,548, Adjusted R² = 0,540, F Tabel = 3,074',
        columns,
        rows,
      });
    } else if (activeTab === 'reliability') {
      const columns = [
        { header: 'Konstruk Variabel', align: 'left' as const },
        { header: 'Jumlah Butir', align: 'right' as const },
        { header: "Cronbach's Alpha", align: 'right' as const },
        { header: 'Batas Kritis (α)', align: 'right' as const },
        { header: 'Status', align: 'center' as const },
      ];
      const rows = [
        ['Kualitas Layanan (X1)', '8', '0,874', '0,700', 'Reliabel'],
        ['Kepuasan Pelanggan (X2)', '7', '0,852', '0,700', 'Reliabel'],
        ['Loyalitas Pelanggan (Y)', '6', '0,881', '0,700', 'Reliabel'],
      ];
      success = await copyWordTable({
        tableNumber: 'Tabel 4.9',
        title: "Hasil Uji Reliabilitas Cronbach's Alpha",
        note: "N = 120 responden, Total Butir Instrumen = 15 butir, Kriteria: Cronbach's Alpha > 0,700",
        columns,
        rows,
      });
    } else {
      const columns = [
        { header: 'Item Pernyataan', align: 'left' as const },
        { header: 'r Hitung', align: 'right' as const },
        { header: 'r Tabel (α=0,05)', align: 'right' as const },
        { header: 'Status', align: 'center' as const },
      ];
      const rows = (mockResults.validity ?? []).slice(0, 6).map((r, i) => [
        `${r.item} (Indikator #${i + 1})`,
        formatNumber(r.rHitung, 3),
        formatNumber(r.rTabel, 4),
        'Valid',
      ]);
      success = await copyWordTable({
        tableNumber: 'Tabel 4.8',
        title: 'Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)',
        note: 'N = 120 responden, r Tabel (α=0,05, df=118) = 0,1793',
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

  const reliabilityNarrative = "Berdasarkan Tabel 4.9, pengujian reliabilitas instrumen dengan koefisien Cronbach's Alpha menghasilkan nilai sebesar 0,874 pada variabel Kualitas Layanan (X1) dengan 8 butir pernyataan dan 0,852 pada variabel Kepuasan Pelanggan (Y) dengan 7 butir pernyataan (total 15 butir instrumen). Mengingat nilai Cronbach's Alpha seluruh konstruk berada di atas batas kritis 0,700, instrumen penelitian dinyatakan reliabel dan memiliki konsistensi internal yang tinggi untuk analisis hipotesis.";

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
    <div className="w-full rounded-[16px] border border-border bg-card shadow-xs overflow-hidden font-sans">
      {/* Tab Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-1.5 p-1 bg-background border border-border rounded-[10px]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('regression');
              setActiveNumber(null);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
              activeTab === 'regression'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
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
              'px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
              activeTab === 'reliability'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
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
              'px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
              activeTab === 'validity'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Uji Validitas Item
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="mint" className="text-[11px] font-medium py-0.5 px-2 rounded-[6px]">
            {COPY.badges.computedByEngine}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTableWord}
            className="h-8 text-xs gap-1.5 rounded-[10px]"
            title="Salin tabel format tab-separated untuk Microsoft Word"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Salin Tabel Word</span>
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Lapis 2: Table Section */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-muted-foreground">
            <h3 className="font-semibold text-foreground text-xs sm:text-sm">
              {activeTab === 'regression'
                ? 'Tabel 4.15 Hasil Analisis Regresi Linier Berganda'
                : activeTab === 'reliability'
                ? "Tabel 4.9 Hasil Uji Reliabilitas Cronbach's Alpha"
                : 'Tabel 4.8 Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)'}
            </h3>
            <span className="text-[11px] whitespace-normal sm:whitespace-nowrap">Format Baku APA 7th Edition</span>
          </div>

          <div className="overflow-x-auto border border-border rounded-[6px] bg-card">
            {activeTab === 'regression' ? (
              <table className="table-journal min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-t-2 border-b border-foreground text-foreground font-semibold">
                    <th className="py-2 px-3">Variabel</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Koefisien (B)</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Std. Error</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">t Hitung</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Sig. (p)</th>
                    <th className="py-2 px-3 text-center whitespace-nowrap">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(mockResults.regression ?? []).map((row, i) => {
                    const tStr = formatNumber(row.tHitung, 3);
                    const bStr = formatNumber(row.coefficient, 3);
                    const pStr = formatNumber(row.pValue, 3);
                    const isTMatched = isMatched(tStr);
                    const isBMatched = isMatched(bStr);

                    return (
                      <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          {row.variable}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right transition-colors cursor-pointer whitespace-nowrap',
                            isBMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(bStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === bStr ? null : bStr)}
                        >
                          {bStr}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground whitespace-nowrap">
                          {formatNumber(row.stdError, 3)}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right font-medium transition-colors cursor-pointer whitespace-nowrap',
                            isTMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(tStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === tStr ? null : tStr)}
                        >
                          {tStr}
                        </td>
                        <td className="py-2 px-3 text-right text-foreground whitespace-nowrap">
                          {pStr}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            Signifikan
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-foreground bg-muted/20 text-xs text-muted-foreground">
                    <td colSpan={6} className="py-2 px-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs tabular-nums text-foreground/90">
                        <span className="whitespace-nowrap">N = <strong>120</strong></span>
                        <span className="whitespace-nowrap">Jumlah Prediktor (k) = <strong>2</strong></span>
                        <span className="whitespace-nowrap">F Hitung = <strong>70,824</strong> (Sig &lt; 0,001)</span>
                        <span className="whitespace-nowrap">R² = <strong>0,548</strong></span>
                        <span className="whitespace-nowrap">Adjusted R² = <strong>0,540</strong></span>
                        <span className="whitespace-nowrap">F Tabel = <strong>3,074</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : activeTab === 'reliability' ? (
              <table className="table-journal min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-t-2 border-b border-foreground text-foreground font-semibold">
                    <th className="py-2 px-3">Konstruk Variabel</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Jumlah Butir</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Cronbach&apos;s Alpha</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">Batas Kritis (α)</th>
                    <th className="py-2 px-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[
                    { construct: 'Kualitas Layanan (X1)', items: 8, alpha: '0,874', cut: '0,700', status: 'Reliabel' },
                    { construct: 'Kepuasan Pelanggan (Y)', items: 7, alpha: '0,852', cut: '0,700', status: 'Reliabel' },
                  ].map((row, i) => {
                    const matched = isMatched(row.alpha);
                    return (
                      <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          {row.construct}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground whitespace-nowrap">
                          {row.items}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right font-semibold transition-colors cursor-pointer whitespace-nowrap',
                            matched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(row.alpha)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === row.alpha ? null : row.alpha)}
                        >
                          {row.alpha}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground whitespace-nowrap">
                          {row.cut}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            <Check className="h-3 w-3" />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-foreground bg-muted/20 text-xs text-muted-foreground">
                    <td colSpan={5} className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs tabular-nums text-foreground/90">
                        <span className="whitespace-nowrap">N = <strong>120</strong> responden</span>
                        <span className="whitespace-nowrap">Total Butir Instrumen = <strong>15</strong> butir</span>
                        <span className="whitespace-nowrap">Kriteria Reliabilitas: <strong>Cronbach&apos;s Alpha &gt; 0,700</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="table-journal min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-t-2 border-b border-foreground text-foreground font-semibold">
                    <th className="py-2 px-3">Item Pernyataan</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">r Hitung</th>
                    <th className="py-2 px-3 text-right whitespace-nowrap">r Tabel (α=0,05)</th>
                    <th className="py-2 px-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(mockResults.validity ?? []).slice(0, 6).map((row, i) => {
                    const rStr = formatNumber(row.rHitung, 3);
                    const matched = isMatched(rStr);

                    return (
                      <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          {row.item} (Indikator #{i + 1})
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right transition-colors cursor-pointer whitespace-nowrap',
                            matched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(rStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === rStr ? null : rStr)}
                        >
                          {rStr}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground whitespace-nowrap">
                          {formatNumber(row.rTabel, 4)}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            Valid
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-foreground bg-muted/20 text-xs text-muted-foreground">
                    <td colSpan={4} className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs tabular-nums text-foreground/90">
                        <span className="whitespace-nowrap">N = <strong>120</strong> responden</span>
                        <span className="whitespace-nowrap">Derajat Kebebasan (df) = <strong>118</strong></span>
                        <span className="whitespace-nowrap">r Tabel (α=0,05) = <strong>0,1793</strong></span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sumber: Data kuesioner diolah dengan mesin statistik {COPY.badges.computedByEngine}. Format tabel baku APA 7th Edition tanpa garis vertikal.
          </p>
        </div>

        {/* Lapis 3: Narrative Box with Connected Numbers */}
        <div className="rounded-[16px] border border-border bg-card p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground border-border bg-muted/40 px-2 py-0.5 rounded-[6px]">
              {COPY.layers.aiNote}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(narrativeText, 'Paragraf penjelasan')}
              className="h-8 text-xs gap-1.5 rounded-[10px]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              <span>{copied ? 'Tersalin' : 'Salin Paragraf'}</span>
            </Button>
          </div>

          <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans max-w-[68ch]">
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
                    'inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded-[4px] transition-all tabular-nums cursor-pointer select-none border border-border/80 bg-muted/60',
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

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Arahkan kursor atau sentuh angka bertinta untuk menyorot sel asalnya di lembar tabel di atas secara langsung.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
