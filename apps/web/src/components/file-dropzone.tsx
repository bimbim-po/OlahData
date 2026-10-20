'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWizardStore } from '@/stores/wizard-store';
import { mockDataset, mockIssues } from '@/lib/mock/dataset-contoh';
import { analyzeDatasetQuality } from '@/lib/validation';
import { FILE_LIMITS } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';
import { parseSpreadsheetFile, DEFAULT_LIKERT_MAP, type ParseResult } from '@/lib/dataset-parser';
import type { DatasetSourceMeta } from '@/lib/api/types';

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
  const [currentFileObj, setCurrentFileObj] = React.useState<File | null>(null);
  const [sheetList, setSheetList] = React.useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = React.useState<string>('');
  const [customLikertMap, setCustomLikertMap] = React.useState<Record<string, number>>(DEFAULT_LIKERT_MAP);
  const [showLikertEditor, setShowLikertEditor] = React.useState(false);
  const [newLikertKey, setNewLikertKey] = React.useState('');
  const [newLikertVal, setNewLikertVal] = React.useState(5);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processLoadedFile = async (
    file: File,
    sheetName?: string,
    likertMapOverride?: Record<string, number>
  ) => {
    setErrorMessage(null);

    // Validate size
    const maxBytes = FILE_LIMITS.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran berkas (${formatBytes(file.size)}) melebihi batas ${FILE_LIMITS.maxSizeMB} MB.`);
      return;
    }

    // Validate extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = (FILE_LIMITS.allowedExtensions as readonly string[]).includes(extension);
    if (!isAllowed) {
      setErrorMessage(
        `Format berkas "${extension}" belum didukung. Harap unggah berkas ${FILE_LIMITS.allowedExtensions.join(', ')}.`
      );
      return;
    }

    setIsParsing(true);
    setCurrentFileObj(file);

    try {
      const parseRes: ParseResult = await parseSpreadsheetFile(file, {
        sheetName,
        customLikertMap: likertMapOverride || customLikertMap,
        verifyServerHash: true,
      });

      if (parseRes.sheetNames && parseRes.sheetNames.length > 1) {
        setSheetList(parseRes.sheetNames);
        setSelectedSheetName(parseRes.selectedSheet || parseRes.sheetNames[0]);
      } else {
        setSheetList([]);
      }

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
      processLoadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processLoadedFile(e.target.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    setErrorMessage(null);
    const cols = Object.keys(mockDataset[0] || {});
    setFileData('data_kuesioner_contoh.xlsx', [...mockDataset], cols, true, 48 * 1024);
    setIssues([...mockIssues]);
    onFileLoaded?.();
  };

  const handleUseMyOwnData = () => {
    resetWizard();
    setCurrentFileObj(null);
    setSheetList([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Proactively open file selector for convenience
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'No,Jenis_Kelamin,Usia,Pendidikan,KL1,KL2,KL3,KL4,KL5,KP1,KP2,KP3,KP4,KP5,LP1,LP2,LP3,LP4,LP5\n' +
      '1,Laki-laki,21,S1,4,4,5,4,4,5,4,4,5,4,4,5,4,4,2\n' +
      '2,Perempuan,22,S1,5,4,4,4,5,4,4,5,4,4,4,4,5,4,1\n' +
      '3,Perempuan,21,S1,4,3,4,4,4,4,3,4,4,4,3,4,4,4,2\n' +
      '4,Laki-laki,23,S1,5,5,5,5,5,5,5,5,5,5,5,5,5,5,1\n' +
      '5,Laki-laki,22,S1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'templat_kuesioner_skripsi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSheetChange = (newSheet: string) => {
    setSelectedSheetName(newSheet);
    if (currentFileObj) {
      processLoadedFile(currentFileObj, newSheet);
    }
  };

  const handleAddCustomLikert = () => {
    if (!newLikertKey.trim()) return;
    const updated = {
      ...customLikertMap,
      [newLikertKey.trim().toLowerCase()]: Number(newLikertVal),
    };
    setCustomLikertMap(updated);
    setNewLikertKey('');
    if (currentFileObj) {
      processLoadedFile(currentFileObj, selectedSheetName, updated);
    }
  };

  const hasLoadedData = fileData.length > 0 && fileName !== null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* 1. Mode Data Contoh Banner: Clear distinction with "Pakai data saya" escape button */}
      {usingSampleData && hasLoadedData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-[16px] border border-amber-500/40 bg-amber-500/10 text-foreground">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="amber" className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">
                {COPY.badges.sampleData}
              </Badge>
              <h4 className="font-semibold text-sm text-foreground">
                Anda Sedang Menggunakan Data Contoh
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[68ch]">
              Hasil analisis dan tabel yang tampil di bawah menggunakan dataset contoh. Ingin menganalisis kuesioner Anda sendiri?
            </p>
          </div>
          <Button
            type="button"
            onClick={handleUseMyOwnData}
            className="cursor-pointer font-semibold rounded-[10px] min-h-[42px] px-4 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Pakai Data Saya
          </Button>
        </div>
      )}

      {/* 2. Top Helper Action Bar: Unduh Templat & Pakai Data Contoh */}
      {!hasLoadedData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[16px] border border-primary/20 bg-primary/5 dark:bg-primary/10">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground block">
              Mulai cepat skripsi Anda
            </span>
            <p className="text-xs text-muted-foreground">
              Gunakan templat resmi atau coba langsung dengan data contoh kuesioner tanpa perlu login.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs rounded-[10px] min-h-[38px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Unduh Templat
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSampleData}
              className="text-xs rounded-[10px] min-h-[38px] border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Pakai Data Contoh
            </Button>
          </div>
        </div>
      )}

      {/* 3. Active Loaded File Card */}
      {hasLoadedData ? (
        <div className="p-6 rounded-[16px] border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base text-foreground break-all">
                    {fileName}
                  </h4>
                  {usingSampleData ? (
                    <Badge variant="amber" className="text-[10px] rounded-[6px]">
                      {COPY.badges.sampleData}
                    </Badge>
                  ) : (
                    <Badge variant="pine" className="text-[10px] rounded-[6px]">
                      Dataset Pengguna
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                  <span>{fileSize ? formatBytes(fileSize) : 'Ukuran internal'}</span>
                  <span>•</span>
                  <span>{formatNumber(fileData.length)} responden</span>
                  <span>•</span>
                  <span>{formatNumber(columns.length)} kolom</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyOwnData}
              className="text-xs cursor-pointer min-h-[40px] rounded-[10px]"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Ganti berkas
            </Button>
          </div>

          {/* Multi-Sheet Selector if present */}
          {sheetList.length > 1 && (
            <div className="p-3.5 rounded-[12px] bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Pilih Lembar Kerja (Sheet Excel):
                </span>
              </div>
              <select
                value={selectedSheetName}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="text-xs rounded-lg border border-border bg-background p-2 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {sheetList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Jumlah Responden</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatNumber(fileData.length)} <span className="text-xs font-normal text-muted-foreground">orang</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Jumlah Pertanyaan / Kolom</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatNumber(columns.length)} <span className="text-xs font-normal text-muted-foreground">kolom</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Status Pembacaan</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" /> Siap dianalisis
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
              <span className="text-[11px] text-muted-foreground block">Sumber Data</span>
              <span className="text-sm font-medium text-foreground mt-0.5 truncate block">
                {usingSampleData ? 'Data Contoh Skripsi' : fileName}
              </span>
            </div>
          </div>

          {/* 4. Folded Technical Details Accordion (Hard Rule 2: Strictly folded) */}
          <details className="group border border-border/60 rounded-[12px] bg-muted/20 p-3.5 transition-all">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between select-none">
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Detail teknis & jejak audit berkas
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>

            <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5 text-xs text-muted-foreground font-mono">
              {datasetMeta?.sha256 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-border/30">
                  <span className="text-foreground font-sans">Kode Sidik Jari (SHA-256 Klien):</span>
                  <span className="text-[11px] break-all select-all text-primary">
                    {datasetMeta.sha256}
                  </span>
                </div>
              )}
              {datasetMeta?.ignoredInfo?.notes && datasetMeta.ignoredInfo.notes.length > 0 && (
                <div className="space-y-1 pt-1 font-sans">
                  <span className="font-semibold text-foreground text-xs block">
                    Catatan Parser Berkas:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {datasetMeta.ignoredInfo.notes.map((note, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-1 text-[11px] text-muted-foreground font-sans">
                Integritas berkas terkunci secara deterministik. Angka dihitung dari data mentah asli tanpa modifikasi otomatis.
              </div>
            </div>
          </details>

          {/* 5. Folded Likert Text Mapping Editor */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowLikertEditor(!showLikertEditor)}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showLikertEditor ? 'Sembunyikan' : 'Lihat'} tabel pemetaan teks Likert</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showLikertEditor && 'rotate-180')} />
            </button>

            {showLikertEditor && (
              <div className="mt-3 p-4 rounded-[12px] border border-border bg-card space-y-3 animate-in fade-in">
                <div className="space-y-1">
                  <h5 className="font-semibold text-xs text-foreground">
                    Tabel Pemetaan Teks Likert ke Skala Angka
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Jawaban teks seperti "Sangat Setuju" otomatis dipetakan ke angka 1-5. Anda dapat menyesuaikan atau menambahkan pemetaan jika kuesioner Anda memakai istilah khusus.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {Object.entries(customLikertMap)
                    .slice(0, 10)
                    .map(([text, num]) => (
                      <div
                        key={text}
                        className="p-2 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between"
                      >
                        <span className="capitalize font-medium text-foreground">{text}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {num}
                        </Badge>
                      </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <input
                    type="text"
                    placeholder="Contoh: Sangat Puas"
                    value={newLikertKey}
                    onChange={(e) => setNewLikertKey(e.target.value)}
                    className="text-xs p-2 rounded-lg border border-border bg-background text-foreground flex-1"
                  />
                  <select
                    value={newLikertVal}
                    onChange={(e) => setNewLikertVal(Number(e.target.value))}
                    className="text-xs p-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        = {n}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddCustomLikert}
                    className="text-xs rounded-lg min-h-[34px] cursor-pointer"
                  >
                    Tambah Pemetaan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty File Dropzone Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[16px] border-2 border-dashed transition-all cursor-pointer select-none',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.005]'
              : 'border-border hover:border-primary/60 hover:bg-muted/30 bg-card'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              fileInputRef.current?.click();
            }
          }}
          aria-label="Area unggah berkas kuesioner"
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

          <h3 className="font-sans text-base sm:text-lg font-semibold text-foreground mb-1">
            {isParsing ? 'Sedang membaca berkas...' : 'Tarik & lepas berkas kuesioner ke sini'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-4">
            Mendukung Excel (.xlsx, .xls) dan CSV (Google Form / SPSS). Deteksi otomatis pemisah titik koma, koma desimal, dan label teks.
          </p>

          <Button
            type="button"
            className="mb-3 min-h-[44px] px-6 text-sm font-semibold rounded-[12px] shadow-sm pointer-events-none"
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
            <span className="font-semibold block">Gagal mengunggah berkas</span>
            <p className="text-destructive/90">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
