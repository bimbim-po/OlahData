'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Printer,
  Copy,
  Check,
  BookOpen,
  Info,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRCritical, getTCritical, getFCritical } from '@/lib/math-stats';
import { formatNumber } from '@/lib/format';
import { useToast } from '@/components/ui/toaster';

export interface StatisticalReferenceTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  respondentCount: number;
  predictorCount?: number;
  rTabel?: number;
  tTabel?: number;
  fTabel?: number;
}

export function StatisticalReferenceTablesDialog({
  open,
  onOpenChange,
  respondentCount,
  predictorCount = 2,
  rTabel: propR,
  tTabel: propT,
  fTabel: propF,
}: StatisticalReferenceTablesDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'r' | 't' | 'f'>('r');
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);

  const dfR = Math.max(1, respondentCount - 2);
  const dfT = Math.max(1, respondentCount - predictorCount - 1);
  const dfF1 = Math.max(1, predictorCount);
  const dfF2 = Math.max(1, respondentCount - predictorCount - 1);

  const calculatedR = propR ?? getRCritical(dfR, 0.05);
  const calculatedT = propT ?? getTCritical(dfT, 0.05);
  const calculatedF = propF ?? getFCritical(dfF1, dfF2, 0.05);

  // Generate standard df list
  const standardDfs = useMemo(() => {
    const list = new Set<number>();
    for (let i = 1; i <= 60; i++) list.add(i);
    for (let i = 65; i <= 100; i += 5) list.add(i);
    list.add(120);
    list.add(150);
    list.add(200);
    list.add(300);
    list.add(500);
    // Ensure user's exact df is always present
    list.add(dfR);
    list.add(dfT);
    list.add(dfF2);
    return Array.from(list).sort((a, b) => a - b);
  }, [dfR, dfT, dfF2]);

  // Citation text
  const citationTexts = {
    r: `Berdasarkan tabel distribusi r Pearson Product Moment dengan derajat bebas df = N - 2 = ${dfR} pada taraf signifikansi α = 0,05 (uji 2 sisi), diperoleh nilai r tabel sebesar ${formatNumber(calculatedR, 4)}. Seluruh butir kuesioner dinyatakan valid apabila memiliki r hitung > ${formatNumber(calculatedR, 4)}.`,
    t: `Berdasarkan tabel distribusi t Student dengan derajat bebas df = N - k - 1 = ${respondentCount} - ${predictorCount} - 1 = ${dfT} pada taraf signifikansi α = 0,05 (uji 2 sisi), diperoleh nilai t tabel sebesar ${formatNumber(calculatedT, 4)}. Variabel bebas dinyatakan berpengaruh parsial secara signifikan apabila t hitung > ${formatNumber(calculatedT, 4)}.`,
    f: `Berdasarkan tabel distribusi F Fisher dengan derajat bebas pembilang df1 = k = ${dfF1} dan derajat bebas penyebut df2 = N - k - 1 = ${dfF2} pada taraf signifikansi α = 0,05, diperoleh nilai F tabel sebesar ${formatNumber(calculatedF, 4)}. Variabel bebas dinyatakan berpengaruh simultan secara signifikan apabila F hitung > ${formatNumber(calculatedF, 4)}.`,
  };

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationTexts[activeTab]);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
      toast({
        title: 'Redaksi Bab 4 Disalin',
        description: 'Teks rujukan tabel siap ditempelkan langsung ke naskah skripsi Anda.',
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

  const handleCopyTableHtml = async () => {
    try {
      let tableHtml = '';
      if (activeTab === 'r') {
        const rowsHtml = standardDfs
          .map((df) => {
            const isTarget = df === dfR;
            const r10 = getRCritical(df, 0.1);
            const r05 = getRCritical(df, 0.05);
            const r01 = getRCritical(df, 0.01);
            const bg = isTarget ? 'background-color: #FFE14D; font-weight: bold;' : '';
            return `<tr style="${bg}"><td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${df}${isTarget ? ' (df Anda)' : ''}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${formatNumber(r10, 4)}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right; ${isTarget ? 'color: #b45309;' : ''}">${formatNumber(r05, 4)}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${formatNumber(r01, 4)}</td></tr>`;
          })
          .join('');

        tableHtml = `
          <table style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ccc; padding: 8px;">df (N - 2)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,10 (2-tailed)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,05 (2-tailed)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,01 (2-tailed)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
      } else if (activeTab === 't') {
        const rowsHtml = standardDfs
          .map((df) => {
            const isTarget = df === dfT;
            const t10 = getTCritical(df, 0.1);
            const t05 = getTCritical(df, 0.05);
            const t01 = getTCritical(df, 0.01);
            const bg = isTarget ? 'background-color: #FFE14D; font-weight: bold;' : '';
            return `<tr style="${bg}"><td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${df}${isTarget ? ' (df Anda)' : ''}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${formatNumber(t10, 4)}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right; ${isTarget ? 'color: #b45309;' : ''}">${formatNumber(t05, 4)}</td><td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${formatNumber(t01, 4)}</td></tr>`;
          })
          .join('');

        tableHtml = `
          <table style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ccc; padding: 8px;">df (N - k - 1)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,10 (2-tailed)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,05 (2-tailed)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">α = 0,01 (2-tailed)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
      } else {
        const rowsHtml = standardDfs
          .map((df2) => {
            const isTargetRow = df2 === dfF2;
            const bgRow = isTargetRow ? 'background-color: #FEF3C7; font-weight: bold;' : '';
            const cells = [1, 2, 3, 4, 5]
              .map((k) => {
                const fVal = getFCritical(k, df2, 0.05);
                const isTargetCell = isTargetRow && k === dfF1;
                const cellBg = isTargetCell ? 'background-color: #FFE14D; border: 2px solid #b45309;' : '';
                return `<td style="border: 1px solid #ccc; padding: 6px; text-align: right; ${cellBg}">${formatNumber(fVal, 4)}</td>`;
              })
              .join('');
            return `<tr style="${bgRow}"><td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${df2}${isTargetRow ? ' (df2 Anda)' : ''}</td>${cells}</tr>`;
          })
          .join('');

        tableHtml = `
          <table style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ccc; padding: 8px;">df2 (N - k - 1)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">k = 1 (df1 = 1)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">k = 2 (df1 = 2)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">k = 3 (df1 = 3)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">k = 4 (df1 = 4)</th>
                <th style="border: 1px solid #ccc; padding: 8px;">k = 5 (df1 = 5)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
      }

      const blobHtml = new Blob([tableHtml], { type: 'text/html' });
      const blobText = new Blob([citationTexts[activeTab]], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);

      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
      toast({
        title: 'Tabel Ber-Stabilo Disalin!',
        description: 'Format tabel beserta stabilo kuning siap ditempel ke Microsoft Word.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyalin Tabel',
        description: 'Peramban tidak mendukung penyalinan tabel HTML langsung.',
        variant: 'error',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden font-sans">
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Highlighter className="w-5 h-5 text-amber-500" />
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Lampiran Tabel Referensi Statistik (Ber-Stabilo Otomatis)
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Tabel r, t, dan F resmi dengan baris derajat bebas (df) proyek Anda yang telah distabilo kuning untuk lampiran skripsi.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
              <Badge variant="outline" className="text-xs font-mono bg-[#FFE14D]/30 border-amber-500/40 text-amber-900 dark:text-amber-200">
                N = {respondentCount} | k = {predictorCount}
              </Badge>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('r')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border',
                activeTab === 'r'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
              )}
            >
              Tabel r Pearson (df = {dfR})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('t')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border',
                activeTab === 't'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
              )}
            >
              Tabel t Student (df = {dfT})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('f')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border',
                activeTab === 'f'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border'
              )}
            >
              Tabel F Fisher (df1 = {dfF1}, df2 = {dfF2})
            </button>
          </div>
        </DialogHeader>

        {/* Content Body: Citation & Scrollable Table */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Citation Guidance Card */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Draf Kalimat Rujukan Bab 4 Skripsi (Bebas Copas):
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyCitation}
                className="h-7 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 gap-1 px-2 cursor-pointer"
              >
                {copiedCitation ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCitation ? 'Tersalin!' : 'Salin Kalimat'}
              </Button>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-background/80 p-2.5 rounded-lg border border-amber-500/20">
              {citationTexts[activeTab]}
            </p>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto max-h-[380px]">
              {activeTab === 'r' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted text-foreground sticky top-0 z-10 border-b border-border font-semibold">
                    <tr>
                      <th className="p-2.5 text-center">df (N - 2)</th>
                      <th className="p-2.5 text-right">Uji 1 Arah (0,05) / 2 Arah (0,10)</th>
                      <th className="p-2.5 text-right font-bold text-primary">Uji 2 Arah (α = 0,05) ★</th>
                      <th className="p-2.5 text-right">Uji 2 Arah (α = 0,01)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                    {standardDfs.map((df) => {
                      const isTarget = df === dfR;
                      const r10 = getRCritical(df, 0.1);
                      const r05 = getRCritical(df, 0.05);
                      const r01 = getRCritical(df, 0.01);
                      return (
                        <tr
                          key={df}
                          className={cn(
                            'transition-colors',
                            isTarget
                              ? 'bg-[#FFE14D] dark:bg-amber-400 text-slate-950 font-bold border-y-2 border-amber-600 shadow-xs'
                              : 'hover:bg-muted/30 text-foreground'
                          )}
                        >
                          <td className="p-2.5 text-center font-bold">{df}</td>
                          <td className="p-2.5 text-right">{formatNumber(r10, 4)}</td>
                          <td className="p-2.5 text-right font-extrabold text-amber-950 dark:text-slate-950">
                            {formatNumber(r05, 4)}
                          </td>
                          <td className="p-2.5 text-right">{formatNumber(r01, 4)}</td>
                          <td className="p-2.5 text-center font-sans">
                            {isTarget ? (
                              <Badge className="bg-amber-900 text-amber-100 hover:bg-amber-900 text-[10px] py-0 font-bold uppercase tracking-wider">
                                df Skripsi Anda
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 't' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted text-foreground sticky top-0 z-10 border-b border-border font-semibold">
                    <tr>
                      <th className="p-2.5 text-center">df (N - k - 1)</th>
                      <th className="p-2.5 text-right">Uji 2 Arah (α = 0,10)</th>
                      <th className="p-2.5 text-right font-bold text-primary">Uji 2 Arah (α = 0,05) ★</th>
                      <th className="p-2.5 text-right">Uji 2 Arah (α = 0,01)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                    {standardDfs.map((df) => {
                      const isTarget = df === dfT;
                      const t10 = getTCritical(df, 0.1);
                      const t05 = getTCritical(df, 0.05);
                      const t01 = getTCritical(df, 0.01);
                      return (
                        <tr
                          key={df}
                          className={cn(
                            'transition-colors',
                            isTarget
                              ? 'bg-[#FFE14D] dark:bg-amber-400 text-slate-950 font-bold border-y-2 border-amber-600 shadow-xs'
                              : 'hover:bg-muted/30 text-foreground'
                          )}
                        >
                          <td className="p-2.5 text-center font-bold">{df}</td>
                          <td className="p-2.5 text-right">{formatNumber(t10, 4)}</td>
                          <td className="p-2.5 text-right font-extrabold text-amber-950 dark:text-slate-950">
                            {formatNumber(t05, 4)}
                          </td>
                          <td className="p-2.5 text-right">{formatNumber(t01, 4)}</td>
                          <td className="p-2.5 text-center font-sans">
                            {isTarget ? (
                              <Badge className="bg-amber-900 text-amber-100 hover:bg-amber-900 text-[10px] py-0 font-bold uppercase tracking-wider">
                                df Skripsi Anda
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {activeTab === 'f' && (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted text-foreground sticky top-0 z-10 border-b border-border font-semibold">
                    <tr>
                      <th className="p-2.5 text-center">df2 (N - k - 1)</th>
                      <th className="p-2.5 text-right">k = 1</th>
                      <th className="p-2.5 text-right">k = 2</th>
                      <th className="p-2.5 text-right">k = 3</th>
                      <th className="p-2.5 text-right">k = 4</th>
                      <th className="p-2.5 text-right">k = 5</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                    {standardDfs.map((df2) => {
                      const isTargetRow = df2 === dfF2;
                      return (
                        <tr
                          key={df2}
                          className={cn(
                            'transition-colors',
                            isTargetRow
                              ? 'bg-amber-100/80 dark:bg-amber-950/40 text-foreground font-semibold border-y border-amber-500/40'
                              : 'hover:bg-muted/30 text-foreground'
                          )}
                        >
                          <td className="p-2.5 text-center font-bold">{df2}</td>
                          {[1, 2, 3, 4, 5].map((k) => {
                            const fVal = getFCritical(k, df2, 0.05);
                            const isExactCell = isTargetRow && k === dfF1;
                            return (
                              <td
                                key={k}
                                className={cn(
                                  'p-2.5 text-right',
                                  isExactCell
                                    ? 'bg-[#FFE14D] dark:bg-amber-400 text-slate-950 font-black rounded-xs shadow-xs'
                                    : ''
                                )}
                              >
                                {formatNumber(fVal, 4)}
                              </td>
                            );
                          })}
                          <td className="p-2.5 text-center font-sans">
                            {isTargetRow ? (
                              <Badge className="bg-amber-900 text-amber-100 hover:bg-amber-900 text-[10px] py-0 font-bold uppercase tracking-wider">
                                df2 Anda
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>Tabel diturunkan secara deterministik menggunakan inverse distribusi Student&apos;s t dan Fisher F.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyTableHtml}
              className="flex-1 sm:flex-none text-xs rounded-lg gap-1.5 cursor-pointer font-medium"
            >
              {copiedTable ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTable ? 'Tabel Tersalin' : 'Salin Tabel untuk Word'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none text-xs rounded-lg gap-1.5 cursor-pointer font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs rounded-lg cursor-pointer font-semibold"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
