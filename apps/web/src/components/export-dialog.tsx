'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  FileText,
  FileType2,
  Download,
  PenTool,
  Zap,
  ShieldAlert,
  Loader2,
  Check,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useToast } from '@/components/ui/toaster';
import { exportResult } from '@/lib/api';
import type { ExportFormat, TestType, AnalysisResults } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { canExportProject, isSampleProject, useUpgradeModal } from '@/lib/entitlements';

export interface ExportDialogProps {
  projectId: string;
  projectTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPlan?: 'free' | 'monthly' | 'thesis';
  results?: AnalysisResults | null;
  onOpenReferenceTables?: () => void;
}

const AVAILABLE_SECTIONS: { id: TestType; label: string; description: string }[] = [
  {
    id: 'descriptive',
    label: 'Statistik Deskriptif',
    description: 'Tabel nilai mean, standar deviasi, min & max variabel',
  },
  {
    id: 'validity',
    label: 'Uji Validitas',
    description: 'Korelasi r hitung vs r tabel tiap butir instrumen',
  },
  {
    id: 'reliability',
    label: 'Uji Reliabilitas',
    description: "Cronbach's Alpha dan item-deleted statistics",
  },
  {
    id: 'normality',
    label: 'Uji Asumsi Klasik',
    description: 'Normalitas K-S, Multikolinearitas (VIF), Heteroskedastisitas Glejser',
  },
  {
    id: 'regression',
    label: 'Regresi Linier Berganda',
    description: 'Koefisien OLS, Uji t parsial, Uji F simultan, dan R²',
  },
  {
    id: 'correlation',
    label: 'Korelasi Pearson',
    description: 'Matriks korelasi antar variabel penelitian',
  },
  {
    id: 'crosstab',
    label: 'Tabulasi Silang & Chi-Square',
    description: 'Matriks kontingensi baris x kolom, count aktual & expected',
  },
  {
    id: 'odds-ratio',
    label: 'Estimasi Risiko (Odds Ratio)',
    description: 'Odds Ratio (OR), Relative Risk (RR), dan 95% Confidence Interval',
  },
];

