'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import type { AnalysisResults, TestType } from '@/lib/api/types';
import { exportResult } from '@/lib/api';

interface Chapter4AsyncExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: AnalysisResults | null;
  projectId?: string;
  projectTitle?: string;
  onCopyAllTables?: () => void;
  initialFormat?: 'docx' | 'pdf';
}

type ExportState = 'idle' | 'preparing' | 'ready' | 'failed';

export function Chapter4AsyncExportModal({
  open,
  onOpenChange,
  results,
  projectId = 'sample',
  projectTitle,
  onCopyAllTables,
  initialFormat = 'docx',
}: Chapter4AsyncExportModalProps) {
  const resolvedProjectTitle =
    (projectTitle && projectTitle.trim()) ||
    (results?.projectTitle && results.projectTitle.trim()) ||
    'Penelitian Skripsi';
  const { toast } = useToast();
  const [format, setFormat] = useState<'docx' | 'pdf'>(initialFormat);
  const [includeDeclaration, setIncludeDeclaration] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [readyFilename, setReadyFilename] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState('Menyiapkan dokumen...');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && initialFormat) {
      setFormat(initialFormat);
    }
    if (!open) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setExportState('idle');
      setDownloadUrl(null);
      setErrorCode(null);
    }
  }, [open, initialFormat]);

  const startAsyncExport = async () => {
    if (!results) return;
    setExportState('preparing');
    setProgressMsg('Menyiapkan naskah Bab 4 berstandar APA 7th...');
    setErrorCode(null);

    try {
      // 1. Coba hubungi endpoint backend jika tersedia
      let blob: Blob | null = null;
      let outFilename = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const response = await fetch('/api/ekspor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            format,
            projectTitle: resolvedProjectTitle,
            includeDeclaration,
            results,
            tableId: selectedTableId !== 'all' ? selectedTableId : undefined,
            direct: true,
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const cType = response.headers.get('content-type') || '';
          if (cType.includes('application/pdf') || cType.includes('officedocument') || cType.includes('msword') || cType.includes('octet-stream')) {
            blob = await response.blob();
            const disp = response.headers.get('content-disposition');
            if (disp && disp.includes('filename=')) {
              const m = disp.match(/filename="?([^"]+)"?/);
              if (m) outFilename = m[1];
            }
          }
        }
      } catch {
        // Backend tidak aktif (misal di Cloudflare Pages static export), otomatis fallback ke generator klien
      }

      // 2. Generator Deterministik Sisi Klien (Client-Side Fallback)
      if (!blob) {
        setProgressMsg('Menyusun tabel tiga garis APA 7th & diagram naskah...');

        const targetFormat = format === 'pdf' ? 'pdf' : 'word';
        const sectionsToInclude: TestType[] = [
          'descriptive',
          'validity',
          'reliability',
          'normality',
          'multicollinearity',
          'heteroscedasticity',
          'regression',
          'correlation',
          'crosstab',
          'odds-ratio',
        ];

        blob = await exportResult(
          projectId,
          {
            format: targetFormat,
            sections: sectionsToInclude,
            includeStatement: includeDeclaration,
            narrativeTone: 'standard',
            projectTitle: resolvedProjectTitle,
          },
          results
        );

        const ext = format === 'pdf' ? 'pdf' : 'doc';
        const safeTitle = (resolvedProjectTitle || 'Penelitian')
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 35)
          .replace(/^_|_$/g, '') || 'Penelitian';
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        outFilename = `OlahData_Bab4_${safeTitle}_${dateStr}.${ext}`;
      }

      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setReadyFilename(outFilename || `OlahData_Bab4.${format === 'pdf' ? 'pdf' : 'doc'}`);
      setExportState('ready');

      // Otomatis unduh langsung ke browser tanpa perlu klik berulang
      const a = document.createElement('a');
      a.href = url;
      a.download = outFilename || `OlahData_Bab4.${format === 'pdf' ? 'pdf' : 'doc'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Berkas Berhasil Dihasilkan & Diunduh',
        description: `${outFilename} siap digunakan untuk naskah skripsi Anda.`,
        variant: 'success',
      });
    } catch (err: unknown) {
      setExportState('failed');
      setErrorCode(err instanceof Error ? err.message : 'EXPORT_FAILED');
    }
  };

  const handleDownloadNow = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = readyFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: 'Berkas Berhasil Diunduh',
      description: `${readyFilename} telah disimpan ke folder unduhan Anda.`,
      variant: 'success',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            <span>Ekspor Hasil Penelitian Bab IV</span>
          </DialogTitle>
          <DialogDescription>
            Unduh draf naskah Bab 4 lengkap dengan tabel standar APA 7th, 1.5 spasi, margin 4-3-3-3 cm, dan diagram residual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setFormat('docx');
                if (exportState === 'failed' || exportState === 'ready') setExportState('idle');
              }}
              disabled={exportState === 'preparing'}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                format === 'docx'
                  ? 'border-primary bg-primary/5 text-foreground shadow-xs'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              )}
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-foreground">Microsoft Word (.docx)</span>
                <span className="text-[11px] text-muted-foreground">Tabel editable dan font Times</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormat('pdf');
                if (exportState === 'failed' || exportState === 'ready') setExportState('idle');
              }}
              disabled={exportState === 'preparing'}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                format === 'pdf'
                  ? 'border-primary bg-primary/5 text-foreground shadow-xs'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              )}
            >
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FileDown className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-foreground">Dokumen PDF (.pdf)</span>
                <span className="text-[11px] text-muted-foreground">Layout identik dan bernomor</span>
              </div>
            </button>
          </div>

          {/* Scope Options */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/70 text-xs">
            <label className="font-semibold text-foreground block">
              Cakupan Tabel Bab IV:
            </label>
            <div className="relative">
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                disabled={exportState === 'preparing'}
                className="w-full appearance-none text-xs pl-3 pr-9 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 truncate cursor-pointer"
              >
                <option value="all">Unduh Bab IV Lengkap (Seluruh Tabel 4.1 s.d. 4.15 dan Pembahasan)</option>
                <option value="4.1">Tabel 4.1 Karakteristik Responden</option>
                <option value="4.2">Tabel 4.2 Deskriptif Variabel dan TCR</option>
                <option value="4.3">Tabel 4.3 Distribusi Frekuensi per Butir</option>
                <option value="4.4">Tabel 4.4 Hasil Uji Validitas</option>
                <option value="4.5">Tabel 4.5 Hasil Uji Reliabilitas</option>
                <option value="4.6">Tabel 4.6 Hasil Uji Normalitas Residual</option>
                <option value="4.7">Tabel 4.7 Hasil Uji Multikolinearitas</option>
                <option value="4.8">Tabel 4.8 Hasil Uji Heteroskedastisitas</option>
                <option value="4.9">Tabel 4.9 Hasil Uji Durbin-Watson</option>
                <option value="4.10">Tabel 4.10 Analisis Regresi Linier Berganda</option>
                <option value="4.11">Tabel 4.11 Keputusan Hipotesis</option>
                <option value="4.12">Tabel 4.12 Matriks Korelasi</option>
                <option value="4.13">Tabel 4.13 Uji Beda 2 Kelompok</option>
                <option value="4.14">Tabel 4.14 Uji Beda 3+ Kelompok</option>
                <option value="4.15">Tabel 4.15 Uji Chi-Kuadrat</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          {/* Declaration Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border/80 bg-background text-xs">
            <Checkbox
              id="includeDeclaration"
              checked={includeDeclaration}
              onCheckedChange={(checked) => setIncludeDeclaration(Boolean(checked))}
              disabled={exportState === 'preparing'}
            />
            <label htmlFor="includeDeclaration" className="cursor-pointer space-y-0.5 leading-snug">
              <span className="font-semibold text-foreground block">
                Sertakan Lampiran Surat Pernyataan Penggunaan Alat Akademik
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Mencantumkan ID komputasi deterministik, verifikasi SHA-256 data, dan pernyataan integritas bebas manipulasi.
              </span>
            </label>
          </div>

          {/* Status Display */}
          {exportState === 'preparing' && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-2 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyiapkan Dokumen...</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{progressMsg}</p>
            </div>
          )}

          {exportState === 'ready' && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Dokumen Siap Diunduh!</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">{readyFilename}</p>
            </div>
          )}

          {exportState === 'failed' && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-xs">
                <AlertOctagon className="h-4 w-4" />
                <span>Gagal Menghasilkan Berkas</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Kode Kendala: {errorCode || 'UNKNOWN_ERROR'}. Silakan coba lagi.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 justify-between items-center sm:items-stretch pt-2 border-t border-border/60">
          {onCopyAllTables && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onCopyAllTables();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto text-xs gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Salin Semua Tabel</span>
            </Button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Tutup
            </Button>

            {exportState === 'ready' ? (
              <Button
                type="button"
                size="sm"
                onClick={handleDownloadNow}
                className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Sekarang</span>
              </Button>
            ) : exportState === 'failed' ? (
              <Button
                type="button"
                size="sm"
                onClick={startAsyncExport}
                className="text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={startAsyncExport}
                disabled={exportState === 'preparing'}
                className="text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {exportState === 'preparing' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyiapkan...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Mulai Ekspor</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
