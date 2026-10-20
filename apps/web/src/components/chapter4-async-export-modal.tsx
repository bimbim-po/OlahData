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
  FileDown
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
import type { AnalysisResults } from '@/lib/api/types';

interface Chapter4AsyncExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: AnalysisResults | null;
  projectTitle?: string;
  onCopyAllTables?: () => void;
  initialFormat?: 'docx' | 'pdf';
}

type ExportState = 'idle' | 'preparing' | 'ready' | 'failed';

export function Chapter4AsyncExportModal({
  open,
  onOpenChange,
  results,
  projectTitle = 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan',
  onCopyAllTables,
  initialFormat = 'docx',
}: Chapter4AsyncExportModalProps) {
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
    setProgressMsg('Menghubungkan ke layanan statistik OlahData...');
    setErrorCode(null);

    try {
      const response = await fetch('/api/ekspor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          projectTitle,
          includeDeclaration,
          results,
          tableId: selectedTableId !== 'all' ? selectedTableId : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memulai proses ekspor');
      }

      const initData = await response.json();
      const jobId = initData.jobId;
      setReadyFilename(initData.filename || `OlahData_Bab4.${format}`);

      // If already ready immediately
      if (initData.status === 'ready' && initData.downloadUrl) {
        setDownloadUrl(initData.downloadUrl);
        setExportState('ready');
        return;
      }

      // Start polling
      setProgressMsg('Menyusun tabel tiga garis APA 7th & diagram residual...');
      let elapsed = 0;
      pollIntervalRef.current = setInterval(async () => {
        elapsed += 2;
        if (elapsed > 60) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setExportState('failed');
          setErrorCode('TIMEOUT_60S');
          return;
        }

        try {
          const pollRes = await fetch(`/api/ekspor?jobId=${jobId}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.status === 'ready') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setDownloadUrl(pollData.downloadUrl || `/api/ekspor?jobId=${jobId}&download=1`);
              setReadyFilename(pollData.filename);
              setExportState('ready');
            } else if (pollData.status === 'failed') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              setExportState('failed');
              setErrorCode(pollData.error || 'EXPORT_FAILED');
            }
          }
        } catch {
          // Ignore network glitch during poll
        }
      }, 1500);
    } catch (err: unknown) {
      setExportState('failed');
      setErrorCode(err instanceof Error ? err.message : 'NETWORK_ERROR');
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
              onClick={() => setFormat('docx')}
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
                <span className="text-[11px] text-muted-foreground">Tabel editable &amp; font Times</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('pdf')}
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
                <span className="text-[11px] text-muted-foreground">Layout identik &amp; bernomor</span>
              </div>
            </button>
          </div>

          {/* Scope Options */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/70 text-xs">
            <label className="font-semibold text-foreground block">
              Cakupan Tabel Bab IV:
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              disabled={exportState === 'preparing'}
              className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="all">Unduh Bab IV Lengkap (Seluruh Tabel 4.1 s.d. 4.15 &amp; Pembahasan)</option>
              <option value="4.1">Tabel 4.1 Karakteristik Responden</option>
              <option value="4.2">Tabel 4.2 Deskriptif Variabel &amp; TCR</option>
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
