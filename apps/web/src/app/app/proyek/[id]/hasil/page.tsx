'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileDown,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  BarChart3,
  Layers,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  GitCompare,
  Info,
  Calendar,
  Building,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  FileText,
  Share2,
  Loader2,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabs, type TabItem } from '@/components/scrollable-tabs';
import { ResultTable, type ColumnDef } from '@/components/result-table';
import { ExplanationBox } from '@/components/explanation-box';
import { AssumptionAlert } from '@/components/assumption-alert';
import { TraceabilityPanel } from '@/components/traceability-panel';
import { ExportDialog } from '@/components/export-dialog';
import { DataSourcePanel } from '@/components/data-source-panel';
import { PageActions } from '@/components/page-actions';
import { useToast } from '@/components/ui/toaster';
import { useWizardStore } from '@/stores/wizard-store';
import { formatNumber, formatDateTime } from '@/lib/format';
import { getProject, getResult, exportResult } from '@/lib/api';
import { buildWordTableHtml, copyHtmlAndText, copyWordTable } from '@/lib/word-table';
import {
  generateDescriptiveIntinya,
  generateValidityIntinya,
  generateReliabilityIntinya,
  generateAssumptionsIntinya,
  generateRegressionIntinya,
  generateCorrelationIntinya,
  verifyNConsistency,
  LIKERT_INTERVAL_NOTE,
} from '@/lib/likert-guard';
import type {
  Project,
  AnalysisResults,
  DescriptiveResult,
  ValidityResult,
  ReliabilityResult,
  NormalityResult,
  MulticollinearityResult,
  HeteroscedasticityResult,
  RegressionResult,
  FTestResult,
  DeterminationResult,
  CorrelationResult,
} from '@/lib/api/types';
import { APP_NAME, ENGINE_VERSION } from '@/lib/constants';
import { COPY } from '@/lib/copy';

const TAB_ORDER = [
  'descriptive',
  'validity',
  'reliability',
  'assumptions',
  'regression',
  'correlation',
];

const TABS_LIST: TabItem[] = [
  { id: 'descriptive', label: 'Deskriptif', icon: BarChart3 },
  { id: 'validity', label: 'Validitas', icon: CheckSquare },
  { id: 'reliability', label: 'Reliabilitas', icon: Layers },
  { id: 'assumptions', label: 'Asumsi Klasik', icon: ShieldCheck },
  { id: 'regression', label: 'Regresi Linier', icon: TrendingUp },
  { id: 'correlation', label: 'Korelasi', icon: GitCompare },
];

