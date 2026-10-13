'use client';

import * as React from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWizardStore } from '@/stores/wizard-store';
import { mockDataset, mockIssues } from '@/lib/mock/dataset-contoh';
import { analyzeDatasetQuality } from '@/lib/validation';
import { FILE_LIMITS } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import type { DatasetRow } from '@/lib/api/types';

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
    setFileData,
    setIssues,
    resetWizard,
  } = useWizardStore();

  const [isDragging, setIsDragging] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
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

    if (extension === '.csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          setIsParsing(false);
          const rawData = results.data as Record<string, unknown>[];
          if (!rawData || rawData.length === 0) {
            setErrorMessage('File CSV tidak memiliki data yang dapat dibaca.');
            return;
          }

          const parsedColumns = results.meta.fields?.filter((f) => f && f.trim() !== '') || Object.keys(rawData[0]);
          const parsedRows: DatasetRow[] = rawData.map((r, idx) => {
            const row: DatasetRow = {};
            parsedColumns.forEach((col) => {
              const val = r[col];
              if (val === undefined || val === null || val === '') {
                row[col] = null;
              } else if (typeof val === 'number') {
                row[col] = val;
              } else {
                const num = Number(val);
                row[col] = !isNaN(num) && typeof val === 'string' && val.trim() !== '' ? num : String(val);
              }
            });
            if (row.No === undefined) {
              row.No = idx + 1;
            }
            return row;
          });

          const finalColumns = parsedColumns.includes('No') ? parsedColumns : ['No', ...parsedColumns];
          const detectedIssues = analyzeDatasetQuality(parsedRows, finalColumns);

          setFileData(file.name, parsedRows, finalColumns, false, file.size);
          setIssues(detectedIssues);
          onFileLoaded?.();
        },
        error: (err) => {
          setIsParsing(false);
          setErrorMessage(`Gagal membaca file CSV: ${err.message}`);
        },
      });
    } else {
      // Excel files (.xlsx, .xls)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            setIsParsing(false);
            setErrorMessage('Tidak ada lembar kerja (sheet) yang ditemukan di file Excel.');
            return;
          }

          const sheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: null,
            raw: true,
          });

          if (!rawData || rawData.length === 0) {
            setIsParsing(false);
            setErrorMessage('Lembar kerja kosong atau tidak ada data yang ditemukan.');
            return;
          }

          const rawHeaders = Object.keys(rawData[0]).filter((k) => k && k.trim() !== '');
          const parsedRows: DatasetRow[] = rawData.map((r, idx) => {
            const row: DatasetRow = {};
            rawHeaders.forEach((col) => {
              const val = r[col];
              if (val === undefined || val === null || val === '') {
                row[col] = null;
              } else if (typeof val === 'number') {
                row[col] = val;
              } else {
                const num = Number(val);
                row[col] = !isNaN(num) && typeof val === 'string' && val.trim() !== '' ? num : String(val);
              }
            });
            if (row.No === undefined) {
              row.No = idx + 1;
            }
            return row;
          });

          const finalColumns = rawHeaders.includes('No') ? rawHeaders : ['No', ...rawHeaders];
          const detectedIssues = analyzeDatasetQuality(parsedRows, finalColumns);

          setIsParsing(false);
          setFileData(file.name, parsedRows, finalColumns, false, file.size);
          setIssues(detectedIssues);
          onFileLoaded?.();
        } catch (err: unknown) {
          setIsParsing(false);
          const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal';
          setErrorMessage(`Gagal membaca file Excel: ${msg}`);
        }
      };

      reader.onerror = () => {
        setIsParsing(false);
        setErrorMessage('Gagal membuka file dari perangkat.');
      };

      reader.readAsArrayBuffer(file);
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
            Muat dataset riset standar (120 responden × 18 butir kuesioner + 3 demografi, 3 konstruk: Kualitas Layanan, Kepuasan, Loyalitas).
          </p>
        </div>
        <Button
          type="button"
          onClick={handleLoadSampleData}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-white shrink-0 font-medium cursor-pointer shadow-sm rounded-[10px] min-h-[44px] h-11 sm:h-9"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Pakai data contoh
        </Button>
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fileSize ? formatBytes(fileSize) : 'Ukuran internal'} • Format tabel terverifikasi
                </p>
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
