'use client';

import * as React from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, RefreshCw, AlertCircle, CheckCircle2, Hash } from 'lucide-react';
import { useWizardStore } from '@/stores/wizard-store';
import { mockDataset, mockExperimentalDataset, mockIssues } from '@/lib/mock/dataset-contoh';
import { analyzeDatasetQuality } from '@/lib/validation';
import { FILE_LIMITS } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import { parseSpreadsheetFile } from '@/lib/dataset-parser';
import type { DatasetRow, DatasetSourceMeta } from '@/lib/api/types';

interface FileDropzoneProps {
  onFileLoaded?: () => void;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileDropzone({ onFileLoaded, className }: FileDropzoneProps) {
  const {
    fileName,
    fileSize,
    fileData,
    columns,
    usingSampleData,
    datasetMeta,
    setFileData,
    setIssues,
    resetWizard,
  } = useWizardStore();

  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size
    const maxBytes = FILE_LIMITS.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran file (${formatBytes(file.size)}) melebihi batas ${FILE_LIMITS.maxSizeMB} MB.`);
      return;
    }

    // Validate extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = (FILE_LIMITS.allowedExtensions as readonly string[]).includes(extension);
    if (!isAllowed) {
      setErrorMessage(
        `Format file "${extension}" tidak didukung. Harap unggah file ${FILE_LIMITS.allowedExtensions.join(', ')}.`
      );
      return;
    }

    setIsParsing(true);

    try {
      const parseRes = await parseSpreadsheetFile(file);
      const detectedIssues = analyzeDatasetQuality(parseRes.rows, parseRes.columns);

      const meta: DatasetSourceMeta = {
        fileName: parseRes.fileName,
        datasetId: `ds-${Date.now()}`,
        runId: `run-${Date.now()}`,
        version: 1,
        kind: 'original',
        sha256: parseRes.sha256,
        rowCount: parseRes.rows.length,
        columnCount: parseRes.columns.length,
        excludedRows: [],
        columns: parseRes.columnMeta,
        ignoredInfo: parseRes.ignoredInfo,
      };

      setFileData(parseRes.fileName, parseRes.rows, parseRes.columns, false, parseRes.fileSize, meta);
      setIssues(detectedIssues);
      onFileLoaded?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses berkas';
      setErrorMessage(`Gagal membaca berkas: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    setErrorMessage(null);
    const cols = Object.keys(mockDataset[0] || {});
    // 120 respondents, 21 columns (18 items + 3 demographics)
    setFileData('data_kuesioner_contoh.xlsx', [...mockDataset], cols, true, 48 * 1024);
    setIssues([...mockIssues]);
    onFileLoaded?.();
  };

  const handleLoadExperimentalData = () => {
    setErrorMessage(null);
    const cols = Object.keys(mockExperimentalDataset[0] || {});
    setFileData('data_eksperimen_pre_post.xlsx', [...mockExperimentalDataset], cols, true, 32 * 1024);
    setIssues([]);
    onFileLoaded?.();
  };

  const handleReplaceFile = () => {
    resetWizard();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasLoadedData = fileData.length > 0 && fileName !== null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Sample Data Banner / Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[16px] border border-primary/20 bg-primary/5 dark:bg-primary/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Ingin coba langsung tanpa menyiapkan file?
            </span>
            <Badge variant="amber" className="text-[11px] font-normal rounded-[6px]">
              {COPY.badges.sampleData}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Pilih dataset riset kuesioner regresi (N=120) atau dataset eksperimen pre-test & post-test (N=60).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={handleLoadSampleData}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white shrink-0 font-medium cursor-pointer shadow-sm rounded-[10px] min-h-[40px] text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Kuesioner (N=120)
          </Button>
          <Button
            type="button"
            onClick={handleLoadExperimentalData}
            variant="outline"
            className="border-primary/80 bg-primary/10 text-primary hover:bg-primary hover:text-white shrink-0 font-medium cursor-pointer shadow-sm rounded-[10px] min-h-[40px] text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Eksperimen (N=60)
          </Button>
        </div>
      </div>

      {/* Active Selected File State */}
      {hasLoadedData ? (
        <div className="p-6 rounded-[16px] border-2 border-primary/30 bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base text-foreground break-all">
                    {fileName}
                  </h4>
                  {usingSampleData && (
                    <Badge variant="amber" className="text-[10px]">
                      {COPY.badges.sampleData}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                  <span>{fileSize ? formatBytes(fileSize) : 'Ukuran internal'}</span>
                  <span>•</span>
                  <span>Format tabel terverifikasi</span>
                  {datasetMeta?.sha256 && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-muted-foreground/80 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        SHA-256: {datasetMeta.sha256.substring(0, 8)}...{datasetMeta.sha256.substring(56)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReplaceFile}
              className="text-xs cursor-pointer min-h-[44px] sm:min-h-[36px]"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Ganti file
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Jumlah Baris</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatNumber(fileData.length)} <span className="text-xs font-normal text-muted-foreground">responden</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Jumlah Kolom</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatNumber(columns.length)} <span className="text-xs font-normal text-muted-foreground">kolom</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Status Parser</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" /> Siap divalidasi
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Tipe Data</span>
              <span className="text-sm font-medium text-foreground mt-0.5">
                {usingSampleData ? 'Data Sampel OlahData' : 'File Pengguna'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-[16px] border-2 border-dashed transition-all cursor-pointer select-none',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.005]'
              : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-card/60'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          aria-label="Area unggah file kuesioner"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-105',
              isDragging ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-primary'
            )}
          >
            <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground mb-1">
            {isParsing ? 'Sedang membaca file...' : 'Tarik & lepas file data kuesioner di sini'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-3">
            Tarik file ke area ini atau tekan tombol di bawah untuk memilih file dari komputer atau ponsel Anda.
          </p>

          <Button
            type="button"
            className="mb-3 min-h-[48px] px-6 text-sm font-semibold rounded-[12px] shadow-sm pointer-events-none"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Pilih Berkas Spreadsheet
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <span>Maks. {FILE_LIMITS.maxSizeMB} MB</span>
            <span>•</span>
            <span>Format: {FILE_LIMITS.allowedExtensions.join(', ')}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-sm">
            <span className="font-semibold block">Gagal mengunggah file</span>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