export default function HasilPage() {
  const params = useParams();
  const router = useRouter();

  // Ambil ID proyek dari params atau pathname (aman untuk SPA fallback & static export)
  const [projectId, setProjectId] = useState<string>('sample');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/app\/proyek\/([^/]+)/);
      if (match && match[1]) {
        setProjectId(match[1]);
        return;
      }
    }
    if (params?.id) {
      setProjectId(params.id as string);
    }
  }, [params?.id]);

  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('descriptive');
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedActiveTab, setCopiedActiveTab] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const { toast } = useToast();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let runId: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        runId = urlParams.get('runId');
      }

      // 1. Cek di wizardStore
      const storeResults = useWizardStore.getState().currentResults;
      let activeResults: AnalysisResults | null = null;

      if (runId && typeof window !== 'undefined') {
        const savedRun = localStorage.getItem(`olahdata_run_${runId}`);
        if (savedRun) {
          try {
            activeResults = JSON.parse(savedRun);
          } catch {
            // ignore
          }
        }
      }

      if (!activeResults && storeResults && (storeResults.projectId === projectId || projectId === 'sample')) {
        activeResults = storeResults;
      }

      if (!activeResults && typeof window !== 'undefined') {
        const savedProjectResults = localStorage.getItem(`olahdata_results_${projectId}`);
        if (savedProjectResults) {
          try {
            activeResults = JSON.parse(savedProjectResults);
          } catch {
            // ignore
          }
        }
      }

      const [projData, apiRes] = await Promise.all([
        getProject(projectId),
        activeResults ? Promise.resolve(activeResults) : getResult(projectId),
      ]);

      setProject(projData || null);
      setResults(activeResults || apiRes);
    } catch (err: unknown) {
      console.error('Failed to load project results', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat hasil analisis';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pemeriksaan konsistensi N antara panel, tabel, dan hasil
  const nCheck = useMemo(() => {
    if (!results) return { consistent: true, expectedN: 0, inconsistentTables: [] };
    return verifyNConsistency(results);
  }, [results]);

  // Susun label versi dataset dinamis
  const dynamicDataVersionLabel = useMemo(() => {
    if (!results) return '';
    const meta = results.sourceMeta;
    const fileName = meta?.fileName || 'dataset.xlsx';
    const ver = meta?.version || 1;
    const isDerived = meta?.kind === 'derived';
    const totalRow = meta?.rowCount || results.respondentCount;
    const excluded = meta?.excludedRows || [];

    let text = `Dataset: ${fileName}, versi ${ver}${isDerived ? ' (turunan dari versi 1)' : ''}. Responden: ${results.respondentCount} dari ${totalRow}`;
    if (excluded.length > 0) {
      text += ` (${excluded.length} baris dikecualikan: nomor ${excluded.slice(0, 5).join(', ')}${excluded.length > 5 ? '...' : ''})`;
    }
    return text;
  }, [results]);

  // Kalimat "Intinya" yang dihasilkan secara deterministik & lolos Number Guard
  const descriptiveIntinya = useMemo(
    () => (results ? generateDescriptiveIntinya(results.descriptive || []) : ''),
    [results]
  );
  const validityIntinya = useMemo(
    () => (results ? generateValidityIntinya(results) : ''),
    [results]
  );
  const reliabilityIntinya = useMemo(
    () => (results ? generateReliabilityIntinya(results) : ''),
    [results]
  );
  const assumptionsIntinya = useMemo(
    () => (results ? generateAssumptionsIntinya(results) : ''),
    [results]
  );
  const regressionIntinya = useMemo(
    () => (results ? generateRegressionIntinya(results) : ''),
    [results]
  );
  const correlationIntinya = useMemo(
    () => (results ? generateCorrelationIntinya(results) : ''),
    [results]
  );

  // Tab names for traceability panel & navigation
  const testNamesMap: Record<string, string> = {
    descriptive: 'Statistik Deskriptif',
    validity: 'Uji Validitas (Pearson Product Moment)',
    reliability: "Uji Reliabilitas (Cronbach's Alpha)",
    assumptions: 'Uji Asumsi Klasik (Normalitas, VIF, Glejser)',
    regression: 'Regresi Linier Berganda (OLS)',
    correlation: 'Korelasi Pearson',
  };

  // Navigasi Sebelumnya & Berikutnya antar-tab
  const currentTabIndex = TAB_ORDER.indexOf(activeTab);
  const prevTabKey = currentTabIndex > 0 ? TAB_ORDER[currentTabIndex - 1] : null;
  const nextTabKey = currentTabIndex < TAB_ORDER.length - 1 ? TAB_ORDER[currentTabIndex + 1] : null;

  // Unduh Cepat Word dari Header
  const handleDirectWordDownload = async () => {
    if (!results) return;
    setIsExportingWord(true);
    try {
      const blob = await exportResult(
        projectId,
        {
          format: 'word',
          sections: ['descriptive', 'validity', 'reliability', 'regression'],
          includeStatement: true,
        },
        results
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hasil_Bab4_${project?.title?.replace(/\s+/g, '_') || 'Skripsi'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Berkas Word Berhasil Diunduh',
        description: 'Tabel berformat APA 7th dan narasi siap disalin ke Bab 4.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Mengunduh Word',
        description: 'Terjadi kesalahan saat membuat dokumen Word.',
        variant: 'error',
      });
    } finally {
      setIsExportingWord(false);
    }
  };

  // Unduh Cepat PDF dari Header
  const handleDirectPdfDownload = async () => {
    if (!results) return;
    setIsExportingPdf(true);
    try {
      const blob = await exportResult(
        projectId,
        {
          format: 'pdf',
          sections: ['descriptive', 'validity', 'reliability', 'regression'],
          includeStatement: true,
        },
        results
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hasil_Bab4_${project?.title?.replace(/\s+/g, '_') || 'Skripsi'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Berkas PDF Berhasil Diunduh',
        description: 'Laporan resmi terverifikasi siap dicetak untuk sidang.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Mengunduh PDF',
        description: 'Terjadi kesalahan saat menyusun berkas PDF.',
        variant: 'error',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Salin Semua Tabel Sekaligus untuk Word
  const handleCopyAllTables = async () => {
    if (!results) return;
    try {
      const allHtmlSections: string[] = [];

      // 1. Deskriptif
      if (results.descriptive && results.descriptive.length > 0) {
        const descHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.1',
          title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian',
          note: `Sumber: Data primer. N = ${results.respondentCount}. ${LIKERT_INTERVAL_NOTE}`,
          columns: descriptiveCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.descriptive.map((r) => [
            r.variable,
            formatNumber(r.n),
            formatNumber(r.mean, 3),
            formatNumber(r.median, 3),
            formatNumber(r.stdDev, 3),
            formatNumber(r.min, 3),
            formatNumber(r.max, 3),
          ]),
        });
        allHtmlSections.push(descHtml);
      }

      // 2. Validitas
      if (results.validity && results.validity.length > 0) {
        const valHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.2',
          title: 'Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)',
          note: `Derajat bebas df = N - 2 = ${results.respondentCount - 2}, taraf signifikansi α = 0,05.`,
          columns: validityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.validity.map((r) => [
            r.item,
            r.construct,
            formatNumber(r.rHitung, 3),
            formatNumber(r.rTabel, 4),
            r.valid ? 'Valid' : 'Gugur',
          ]),
        });
        allHtmlSections.push(valHtml);
      }

      // 3. Reliabilitas
      if (results.reliability && results.reliability.length > 0) {
        const relHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.3',
          title: 'Hasil Pengujian Reliabilitas Konstruk (Cronbach\'s Alpha)',
          note: 'Kriteria reliabilitas: Cronbach\'s Alpha ≥ 0,600 (standar minimum).',
          columns: reliabilityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.reliability.map((r) => [
            r.construct,
            formatNumber(r.itemCount),
            formatNumber(r.cronbachAlpha, 3),
            '0,600',
            r.reliable ? 'Reliabel' : 'Tidak Reliabel',
          ]),
        });
        allHtmlSections.push(relHtml);
      }

      // 4. Regresi
      if (results.regression && results.regression.length > 0) {
        const regHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.4',
          title: 'Hasil Analisis Regresi Linier Berganda dan Uji t Parsial',
          note: `Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - results.regression.length}.`,
          columns: regressionCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.regression.map((r) => [
            r.variable,
            formatNumber(r.coefficient, 3),
            formatNumber(r.stdError, 3),
            formatNumber(r.tHitung, 3),
            formatNumber(r.pValue, 3),
            r.significant ? 'Signifikan' : 'Tidak Signifikan',
          ]),
        });
        allHtmlSections.push(regHtml);
      }

      const combinedHtml = allHtmlSections.join('<br/><br/>');
      const plainText = 'Tabel-tabel hasil analisis statistik Bab 4 OlahData berhasil disalin.';
      await copyHtmlAndText(combinedHtml, plainText);

      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      toast({
        title: 'Seluruh Tabel Disalin',
        description: 'Semua tabel bab 4 berhasil disalin ke papan klip dengan format APA 7th.',
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

  // Salin Tab Aktif
  const handleCopyActiveTabForWord = async () => {
    if (!results) return;
    try {
      let tableHtml = '';
      if (activeTab === 'descriptive') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.1',
          title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian',
          note: `Sumber: Data primer. N = ${results.respondentCount}. ${LIKERT_INTERVAL_NOTE}`,
          columns: descriptiveCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.descriptive || []).map((r) => [
            r.variable,
            formatNumber(r.n),
            formatNumber(r.mean, 3),
            formatNumber(r.median, 3),
            formatNumber(r.stdDev, 3),
            formatNumber(r.min, 3),
            formatNumber(r.max, 3),
          ]),
        });
      } else if (activeTab === 'validity') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.2',
          title: 'Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)',
          note: `Derajat bebas df = N - 2 = ${results.respondentCount - 2}, taraf signifikansi α = 0,05.`,
          columns: validityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.validity || []).map((r) => [
            r.item,
            r.construct,
            formatNumber(r.rHitung, 3),
            formatNumber(r.rTabel, 4),
            r.valid ? 'Valid' : 'Gugur',
          ]),
        });
      } else if (activeTab === 'reliability') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.3',
          title: 'Hasil Pengujian Reliabilitas Konstruk (Cronbach\'s Alpha)',
          note: 'Kriteria reliabilitas: Cronbach\'s Alpha ≥ 0,600 (standar minimum).',
          columns: reliabilityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.reliability || []).map((r) => [
            r.construct,
            formatNumber(r.itemCount),
            formatNumber(r.cronbachAlpha, 3),
            '0,600',
            r.reliable ? 'Reliabel' : 'Tidak Reliabel',
          ]),
        });
      } else if (activeTab === 'regression') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.7',
          title: 'Hasil Analisis Regresi Linier Berganda dan Uji t Parsial',
          note: `Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - (results.regression?.length || 3)}.`,
          columns: regressionCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.regression || []).map((r) => [
            r.variable,
            formatNumber(r.coefficient, 3),
            formatNumber(r.stdError, 3),
            formatNumber(r.tHitung, 3),
            formatNumber(r.pValue, 3),
            r.significant ? 'Signifikan' : 'Tidak Signifikan',
          ]),
        });
      } else if (activeTab === 'correlation') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.10',
          title: 'Matriks Korelasi Pearson Antar Variabel Penelitian',
          note: 'Korelasi diuji pada tingkat signifikansi α = 0,05 (dua arah).',
          columns: correlationCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.correlation || []).map((r) => [
            r.variable1,
            r.variable2,
            formatNumber(r.coefficient, 3),
            formatNumber(r.pValue, 3),
            r.strength,
            r.significant ? 'Signifikan' : 'Tidak',
          ]),
        });
      }

      if (tableHtml) {
        await copyHtmlAndText(tableHtml, 'Tabel berhasil disalin untuk Word.');
        setCopiedActiveTab(true);
        setTimeout(() => setCopiedActiveTab(false), 2000);
        toast({
          title: 'Tabel Tab Ini Disalin',
          description: 'Tempelkan (Ctrl+V) langsung ke lembar kerja Word Anda.',
          variant: 'success',
        });
      }
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Periksa izin clipboard.',
        variant: 'error',
      });
    }
  };

  // State: Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat hasil analisis">
        <div className="h-20 bg-card rounded-2xl border border-border p-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-64 bg-muted rounded" />
            <div className="h-4 w-96 bg-muted/60 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-muted rounded-lg" />
            <div className="h-9 w-28 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-12 bg-card rounded-xl border border-border" />
            <div className="h-72 bg-card rounded-2xl border border-border" />
            <div className="h-44 bg-card rounded-2xl border border-border" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-96 bg-card rounded-2xl border border-border" />
          </div>
        </div>
      </div>
    );
  }

  // State: Error / Gagal
  if (loadError) {
    return (
      <div className="p-8 text-center border border-destructive/40 rounded-2xl bg-destructive/5 space-y-4 my-8">
        <AlertOctagon className="h-10 w-10 text-destructive mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Gagal Memuat Hasil Analisis</h2>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            {loadError} (Kode Galat: ERR_RESULTS_FETCH)
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2 text-[13px] min-h-[40px]">
          <RotateCcw className="h-4 w-4" />
          <span>Coba Lagi</span>
        </Button>
      </div>
    );
  }

  // State: Kosong / Belum ada hasil
  if (!results) {
    return (
      <div className="p-10 text-center border border-border rounded-2xl bg-card space-y-4 my-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Belum Ada Hasil Analisis</h2>
          <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
            Proyek ini belum menjalankan analisis statistik. Silakan atur variabel dan jalankan analisis untuk memperoleh angka Bab 4.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/app/proyek/${projectId}/analisis`}>
            <span>Jalankan Analisis Sekarang</span>
          </Link>
        </Button>
      </div>
    );
  }

  // State: Data Tidak Konsisten (Peringatan Merah Keras)
  if (!nCheck.consistent) {
    return (
      <div className="p-8 border-2 border-destructive bg-destructive/10 rounded-2xl space-y-4 my-6 text-foreground">
        <div className="flex items-center gap-3 text-destructive font-bold text-lg">
          <AlertOctagon className="h-6 w-6 shrink-0" />
          <span>Data Tidak Konsisten</span>
        </div>
        <p className="text-sm leading-relaxed">
          Sistem mendeteksi inkonsistensi nilai responden: Tabel{' '}
          <strong>{nCheck.inconsistentTables.join(', ')}</strong> memuat jumlah N yang berbeda dari N valid hasil analisis (
          <strong>{nCheck.expectedN} responden</strong>). Untuk mencegah salah kutip pada naskah skripsi, hasil tidak ditampilkan.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button asChild variant="destructive" size="sm">
            <Link href={`/app/proyek/${projectId}/analisis`}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Jalankan Ulang Analisis
            </Link>
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  // --- Definisi Kolom Tabel Sesuai Kaidah Akademik ---

  // 1. Deskriptif Konstruk
  const descriptiveCols: ColumnDef<DescriptiveResult>[] = [
    {
      key: 'variable',
      header: 'Konstruk Variabel',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
    },
    {
      key: 'n',
      header: 'N Valid',
      align: 'right',
      getValue: () => formatNumber(results.respondentCount),
    },
    {
      key: 'mean',
      header: 'Mean (Rata-rata)',
      align: 'right',
      getValue: (r) => formatNumber(r.mean, 3),
    },
    {
      key: 'median',
      header: 'Median',
      align: 'right',
      getValue: (r) => formatNumber(r.median, 3),
    },
    {
      key: 'stdDev',
      header: 'Standar Deviasi',
      align: 'right',
      getValue: (r) => formatNumber(r.stdDev, 3),
    },
    {
      key: 'min',
      header: 'Min',
      align: 'right',
      getValue: (r) => formatNumber(r.min, 3),
    },
    {
      key: 'max',
      header: 'Maks',
      align: 'right',
      getValue: (r) => formatNumber(r.max, 3),
    },
  ];

  // 1b. Deskriptif Rincian Per Butir
  const itemDescriptiveCols: ColumnDef<DescriptiveResult>[] = [
    {
      key: 'variable',
      header: 'Butir Indikator',
      className: 'font-mono font-semibold',
      render: (r) => <span className="text-foreground">{r.variable}</span>,
    },
    {
      key: 'n',
      header: 'N',
      align: 'right',
      getValue: (r) => formatNumber(r.n),
    },
    {
      key: 'mean',
      header: 'Mean',
      align: 'right',
      getValue: (r) => formatNumber(r.mean, 3),
    },
    {
      key: 'median',
      header: 'Median',
      align: 'right',
      getValue: (r) => formatNumber(r.median, 3),
    },
    {
      key: 'stdDev',
      header: 'Standar Deviasi',
      align: 'right',
      getValue: (r) => formatNumber(r.stdDev, 3),
    },
    {
      key: 'min',
      header: 'Min',
      align: 'right',
      getValue: (r) => formatNumber(r.min, 3),
    },
    {
      key: 'max',
      header: 'Maks',
      align: 'right',
      getValue: (r) => formatNumber(r.max, 3),
    },
  ];

  // 2. Validitas
  const validityCols: ColumnDef<ValidityResult>[] = [
    {
      key: 'item',
      header: 'Butir Indikator',
      className: 'font-semibold font-mono',
      getValue: (r) => r.item,
    },
    {
      key: 'construct',
      header: 'Konstruk Variabel',
      getValue: (r) => r.construct,
    },
    {
      key: 'rHitung',
      header: 'r Hitung',
      align: 'right',
      getValue: (r) => formatNumber(r.rHitung, 3),
    },
    {
      key: 'rTabel',
      header: 'r Tabel (α=0,05)',
      align: 'right',
      getValue: (r) => formatNumber(r.rTabel, 4),
    },
    {
      key: 'valid',
      header: 'Status Validitas',
      align: 'center',
      render: (r) => (
        <Badge
          variant={r.valid ? 'pine' : 'destructive'}
          className="text-[13px] px-2.5 py-0.5 min-h-[24px]"
        >
          {r.valid ? 'Valid' : 'Gugur'}
        </Badge>
      ),
      getValue: (r) => (r.valid ? 'Valid' : 'Gugur'),
    },
  ];

  // 3. Reliabilitas
  const reliabilityCols: ColumnDef<ReliabilityResult>[] = [
    {
      key: 'construct',
      header: 'Konstruk Variabel',
      render: (r) => <span className="font-semibold text-foreground">{r.construct}</span>,
    },
    {
      key: 'itemCount',
      header: 'Jumlah Butir',
      align: 'right',
      getValue: (r) => formatNumber(r.itemCount),
    },
    {
      key: 'cronbachAlpha',
      header: "Cronbach's Alpha",
      align: 'right',
      getValue: (r) => formatNumber(r.cronbachAlpha, 3),
    },
    {
      key: 'threshold',
      header: 'Ambang Batas',
      align: 'right',
      getValue: () => '0,600',
    },
    {
      key: 'reliable',
      header: 'Status Reliabilitas',
      align: 'center',
      render: (r) => (
        <Badge variant={r.reliable ? 'pine' : 'destructive'} className="text-[13px] px-2.5 py-0.5 min-h-[24px]">
          {r.reliable ? 'Reliabel' : 'Tidak Reliabel'}
        </Badge>
      ),
      getValue: (r) => (r.reliable ? 'Reliabel' : 'Tidak Reliabel'),
    },
  ];

  // 4a. Normalitas
  const normalityCols: ColumnDef<NormalityResult>[] = [
    {
      key: 'test',
      header: 'Uji Statistik',
      render: (r) => <span className="font-semibold text-foreground">{r.test}</span>,
    },
    {
      key: 'statistic',
      header: 'Statistik Uji (K-S)',
      align: 'right',
      getValue: (r) => formatNumber(r.statistic, 3),
    },
    {
      key: 'pValue',
      header: 'Asymp. Sig. (2-tailed)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'kriteria',
      header: 'Kriteria (α)',
      align: 'right',
      getValue: () => '0,050',
    },
    {
      key: 'normal',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.normal ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {r.normal ? 'Normal' : 'Tidak Normal'}
        </Badge>
      ),
      getValue: (r) => (r.normal ? 'Normal' : 'Tidak Normal'),
    },
  ];

  // 4b. Multikolinearitas
  const multicollinearityCols: ColumnDef<MulticollinearityResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Bebas',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
    },
    {
      key: 'tolerance',
      header: 'Tolerance',
      align: 'right',
      getValue: (r) => formatNumber(r.tolerance, 3),
    },
    {
      key: 'vif',
      header: 'VIF',
      align: 'right',
      getValue: (r) => formatNumber(r.vif, 3),
    },
    {
      key: 'cutoff',
      header: 'Batas VIF',
      align: 'right',
      getValue: () => '< 10,00',
    },
    {
      key: 'problematic',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={!r.problematic ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {!r.problematic ? 'Bebas Multikolinearitas' : 'Ada Multikolinearitas'}
        </Badge>
      ),
      getValue: (r) => (!r.problematic ? 'Bebas' : 'Bermasalah'),
    },
  ];

  // 4c. Heteroskedastisitas
  const heteroscedasticityCols: ColumnDef<HeteroscedasticityResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Bebas',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
    },
    {
      key: 'test',
      header: 'Metode Pengujian',
      getValue: (r) => r.test,
    },
    {
      key: 'tHitung',
      header: 't Hitung (Abs Residual)',
      align: 'right',
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (p-value)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'status',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={!r.significant ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {!r.significant ? 'Homoskedastis (Bebas Gejala)' : 'Terjadi Heteroskedastisitas'}
        </Badge>
      ),
      getValue: (r) => (!r.significant ? 'Bebas Gejala' : 'Terjadi Gejala'),
    },
  ];

  // 5a. Regresi Linier
  const regressionCols: ColumnDef<RegressionResult>[] = [
    {
      key: 'variable',
      header: 'Model / Variabel',
      render: (r) => (
        <span
          className={
            r.variable.includes('Konstanta')
              ? 'text-muted-foreground italic'
              : 'font-semibold text-foreground'
          }
        >
          {r.variable}
        </span>
      ),
    },
    {
      key: 'coefficient',
      header: 'Koefisien Regresi (B)',
      align: 'right',
      getValue: (r) => formatNumber(r.coefficient, 3),
    },
    {
      key: 'stdError',
      header: 'Std. Error',
      align: 'right',
      getValue: (r) => formatNumber(r.stdError, 3),
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (p-value)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'significant',
      header: 'Signifikansi (p < 0,05)',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
          {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 5b. Uji F Simultan
  const kPredictors = (results.regression?.length || 3) - 1;
  const fTestCols: ColumnDef<FTestResult>[] = [
    {
      key: 'model',
      header: 'Model Uji',
      render: () => <span className="font-semibold">Regresi Simultan</span>,
      getValue: () => 'Regresi Simultan',
    },
    {
      key: 'fHitung',
      header: 'F Hitung',
      align: 'right',
      getValue: (r) => formatNumber(r.fHitung, 3),
    },
    {
      key: 'fTabel',
      header: `F Tabel (k=${kPredictors}, N=${results.respondentCount})`,
      align: 'right',
      getValue: (r) => formatNumber(r.fTabel, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (p-value)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'significant',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {r.significant ? 'Signifikan Simultan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 5c. Koefisien Determinasi R²
  const determinationCols: ColumnDef<DeterminationResult>[] = [
    {
      key: 'model',
      header: 'Model',
      render: () => <span className="font-semibold">1</span>,
      getValue: () => '1',
    },
    {
      key: 'rSquare',
      header: 'R Square (R²)',
      align: 'right',
      getValue: (r) => formatNumber(r.rSquare, 3),
    },
    {
      key: 'adjustedRSquare',
      header: 'Adjusted R Square',
      align: 'right',
      getValue: (r) => formatNumber(r.adjustedRSquare, 3),
    },
    {
      key: 'stdError',
      header: 'Std. Error of the Estimate',
      align: 'right',
      getValue: (r) => formatNumber(r.stdError, 3),
    },
  ];

  // 6. Korelasi Pearson
  const correlationCols: ColumnDef<CorrelationResult>[] = [
    {
      key: 'variable1',
      header: 'Variabel 1',
      render: (r) => <span className="font-semibold text-foreground">{r.variable1}</span>,
    },
    {
      key: 'variable2',
      header: 'Variabel 2',
      render: (r) => <span className="font-semibold text-foreground">{r.variable2}</span>,
    },
    {
      key: 'coefficient',
      header: 'Korelasi Pearson (r)',
      align: 'right',
      getValue: (r) => formatNumber(r.coefficient, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (2-tailed)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'strength',
      header: 'Kekuatan Hubungan',
      align: 'center',
      getValue: (r) => r.strength,
    },
    {
      key: 'significant',
      header: 'Signifikansi',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
          {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Sticky Header Meja Kerja Hasil */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pb-4 pt-3 sm:pt-4 border-b border-border/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground flex-wrap">
            <Link href="/app" className="hover:text-foreground transition-colors">
              Proyek
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span
              className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[320px]"
              title={project?.title || 'Skripsi Saya'}
            >
              {project?.title || 'Skripsi Saya'}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-primary font-semibold">Hasil Bab 4</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              Hasil Analisis &amp; Pembahasan Bab 4
            </h1>
            <Badge variant="outline" className="text-[13px] bg-muted/40 font-mono min-h-[24px]">
              N = {results.respondentCount}
            </Badge>
          </div>
        </div>

        {/* Action Buttons: Unduh Word, Unduh PDF, Salin Semua Tabel */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllTables}
            className="text-[13px] min-h-[40px] px-3.5 gap-1.5 touch-manipulation cursor-pointer"
            title="Salin seluruh tabel sekaligus dalam format Microsoft Word"
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Semua Tabel Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Salin Semua Tabel</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDirectWordDownload}
            disabled={isExportingWord}
            className="text-[13px] min-h-[40px] px-3.5 gap-1.5 font-medium touch-manipulation cursor-pointer"
            title="Unduh laporan lengkap format Microsoft Word (.docx)"
          >
            {isExportingWord ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 text-primary" />
            )}
            <span>Unduh Word</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDirectPdfDownload}
            disabled={isExportingPdf}
            className="text-[13px] min-h-[40px] px-3.5 gap-1.5 font-semibold shadow-xs touch-manipulation cursor-pointer"
            title="Unduh laporan resmi terverifikasi format PDF (.pdf)"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span>Unduh PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="text-[13px] min-h-[40px] w-10 px-0 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
            title="Pilihan ekspor lanjutan &amp; opsi watermark"
            aria-label="Pilihan ekspor lanjutan"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[13px] min-h-[40px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer"
            title="Buka panduan interpretasi hasil Bab 4"
          >
            <Link
              href={`/app/bantuan#${
                activeTab === 'reliability'
                  ? 'reliabilitas'
                  : activeTab === 'validity'
                  ? 'validitas'
                  : activeTab === 'assumptions'
                  ? 'asumsi-klasik'
                  : activeTab === 'regression'
                  ? 'regresi'
                  : 'panduan-hasil'
              }`}
              target="_blank"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Bantuan</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Panel Sumber Data & Integritas Matriks */}
      <DataSourcePanel meta={results.sourceMeta} projectId={projectId} />

      {/* Tata Letak Dua Kolom: Hasil (minmax(0, 1fr)) + Panel Samping Jejak Hitung (360px) pada >= 1200px */}
      <div className="grid grid-cols-1 min-[1200px]:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start w-full min-w-0">
        {/* Kolom Kiri/Utama: Tab-Tab Uji Statistik */}
        <div data-results-column="true" className="w-full min-w-0 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
            {/* Scrollable Tabs dengan Shadow Indicator, Fade Gradient, dan Aksesibilitas Penuh */}
            <ScrollableTabs
              tabs={TABS_LIST}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />

            {/* 1. STATISTIK DESKRIPTIF */}
            <TabsContent value="descriptive" className="space-y-6 mt-4">
              <ResultTable
                tableNumber="Tabel 4.1"
                title="Hasil Analisis Statistik Deskriptif Variabel Penelitian"
                note={`Sumber data: ${results.sourceMeta?.fileName || 'Data Primer'}. N = ${results.respondentCount} responden valid. Skala Likert 1-5. ${LIKERT_INTERVAL_NOTE}`}
                columns={descriptiveCols}
                data={results.descriptive || []}
                rowKey={(r) => r.variable}
                highlightedValue={highlightedNumber}
              />

              {/* Rincian Deskriptif Per Butir (Bagian Lipat) */}
              <div className="rounded-[16px] border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowItemDetails(!showItemDetails)}
                  className="w-full p-4 flex items-center justify-between text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Rincian Statistik Deskriptif Per Butir Pertanyaan ({results.itemDescriptive?.length || 0} butir)</span>
                  </span>
                  {showItemDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showItemDetails && (
                  <div className="p-4 pt-0">
                    <ResultTable
                      tableNumber="Tabel 4.1b"
                      title="Distribusi Deskriptif Butir Pertanyaan Kuesioner"
                      note={`Menampilkan rata-rata, sebaran, dan nilai ekstrim tiap butir instrumen (N = ${results.respondentCount}).`}
                      columns={itemDescriptiveCols}
                      data={results.itemDescriptive || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  </div>
                )}
              </div>

              <ExplanationBox
                title="Interpretasi Statistik Deskriptif"
                summarySentence={descriptiveIntinya}
                explanation={results.explanations.descriptive}
                onHoverNumber={setHighlightedNumber}
                activeNumber={highlightedNumber}
              />
            </TabsContent>

            {/* 2. UJI VALIDITAS */}
            <TabsContent value="validity" className="space-y-6 mt-4">
              {results.validity && results.validity.length > 0 && (
                <AssumptionAlert
                  status={results.validity.some((v) => !v.valid) ? 'violated' : 'passed'}
                  title={
                    results.validity.some((v) => !v.valid)
                      ? 'Terdapat Butir Yang Dinyatakan Gugur'
                      : 'Seluruh Butir Pernyataan Dinyatakan Valid'
                  }
                  description={`Nilai r hitung korelasi Pearson Product Moment diuji terhadap r tabel sebesar ${formatNumber(results.validity[0].rTabel, 4)} (df = ${results.respondentCount - 2}, α = 0,05).`}
                  recommendation={
                    results.validity.some((v) => !v.valid)
                      ? 'Butir yang gugur sebaiknya dikeluarkan dari pengujian lanjutan atau diperbaiki redaksinya.'
                      : 'Seluruh butir indikator layak digunakan sebagai instrumen pengumpul data penelitian.'
                  }
                />
              )}

              <ResultTable
                tableNumber="Tabel 4.2"
                title="Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)"
                note={`Derajat bebas df = N - 2 = ${results.respondentCount - 2}, taraf signifikansi α = 0,05 (r tabel = ${results.validity?.[0]?.rTabel ? formatNumber(results.validity[0].rTabel, 4) : '0,1816'}). Kriteria: r hitung > r tabel = Valid.`}
                columns={validityCols}
                data={results.validity || []}
                rowKey={(r) => r.item}
                highlightedValue={highlightedNumber}
              />

              <ExplanationBox
                title="Interpretasi Uji Validitas"
                summarySentence={validityIntinya}
                explanation={results.explanations.validity}
                onHoverNumber={setHighlightedNumber}
                activeNumber={highlightedNumber}
              />
            </TabsContent>

            {/* 3. UJI RELIABILITAS */}
            <TabsContent value="reliability" className="space-y-6 mt-4">
              {results.reliability && (
                <AssumptionAlert
                  status={results.reliability.some((r) => !r.reliable) ? 'violated' : 'passed'}
                  title={
                    results.reliability.some((r) => !r.reliable)
                      ? 'Perhatian: Ada Konstruk Yang Belum Reliabel'
                      : 'Tingkat Reliabilitas Konstruk Memenuhi Standar'
                  }
                  description="Koefisien Cronbach's Alpha pada konstruk diuji terhadap ambang batas baku minimal 0,600 (standar konservatif 0,700)."
                  recommendation="Instrumen yang reliabel menjamin konsistensi hasil pengukuran dalam pengumpulan data penelitian."
                />
              )}

              <ResultTable
                tableNumber="Tabel 4.3"
                title="Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)"
                note="* Ambang batas reliabilitas standar kuesioner menurut Nunnaly & Ghozali adalah Cronbach's Alpha ≥ 0,600."
                columns={reliabilityCols}
                data={results.reliability || []}
                rowKey={(r) => r.construct}
                highlightedValue={highlightedNumber}
              />

              <ExplanationBox
                title="Interpretasi Uji Reliabilitas"
                summarySentence={reliabilityIntinya}
                explanation={results.explanations.reliability}
                onHoverNumber={setHighlightedNumber}
                activeNumber={highlightedNumber}
              />
            </TabsContent>

            {/* 4. UJI ASUMSI KLASIK */}
            <TabsContent value="assumptions" className="space-y-6 mt-4">
              {/* 4a. Normalitas */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    1. Uji Normalitas Residual
                  </h3>
                </div>

                {results.normality && results.normality.length > 0 && (
                  <AssumptionAlert
                    status={results.normality[0].normal ? 'passed' : 'violated'}
                    title={
                      results.normality[0].normal
                        ? `Asumsi Normalitas Terpenuhi (p = ${formatNumber(results.normality[0].pValue, 3)} ≥ 0,05)`
                        : `Asumsi Normalitas Tidak Terpenuhi (p = ${formatNumber(results.normality[0].pValue, 3)} < 0,05)`
                    }
                    description={`Uji One-Sample Kolmogorov-Smirnov terhadap residual menghasilkan statistik ${formatNumber(results.normality[0].statistic, 3)} dengan p-value ${formatNumber(results.normality[0].pValue, 3)}.`}
                    recommendation={
                      results.normality[0].normal
                        ? 'Data residual regresi berdistribusi normal, memenuhi prasyarat parametrik OLS.'
                        : 'Pertimbangkan transformasi data atau penambahan responden jika diperlukan.'
                    }
                  />
                )}

                <ResultTable
                  tableNumber="Tabel 4.4"
                  title="Hasil Uji Normalitas Kolmogorov-Smirnov Residual"
                  note={`Uji dilakukan terhadap unstandardized residual model regresi (N = ${results.respondentCount}). Kriteria: Sig. ≥ 0,05 berdistribusi normal.`}
                  columns={normalityCols}
                  data={results.normality || []}
                  rowKey={(r) => r.test}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji Normalitas"
                  summarySentence={
                    results.normality?.[0]?.normal
                      ? `Nilai Sig. Kolmogorov-Smirnov sebesar ${formatNumber(results.normality[0].pValue, 3)} (≥ 0,05) membuktikan data residual berdistribusi normal.`
                      : `Nilai Sig. Kolmogorov-Smirnov sebesar ${results.normality?.[0] ? formatNumber(results.normality[0].pValue, 3) : '-'} (< 0,05) mengindikasikan residual belum berdistribusi normal.`
                  }
                  explanation={results.explanations.normality}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>

              {/* 4b. Multikolinearitas */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    2. Uji Multikolinearitas
                  </h3>
                </div>

                <ResultTable
                  tableNumber="Tabel 4.5"
                  title="Hasil Uji Multikolinearitas Variabel Bebas (Tolerance & VIF)"
                  note="* Ambang batas: Nilai Tolerance > 0,10 dan Variance Inflation Factor (VIF) < 10,00."
                  columns={multicollinearityCols}
                  data={results.multicollinearity || []}
                  rowKey={(r) => r.variable}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji Multikolinearitas"
                  summarySentence={
                    results.multicollinearity?.some((m) => m.problematic)
                      ? 'Ditemukan indikasi multikolinearitas pada variabel bebas (VIF ≥ 10,00).'
                      : 'Seluruh variabel bebas memiliki VIF < 10,00 dan Tolerance > 0,10, membuktikan model regresi bebas dari masalah multikolinearitas.'
                  }
                  explanation={results.explanations.multicollinearity}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>

              {/* 4c. Heteroskedastisitas */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    3. Uji Heteroskedastisitas (Metode Glejser)
                  </h3>
                </div>

                <ResultTable
                  tableNumber="Tabel 4.6"
                  title="Hasil Uji Heteroskedastisitas Menggunakan Metode Glejser"
                  note="* Variabel dependen uji adalah Nilai Absolut Residual |e_i|. Kriteria: Sig. > 0,05 tidak terdapat gejala heteroskedastisitas."
                  columns={heteroscedasticityCols}
                  data={results.heteroscedasticity || []}
                  rowKey={(r) => r.variable}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji Heteroskedastisitas"
                  summarySentence={
                    results.heteroscedasticity?.some((h) => h.significant)
                      ? 'Terdapat variabel yang terindikasi heteroskedastisitas (p < 0,05 pada Uji Glejser).'
                      : 'Nilai Sig. Uji Glejser seluruh variabel bebas berada di atas 0,05, membuktikan tidak ada gejala heteroskedastisitas pada residual.'
                  }
                  explanation={results.explanations.heteroscedasticity}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>
            </TabsContent>

            {/* 5. REGRESI LINIER BERGANDA */}
            <TabsContent value="regression" className="space-y-6 mt-4">
              {/* 5a. Koefisien Regresi & Uji t Parsial */}
              <div className="space-y-4">
                <ResultTable
                  tableNumber="Tabel 4.7"
                  title="Hasil Analisis Regresi Linier Berganda dan Uji t Parsial"
                  note={`Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - (results.regression?.length || 3)}. Kriteria: Sig. < 0,05 = Signifikan.`}
                  columns={regressionCols}
                  data={results.regression || []}
                  rowKey={(r) => r.variable}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Model Regresi & Uji t Parsial"
                  summarySentence={regressionIntinya}
                  explanation={results.explanations.regression}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>

              {/* 5b. Uji F Simultan */}
              <div className="space-y-4 pt-6 border-t border-border">
                <ResultTable
                  tableNumber="Tabel 4.8"
                  title="Hasil Uji Signifikansi Simultan (Uji F / ANOVA Model)"
                  note={`F tabel pada derajat bebas df1 = ${kPredictors}, df2 = ${results.respondentCount - (results.regression?.length || 3)}, α = 0,05. Kriteria: F hitung > F tabel dan Sig. < 0,05.`}
                  columns={fTestCols}
                  data={results.fTest ? [results.fTest] : []}
                  rowKey={() => 'ftest-1'}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji F Simultan"
                  summarySentence={
                    results.fTest?.significant
                      ? `Nilai F hitung ${formatNumber(results.fTest.fHitung, 2)} > F tabel ${formatNumber(results.fTest.fTabel, 2)} (Sig. = ${formatNumber(results.fTest.pValue, 3)}) membuktikan seluruh variabel bebas secara serempak berpengaruh signifikan.`
                      : `Nilai F hitung ${results.fTest ? formatNumber(results.fTest.fHitung, 2) : '-'} tidak melampaui F tabel (Sig. ≥ 0,05).`
                  }
                  explanation={results.explanations.fTest}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>

              {/* 5c. Koefisien Determinasi R² */}
              <div className="space-y-4 pt-6 border-t border-border">
                <ResultTable
                  tableNumber="Tabel 4.9"
                  title="Hasil Analisis Koefisien Determinasi (Model Summary)"
                  note="* Model regresi OLS dengan variabel independen terstandarisasi."
                  columns={determinationCols}
                  data={results.determination ? [results.determination] : []}
                  rowKey={() => 'det-1'}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Koefisien Determinasi R²"
                  summarySentence={
                    results.determination
                      ? `Nilai R² sebesar ${formatNumber(results.determination.rSquare, 3)} menunjukkan ${formatNumber(results.determination.rSquare * 100, 1)}% variasi variabel terikat dapat dijelaskan oleh model.`
                      : 'Koefisien determinasi model penelitian.'
                  }
                  explanation={results.explanations.determination}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </div>
            </TabsContent>

            {/* 6. KORELASI PEARSON */}
            <TabsContent value="correlation" className="space-y-6 mt-4">
              <ResultTable
                tableNumber="Tabel 4.10"
                title="Matriks Korelasi Pearson Antar Variabel Penelitian"
                note={`Korelasi diuji pada tingkat signifikansi α = 0,05 (dua arah, N = ${results.respondentCount}).`}
                columns={correlationCols}
                data={results.correlation || []}
                rowKey={(r) => `${r.variable1}-${r.variable2}`}
                highlightedValue={highlightedNumber}
              />

              <ExplanationBox
                title="Interpretasi Korelasi Pearson"
                summarySentence={correlationIntinya}
                explanation={results.explanations.correlation}
                onHoverNumber={setHighlightedNumber}
                activeNumber={highlightedNumber}
              />
            </TabsContent>
          </Tabs>

          {/* Tombol Navigasi Antar-Uji: Sebelumnya & Berikutnya */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-border/80 gap-3 flex-wrap">
            {prevTabKey ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(prevTabKey)}
                className="gap-1.5 text-[13px] min-h-[40px] px-3.5 touch-manipulation cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya: {testNamesMap[prevTabKey]?.split(' ')[0]}</span>
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyActiveTabForWord}
              className="text-[13px] min-h-[40px] px-3.5 gap-1.5 hidden sm:inline-flex touch-manipulation cursor-pointer"
            >
              {copiedActiveTab ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span>Salin Tab Ini untuk Word</span>
                </>
              )}
            </Button>

            {nextTabKey ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(nextTabKey)}
                className="gap-1.5 text-[13px] min-h-[40px] px-3.5 touch-manipulation cursor-pointer"
              >
                <span>Berikutnya: {testNamesMap[nextTabKey]?.split(' ')[0]}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div />
            )}
          </div>

          {/* Panduan Dosen Pembimbing Skripsi Bab 4 */}
          <div className="rounded-[16px] border border-border bg-card p-5 sm:p-6 flex items-start gap-3.5 text-[13px] sm:text-sm text-foreground/90 shadow-xs">
            <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1.5 max-w-[68ch]">
              <h4 className="font-semibold text-foreground text-sm">
                Panduan Sidang &amp; Penyusunan Bab 4 Skripsi
              </h4>
              <p className="text-muted-foreground leading-relaxed text-[13px]">
                Hasil pengolahan data dan narasi di atas disusun secara deterministik mengikuti kaidah penulisan skripsi baku. Jika dosen pembimbing menanyakan keabsahan data, tunjukkan kode verifikasi hash pada panel Jejak Hitung.
              </p>
              <p className="text-[13px] font-medium text-primary">
                {COPY.reassurance.saved}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan / Bawah: Panel Jejak Hitung Audit Trail (360px di Desktop >= 1200px) */}
        <aside className="w-full min-w-0 min-[1200px]:sticky min-[1200px]:top-24 space-y-4">
          <TraceabilityPanel
            currentTestKey={activeTab}
            currentTestName={testNamesMap[activeTab] || 'Statistik Skripsi'}
            dataVersionLabel={dynamicDataVersionLabel}
            respondentCount={results.respondentCount}
            significanceLevel={results.significanceLevel}
            rTabel={results.validity?.[0]?.rTabel}
            dfResidual={results.regression ? results.respondentCount - results.regression.length : undefined}
            hash={results.sourceMeta?.sha256}
            isHashValid={Boolean(results.sourceMeta?.sha256)}
            timestamp={results.timestamp}
            engineVersion={results.engineVersion}
            onDownloadStatement={() => setExportOpen(true)}
          />

          {/* Banner Pernyataan Etika Penggunaan Alat */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-[13px] shadow-2xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>Pernyataan Penggunaan Alat</span>
            </div>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              Lampirkan lembar transparansi {APP_NAME} pada lampiran naskah skripsi Anda untuk memenuhi standar integritas akademik kampus.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="w-full justify-center gap-1.5 text-[13px] min-h-[40px] text-foreground hover:bg-muted font-medium rounded-lg touch-manipulation cursor-pointer"
            >
              <span>Buka Opsi Ekspor &amp; Etika</span>
            </Button>
          </div>
        </aside>
      </div>

      {/* PageActions Navigasi Halaman */}
      <PageActions
        prevHref={`/app/proyek/${projectId}/analisis`}
        prevLabel="Kembali ke Pengaturan Analisis"
        nextHref="/app"
        nextLabel="Selesai &amp; Buka Daftar Proyek"
      />

      {/* Export Dialog */}
      <ExportDialog
        projectId={projectId}
        projectTitle={project?.title}
        open={exportOpen}
        onOpenChange={setExportOpen}
        results={results}
      />
    </div>
  );
}
