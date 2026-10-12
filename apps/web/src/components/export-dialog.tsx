'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  FileText,
  FileType2,
  Download,
  Sparkles,
  ShieldAlert,
  Loader2,
  Check,
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
import type { ExportFormat, TestType } from '@/lib/api/types';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';

export interface ExportDialogProps {
  projectId: string;
  projectTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPlan?: 'free' | 'monthly' | 'thesis';
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
];

export function ExportDialog({
  projectId,
  projectTitle = 'Analisis Skripsi',
  open,
  onOpenChange,
  userPlan: propPlan,
}: ExportDialogProps) {
  const { toast } = useToast();
  const authUser = useAuthStore((s) => s.user);
  const plan = propPlan || authUser?.plan || 'free';
  const isFreePlan = plan === 'free';

  const [format, setFormat] = useState<ExportFormat>('word');
  const [selectedSections, setSelectedSections] = useState<TestType[]>([
    'descriptive',
    'validity',
    'reliability',
    'normality',
    'regression',
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

  const handleDownload = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: 'Pilih minimal satu bagian analisis',
        description: 'Tandai bagian yang ingin dimasukkan ke dalam berkas ekspor.',
        variant: 'error',
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportResult(projectId, {
        format,
        sections: selectedSections,
        includeStatement,
      });

      // Trigger browser download
      const ext = format === 'word' ? 'docx' : 'pdf';
      const cleanTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Laporan_Hasil_${cleanTitle || 'OlahData'}.${ext}`;

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
              Pilih Format Dokumen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('word')}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  format === 'word'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0',
                    format === 'word'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      Microsoft Word
                    </span>
                    {format === 'word' && (
                      <Check className="h-4 w-4 text-primary ml-1" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block font-mono mt-0.5">
                    .docx
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Tabel & narasi siap diedit langsung di MS Word
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                  format === 'pdf'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                    : 'border-border hover:border-muted-foreground/40 bg-card'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg shrink-0',
                    format === 'pdf'
                      ? 'bg-destructive text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <FileType2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      Dokumen PDF
                    </span>
                    {format === 'pdf' && (
                      <Check className="h-4 w-4 text-primary ml-1" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block font-mono mt-0.5">
                    .pdf
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Format rapi siap cetak untuk lampiran sidang
                  </p>
                </div>
              </button>
            </div>
          </div>

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

          {/* Free plan watermark notice */}
          {isFreePlan && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2.5 text-xs text-amber-950 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">
                    Pemberitahuan Akun Gratis
                  </span>
                  <p className="mt-0.5 leading-relaxed">
                    Hasil ekspor akan memiliki tanda air OlahData. Upgrade ke paket Berlangganan untuk menghapus tanda air dan mengakses ekspor tanpa batas.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
                >
                  <Link href="/app/langganan">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Upgrade Sekarang
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Batal
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isExporting || selectedSections.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyiapkan Berkas...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Unduh Berkas</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