export function ExportDialog({
  projectId,
  projectTitle,
  open,
  onOpenChange,
  userPlan: propPlan,
  results,
  onOpenReferenceTables,
}: ExportDialogProps) {
  const resolvedProjectTitle =
    (projectTitle && projectTitle.trim()) ||
    (results?.projectTitle && results.projectTitle.trim()) ||
    'Analisis Skripsi';
  const { toast } = useToast();
  const authUser = useAuthStore((s) => s.user);
  const plan = propPlan || authUser?.plan || 'free';
  const { openUpgradeModal } = useUpgradeModal();
  const isSample = isSampleProject(projectId);
  const canExport = canExportProject(plan, isSample);
  const isFreePlan = plan === 'free';

  const [format, setFormat] = useState<ExportFormat>('word');
  const [narrativeTone, setNarrativeTone] = useState<'standard' | 'concise' | 'formal'>('standard');
  const [selectedSections, setSelectedSections] = useState<TestType[]>([
    'descriptive',
    'validity',
    'reliability',
    'normality',
    'regression',
    'crosstab',
    'odds-ratio',
  ]);
  const [includeStatement, setIncludeStatement] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (id: TestType) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAllSections = () => {
    if (selectedSections.length === AVAILABLE_SECTIONS.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(AVAILABLE_SECTIONS.map((s) => s.id));
    }
  };

  const handleDownload = async (overrideFormat?: ExportFormat) => {
    if (!canExport) {
      onOpenChange(false);
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Ekspor Dokumen Word .docx Tanpa Batas & Format APA 7th',
      });
      return;
    }

    const targetFormat = overrideFormat || format;
    if (targetFormat !== 'spss-word' && selectedSections.length === 0) {
      toast({
        title: 'Pilih minimal satu bagian analisis',
        description: 'Tandai bagian yang ingin dimasukkan ke dalam berkas ekspor.',
        variant: 'error',
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportResult(
        projectId,
        {
          format: targetFormat,
          sections: selectedSections,
          includeStatement,
          narrativeTone,
          projectTitle: resolvedProjectTitle,
        },
        results || undefined
      );

      // Trigger browser download
      const ext = targetFormat === 'pdf' ? 'pdf' : 'doc';
      const cleanTitle = resolvedProjectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      const prefix = targetFormat === 'spss-word' ? 'Lampiran_SPSS_' : (targetFormat === 'word' ? 'Naskah_Bab4_APA_' : 'Laporan_Hasil_');
      const filename = `${prefix}${cleanTitle || 'OlahData'}.${ext}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Berkas ekspor berhasil diunduh',
        description: `Berkas ${filename} telah disimpan di folder unduhan Anda.`,
        variant: 'success',
      });

      onOpenChange(false);
    } catch {
      toast({
        title: 'Gagal mengekspor hasil',
        description: 'Terjadi kendala saat menyiapkan berkas. Silakan coba kembali.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ekspor Hasil Analisis</DialogTitle>
          <DialogDescription>
            Pilih format dokumen dan bagian tabel statistik yang ingin diunduh untuk lampiran Bab 4 skripsi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format selection cards */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
              Pilih Paket Berkas Ekspor
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('word')}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer',
                  format === 'word'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg shrink-0',
                      format === 'word'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  {format === 'word' && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="font-semibold text-xs text-foreground block">
                  Naskah Bab 4 (APA 7th)
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Word (.docx)
                </span>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-snug">
                  Tabel 3 garis horizontal standar APA + narasi interpretasi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('spss-word')}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer',
                  format === 'spss-word'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30 shadow-xs dark:bg-blue-950/20'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="px-1.5 py-0.5 bg-blue-700 text-white text-[9px] font-bold rounded-xs font-mono">
                    SPSS
                  </span>
                  {format === 'spss-word' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="font-semibold text-xs text-foreground block">
                  Lampiran (Gaya SPSS)
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Word (.docx)
                </span>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-snug">
                  Tabel kotak klasik khas Output Viewer SPSS + Jejak Hitung Hash.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={cn(
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer',
                  format === 'pdf'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg shrink-0',
                      format === 'pdf'
                        ? 'bg-destructive text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <FileType2 className="h-4 w-4" />
                  </div>
                  {format === 'pdf' && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="font-semibold text-xs text-foreground block">
                  Laporan Hasil PDF
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  PDF (.pdf)
                </span>
                <p className="text-[10.5px] text-muted-foreground mt-1 leading-snug">
                  Format rapi siap cetak untuk lampiran fisik dewan penguji.
                </p>
              </button>
            </div>

            {onOpenReferenceTables && (
              <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FFE14D] text-slate-900 shrink-0">
                    <Highlighter className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-foreground block">
                      Tabel Referensi r, t, dan F (Ditandai Stabilo Otomatis)
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Baris derajat bebas (df) proyek Anda otomatis disorot kuning untuk lampiran skripsi.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenReferenceTables();
                  }}
                  className="text-xs h-8 shrink-0 font-medium border-amber-500/40 hover:bg-amber-500/20 cursor-pointer text-amber-900 dark:text-amber-200"
                >
                  Buka Tabel Stabilo
                </Button>
              </div>
            )}
          </div>

          {/* Gaya Bahasa Interpretasi Narasi (Khusus Mode Word Naskah Bab 4) */}
          {format === 'word' && (
            <div className="p-3 border border-border rounded-xl bg-card space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-primary" />
                <span>Gaya Bahasa Draf Interpretasi Bab 4</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'standard', label: 'Standar', desc: 'Lengkap & deskriptif' },
                    { id: 'concise', label: 'Lebih Singkat', desc: 'Ringkas & to-the-point' },
                    { id: 'formal', label: 'Lebih Formal', desc: 'Baku akademik skripsi' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNarrativeTone(t.id)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors cursor-pointer',
                      narrativeTone === t.id
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <div className="font-medium text-foreground">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Bagian yang Disertakan
              </label>
              <button
                type="button"
                onClick={toggleAllSections}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                {selectedSections.length === AVAILABLE_SECTIONS.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua'}
              </button>
            </div>

            <div className="space-y-2 border border-border rounded-xl p-3 bg-muted/20">
              {AVAILABLE_SECTIONS.map((sec) => {
                const isChecked = selectedSections.includes(sec.id);
                return (
                  <label
                    key={sec.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSection(sec.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground block">
                        {sec.label}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {sec.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Include Statement Checkbox */}
          <div className="p-3.5 border border-border rounded-xl bg-card">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={includeStatement}
                onCheckedChange={(c) => setIncludeStatement(!!c)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground block">
                  Sertakan Pernyataan Penggunaan Alat
                </span>
                <span className="text-xs text-muted-foreground block mt-0.5 leading-relaxed">
                  Melampirkan klausul transparansi akademik standar OlahData untuk dosen pembimbing dan penguji skripsi.
                </span>
              </div>
            </label>
          </div>

          {/* Free plan export paywall notice */}
          {!canExport && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5 text-xs text-foreground">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block text-amber-900 dark:text-amber-200">
                    Fitur Ekspor Naskah Word .docx dan PDF Memerlukan Paket Aktif
                  </span>
                  <p className="mt-0.5 leading-relaxed text-muted-foreground">
                    Dokumen skripsi asli Anda dapat diekspor lengkap tanpa batasan pada Paket Bulanan dan Paket Skripsi. Proyek contoh simulasi dapat diuji coba unduh secara gratis.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    openUpgradeModal({
                      plan: 'monthly',
                      reason: 'Ekspor Dokumen Word .docx Tanpa Batas',
                    });
                  }}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Buka Kunci Ekspor (Mulai Rp 39.000)
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-border/80 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="text-xs text-muted-foreground order-last sm:order-first"
          >
            Tutup
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {format === 'pdf' ? (
              <Button
                onClick={() => handleDownload('pdf')}
                disabled={isExporting || selectedSections.length === 0}
                className="gap-2 text-xs"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>Unduh Laporan PDF</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleDownload('word')}
                  disabled={isExporting || selectedSections.length === 0}
                  className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  <span>Unduh Naskah Bab 4 (Format APA 7th)</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload('spss-word')}
                  disabled={isExporting}
                  className="gap-2 text-xs border-blue-600/40 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40 font-semibold"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span>Unduh Lampiran (Gaya SPSS)</span>
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
