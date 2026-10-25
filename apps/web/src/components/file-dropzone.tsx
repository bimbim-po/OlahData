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
  Globe,
  Link2,
  FileCode,
  Loader2,
} from 'lucide-react';
import { useWizardStore } from '@/stores/wizard-store';
import { mockDataset, mockIssues } from '@/lib/mock/dataset-contoh';
import { analyzeDatasetQuality } from '@/lib/validation';
import { FILE_LIMITS } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNumber, generateSafeCsv } from '@/lib/format';
import { parseSpreadsheetFile, DEFAULT_LIKERT_MAP, extractGoogleSheetsCsvUrl, type ParseResult } from '@/lib/dataset-parser';
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
  const [activeInputTab, setActiveInputTab] = React.useState<'upload' | 'gsheet'>('upload');
  const [gsheetUrl, setGsheetUrl] = React.useState('');
  const [isFetchingGsheet, setIsFetchingGsheet] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const preprocessingSummary = React.useMemo(() => {
    if (!fileData || fileData.length === 0) return null;
    let missingCount = 0;
    const cols = columns.filter((c) => c !== 'No');
    fileData.forEach((row) => {
      cols.forEach((col) => {
        const v = row[col];
        if (v === null || v === undefined || v === '') {
          missingCount++;
        }
      });
    });

    const metaCols = datasetMeta?.columns || [];
    const itemCount = metaCols.filter((c) => c.role === 'item').length;
    const demoCount = metaCols.filter((c) => c.role === 'demographic').length;
    const idCount = metaCols.filter((c) => c.role === 'id').length;
    const otherCount = Math.max(0, columns.length - (itemCount + demoCount + idCount));

    return {
      totalRows: fileData.length,
      totalCols: columns.length,
      missingCount,
      itemCount: itemCount > 0 ? itemCount : cols.length,
      demoCount,
      otherCount,
    };
  }, [fileData, columns, datasetMeta]);

  const handleImportGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = gsheetUrl.trim();
    if (!trimmed) {
      setErrorMessage('Harap tempel tautan Google Sheets tanggapan kuesioner Anda.');
      return;
    }

    const csvExportUrl = extractGoogleSheetsCsvUrl(trimmed);
    if (!csvExportUrl) {
      setErrorMessage(
        'Format URL Google Sheets tidak dikenali. Pastikan tautan berasal dari docs.google.com/spreadsheets/d/...'
      );
      return;
    }

    setIsFetchingGsheet(true);
    try {
      // 1. Coba ambil lewat proxy Cloudflare / API
      const proxyUrl = `/api/import/google-sheets?url=${encodeURIComponent(csvExportUrl)}`;
      let res = await fetch(proxyUrl);

      // 2. Fallback fetch langsung jika proxy offline
      if (!res.ok && res.status !== 403) {
        try {
          const directRes = await fetch(csvExportUrl);
          if (directRes.ok) res = directRes;
        } catch {
          // ignore
        }
      }

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(
          errorJson?.error ||
            `Gagal mengambil data dari Google Sheets (HTTP ${res.status}). Pastikan hak akses spreadsheet diatur ke 'Siapa saja yang memiliki link'.`
        );
      }

      const csvText = await res.text();
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Data kuesioner pada Google Sheets tersebut kosong.');
      }

      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      const gsheetFile = new File([blob], 'kuesioner_google_sheets.csv', { type: 'text/csv' });

      await processLoadedFile(gsheetFile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mengimpor Google Sheets.';
      setErrorMessage(msg);
    } finally {
      setIsFetchingGsheet(false);
    }
  };

  const processLoadedFile = async (
    file: File,
    sheetName?: string,
    likertMapOverride?: Record<string, number>
  ) => {
    setErrorMessage(null);

    // Reject 0 B empty files immediately
    if (file.size === 0) {
      setErrorMessage('File kosong atau tidak memiliki baris data. Silakan unggah file CSV/Excel yang valid.');
      return;
    }

    // Validate size
    const maxBytes = FILE_LIMITS.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran berkas (${formatBytes(file.size)}) melebihi batas ${FILE_LIMITS.maxSizeMB} MB.`);
      return;
    }

    // Validate extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = [...FILE_LIMITS.allowedExtensions, '.json'];
    const isAllowed = allowed.includes(extension);
    if (!isAllowed) {
      setErrorMessage(
        `Format berkas "${extension}" belum didukung. Harap unggah berkas ${allowed.join(', ')}.`
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
      if (msg.includes('File kosong atau tidak memiliki baris data')) {
        setErrorMessage(msg);
      } else {
        setErrorMessage(`Gagal membaca berkas: ${msg}`);
      }
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
    const templateHeaders = [
      'No',
      'Jenis_Kelamin',
      'Usia',
      'Pendidikan',
      'KL1',
      'KL2',
      'KL3',
      'KL4',
      'KL5',
      'KP1',
      'KP2',
      'KP3',
      'KP4',
      'KP5',
      'LP1',
      'LP2',
      'LP3',
      'LP4',
      'LP5',
    ];
    const templateRows = [
      { No: 1, Jenis_Kelamin: 'Laki-laki', Usia: 21, Pendidikan: 'S1', KL1: 4, KL2: 4, KL3: 5, KL4: 4, KL5: 4, KP1: 5, KP2: 4, KP3: 4, KP4: 5, KP5: 4, LP1: 4, LP2: 5, LP3: 4, LP4: 4, LP5: 2 },
      { No: 2, Jenis_Kelamin: 'Perempuan', Usia: 22, Pendidikan: 'S1', KL1: 5, KL2: 4, KL3: 4, KL4: 4, KL5: 5, KP1: 4, KP2: 4, KP3: 5, KP4: 4, KP5: 4, LP1: 4, LP2: 4, LP3: 5, LP4: 4, LP5: 1 },
      { No: 3, Jenis_Kelamin: 'Perempuan', Usia: 21, Pendidikan: 'S1', KL1: 4, KL2: 3, KL3: 4, KL4: 4, KL5: 4, KP1: 4, KP2: 3, KP3: 4, KP4: 4, KP5: 4, LP1: 3, LP2: 4, LP3: 4, LP4: 4, LP5: 2 },
      { No: 4, Jenis_Kelamin: 'Laki-laki', Usia: 23, Pendidikan: 'S1', KL1: 5, KL2: 5, KL3: 5, KL4: 5, KL5: 5, KP1: 5, KP2: 5, KP3: 5, KP4: 5, KP5: 5, LP1: 5, LP2: 5, LP3: 5, LP4: 5, LP5: 1 },
      { No: 5, Jenis_Kelamin: 'Laki-laki', Usia: 22, Pendidikan: 'S1', KL1: 4, KL2: 4, KL3: 4, KL4: 4, KL5: 4, KP1: 4, KP2: 4, KP3: 4, KP4: 4, KP5: 4, LP1: 4, LP2: 4, LP3: 4, LP4: 4, LP5: 2 },
    ];

    const safeCsv = generateSafeCsv(templateHeaders, templateRows);
    const blob = new Blob([safeCsv], { type: 'text/csv;charset=utf-8;' });
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

          {/* Pre-Processing Data Summary Card */}
          {preprocessingSummary && (
            <div className="p-4 rounded-[12px] bg-primary/5 border border-primary/20 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  Ringkasan Pra-Pemrosesan Data (Pre-processing Summary)
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {formatNumber(preprocessingSummary.totalRows)} Baris × {formatNumber(preprocessingSummary.totalCols)} Kolom
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Butir Skala Likert</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatNumber(preprocessingSummary.itemCount)} kolom
                  </span>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Demografi Responden</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatNumber(preprocessingSummary.demoCount)} kolom
                  </span>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Nilai Kosong (Missing)</span>
                  <span className={cn(
                    'font-semibold tabular-nums',
                    preprocessingSummary.missingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {preprocessingSummary.missingCount === 0 ? '0 (Lengkap)' : `${formatNumber(preprocessingSummary.missingCount)} sel`}
                  </span>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Kolom Lain / ID</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatNumber(preprocessingSummary.otherCount)} kolom
                  </span>
                </div>
              </div>
            </div>
          )}

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
        /* Empty File / Google Sheets Tab Selection */
        <div className="space-y-4">
          {/* Tab Selector: Unggah Berkas vs Tautkan Google Sheets */}
          <div className="flex items-center gap-2 border-b border-border/80 pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveInputTab('upload'); setErrorMessage(null); }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                activeInputTab === 'upload'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Berkas (Excel, CSV, XML)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveInputTab('gsheet'); setErrorMessage(null); }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                activeInputTab === 'gsheet'
                  ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Globe className="w-4 h-4" />
              <span>Tautkan Google Sheets</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                Google Forms
              </Badge>
            </button>
          </div>

          {activeInputTab === 'upload' ? (
            /* Area Unggah Berkas: Excel, CSV, XML */
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
              aria-busy={isParsing}
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
                accept=".xlsx,.xls,.csv,.xml,.json"
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
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">
                Mendukung <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV (.csv)</strong>, <strong>JSON (.json)</strong>, dan <strong>XML (.xml)</strong>. Deteksi otomatis pemisah titik koma, koma desimal, serta konversi teks Likert.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <Button
                  type="button"
                  className="min-h-[44px] px-6 text-sm font-semibold rounded-[12px] shadow-sm pointer-events-none"
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Pilih Berkas (.xlsx / .csv / .json)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleData();
                  }}
                  className="min-h-[44px] px-5 text-sm font-semibold rounded-[12px] border-primary/50 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gunakan Data Contoh (1-Klik)
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/80 bg-muted/50 px-3.5 py-1.5 rounded-full border border-border/50">
                <span>Maks. {FILE_LIMITS.maxSizeMB} MB</span>
                <span>•</span>
                <span className="font-mono">.xlsx, .xls, .csv, .xml, .json</span>
              </div>
            </div>
          ) : (
            /* Area Impor Google Sheets */
            <div className="p-6 sm:p-8 rounded-[16px] border border-border bg-card shadow-sm space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground">
                    Impor Langsung dari Google Sheets / Google Forms
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Hubungkan spreadsheet tanggapan kuesioner Google Forms Anda secara instan. Data akan ditarik secara deterministik dan langsung diuji validitas serta reliabilitasnya.
                </p>
              </div>

              <form onSubmit={handleImportGoogleSheet} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="gsheet-url" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    Tautan Google Sheets Kuesioner:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="gsheet-url"
                      type="url"
                      required
                      placeholder="Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit?usp=sharing"
                      value={gsheetUrl}
                      onChange={(e) => setGsheetUrl(e.target.value)}
                      className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                    <Button
                      type="submit"
                      disabled={isFetchingGsheet || isParsing}
                      className="min-h-[44px] px-6 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0 shadow-sm"
                    >
                      {isFetchingGsheet ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menarik Data...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Tarik Data Kuesioner
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Petunjuk Berbagi Google Sheets */}
                <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-xs space-y-1.5 text-muted-foreground">
                  <span className="font-semibold text-foreground block">
                    Cara Menghubungkan Google Sheets Tanggapan Kuesioner:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-xs pl-1">
                    <li>Buka spreadsheet Google Sheets hasil kuesioner Anda.</li>
                    <li>Klik tombol hijau <strong>Bagikan (Share)</strong> di sudut kanan atas.</li>
                    <li>Di bagian <em>Akses umum (General access)</em>, ubah pilihan menjadi <strong>Siapa saja yang memiliki link (Anyone with the link)</strong>.</li>
                    <li>Salin link tersebut dan tempelkan pada kolom di atas, lalu klik <strong>Tarik Data Kuesioner</strong>.</li>
                  </ol>
                </div>
              </form>
            </div>
          )}
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
