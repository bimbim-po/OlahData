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

type ActiveTab = 'regression' | 'validity';

export function Bab4Preview() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>('regression');
  const [copied, setCopied] = React.useState(false);
  const [activeNumber, setActiveNumber] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: `${label} berhasil disalin`,
      description: 'Format siap kamu tempelkan langsung ke dokumen Bab 4 skripsimu.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTableWord = () => {
    if (activeTab === 'regression') {
      const header = 'Variabel\tKoefisien (B)\tStd. Error\tt Hitung\tSig. (p)\tKeterangan';
      const rows = (mockResults.regression ?? []).map(
        (r) => `${r.variable}\t${formatNumber(r.coefficient, 3)}\t${formatNumber(r.stdError, 3)}\t${formatNumber(r.tHitung, 3)}\t${formatNumber(r.pValue, 3)}\tSignifikan`
      );
      const text = `Tabel 4.15 Hasil Uji Regresi Linier Berganda\n${header}\n${rows.join('\n')}\nCatatan: F = 48,652, R² = 0,460, F Tabel = 3,076`;
      navigator.clipboard.writeText(text);
    } else {
      const header = 'Item Pernyataan\tr Hitung\tr Tabel (α=0,05)\tStatus';
      const rows = (mockResults.validity ?? []).slice(0, 6).map(
        (r, i) => `${r.item} (Indikator #${i + 1})\t${formatNumber(r.rHitung, 3)}\t${formatNumber(r.rTabel, 4)}\tValid`
      );
      const text = `Tabel 4.8 Hasil Uji Validitas Item Variabel Kualitas Layanan (X1)\n${header}\n${rows.join('\n')}\nCatatan: N = 117 responden`;
      navigator.clipboard.writeText(text);
    }
    toast({
      title: COPY.layers.copied,
      description: 'Tempelkan (Ctrl+V) langsung ke dokumen Word skripsimu.',
      variant: 'success',
    });
  };

  // Render tokens with connected number highlighting
  const narrativeText =
    activeTab === 'regression'
      ? (mockResults.explanations?.regression ?? '')
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {activeTab === 'regression'
                ? 'Tabel 4.15 Hasil Analisis Regresi Linier Berganda'
                : 'Tabel 4.8 Hasil Uji Validitas Item Kuesioner'}
            </span>
            <span className="text-[11px]">Format Baku APA 7th Edition</span>
          </div>

          <div className="overflow-x-auto border border-border rounded-[6px] bg-card">
            {activeTab === 'regression' ? (
              <table className="table-journal min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-t-2 border-b border-foreground text-foreground font-semibold">
                    <th className="py-2 px-3">Variabel</th>
                    <th className="py-2 px-3 text-right">Koefisien (B)</th>
                    <th className="py-2 px-3 text-right">Std. Error</th>
                    <th className="py-2 px-3 text-right">t Hitung</th>
                    <th className="py-2 px-3 text-right">Sig. (p)</th>
                    <th className="py-2 px-3 text-center">Keterangan</th>
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
                        <td className="py-2 px-3 font-medium text-foreground">
                          {row.variable}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right transition-colors cursor-pointer',
                            isBMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(bStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === bStr ? null : bStr)}
                        >
                          {bStr}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          {formatNumber(row.stdError, 3)}
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right font-medium transition-colors cursor-pointer',
                            isTMatched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(tStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === tStr ? null : tStr)}
                        >
                          {tStr}
                        </td>
                        <td className="py-2 px-3 text-right text-foreground">
                          {pStr}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            Signifikan
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-foreground bg-muted/20 text-xs text-muted-foreground">
                    <td colSpan={6} className="py-2 px-3">
                      <div className="flex flex-wrap gap-4 text-xs tabular-nums">
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
              <table className="table-journal min-w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-t-2 border-b border-foreground text-foreground font-semibold">
                    <th className="py-2 px-3">Item Pernyataan</th>
                    <th className="py-2 px-3 text-right">r Hitung</th>
                    <th className="py-2 px-3 text-right">r Tabel (α=0,05)</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {(mockResults.validity ?? []).slice(0, 6).map((row, i) => {
                    const rStr = formatNumber(row.rHitung, 3);
                    const matched = isMatched(rStr);

                    return (
                      <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground">
                          {row.item} (Indikator #{i + 1})
                        </td>
                        <td
                          className={cn(
                            'py-2 px-3 text-right transition-colors cursor-pointer',
                            matched && 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-[4px]'
                          )}
                          onMouseEnter={() => setActiveNumber(rStr)}
                          onMouseLeave={() => setActiveNumber(null)}
                          onClick={() => setActiveNumber(activeNumber === rStr ? null : rStr)}
                        >
                          {rStr}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          {formatNumber(row.rTabel, 4)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                            Valid
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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

          <div className="text-sm leading-relaxed text-foreground font-sans max-w-[68ch]">
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
