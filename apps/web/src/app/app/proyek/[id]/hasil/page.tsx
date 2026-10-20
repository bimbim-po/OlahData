'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Scissors,
  RefreshCw,
  Table as TableIcon,
  Lock,
  BookOpen,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabs, type TabItem } from '@/components/scrollable-tabs';
import { ResultTable, type ColumnDef } from '@/components/result-table';
import { ExplanationBox } from '@/components/explanation-box';
import { AssumptionAlert } from '@/components/assumption-alert';
import { TraceabilityPanel } from '@/components/traceability-panel';
import { ExportDialog } from '@/components/export-dialog';
import { StatisticalReferenceTablesDialog } from '@/components/statistical-reference-tables-dialog';
import { DataSourcePanel } from '@/components/data-source-panel';
import { TopSummaryTrafficLights } from '@/components/top-summary-traffic-lights';
import { Chapter4InterpretationCard } from '@/components/chapter4-interpretation-card';
import { TambahAnalisisSelector } from '@/components/tambah-analisis-selector';
import { Chapter4AsyncExportModal } from '@/components/chapter4-async-export-modal';
import { AcademicResidualPlots, AcademicHeteroscedasticityPlot } from '@/components/academic-residual-plots';
import { PageActions } from '@/components/page-actions';
import { useToast } from '@/components/ui/toaster';
import { useWizardStore } from '@/stores/wizard-store';
import { cn } from '@/lib/utils';
import { formatNumber, formatDateTime } from '@/lib/format';
import { getProject, getResult, exportResult } from '@/lib/api';
import { buildWordTableHtml, copyHtmlAndText, copyWordTable } from '@/lib/word-table';
import { SpssOutputViewer } from '@/components/spss-output-viewer';
import { ThesisDefenseCompanion } from '@/components/thesis-defense-companion';
import { ProResultBlur } from '@/components/pro-result-blur';
import { usePlanGate, isSampleProject } from '@/lib/entitlements';
import { computeDeterministicStats } from '@/lib/stats-engine';
import type {
  PairedTTestResult,
  NGainSummary,
  IndividualNGain,
  IndependentTTestResult,
  OneWayAnovaResult,
  TukeyHsdComparison,
  NonParametricResult,
} from '@/lib/comparative-stats';
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
  LinearityResult,
  DurbinWatsonResult,
  DemographicVariableResult,
  DemographicCategory,
} from '@/lib/api/types';
import { APP_NAME, ENGINE_VERSION } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { mockResults } from '@/lib/mock/results';

interface HypothesisDecisionRow {
  hypothesis: string;
  statement: string;
  coefficient: string;
  testValue: string;
  pValue: string;
  decision: string;
  isAccepted: boolean;
}

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
  const [outputMode, setOutputMode] = useState<'apa' | 'spss'>('apa');
  const [activeTab, setActiveTab] = useState('descriptive');
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedActiveTab, setCopiedActiveTab] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showSpearmanHetero, setShowSpearmanHetero] = useState(false);
  const [heteroMethod, setHeteroMethod] = useState<'glejser' | 'park' | 'spearman'>('glejser');
  const [showReferenceTables, setShowReferenceTables] = useState(false);
  const [enabledOptionalTables, setEnabledOptionalTables] = useState<string[]>(['tabel_4_12_korelasi']);
  const [chapter4ModalOpen, setChapter4ModalOpen] = useState(false);
  const [chapter4ExportFormat, setChapter4ExportFormat] = useState<'docx' | 'pdf'>('docx');

  const toggleOptionalTable = (tableId: string) => {
    setEnabledOptionalTables((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    );
  };
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams?.get('contoh') === '1';
  const isSample = isSampleProject(projectId) || isSampleProject(project) || isDemoParam;
  const { isFree, canExport, openUpgradeModal } = usePlanGate(projectId, isSample);

  const handleResetDemo = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`olahdata_results_${projectId}`);
        localStorage.removeItem('olahdata_results_sample');
        localStorage.removeItem('olahdata_results_project-1');
      } catch {
        // ignore
      }
    }
    useWizardStore.getState().resetWizard();
    setResults(mockResults);
    toast({
      title: 'Data contoh berhasil direset',
      description: 'Seluruh modifikasi simulasi telah dibersihkan kembali ke data acuan awal.',
      variant: 'success',
    });
  };

  const handleEliminateInvalidItems = () => {
    if (!results || !results.validity) return;
    const invalidItems = results.validity.filter((v) => !v.valid).map((v) => v.item);
    if (invalidItems.length === 0) return;

    const store = useWizardStore.getState();
    store.eliminateInvalidItems(invalidItems);
    const updatedState = useWizardStore.getState();

    const newResults = computeDeterministicStats({
      rows: updatedState.fileData,
      constructs: updatedState.constructs,
      selectedTests: updatedState.selectedTests,
      reverseItems: updatedState.reverseItems,
      calculationMethod: updatedState.calculationMethod,
      datasetMeta: updatedState.datasetMeta || undefined,
      researchDesign: updatedState.researchDesign,
      preCol: updatedState.preCol,
      postCol: updatedState.postCol,
      groupCol: updatedState.groupCol,
      scoreCol: updatedState.scoreCol,
      idealMaxScore: updatedState.idealMaxScore,
      projectId,
      dataVersionId: `dv-${updatedState.dataVersion}`,
    });

    store.setCurrentResults(newResults);
    setResults(newResults);
    toast({
      title: 'Versi Revisi Berhasil Dibuat!',
      description: `${invalidItems.length} butir gugur (${invalidItems.join(', ')}) berhasil dieliminasi dan seluruh analisis dihitung ulang secara otomatis.`,
      variant: 'success',
    });
  };

  const handleEliminateOutliers = (rowNumbers: number[]) => {
    if (rowNumbers.length === 0) return;
    if (isFree) {
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Pembersihan Outlier & Normalisasi Data Otomatis',
      });
      return;
    }

    const store = useWizardStore.getState();
    store.eliminateOutliers(rowNumbers);
    const updatedState = useWizardStore.getState();

    const newResults = computeDeterministicStats({
      rows: updatedState.fileData,
      constructs: updatedState.constructs,
      selectedTests: updatedState.selectedTests,
      reverseItems: updatedState.reverseItems,
      calculationMethod: updatedState.calculationMethod,
      datasetMeta: updatedState.datasetMeta || undefined,
      researchDesign: updatedState.researchDesign,
      preCol: updatedState.preCol,
      postCol: updatedState.postCol,
      groupCol: updatedState.groupCol,
      scoreCol: updatedState.scoreCol,
      idealMaxScore: updatedState.idealMaxScore,
      projectId,
      dataVersionId: `dv-${updatedState.dataVersion}`,
    });

    store.setCurrentResults(newResults);
    setResults(newResults);
    toast({
      title: 'Responden Outlier Berhasil Dikecualikan!',
      description: `${rowNumbers.length} responden outlier residual (|Z| > 2,5) dieksklusi dan model analisis dihitung ulang (versi baru dibuat).`,
      variant: 'success',
    });
  };

  const computedTabs = useMemo<TabItem[]>(() => {
    if (!results) return TABS_LIST;

    if (results.researchDesign === 'categorical') {
      const tabs: TabItem[] = [
        { id: 'crosstab', label: 'Tabulasi Silang & Chi-Square', icon: TableIcon },
      ];
      if (results.descriptive && results.descriptive.length > 0) {
        tabs.unshift({ id: 'descriptive', label: 'Deskriptif', icon: BarChart3 });
      }
      return tabs;
    }

    if (results.researchDesign === 'comparative') {
      const tabs: TabItem[] = [
        { id: 'descriptive', label: 'Deskriptif', icon: BarChart3 },
      ];
      if (results.pairedTTest || results.nGain) {
        tabs.push({ id: 'paired-ttest', label: 'Paired t-Test & N-Gain', icon: GitCompare });
      }
      if (results.independentTTest) {
        tabs.push({ id: 'independent-ttest', label: 'Independent t-Test', icon: GitCompare });
      }
      if (results.oneWayAnova) {
        tabs.push({ id: 'oneway-anova', label: 'One-Way ANOVA', icon: Layers });
      }
      if (results.nonParametric) {
        tabs.push({ id: 'nonparametric', label: 'Uji Non-Parametrik', icon: ShieldCheck });
      }
      return tabs;
    }

    const tabs: TabItem[] = [...TABS_LIST];
    if (results.crosstab || results.chiSquare || enabledOptionalTables.includes('tabel_4_15_chi_kuadrat')) {
      tabs.push({ id: 'crosstab', label: 'Tabulasi Silang & Chi-Square', icon: TableIcon });
    }
    if (results.pairedTTest || results.nGain) {
      tabs.push({ id: 'paired-ttest', label: 'Paired t-Test & N-Gain', icon: GitCompare });
    }
    if (results.independentTTest || enabledOptionalTables.includes('tabel_4_13_uji_beda_2')) {
      tabs.push({ id: 'independent-ttest', label: 'Independent t-Test', icon: GitCompare });
    }
    if (results.oneWayAnova || enabledOptionalTables.includes('tabel_4_14_uji_beda_3')) {
      tabs.push({ id: 'oneway-anova', label: 'One-Way ANOVA', icon: Layers });
    }
    if (results.nonParametric) {
      tabs.push({ id: 'nonparametric', label: 'Uji Non-Parametrik', icon: ShieldCheck });
    }
    return tabs;
  }, [results, enabledOptionalTables]);

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

      const finalRes = activeResults || apiRes;
      setProject(projData || null);
      setResults(finalRes);
      if (finalRes?.researchDesign === 'categorical') {
        setActiveTab('crosstab');
      }
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

  const hypothesisRows = useMemo<HypothesisDecisionRow[]>(() => {
    if (!results || !results.regression) return [];
    const rows: HypothesisDecisionRow[] = [];
    let hIdx = 1;
    const predictors = results.regression.filter(
      (r) => !r.variable.toLowerCase().includes('konstanta') && !r.variable.toLowerCase().includes('constant')
    );
    predictors.forEach((p) => {
      const isAccepted = p.significant || p.pValue < 0.05;
      const direction = p.coefficient > 0 ? 'positif' : 'negatif';
      rows.push({
        hypothesis: `H${hIdx}`,
        statement: `${p.variable} berpengaruh ${direction} dan signifikan terhadap variabel terikat`,
        coefficient: formatNumber(p.coefficient, 3),
        testValue: `t = ${formatNumber(p.tHitung, 3)}`,
        pValue: p.pValue < 0.001 ? '< 0,001' : formatNumber(p.pValue, 4),
        decision: isAccepted ? 'Diterima (Signifikan)' : 'Ditolak (Tidak Signifikan)',
        isAccepted,
      });
      hIdx++;
    });
    if (results.fTest) {
      const isAccepted = results.fTest.significant;
      rows.push({
        hypothesis: `H${hIdx} (Simultan)`,
        statement: `Seluruh variabel bebas secara simultan berpengaruh signifikan terhadap variabel terikat`,
        coefficient: `R² = ${results.determination ? formatNumber(results.determination.rSquare, 3) : '-'}`,
        testValue: `F = ${formatNumber(results.fTest.fHitung, 3)}`,
        pValue: results.fTest.pValue < 0.001 ? '< 0,001' : formatNumber(results.fTest.pValue, 4),
        decision: isAccepted ? 'Diterima (Signifikan)' : 'Ditolak (Tidak Signifikan)',
        isAccepted,
      });
    }
    return rows;
  }, [results]);

  // Tab names for traceability panel & navigation
  const testNamesMap: Record<string, string> = {
    descriptive: 'Statistik Deskriptif',
    validity: 'Uji Validitas (Pearson Product Moment)',
    reliability: "Uji Reliabilitas (Cronbach's Alpha)",
    assumptions: 'Uji Asumsi Klasik (Normalitas, VIF, Glejser)',
    regression: 'Regresi Linier Berganda (OLS)',
    correlation: 'Korelasi Pearson',
    'paired-ttest': 'Paired Sample t-Test & N-Gain',
    'independent-ttest': 'Independent Sample t-Test & Levene',
    'oneway-anova': 'One-Way ANOVA & Post-Hoc Tukey',
    nonparametric: 'Uji Non-Parametrik Alternatif',
    crosstab: 'Tabulasi Silang, Chi-Square, & Odds Ratio',
  };

  // Navigasi Sebelumnya & Berikutnya antar-tab dinamis
  const activeTabOrder = useMemo(() => computedTabs.map((t) => t.id), [computedTabs]);
  const currentTabIndex = activeTabOrder.indexOf(activeTab);
  const prevTabKey = currentTabIndex > 0 ? activeTabOrder[currentTabIndex - 1] : null;
  const nextTabKey = currentTabIndex < activeTabOrder.length - 1 ? activeTabOrder[currentTabIndex + 1] : null;

  // Unduh Cepat Word dari Header
  const handleDirectWordDownload = async () => {
    if (!results) return;
    if (!canExport) {
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Ekspor Dokumen Word .docx Tanpa Batas & Tanpa Watermark',
      });
      return;
    }
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
    if (!canExport) {
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Ekspor Dokumen PDF Resmi Terverifikasi Tanpa Batas',
      });
      return;
    }
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
    if (!canExport) {
      openUpgradeModal({
        plan: 'monthly',
        reason: 'Salin Seluruh Tabel Sekaligus Format Microsoft Word',
      });
      return;
    }
    try {
      const allHtmlSections: string[] = [];

      // 4.1 Demografi (Karakteristik Responden)
      if (results.demographics && results.demographics.length > 0) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
        results.demographics.forEach((demo, dIdx) => {
          const letter = results.demographics!.length > 1 ? letters[dIdx] || `${dIdx + 1}` : '';
          const demoHtml = buildWordTableHtml({
            tableNumber: `Tabel 4.1${letter}`,
            title: `Distribusi Frekuensi Karakteristik Responden Berdasarkan ${demo.variable.replace(/_/g, ' ')}`,
            note: `Total responden N = ${results.respondentCount}. Kategori mayoritas: ${demo.majorityCategory || '-'}.`,
            columns: demographicCategoryCols.map((c) => ({ header: c.header, align: c.align })),
            rows: demo.categories.map((c) => [
              c.category,
              formatNumber(c.frequency),
              `${formatNumber(c.percentage, 1)}%`,
              `${formatNumber(c.cumulativePercentage, 1)}%`,
            ]),
          });
          allHtmlSections.push(demoHtml);
        });
      }

      // 4.2 Deskriptif Variabel Penelitian
      if (results.descriptive && results.descriptive.length > 0) {
        const descHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.2',
          title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian & TCR',
          note: `Sumber data: Data primer. N = ${results.respondentCount}. ${LIKERT_INTERVAL_NOTE}`,
          columns: descriptiveCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.descriptive.map((r) => [
            r.variable,
            formatNumber(r.n),
            formatNumber(r.mean, 3),
            formatNumber(r.median, 3),
            formatNumber(r.stdDev, 3),
            formatNumber(r.min, 3),
            formatNumber(r.max, 3),
            r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-',
            r.tcrCategory || '-',
          ]),
        });
        allHtmlSections.push(descHtml);
      }

      // 4.3 Distribusi Jawaban per Butir (Likert)
      if (results.itemDescriptive && results.itemDescriptive.length > 0) {
        const distHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.3',
          title: 'Distribusi Frekuensi Jawaban Responden per Butir Kuesioner',
          note: '* STS = Sangat Tidak Setuju (1), TS = Tidak Setuju (2), N = Netral (3), S = Setuju (4), SS = Sangat Setuju (5).',
          columns: likertItemCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.itemDescriptive.map((r) => [
            r.variable,
            formatNumber(r.freq1 ?? 0),
            formatNumber(r.freq2 ?? 0),
            formatNumber(r.freq3 ?? 0),
            formatNumber(r.freq4 ?? 0),
            formatNumber(r.freq5 ?? 0),
            formatNumber(r.n),
            formatNumber(r.mean, 2),
            r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-',
            r.tcrCategory || '-',
          ]),
        });
        allHtmlSections.push(distHtml);
      }

      // 4.4 Validitas
      if (results.validity && results.validity.length > 0) {
        const valHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.4',
          title: 'Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)',
          note: `Derajat bebas df = N - 2 = ${results.respondentCount - 2}, taraf signifikansi α = 0,05 (r tabel = ${results.validity[0]?.rTabel ? formatNumber(results.validity[0].rTabel, 4) : '0,1816'}). Kriteria: r hitung > r tabel.`,
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

      // 4.5 Reliabilitas
      if (results.reliability && results.reliability.length > 0) {
        const relHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.5',
          title: 'Hasil Pengujian Reliabilitas Konstruk (Cronbach\'s Alpha)',
          note: 'Kriteria reliabilitas: Cronbach\'s Alpha ≥ 0,600 (standar minimum) / ≥ 0,700 (konservatif).',
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

      // 4.6 Normalitas Residual
      if (results.normality && results.normality.length > 0) {
        const normHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.6',
          title: 'Hasil Uji Normalitas Residual Regresi (Kolmogorov-Smirnov & Shapiro-Wilk)',
          note: `Uji dilakukan terhadap unstandardized residual model regresi (N = ${results.respondentCount}). Kriteria: Sig. ≥ 0,05.`,
          columns: normalityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.normality.map((r) => [
            r.test,
            formatNumber(r.statistic, 3),
            formatNumber(r.pValue, 3),
            '0,050',
            r.normal ? 'Normal' : 'Tidak Normal',
          ]),
        });
        allHtmlSections.push(normHtml);
      }

      // 4.7 Multikolinearitas
      if (results.multicollinearity && results.multicollinearity.length > 0) {
        const multiHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.7',
          title: 'Hasil Uji Multikolinearitas Variabel Bebas (Tolerance & VIF)',
          note: '* Ambang batas: Tolerance > 0,10 dan VIF < 10,00.',
          columns: multicollinearityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.multicollinearity.map((r) => [
            r.variable,
            formatNumber(r.tolerance, 3),
            formatNumber(r.vif, 3),
            '< 10,00',
            !r.problematic ? 'Bebas' : 'Bermasalah',
          ]),
        });
        allHtmlSections.push(multiHtml);
      }

      // 4.8 Heteroskedastisitas
      if (results.heteroscedasticity && results.heteroscedasticity.length > 0) {
        const heteroHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.8',
          title: 'Hasil Uji Heteroskedastisitas (Metode Glejser)',
          note: '* Kriteria: Sig. > 0,05 bebas heteroskedastisitas.',
          columns: heteroscedasticityCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.heteroscedasticity.map((r) => [
            r.variable,
            r.test,
            formatNumber(r.tHitung, 3),
            formatNumber(r.pValue, 3),
            !r.significant ? 'Bebas Gejala' : 'Terjadi Gejala',
          ]),
        });
        allHtmlSections.push(heteroHtml);
      }

      // 4.9 Durbin-Watson
      if (results.durbinWatson) {
        const dwHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.9',
          title: 'Hasil Uji Autokorelasi Durbin-Watson Model Regresi',
          note: `k = ${kPredictors}, N = ${results.respondentCount}. Kriteria: dU < d < 4 - dU.`,
          columns: durbinWatsonCols.map((c) => ({ header: c.header, align: c.align })),
          rows: [[
            formatNumber(results.durbinWatson.dwStatistic, 4),
            formatNumber(results.durbinWatson.dL, 4),
            formatNumber(results.durbinWatson.dU, 4),
            formatNumber(4 - results.durbinWatson.dU, 4),
            results.durbinWatson.conclusion,
          ]],
        });
        allHtmlSections.push(dwHtml);
      }

      // 4.10 Regresi Linier Berganda
      if (results.regression && results.regression.length > 0) {
        const regHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.10a',
          title: 'Hasil Analisis Regresi Linier Berganda dan Uji t Parsial',
          note: `Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - results.regression.length}.`,
          columns: regressionCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.regression.map((r) => [
            r.variable,
            formatNumber(r.coefficient, 3),
            formatNumber(r.stdError, 3),
            r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
            formatNumber(r.tHitung, 3),
            r.tTabel !== undefined ? formatNumber(r.tTabel, 3) : '-',
            formatNumber(r.pValue, 3),
            r.variable.toLowerCase().includes('konstanta') ? '-' : (r.significant ? 'Signifikan' : 'Tidak Signifikan'),
          ]),
        });
        allHtmlSections.push(regHtml);

        if (results.determination) {
          const detHtml = buildWordTableHtml({
            tableNumber: 'Tabel 4.10b',
            title: 'Hasil Analisis Koefisien Determinasi (Model Summary)',
            columns: determinationCols.map((c) => ({ header: c.header, align: c.align })),
            rows: [[
              '1',
              formatNumber(results.determination.rSquare, 3),
              formatNumber(results.determination.adjustedRSquare, 3),
              formatNumber(results.determination.stdError, 3),
            ]],
          });
          allHtmlSections.push(detHtml);
        }

        if (results.fTest) {
          const fHtml = buildWordTableHtml({
            tableNumber: 'Tabel 4.10c',
            title: 'Hasil Uji Signifikansi Simultan (Uji F / ANOVA Model)',
            columns: fTestCols.map((c) => ({ header: c.header, align: c.align })),
            rows: [[
              'Regresi Simultan',
              formatNumber(results.fTest.fHitung, 3),
              formatNumber(results.fTest.fTabel, 3),
              formatNumber(results.fTest.pValue, 3),
              results.fTest.significant ? 'Signifikan Simultan' : 'Tidak Signifikan',
            ]],
          });
          allHtmlSections.push(fHtml);
        }

        // SE and SR table
        const predictors = results.regression.filter((r) => !r.variable.toLowerCase().includes('konstanta') && r.sePercent !== undefined);
        if (predictors.length > 0) {
          const seSrHtml = buildWordTableHtml({
            tableNumber: 'Tabel 4.10d',
            title: 'Sumbangan Efektif (SE %) dan Sumbangan Relatif (SR %) Variabel Bebas',
            note: `Total SE = ${(results.determination?.rSquare ? results.determination.rSquare * 100 : 0).toFixed(2)}%, Total SR = 100,00%.`,
            columns: seSrCols.map((c) => ({ header: c.header, align: c.align })),
            rows: predictors.map((r) => [
              r.variable,
              r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
              r.sePercent !== undefined ? `${formatNumber(r.sePercent, 2)}%` : '-',
              r.srPercent !== undefined ? `${formatNumber(r.srPercent, 2)}%` : '-',
            ]),
          });
          allHtmlSections.push(seSrHtml);
        }

        // 4.11 Ringkasan Keputusan Hipotesis
        const hipHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.11',
          title: 'Ringkasan Keputusan Pengujian Hipotesis Penelitian',
          note: '* Kriteria: Sig. p < 0,05 dan t hitung > t tabel / F hitung > F tabel.',
          columns: hypothesisCols.map((c) => ({ header: c.header, align: c.align })),
          rows: hypothesisRows.map((h) => [
            h.hypothesis,
            h.statement,
            h.coefficient,
            h.testValue,
            h.pValue,
            h.decision,
          ]),
        });
        allHtmlSections.push(hipHtml);
      }

      // 4.12 Matriks Korelasi
      if (results.correlation && results.correlation.length > 0) {
        const corrHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.12',
          title: 'Matriks Korelasi Pearson Antar Variabel Penelitian',
          note: `Taraf signifikansi α = 0,05 (dua arah, N = ${results.respondentCount}).`,
          columns: correlationCols.map((c) => ({ header: c.header, align: c.align })),
          rows: results.correlation.map((r) => [
            r.variable1,
            r.variable2,
            formatNumber(r.coefficient, 3),
            formatNumber(r.pValue, 4),
            r.significant ? 'Signifikan' : 'Tidak Signifikan',
          ]),
        });
        allHtmlSections.push(corrHtml);
      }

      // 4.13 Uji Beda 2 Kelompok (Independent t-Test)
      if (results.independentTTest) {
        const it = results.independentTTest;
        const itHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.13',
          title: 'Hasil Uji Beda Dua Kelompok Bebas (Independent Samples t-Test)',
          note: `* Uji Levene: F = ${formatNumber(it.levene.fStatistic, 3)}, Sig. = ${formatNumber(it.levene.pValue, 4)}.`,
          columns: independentTTestCols.map((c) => ({ header: c.header, align: c.align })),
          rows: it.rows.map((row, idx) => [
            row.assumption,
            idx === 0 ? formatNumber(it.levene.fStatistic, 3) : '-',
            idx === 0 ? formatNumber(it.levene.pValue, 4) : '-',
            formatNumber(row.tHitung, 3),
            formatNumber(row.df, 1),
            formatNumber(row.pValue, 4),
            formatNumber(row.meanDiff, 3),
          ]),
        });
        allHtmlSections.push(itHtml);
      }

      // 4.14 One-Way ANOVA
      if (results.oneWayAnova) {
        const an = results.oneWayAnova;
        const anHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.14',
          title: 'Hasil Analisis Varians Satu Jalur (One-Way ANOVA)',
          note: `F tabel (df1 = ${an.dfBetween}, df2 = ${an.dfWithin}, α = 0,05) = ${formatNumber(an.fTabel, 3)}.`,
          columns: oneWayAnovaCols.map((c) => ({ header: c.header, align: c.align })),
          rows: [
            ['Between Groups', formatNumber(an.ssBetween, 3), an.dfBetween, formatNumber(an.msBetween, 3), formatNumber(an.fHitung, 3), formatNumber(an.pValue, 4)],
            ['Within Groups', formatNumber(an.ssWithin, 3), an.dfWithin, formatNumber(an.msWithin, 3), '-', '-'],
            ['Total', formatNumber(an.ssTotal, 3), an.dfTotal, '-', '-', '-'],
          ],
        });
        allHtmlSections.push(anHtml);
      }

      // 4.15 Tabulasi Silang & Chi-Square (Categorical)
      if (results.crosstab && results.chiSquare) {
        const ct = results.crosstab;
        const cs = results.chiSquare;
        const crosstabRows: (string | number)[][] = [];
        ct.rowCategories.forEach((rowCat, rIdx) => {
          const counts = ct.colCategories.map((_, cIdx) => ct.matrix[rIdx][cIdx]);
          crosstabRows.push([rowCat, 'Count', ...counts, ct.rowTotals[rIdx]]);
          const expecteds = ct.colCategories.map((_, cIdx) => formatNumber(ct.expectedMatrix[rIdx][cIdx], 1));
          crosstabRows.push(['', 'Expected Count', ...expecteds, formatNumber(ct.rowTotals[rIdx], 1)]);
          const rowPercents = ct.colCategories.map((_, cIdx) => `${formatNumber(ct.rowPercentages[rIdx][cIdx], 1)}%`);
          crosstabRows.push(['', `% within ${ct.rowVar}`, ...rowPercents, '100,0%']);
        });

        allHtmlSections.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.15a',
          title: `Hasil Tabulasi Silang ${ct.rowVar} dan ${ct.colVar}`,
          note: `Total N = ${ct.totalN} responden.`,
          columns: [
            { header: ct.rowVar, align: 'left' },
            { header: 'Keterangan', align: 'left' },
            ...ct.colCategories.map((c) => ({ header: c, align: 'right' as const })),
            { header: 'Total', align: 'right' },
          ],
          rows: crosstabRows,
        }));

        const csRows: (string | number)[][] = [
          ['Pearson Chi-Square', formatNumber(cs.pearsonChiSquare, 3), cs.df, formatNumber(cs.pearsonSig, 4), cs.pearsonSig < 0.05 ? 'Signifikan' : 'Tidak'],
        ];
        if (cs.continuityCorrection !== undefined) {
          csRows.push(['Continuity Correction (Yates)', formatNumber(cs.continuityCorrection, 3), 1, formatNumber(cs.continuityCorrectionSig || 0, 4), (cs.continuityCorrectionSig || 0) < 0.05 ? 'Signifikan' : 'Tidak']);
        }
        if (cs.fisherExact !== undefined) {
          csRows.push(["Fisher's Exact Test", '-', '-', formatNumber(cs.fisherExact, 4), cs.fisherExact < 0.05 ? 'Signifikan' : 'Tidak']);
        }
        allHtmlSections.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.15b',
          title: "Hasil Uji Chi-Square & Fisher's Exact Test",
          note: cs.cochranFootnote,
          columns: [
            { header: 'Uji Statistik', align: 'left' },
            { header: 'Nilai Hitung', align: 'right' },
            { header: 'df', align: 'right' },
            { header: 'Sig. (2-sided)', align: 'right' },
            { header: 'Keputusan', align: 'center' },
          ],
          rows: csRows,
        }));

        if (results.riskEstimate) {
          const re = results.riskEstimate;
          allHtmlSections.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.15c',
            title: `Estimasi Risiko Epidemiologi (${re.exposureVar})`,
            columns: [
              { header: 'Ukuran Asosiasi', align: 'left' },
              { header: 'Estimasi Nilai', align: 'right' },
              { header: '95% CI Lower', align: 'right' },
              { header: '95% CI Upper', align: 'right' },
              { header: 'Interpretasi Risiko', align: 'center' },
            ],
            rows: [
              [`Odds Ratio (OR) untuk ${re.exposureVar}`, formatNumber(re.oddsRatio, 3), formatNumber(re.ciLower, 3), formatNumber(re.ciUpper, 3), re.ciLower > 1.0 ? 'Faktor Risiko Signifikan' : (re.ciUpper < 1.0 ? 'Faktor Protektif Signifikan' : 'Bukan Risiko')],
              ['Relative Risk (RR) Kohort 1', formatNumber(re.forCohortRisk1, 3), formatNumber(re.forCohortRisk1CiLower, 3), formatNumber(re.forCohortRisk1CiUpper, 3), 'Kelompok Kasus'],
              ['Relative Risk (RR) Kohort 2', formatNumber(re.forCohortRisk2, 3), formatNumber(re.forCohortRisk2CiLower, 3), formatNumber(re.forCohortRisk2CiUpper, 3), 'Kelompok Kontrol'],
            ],
          }));
        }
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
        const parts: string[] = [];
        if (results.demographics && results.demographics.length > 0) {
          const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
          results.demographics.forEach((demo, dIdx) => {
            const letter = results.demographics!.length > 1 ? letters[dIdx] || `${dIdx + 1}` : '';
            parts.push(buildWordTableHtml({
              tableNumber: `Tabel 4.1${letter}`,
              title: `Distribusi Frekuensi Karakteristik Responden Berdasarkan ${demo.variable.replace(/_/g, ' ')}`,
              note: `Total responden N = ${results.respondentCount}.`,
              columns: demographicCategoryCols.map((c) => ({ header: c.header, align: c.align })),
              rows: demo.categories.map((c) => [
                c.category,
                formatNumber(c.frequency),
                `${formatNumber(c.percentage, 1)}%`,
                `${formatNumber(c.cumulativePercentage, 1)}%`,
              ]),
            }));
          });
        }
        if (results.descriptive && results.descriptive.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.2',
            title: 'Hasil Analisis Statistik Deskriptif Variabel Penelitian & TCR',
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
              r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-',
              r.tcrCategory || '-',
            ]),
          }));
        }
        if (results.itemDescriptive && results.itemDescriptive.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.3',
            title: 'Distribusi Frekuensi Jawaban Responden per Butir Kuesioner',
            note: '* STS (1), TS (2), N (3), S (4), SS (5).',
            columns: likertItemCols.map((c) => ({ header: c.header, align: c.align })),
            rows: results.itemDescriptive.map((r) => [
              r.variable,
              formatNumber(r.freq1 ?? 0),
              formatNumber(r.freq2 ?? 0),
              formatNumber(r.freq3 ?? 0),
              formatNumber(r.freq4 ?? 0),
              formatNumber(r.freq5 ?? 0),
              formatNumber(r.n),
              formatNumber(r.mean, 2),
              r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-',
              r.tcrCategory || '-',
            ]),
          }));
        }
        tableHtml = parts.join('<br/><br/>');
      } else if (activeTab === 'validity') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.4',
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
          tableNumber: 'Tabel 4.5',
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
      } else if (activeTab === 'assumptions') {
        const parts: string[] = [];
        if (results.normality && results.normality.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.6',
            title: 'Hasil Uji Normalitas Residual Regresi (Kolmogorov-Smirnov & Shapiro-Wilk)',
            columns: normalityCols.map((c) => ({ header: c.header, align: c.align })),
            rows: results.normality.map((r) => [
              r.test,
              formatNumber(r.statistic, 3),
              formatNumber(r.pValue, 3),
              '0,050',
              r.normal ? 'Normal' : 'Tidak Normal',
            ]),
          }));
        }
        if (results.multicollinearity && results.multicollinearity.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.7',
            title: 'Hasil Uji Multikolinearitas (Tolerance & VIF)',
            columns: multicollinearityCols.map((c) => ({ header: c.header, align: c.align })),
            rows: results.multicollinearity.map((r) => [
              r.variable,
              formatNumber(r.tolerance, 3),
              formatNumber(r.vif, 3),
              '< 10,00',
              !r.problematic ? 'Bebas' : 'Bermasalah',
            ]),
          }));
        }
        if (results.heteroscedasticity && results.heteroscedasticity.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.8',
            title: 'Hasil Uji Heteroskedastisitas (Metode Glejser)',
            columns: heteroscedasticityCols.map((c) => ({ header: c.header, align: c.align })),
            rows: results.heteroscedasticity.map((r) => [
              r.variable,
              r.test,
              formatNumber(r.tHitung, 3),
              formatNumber(r.pValue, 3),
              !r.significant ? 'Bebas Gejala' : 'Terjadi Gejala',
            ]),
          }));
        }
        if (results.durbinWatson) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.9',
            title: 'Hasil Uji Autokorelasi Durbin-Watson',
            columns: durbinWatsonCols.map((c) => ({ header: c.header, align: c.align })),
            rows: [[
              formatNumber(results.durbinWatson.dwStatistic, 4),
              formatNumber(results.durbinWatson.dL, 4),
              formatNumber(results.durbinWatson.dU, 4),
              formatNumber(4 - results.durbinWatson.dU, 4),
              results.durbinWatson.conclusion,
            ]],
          }));
        }
        tableHtml = parts.join('<br/><br/>');
      } else if (activeTab === 'regression') {
        const parts: string[] = [];
        parts.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.10a',
          title: 'Hasil Analisis Regresi Linier Berganda dan Uji t Parsial',
          note: `Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - (results.regression?.length || 3)}.`,
          columns: regressionCols.map((c) => ({ header: c.header, align: c.align })),
          rows: (results.regression || []).map((r) => [
            r.variable,
            formatNumber(r.coefficient, 3),
            formatNumber(r.stdError, 3),
            r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
            formatNumber(r.tHitung, 3),
            r.tTabel !== undefined ? formatNumber(r.tTabel, 3) : '-',
            formatNumber(r.pValue, 3),
            r.significant ? 'Signifikan' : 'Tidak Signifikan',
          ]),
        }));

        if (results.determination) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.10b',
            title: 'Hasil Analisis Koefisien Determinasi (Model Summary)',
            columns: determinationCols.map((c) => ({ header: c.header, align: c.align })),
            rows: [[
              '1',
              formatNumber(results.determination.rSquare, 3),
              formatNumber(results.determination.adjustedRSquare, 3),
              formatNumber(results.determination.stdError, 3),
            ]],
          }));
        }

        if (results.fTest) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.10c',
            title: 'Hasil Uji Signifikansi Simultan (Uji F / ANOVA Model)',
            columns: fTestCols.map((c) => ({ header: c.header, align: c.align })),
            rows: [[
              'Regresi Simultan',
              formatNumber(results.fTest.fHitung, 3),
              formatNumber(results.fTest.fTabel, 3),
              formatNumber(results.fTest.pValue, 3),
              results.fTest.significant ? 'Signifikan Simultan' : 'Tidak Signifikan',
            ]],
          }));
        }

        const predictors = (results.regression || []).filter((r) => !r.variable.toLowerCase().includes('konstanta') && r.sePercent !== undefined);
        if (predictors.length > 0) {
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.10d',
            title: 'Sumbangan Efektif (SE %) dan Sumbangan Relatif (SR %)',
            columns: seSrCols.map((c) => ({ header: c.header, align: c.align })),
            rows: predictors.map((r) => [
              r.variable,
              r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-',
              r.sePercent !== undefined ? `${formatNumber(r.sePercent, 2)}%` : '-',
              r.srPercent !== undefined ? `${formatNumber(r.srPercent, 2)}%` : '-',
            ]),
          }));
        }

        parts.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.11',
          title: 'Ringkasan Keputusan Pengujian Hipotesis Penelitian',
          columns: hypothesisCols.map((c) => ({ header: c.header, align: c.align })),
          rows: hypothesisRows.map((h) => [
            h.hypothesis,
            h.statement,
            h.coefficient,
            h.testValue,
            h.pValue,
            h.decision,
          ]),
        }));

        tableHtml = parts.join('<br/><br/>');
      } else if (activeTab === 'correlation') {
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.12',
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
      } else if (activeTab === 'independent-ttest' && results.independentTTest) {
        const it = results.independentTTest;
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.13',
          title: 'Hasil Uji Beda Dua Kelompok Bebas (Independent Samples t-Test)',
          columns: independentTTestCols.map((c) => ({ header: c.header, align: c.align })),
          rows: it.rows.map((row, idx) => [
            row.assumption,
            idx === 0 ? formatNumber(it.levene.fStatistic, 3) : '-',
            idx === 0 ? formatNumber(it.levene.pValue, 4) : '-',
            formatNumber(row.tHitung, 3),
            formatNumber(row.df, 1),
            formatNumber(row.pValue, 4),
            formatNumber(row.meanDiff, 3),
          ]),
        });
      } else if (activeTab === 'oneway-anova' && results.oneWayAnova) {
        const an = results.oneWayAnova;
        tableHtml = buildWordTableHtml({
          tableNumber: 'Tabel 4.14',
          title: 'Hasil Analisis Varians Satu Jalur (One-Way ANOVA)',
          columns: oneWayAnovaCols.map((c) => ({ header: c.header, align: c.align })),
          rows: [
            ['Between Groups', formatNumber(an.ssBetween, 3), an.dfBetween, formatNumber(an.msBetween, 3), formatNumber(an.fHitung, 3), formatNumber(an.pValue, 4)],
            ['Within Groups', formatNumber(an.ssWithin, 3), an.dfWithin, formatNumber(an.msWithin, 3), '-', '-'],
            ['Total', formatNumber(an.ssTotal, 3), an.dfTotal, '-', '-', '-'],
          ],
        });
      } else if (activeTab === 'crosstab' && results.crosstab && results.chiSquare) {
        const ct = results.crosstab;
        const cs = results.chiSquare;
        const parts: string[] = [];

        const crosstabRows: (string | number)[][] = [];
        ct.rowCategories.forEach((rowCat, rIdx) => {
          const counts = ct.colCategories.map((_, cIdx) => ct.matrix[rIdx][cIdx]);
          crosstabRows.push([rowCat, 'Count', ...counts, ct.rowTotals[rIdx]]);
          const expecteds = ct.colCategories.map((_, cIdx) => formatNumber(ct.expectedMatrix[rIdx][cIdx], 1));
          crosstabRows.push(['', 'Expected Count', ...expecteds, formatNumber(ct.rowTotals[rIdx], 1)]);
          const rowPercents = ct.colCategories.map((_, cIdx) => `${formatNumber(ct.rowPercentages[rIdx][cIdx], 1)}%`);
          crosstabRows.push(['', `% within ${ct.rowVar}`, ...rowPercents, '100,0%']);
        });

        parts.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.15a',
          title: `Hasil Tabulasi Silang ${ct.rowVar} dan ${ct.colVar}`,
          note: `Total N = ${ct.totalN} responden.`,
          columns: [
            { header: ct.rowVar, align: 'left' },
            { header: 'Keterangan', align: 'left' },
            ...ct.colCategories.map((c) => ({ header: c, align: 'right' as const })),
            { header: 'Total', align: 'right' },
          ],
          rows: crosstabRows,
        }));

        const csRows: (string | number)[][] = [
          ['Pearson Chi-Square', formatNumber(cs.pearsonChiSquare, 3), cs.df, formatNumber(cs.pearsonSig, 4), cs.pearsonSig < 0.05 ? 'Signifikan' : 'Tidak'],
        ];
        if (cs.continuityCorrection !== undefined) {
          csRows.push(['Continuity Correction (Yates)', formatNumber(cs.continuityCorrection, 3), 1, formatNumber(cs.continuityCorrectionSig || 0, 4), (cs.continuityCorrectionSig || 0) < 0.05 ? 'Signifikan' : 'Tidak']);
        }
        if (cs.fisherExact !== undefined) {
          csRows.push(["Fisher's Exact Test", '-', '-', formatNumber(cs.fisherExact, 4), cs.fisherExact < 0.05 ? 'Signifikan' : 'Tidak']);
        }

        parts.push(buildWordTableHtml({
          tableNumber: 'Tabel 4.15b',
          title: "Hasil Uji Chi-Square & Fisher's Exact Test",
          note: cs.cochranFootnote,
          columns: [
            { header: 'Uji Statistik', align: 'left' },
            { header: 'Nilai Hitung', align: 'right' },
            { header: 'df', align: 'right' },
            { header: 'Sig. (2-sided)', align: 'right' },
            { header: 'Keputusan', align: 'center' },
          ],
          rows: csRows,
        }));

        if (results.riskEstimate) {
          const re = results.riskEstimate;
          parts.push(buildWordTableHtml({
            tableNumber: 'Tabel 4.15c',
            title: `Estimasi Risiko Epidemiologi (${re.exposureVar})`,
            columns: [
              { header: 'Ukuran Asosiasi', align: 'left' },
              { header: 'Estimasi Nilai', align: 'right' },
              { header: '95% CI Lower', align: 'right' },
              { header: '95% CI Upper', align: 'right' },
              { header: 'Interpretasi Risiko', align: 'center' },
            ],
            rows: [
              [`Odds Ratio (OR) untuk ${re.exposureVar}`, formatNumber(re.oddsRatio, 3), formatNumber(re.ciLower, 3), formatNumber(re.ciUpper, 3), re.ciLower > 1.0 ? 'Faktor Risiko Signifikan' : (re.ciUpper < 1.0 ? 'Faktor Protektif Signifikan' : 'Bukan Risiko')],
              ['Relative Risk (RR) Kohort 1', formatNumber(re.forCohortRisk1, 3), formatNumber(re.forCohortRisk1CiLower, 3), formatNumber(re.forCohortRisk1CiUpper, 3), 'Kelompok Kasus'],
            ],
          }));
        }

        tableHtml = parts.join('<br/><br/>');
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
    {
      key: 'tcr',
      header: 'TCR (%)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'}
        </span>
      ),
      getValue: (r) => (r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'),
    },
    {
      key: 'tcrCategory',
      header: 'Kategori TCR',
      align: 'center',
      render: (r) =>
        r.tcrCategory ? (
          <Badge
            variant="outline"
            className="text-[12px] font-medium bg-muted/40 border-primary/30 text-foreground"
          >
            {r.tcrCategory}
          </Badge>
        ) : (
          <span>-</span>
        ),
      getValue: (r) => r.tcrCategory || '-',
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
    {
      key: 'tcr',
      header: 'TCR (%)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'}
        </span>
      ),
      getValue: (r) => (r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'),
    },
    {
      key: 'tcrCategory',
      header: 'Kategori TCR',
      align: 'center',
      render: (r) =>
        r.tcrCategory ? (
          <Badge
            variant="outline"
            className="text-[12px] font-medium bg-muted/40 border-primary/30 text-foreground"
          >
            {r.tcrCategory}
          </Badge>
        ) : (
          <span>-</span>
        ),
      getValue: (r) => r.tcrCategory || '-',
    },
  ];

  // 1b-2. Distribusi Frekuensi Jawaban per Butir (Skala Likert 1-5)
  const likertItemCols: ColumnDef<DescriptiveResult>[] = [
    {
      key: 'variable',
      header: 'Butir Indikator',
      className: 'font-mono font-semibold',
      render: (r) => <span className="text-foreground">{r.variable}</span>,
      getValue: (r) => r.variable,
    },
    {
      key: 'freq1',
      header: 'STS (1)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{formatNumber(r.freq1 ?? 0)}</span>,
      getValue: (r) => formatNumber(r.freq1 ?? 0),
    },
    {
      key: 'freq2',
      header: 'TS (2)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{formatNumber(r.freq2 ?? 0)}</span>,
      getValue: (r) => formatNumber(r.freq2 ?? 0),
    },
    {
      key: 'freq3',
      header: 'N (3)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{formatNumber(r.freq3 ?? 0)}</span>,
      getValue: (r) => formatNumber(r.freq3 ?? 0),
    },
    {
      key: 'freq4',
      header: 'S (4)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{formatNumber(r.freq4 ?? 0)}</span>,
      getValue: (r) => formatNumber(r.freq4 ?? 0),
    },
    {
      key: 'freq5',
      header: 'SS (5)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{formatNumber(r.freq5 ?? 0)}</span>,
      getValue: (r) => formatNumber(r.freq5 ?? 0),
    },
    {
      key: 'n',
      header: 'Total N',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono font-bold">{formatNumber(r.n)}</span>,
      getValue: (r) => formatNumber(r.n),
    },
    {
      key: 'mean',
      header: 'Rata-rata',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums font-mono font-bold text-foreground">
          {formatNumber(r.mean, 2)}
        </span>
      ),
      getValue: (r) => formatNumber(r.mean, 2),
    },
    {
      key: 'tcr',
      header: 'TCR (%)',
      align: 'right',
      render: (r) => (
        <span className="tabular-nums font-mono font-semibold text-foreground">
          {r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'}
        </span>
      ),
      getValue: (r) => (r.tcr !== undefined ? `${formatNumber(r.tcr, 1)}%` : '-'),
    },
    {
      key: 'tcrCategory',
      header: 'Kategori',
      align: 'center',
      render: (r) => (
        <Badge
          variant={r.tcrCategory === 'Sangat Baik' || r.tcrCategory === 'Baik' ? 'pine' : 'secondary'}
          className="text-[11px]"
        >
          {r.tcrCategory || '-'}
        </Badge>
      ),
      getValue: (r) => r.tcrCategory || '-',
    },
  ];

  // 1c. Profil Demografi Responden
  const demographicCategoryCols: ColumnDef<DemographicCategory>[] = [
    {
      key: 'category',
      header: 'Kategori / Kelompok',
      render: (r) => <span className="font-semibold text-foreground">{r.category}</span>,
    },
    {
      key: 'frequency',
      header: 'Frekuensi (n)',
      align: 'right',
      getValue: (r) => formatNumber(r.frequency),
    },
    {
      key: 'percentage',
      header: 'Persentase (%)',
      align: 'right',
      getValue: (r) => `${formatNumber(r.percentage, 1)}%`,
    },
    {
      key: 'cumulativePercentage',
      header: 'Kumulatif (%)',
      align: 'right',
      getValue: (r) => `${formatNumber(r.cumulativePercentage, 1)}%`,
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

  // 4d. Autokorelasi Durbin-Watson
  const durbinWatsonCols: ColumnDef<DurbinWatsonResult>[] = [
    {
      key: 'dwStatistic',
      header: 'Statistik Durbin-Watson (d)',
      align: 'right',
      getValue: (r) => formatNumber(r.dwStatistic, 4),
    },
    {
      key: 'dL',
      header: 'Batas Bawah (dL)',
      align: 'right',
      getValue: (r) => formatNumber(r.dL, 4),
    },
    {
      key: 'dU',
      header: 'Batas Atas (dU)',
      align: 'right',
      getValue: (r) => formatNumber(r.dU, 4),
    },
    {
      key: 'fourMinusDU',
      header: '4 - dU',
      align: 'right',
      getValue: (r) => formatNumber(4 - r.dU, 4),
    },
    {
      key: 'conclusion',
      header: 'Kesimpulan Uji',
      align: 'center',
      render: (r) => (
        <Badge variant={r.status === 'bebas' ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {r.conclusion}
        </Badge>
      ),
      getValue: (r) => r.conclusion,
    },
  ];

  // 4e. Linearitas (Deviation from Linearity)
  const linearityCols: ColumnDef<LinearityResult>[] = [
    {
      key: 'relation',
      header: 'Hubungan Variabel',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.independentVar} → {r.dependentVar}
        </span>
      ),
    },
    {
      key: 'fDeviation',
      header: 'F Deviation from Linearity',
      align: 'right',
      getValue: (r) => formatNumber(r.fDeviation, 3),
    },
    {
      key: 'sigDeviation',
      header: 'Sig. Deviation (p-value)',
      align: 'right',
      getValue: (r) => formatNumber(r.sigDeviation, 3),
    },
    {
      key: 'fLinearity',
      header: 'F Linearity',
      align: 'right',
      getValue: (r) => formatNumber(r.fLinearity, 3),
    },
    {
      key: 'sigLinearity',
      header: 'Sig. Linearity',
      align: 'right',
      getValue: (r) => formatNumber(r.sigLinearity, 3),
    },
    {
      key: 'isLinear',
      header: 'Status Hubungan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.isLinear ? 'pine' : 'destructive'} className="text-[13px] min-h-[24px]">
          {r.isLinear ? 'Linier Signifikan' : 'Tidak Linier'}
        </Badge>
      ),
      getValue: (r) => (r.isLinear ? 'Linier' : 'Tidak Linier'),
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
      header: 'Unstandardized B',
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
      key: 'standardizedBeta',
      header: 'Beta (β)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-'}
        </span>
      ),
      getValue: (r) => (r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-'),
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'tTabel',
      header: 't Tabel (α/2)',
      align: 'right',
      getValue: (r) => (r.tTabel !== undefined ? formatNumber(r.tTabel, 3) : '-'),
    },
    {
      key: 'pValue',
      header: 'Sig. (p-value)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'significant',
      header: 'Signifikansi',
      align: 'center',
      render: (r) => {
        const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
        if (isConst) {
          return <span className="text-muted-foreground font-mono">-</span>;
        }
        return (
          <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
            {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
          </Badge>
        );
      },
      getValue: (r) => {
        const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
        return isConst ? '-' : (r.significant ? 'Signifikan' : 'Tidak');
      },
    },
  ];

  // 5b. Sumbangan Efektif (SE) & Sumbangan Relatif (SR)
  const seSrCols: ColumnDef<RegressionResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Bebas (X)',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
    },
    {
      key: 'standardizedBeta',
      header: 'Standardized Beta (β)',
      align: 'right',
      getValue: (r) => (r.standardizedBeta !== undefined ? formatNumber(r.standardizedBeta, 3) : '-'),
    },
    {
      key: 'sePercent',
      header: 'Sumbangan Efektif (SE %)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.sePercent !== undefined ? `${formatNumber(r.sePercent, 2)}%` : '-'}
        </span>
      ),
      getValue: (r) => (r.sePercent !== undefined ? `${formatNumber(r.sePercent, 2)}%` : '-'),
    },
    {
      key: 'srPercent',
      header: 'Sumbangan Relatif (SR %)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-primary">
          {r.srPercent !== undefined ? `${formatNumber(r.srPercent, 2)}%` : '-'}
        </span>
      ),
      getValue: (r) => (r.srPercent !== undefined ? `${formatNumber(r.srPercent, 2)}%` : '-'),
    },
  ];

  // 5c. Uji F Simultan
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

  // 5d. Keputusan Hipotesis Penelitian (Tabel 4.11)
  const hypothesisCols: ColumnDef<HypothesisDecisionRow>[] = [
    {
      key: 'hypothesis',
      header: 'Hipotesis',
      render: (r) => <span className="font-bold text-foreground font-mono">{r.hypothesis}</span>,
      getValue: (r) => r.hypothesis,
    },
    {
      key: 'statement',
      header: 'Pernyataan Hubungan / Jalur',
      render: (r) => <span className="text-foreground font-medium">{r.statement}</span>,
      getValue: (r) => r.statement,
    },
    {
      key: 'coefficient',
      header: 'Koefisien (B / R²)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono">{r.coefficient}</span>,
      getValue: (r) => r.coefficient,
    },
    {
      key: 'testValue',
      header: 'Nilai Uji (t / F)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono font-semibold">{r.testValue}</span>,
      getValue: (r) => r.testValue,
    },
    {
      key: 'pValue',
      header: 'Sig. (p-value)',
      align: 'right',
      render: (r) => <span className="tabular-nums font-mono font-semibold">{r.pValue}</span>,
      getValue: (r) => r.pValue,
    },
    {
      key: 'decision',
      header: 'Keputusan Hipotesis',
      align: 'center',
      render: (r) => (
        <Badge variant={r.isAccepted ? 'pine' : 'secondary'} className="text-xs font-semibold">
          {r.decision}
        </Badge>
      ),
      getValue: (r) => r.decision,
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

  // 7. Paired Sample t-Test
  const pairedTTestCols: ColumnDef<PairedTTestResult>[] = [
    {
      key: 'pairName',
      header: 'Pasangan Pengujian',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.preVar} &rarr; {r.postVar}
        </span>
      ),
      getValue: (r) => `${r.preVar} - ${r.postVar}`,
    },
    {
      key: 'meanPre',
      header: 'Mean Pre',
      align: 'right',
      getValue: (r) => formatNumber(r.meanPre, 3),
    },
    {
      key: 'meanPost',
      header: 'Mean Post',
      align: 'right',
      getValue: (r) => formatNumber(r.meanPost, 3),
    },
    {
      key: 'meanDiff',
      header: 'Selisih (Mean Diff)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-primary">
          {formatNumber(r.meanDiff, 3)}
        </span>
      ),
      getValue: (r) => formatNumber(r.meanDiff, 3),
    },
    {
      key: 'stdErrorDiff',
      header: 'Std. Error',
      align: 'right',
      getValue: (r) => formatNumber(r.stdErrorDiff, 3),
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.tHitung, 3)}</span>,
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'tTabel',
      header: `t Tabel (df=${results?.pairedTTest?.df || 0})`,
      align: 'right',
      getValue: (r) => formatNumber(r.tTabel, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (2-tailed)',
      align: 'right',
      getValue: (r) => formatNumber(r.pValue, 4),
    },
    {
      key: 'significant',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[12px]">
          {r.significant ? 'Signifikan Meningkat' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 8. N-Gain Score Summary
  const nGainCols: ColumnDef<NGainSummary>[] = [
    {
      key: 'metric',
      header: 'Metrik Evaluasi',
      render: () => <span className="font-semibold">N-Gain Score Ternormalisasi</span>,
      getValue: () => 'N-Gain Score',
    },
    {
      key: 'meanScorePre',
      header: 'Mean Skor Pre',
      align: 'right',
      getValue: (r) => formatNumber(r.meanScorePre, 2),
    },
    {
      key: 'meanScorePost',
      header: 'Mean Skor Post',
      align: 'right',
      getValue: (r) => formatNumber(r.meanScorePost, 2),
    },
    {
      key: 'meanNGainScore',
      header: 'Rata-rata N-Gain (g)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-primary">{formatNumber(r.meanNGainScore, 3)}</span>
      ),
      getValue: (r) => formatNumber(r.meanNGainScore, 3),
    },
    {
      key: 'meanNGainPercent',
      header: 'N-Gain Persen (%)',
      align: 'right',
      render: (r) => (
        <span className="font-semibold text-primary">{formatNumber(r.meanNGainPercent, 1)}%</span>
      ),
      getValue: (r) => `${formatNumber(r.meanNGainPercent, 1)}%`,
    },
    {
      key: 'hakeCategory',
      header: 'Kategori Hake (1998)',
      align: 'center',
      render: (r) => (
        <Badge
          variant={
            r.hakeCategory === 'Tinggi'
              ? 'pine'
              : r.hakeCategory === 'Sedang'
              ? 'amber'
              : 'secondary'
          }
          className="text-[12px]"
        >
          {r.hakeCategory}
        </Badge>
      ),
      getValue: (r) => r.hakeCategory,
    },
    {
      key: 'meltzerCategory',
      header: 'Efektivitas Meltzer (2002)',
      align: 'center',
      render: (r) => (
        <Badge
          variant={
            r.meltzerCategory === 'Efektif'
              ? 'pine'
              : r.meltzerCategory === 'Cukup Efektif'
              ? 'brand'
              : 'amber'
          }
          className="text-[12px]"
        >
          {r.meltzerCategory}
        </Badge>
      ),
      getValue: (r) => r.meltzerCategory,
    },
  ];

  // 9. Independent Sample t-Test
  const independentTTestCols: ColumnDef<{
    assumption: string;
    fLevene: number | string;
    sigLevene: number | string;
    tHitung: number;
    df: number;
    pValue: number;
    meanDiff: number;
    stdErrorDiff: number;
    ciLower: number;
    ciUpper: number;
    isRecommended: boolean;
  }>[] = [
    {
      key: 'assumption',
      header: 'Asumsi Varians',
      render: (r) => (
        <div className="flex items-center gap-1.5 font-medium">
          <span>{r.assumption}</span>
          {r.isRecommended && (
            <Badge variant="amber" className="text-[10px] px-1.5 py-0">
              ★ Rekomendasi
            </Badge>
          )}
        </div>
      ),
      getValue: (r) => r.assumption,
    },
    {
      key: 'fLevene',
      header: 'Levene F',
      align: 'right',
      getValue: (r) => (typeof r.fLevene === 'number' ? formatNumber(r.fLevene, 3) : r.fLevene),
    },
    {
      key: 'sigLevene',
      header: 'Levene Sig.',
      align: 'right',
      getValue: (r) => (typeof r.sigLevene === 'number' ? formatNumber(r.sigLevene, 3) : r.sigLevene),
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.tHitung, 3)}</span>,
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'df',
      header: 'df',
      align: 'right',
      getValue: (r) => formatNumber(r.df, 1),
    },
    {
      key: 'pValue',
      header: 'Sig. (2-tailed)',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.pValue, 4)}</span>,
      getValue: (r) => formatNumber(r.pValue, 4),
    },
    {
      key: 'meanDiff',
      header: 'Mean Diff',
      align: 'right',
      getValue: (r) => formatNumber(r.meanDiff, 3),
    },
    {
      key: 'stdErrorDiff',
      header: 'Std. Error',
      align: 'right',
      getValue: (r) => formatNumber(r.stdErrorDiff, 3),
    },
  ];

  // 10. One-Way ANOVA
  const oneWayAnovaCols: ColumnDef<{
    source: string;
    ss: number;
    df: number;
    ms: number;
    f: number | string;
    sig: number | string;
  }>[] = [
    {
      key: 'source',
      header: 'Sumber Variasi',
      render: (r) => <span className="font-semibold">{r.source}</span>,
      getValue: (r) => r.source,
    },
    {
      key: 'ss',
      header: 'Sum of Squares',
      align: 'right',
      getValue: (r) => formatNumber(r.ss, 3),
    },
    {
      key: 'df',
      header: 'df',
      align: 'right',
      getValue: (r) => String(r.df),
    },
    {
      key: 'ms',
      header: 'Mean Square',
      align: 'right',
      getValue: (r) => (r.ms > 0 ? formatNumber(r.ms, 3) : '-'),
    },
    {
      key: 'f',
      header: 'F Hitung',
      align: 'right',
      render: (r) => <span className="font-semibold">{typeof r.f === 'number' ? formatNumber(r.f, 3) : r.f}</span>,
      getValue: (r) => (typeof r.f === 'number' ? formatNumber(r.f, 3) : r.f),
    },
    {
      key: 'sig',
      header: 'Sig.',
      align: 'right',
      render: (r) => <span className="font-semibold">{typeof r.sig === 'number' ? formatNumber(r.sig, 4) : r.sig}</span>,
      getValue: (r) => (typeof r.sig === 'number' ? formatNumber(r.sig, 4) : r.sig),
    },
  ];

  // 11. Non-Parametric Tests
  const nonParametricCols: ColumnDef<NonParametricResult>[] = [
    {
      key: 'testName',
      header: 'Uji Non-Parametrik',
      render: (r) => <span className="font-semibold">{r.testName}</span>,
      getValue: (r) => r.testName,
    },
    {
      key: 'dependentVar',
      header: 'Variabel',
      getValue: (r) => r.dependentVar,
    },
    {
      key: 'groupVar',
      header: 'Kelompok / Pasangan',
      getValue: (r) => r.groupVar || 'Sampel Berpasangan',
    },
    {
      key: 'statistic',
      header: 'Nilai Statistik Uji',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.statistic, 3)}</span>,
      getValue: (r) => formatNumber(r.statistic, 3),
    },
    {
      key: 'zValue',
      header: 'Z Hitung (Asymptotic)',
      align: 'right',
      getValue: (r) => (r.zValue !== undefined ? formatNumber(r.zValue, 3) : '-'),
    },
    {
      key: 'pValue',
      header: 'Asymp. Sig. (2-tailed)',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.pValue, 4)}</span>,
      getValue: (r) => formatNumber(r.pValue, 4),
    },
    {
      key: 'significant',
      header: 'Kesimpulan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[12px]">
          {r.significant ? 'Berbeda Signifikan' : 'Tidak Berbeda Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 12. Spearman Rank Heteroscedasticity Alternative
  const spearmanHeteroCols: ColumnDef<HeteroscedasticityResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Bebas',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
      getValue: (r) => r.variable,
    },
    {
      key: 'test',
      header: 'Metode Uji',
      getValue: (r) => r.test,
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (2-tailed)',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.pValue, 3)}</span>,
      getValue: (r) => formatNumber(r.pValue, 3),
    },
    {
      key: 'significant',
      header: 'Kesimpulan Homoskedastisitas',
      align: 'center',
      render: (r) => (
        <Badge variant={!r.significant ? 'pine' : 'destructive'} className="text-[12px]">
          {!r.significant ? 'Bebas Heteroskedastisitas (Sig. > 0,05)' : 'Terindikasi Heteroskedastisitas'}
        </Badge>
      ),
      getValue: (r) => (!r.significant ? 'Bebas' : 'Terindikasi'),
    },
  ];

  // 12b. Park Test Heteroscedasticity Alternative
  const parkHeteroCols: ColumnDef<HeteroscedasticityResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Bebas',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
      getValue: (r) => r.variable,
    },
    {
      key: 'test',
      header: 'Metode Uji',
      getValue: (r) => r.test,
    },
    {
      key: 'beta',
      header: 'Koefisien (β)',
      align: 'right',
      render: (r) => (
        <span className="font-mono tabular-nums">
          {r.beta !== undefined ? formatNumber(r.beta, 4) : '-'}
        </span>
      ),
      getValue: (r) => (r.beta !== undefined ? formatNumber(r.beta, 4) : '-'),
    },
    {
      key: 'tHitung',
      header: 't Hitung',
      align: 'right',
      render: (r) => <span className="font-mono tabular-nums">{formatNumber(r.tHitung, 3)}</span>,
      getValue: (r) => formatNumber(r.tHitung, 3),
    },
    {
      key: 'pValue',
      header: 'Sig. (2-tailed)',
      align: 'right',
      render: (r) => (
        <span className={cn('font-semibold font-mono tabular-nums', r.significant ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
          {formatNumber(r.pValue, 4)}
        </span>
      ),
      getValue: (r) => formatNumber(r.pValue, 4),
    },
    {
      key: 'significant',
      header: 'Kesimpulan Homoskedastisitas',
      align: 'center',
      render: (r) => (
        <Badge variant={!r.significant ? 'pine' : 'destructive'} className="text-[12px]">
          {!r.significant ? 'Bebas Heteroskedastisitas (Sig. > 0,05)' : 'Terindikasi Heteroskedastisitas'}
        </Badge>
      ),
      getValue: (r) => (!r.significant ? 'Bebas' : 'Terindikasi'),
    },
  ];

  // 13. Chi-Square Tests
  const chiSquareTableCols: ColumnDef<{
    test: string;
    value: number | string;
    df: number | string;
    sig: number;
    exactSig?: number;
    isRecommended?: boolean;
    significant: boolean;
  }>[] = [
    {
      key: 'test',
      header: 'Uji Statistik Asosiasi',
      render: (r) => (
        <div className="flex items-center gap-1.5 font-medium">
          <span>{r.test}</span>
          {r.isRecommended && (
            <Badge variant="amber" className="text-[10px] px-1.5 py-0">
              ★ Rekomendasi Kaidah Cochran
            </Badge>
          )}
        </div>
      ),
      getValue: (r) => r.test,
    },
    {
      key: 'value',
      header: 'Nilai Hitung (χ²)',
      align: 'right',
      render: (r) => <span className="font-semibold">{typeof r.value === 'number' ? formatNumber(r.value, 3) : r.value}</span>,
      getValue: (r) => (typeof r.value === 'number' ? formatNumber(r.value, 3) : r.value),
    },
    {
      key: 'df',
      header: 'df',
      align: 'right',
      getValue: (r) => String(r.df),
    },
    {
      key: 'sig',
      header: 'Asymp. Sig. (2-sided)',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.sig, 4)}</span>,
      getValue: (r) => formatNumber(r.sig, 4),
    },
    {
      key: 'exactSig',
      header: 'Exact Sig. (2-sided)',
      align: 'right',
      getValue: (r) => (r.exactSig !== undefined ? formatNumber(r.exactSig, 4) : '-'),
    },
    {
      key: 'significant',
      header: 'Kesimpulan (α=0,05)',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[12px]">
          {r.significant ? 'Berhubungan Signifikan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak Signifikan'),
    },
  ];

  // 14. Risk Estimate (Odds Ratio)
  const riskEstimateTableCols: ColumnDef<{
    measure: string;
    value: number;
    ciLower: number;
    ciUpper: number;
    isSignificantRisk: boolean;
    isProtective: boolean;
  }>[] = [
    {
      key: 'measure',
      header: 'Ukuran Asosiasi Risiko',
      render: (r) => <span className="font-semibold text-foreground">{r.measure}</span>,
      getValue: (r) => r.measure,
    },
    {
      key: 'value',
      header: 'Nilai Estimasi (OR / RR)',
      align: 'right',
      render: (r) => <span className="font-bold text-primary">{formatNumber(r.value, 3)}</span>,
      getValue: (r) => formatNumber(r.value, 3),
    },
    {
      key: 'ciLower',
      header: '95% CI Lower',
      align: 'right',
      getValue: (r) => formatNumber(r.ciLower, 3),
    },
    {
      key: 'ciUpper',
      header: '95% CI Upper',
      align: 'right',
      getValue: (r) => formatNumber(r.ciUpper, 3),
    },
    {
      key: 'decision',
      header: 'Interpretasi Epidemiologi',
      align: 'center',
      render: (r) => (
        <Badge
          variant={r.isSignificantRisk ? 'coral' : (r.isProtective ? 'pine' : 'secondary')}
          className="text-[12px]"
        >
          {r.isSignificantRisk ? 'Faktor Risiko Signifikan' : (r.isProtective ? 'Faktor Protektif' : 'Bukan Risiko Signifikan')}
        </Badge>
      ),
      getValue: (r) => (r.isSignificantRisk ? 'Faktor Risiko Signifikan' : (r.isProtective ? 'Faktor Protektif' : 'Bukan Risiko')),
    },
  ];

  // 15. Symmetric Measures (Phi, Cramer's V, Contingency Coefficient)
  const symmetricMeasuresTableCols: ColumnDef<{
    measure: string;
    value: number | string;
    pValue: number;
    category: string;
  }>[] = [
    {
      key: 'measure',
      header: 'Ukuran Korelasi Nominal',
      render: (r) => <span className="font-semibold text-foreground">{r.measure}</span>,
      getValue: (r) => r.measure,
    },
    {
      key: 'value',
      header: 'Nilai Koefisien',
      align: 'right',
      render: (r) => <span className="font-semibold">{typeof r.value === 'number' ? formatNumber(r.value, 3) : r.value}</span>,
      getValue: (r) => (typeof r.value === 'number' ? formatNumber(r.value, 3) : r.value),
    },
    {
      key: 'pValue',
      header: 'Approximate Significance',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.pValue, 4)}</span>,
      getValue: (r) => formatNumber(r.pValue, 4),
    },
    {
      key: 'category',
      header: 'Tingkat Keeratan Hubungan',
      align: 'center',
      render: (r) => (
        <Badge variant={r.pValue < 0.05 ? 'pine' : 'secondary'} className="text-[12px]">
          {r.category}
        </Badge>
      ),
      getValue: (r) => r.category,
    },
  ];

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Sticky Header Meja Kerja Hasil */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-md pb-4 pt-3 sm:pt-4 border-b border-border/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Breadcrumb Nav */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Link href="/app" className="hover:text-foreground transition-colors">
              Proyek
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span
              className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[320px]"
              title={project?.title || 'Skripsi Saya'}
            >
              {project?.title || 'Skripsi Saya'}
            </span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary font-semibold">Hasil Bab 4</span>
          </div>

          {/* Heading & Metadata */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
              Hasil Analisis &amp; Pembahasan Bab 4
            </h1>
            <Badge variant="outline" className="text-xs bg-muted/50 font-mono py-0.5">
              N = {results.respondentCount} responden
            </Badge>
            {isSample && (
              <Badge variant="amber" className="text-xs font-semibold py-0.5">
                Data Contoh
              </Badge>
            )}
          </div>

          {/* Dataset & Timestamp Metadata Strip */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
            <span className="inline-flex items-center gap-1 font-mono">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {results.sourceMeta?.fileName || 'dataset_kuesioner.xlsx'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              {formatDateTime(project?.updatedAt || project?.createdAt || new Date().toISOString())}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">
              Verifikasi: {results.sourceMeta?.sha256 ? results.sourceMeta.sha256.substring(0, 8) : 'sha256-verified'}
            </span>
          </div>
        </div>

        {/* Action Buttons: 1 Tombol Utama "Unduh Bab 4 (Word)" + Dropdown "Unduh Lainnya" */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <TambahAnalisisSelector
            enabledTableIds={enabledOptionalTables}
            onToggleTable={toggleOptionalTable}
          />

          {/* Tombol Utama: Unduh Bab 4 (Word) */}
          <Button
            size="sm"
            onClick={() => {
              setChapter4ExportFormat('docx');
              setChapter4ModalOpen(true);
            }}
            className="text-[13px] min-h-[44px] px-4 gap-2 font-semibold shadow-xs touch-manipulation cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            title="Unduh draf naskah Bab 4 format Microsoft Word (.docx) dengan tabel APA 7th asli"
          >
            <FileDown className="h-4 w-4" />
            <span>Unduh Bab 4 (Word)</span>
          </Button>

          {/* Dropdown Menu: Unduh Lainnya & Salin Semua */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-[13px] min-h-[44px] px-3.5 gap-1.5 touch-manipulation cursor-pointer rounded-xl font-medium border-border hover:bg-muted"
                aria-label="Menu unduh lainnya"
              >
                <span>Unduh Lainnya</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setChapter4ExportFormat('pdf');
                  setChapter4ModalOpen(true);
                }}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium"
              >
                <FileText className="h-4 w-4 text-rose-500" />
                <div className="flex flex-col">
                  <span>Unduh Laporan Resmi (PDF)</span>
                  <span className="text-[10px] text-muted-foreground">Format siap cetak untuk sidang</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleCopyAllTables}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium"
              >
                <Copy className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span>Salin Semua Tabel Sekaligus</span>
                  <span className="text-[10px] text-muted-foreground">Format tabel APA 7th untuk Word</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowReferenceTables(true)}
                className="gap-2.5 cursor-pointer text-xs py-2.5 font-medium text-amber-900 dark:text-amber-200"
              >
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col">
                  <span>Tabel r, t, F (df Berstabilo)</span>
                  <span className="text-[10px] text-muted-foreground">Buka tabel referensi statistik</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setExportOpen(true)}
                className="gap-2.5 cursor-pointer text-xs py-2 text-muted-foreground"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Opsi Ekspor Lanjutan &amp; Lampiran</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[13px] min-h-[44px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation cursor-pointer rounded-xl"
            title="Buka panduan interpretasi hasil Bab 4"
          >
            <Link
              href="/app/bantuan"
              target="_blank"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Bantuan</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner Mode Data Contoh & Reset Demo */}
      {isSample && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-foreground shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="amber" className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">
                {COPY.badges.sampleData}
              </Badge>
              <h4 className="font-semibold text-sm sm:text-base text-foreground">
                Anda Sedang Melihat Hasil Data Contoh
              </h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[72ch]">
              Seluruh tabel Bab 4, narasi interpretasi, dan lampiran di bawah ini menggunakan dataset simulasi kuesioner (N = 120). Uji lanjutan (ANOVA, Uji Beda, Chi-Square, Durbin-Watson) terbuka penuh dalam mode demo ini.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDemo}
              className="cursor-pointer rounded-xl min-h-[40px] px-3.5 border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset Demo
            </Button>
            <Button
              type="button"
              size="sm"
              asChild
              className="cursor-pointer font-semibold rounded-xl min-h-[40px] px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/app/proyek/baru">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Pakai Data Saya
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Panel Sumber Data & Integritas Matriks */}
      <DataSourcePanel meta={results.sourceMeta} projectId={projectId} />

      {/* Ringkasan Eksekutif Bab 4 (Lampu Hijau / Kuning / Merah) */}
      <TopSummaryTrafficLights results={results} onJumpToTab={(tabId) => setActiveTab(tabId)} />

      {/* Dual-View Segmented Output Toggle: APA 7th vs SPSS Classic */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Format Tampilan Output
            </span>
            <Badge variant="outline" className="text-[11px] font-mono py-0">
              Dual-View
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Pilih format tabel naskah untuk Bab 4 atau format output klasik untuk lampiran skripsi.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Format Tampilan Output"
          className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={outputMode === 'apa'}
            onClick={() => setOutputMode('apa')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all touch-manipulation cursor-pointer",
              outputMode === 'apa'
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>Tabel Naskah Bab 4 (APA 7th)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={outputMode === 'spss'}
            onClick={() => setOutputMode('spss')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all touch-manipulation cursor-pointer",
              outputMode === 'spss'
                ? "bg-background text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>Mode Lampiran (Gaya SPSS)</span>
          </button>
        </div>
      </div>

      {/* Output Mode Switch: SPSS Full-Width vs APA 7th + Jejak Hitung */}
      {outputMode === 'spss' ? (
        <div className="w-full min-w-0 space-y-6">
          <ProResultBlur
            isLocked={isFree && !isSample}
            isSample={isSample}
            testName="Lampiran Output SPSS Klasik"
            reason="Tampilan lembar output klasik SPSS (.spv/tabel pivot) lengkap dengan seluruh tabel komparatif dan regresi tersedia pada Paket Bulanan &amp; Paket Skripsi."
          >
            <SpssOutputViewer
              results={results}
              onHoverNumber={setHighlightedNumber}
              highlightedValue={highlightedNumber}
            />
          </ProResultBlur>
        </div>
      ) : (
        <div className="grid grid-cols-1 min-[1200px]:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start w-full min-w-0">
          {/* Kolom Kiri/Utama: Tab-Tab Uji Statistik */}
          <div data-results-column="true" className="w-full min-w-0 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
              {/* Scrollable Tabs dengan Shadow Indicator, Fade Gradient, dan Aksesibilitas Penuh */}
              <ScrollableTabs
                tabs={computedTabs}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
              />

              {/* 1. STATISTIK DESKRIPTIF */}
              <TabsContent value="descriptive" className="space-y-6 mt-4">
                {/* Tabel 4.1: Profil & Karakteristik Responden */}
                {results.demographics && results.demographics.length > 0 ? (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-2">
                      <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                        Tabel 4.1 (Format Baku APA 7th Edition)
                      </span>
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        Distribusi Frekuensi Karakteristik Responden Penelitian
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sebaran karakteristik profil demografi responden (N = {results.respondentCount}).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {results.demographics.map((demo, dIdx) => {
                        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
                        const letter = results.demographics!.length > 1 ? letters[dIdx] || `${dIdx + 1}` : '';
                        return (
                          <ResultTable
                            key={demo.variable}
                            tableNumber={`Tabel 4.1${letter}`}
                            title={`Distribusi Frekuensi Karakteristik Responden Berdasarkan ${demo.variable.replace(/_/g, ' ')}`}
                            note={`Total responden N = ${results.respondentCount}. Kategori mayoritas: ${demo.majorityCategory || '-'}.`}
                            columns={demographicCategoryCols}
                            data={demo.categories}
                            rowKey={(c) => `${demo.variable}-${c.category}`}
                            highlightedValue={highlightedNumber}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 space-y-1">
                    <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                      Tabel 4.1
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      Karakteristik &amp; Demografi Responden
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Kolom demografi kuesioner (seperti Jenis Kelamin, Usia, Pendidikan) dirangkum otomatis pada bagian ini saat file kuesioner memuat data profil responden.
                    </p>
                  </div>
                )}

                {/* Tabel 4.2: Statistik Deskriptif Variabel Penelitian */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                        Tabel 4.2 (Format Baku APA 7th Edition)
                      </span>
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        Hasil Analisis Statistik Deskriptif Variabel Penelitian
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowItemDetails(!showItemDetails)}
                      className="text-xs h-8 px-3 gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      {showItemDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showItemDetails ? 'Sembunyikan Rincian per Butir' : 'Lihat Rincian per Indikator'}</span>
                    </Button>
                  </div>

                  <ResultTable
                    tableNumber="Tabel 4.2"
                    title="Hasil Analisis Statistik Deskriptif Variabel Penelitian & TCR"
                    note={`Sumber data: ${results.sourceMeta?.fileName || 'Data Primer'}. N = ${results.respondentCount} responden valid. Skala Likert 1-5. ${LIKERT_INTERVAL_NOTE}`}
                    columns={descriptiveCols}
                    data={results.descriptive || []}
                    rowKey={(r) => r.variable}
                    highlightedValue={highlightedNumber}
                  />

                  {/* Folded Item Details Table */}
                  {showItemDetails && results.itemDescriptive && results.itemDescriptive.length > 0 && (
                    <div className="pt-2 pl-2 border-l-2 border-primary/40 space-y-2">
                      <span className="text-xs font-semibold text-foreground block">
                        Rincian Statistik Deskriptif per Butir Pertanyaan (TCR Indikator):
                      </span>
                      <ResultTable
                        tableNumber="Tabel 4.2 (Rincian)"
                        title="Rincian Skor Rata-rata & TCR per Butir Pertanyaan"
                        columns={itemDescriptiveCols}
                        data={results.itemDescriptive}
                        rowKey={(r) => r.variable}
                        highlightedValue={highlightedNumber}
                      />
                    </div>
                  )}
                </div>

                {/* Tabel 4.3: Distribusi Frekuensi Jawaban per Butir (Likert STS..SS) */}
                {results.itemDescriptive && results.itemDescriptive.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <ResultTable
                      tableNumber="Tabel 4.3"
                      title="Distribusi Frekuensi Jawaban Responden per Butir Kuesioner (Skala Likert 1-5)"
                      note={`* STS = Sangat Tidak Setuju (1), TS = Tidak Setuju (2), N = Netral (3), S = Setuju (4), SS = Sangat Setuju (5). TCR = Tingkat Capaian Responden. N = ${results.respondentCount} responden.`}
                      columns={likertItemCols}
                      data={results.itemDescriptive}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  </div>
                )}

                {/* Chapter 4 Rule-Based Interpretation & Discussion Scaffold */}
                <Chapter4InterpretationCard
                  tableNumber="Tabel 4.1–4.3"
                  intinya={descriptiveIntinya}
                  interpretation={results.explanations.descriptive}
                  guidingQuestions={[
                    'Apakah kecenderungan rata-rata jawaban responden ini mencerminkan kondisi lapangan yang sesungguhnya?',
                    'Indikator butir manakah yang memiliki skor tertinggi dan terendah, serta apa makna praktisnya bagi responden?',
                    'Bagaimana interpretasi TCR ini memperkuat latar belakang masalah yang diajukan pada Bab 1?',
                  ]}
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

                {/* Troubleshooter Uji Validitas */}
                {results.validity && results.validity.some((v) => !v.valid) && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                          Asisten Penyelamat Data: Ditemukan {results.validity.filter((v) => !v.valid).length} butir gugur ({results.validity.filter((v) => !v.valid).map((v) => v.item).join(', ')})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ingin menghapus butir gugur dan menghitung ulang skor komposit variabel serta seluruh regresi secara otomatis? Dataset asli Anda tetap aman dan utuh di Riwayat.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleEliminateInvalidItems}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 rounded-lg min-h-[38px] shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Eliminasi Butir Gugur &amp; Hitung Ulang (Buat Versi Baru)
                    </Button>
                  </div>
                )}

                <ResultTable
                  tableNumber="Tabel 4.4"
                  title="Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)"
                  note={`Derajat bebas df = N - 2 = ${results.respondentCount - 2}, taraf signifikansi α = 0,05 (r tabel = ${results.validity?.[0]?.rTabel ? formatNumber(results.validity[0].rTabel, 4) : '0,1816'}). Kriteria: r hitung > r tabel = Valid.`}
                  columns={validityCols}
                  data={results.validity || []}
                  rowKey={(r) => r.item}
                  highlightedValue={highlightedNumber}
                />

                <Chapter4InterpretationCard
                  tableNumber="Tabel 4.4"
                  intinya={validityIntinya}
                  interpretation={results.explanations.validity}
                  guidingQuestions={[
                    'Apakah seluruh butir pernyataan mampu mengukur konstruk penelitian secara akurat sesuai indikator teori?',
                    'Jika ada butir yang gugur, faktor apa dalam redaksi pertanyaan atau pemahaman responden yang memengaruhinya?',
                    'Bagaimana dampak eliminasi butir gugur terhadap validitas isi (content validity) instrumen Anda?',
                  ]}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />

                {/* Bekal Sidang Skripsi */}
                <ThesisDefenseCompanion
                  testType="validity"
                  dataMetrics={{
                    n: results.respondentCount,
                    df: results.respondentCount - 2,
                    rTabel: results.validity?.[0]?.rTabel,
                  }}
                />
              </TabsContent>

              {/* 3. UJI RELIABILITAS */}
              <TabsContent value="reliability" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Uji Reliabilitas (Cronbach's Alpha)"
                  reason="Koefisien reliabilitas Cronbach's Alpha, item-deleted statistics, dan interpretasi Bab 4 lengkap tersedia pada Paket Bulanan & Paket Skripsi."
                >
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
                    tableNumber="Tabel 4.5"
                    title="Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)"
                    note="* Ambang batas reliabilitas standar kuesioner menurut Nunnaly & Ghozali adalah Cronbach's Alpha ≥ 0,600 (atau ≥ 0,700 untuk standar konservatif)."
                    columns={reliabilityCols}
                    data={results.reliability || []}
                    rowKey={(r) => r.construct}
                    highlightedValue={highlightedNumber}
                  />

                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.5"
                    intinya={reliabilityIntinya}
                    interpretation={results.explanations.reliability}
                    guidingQuestions={[
                      'Apakah koefisien Cronbach Alpha seluruh konstruk memenuhi syarat keandalan instrumen (≥ 0,600 / ≥ 0,700)?',
                      'Bagaimana konsistensi internal responden dalam menjawab pertanyaan-pertanyaan yang mengukur dimensi yang sama?',
                      'Apakah ada indikasi butir yang jika dihapus dapat meningkatkan nilai Alpha secara signifikan?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />

                  {/* Bekal Sidang Skripsi */}
                  <ThesisDefenseCompanion
                    testType="reliability"
                    dataMetrics={{
                      n: results.respondentCount,
                      cronbachAlpha: results.reliability?.[0]?.cronbachAlpha,
                    }}
                  />
                </ProResultBlur>
              </TabsContent>

              {/* 4. UJI ASUMSI KLASIK */}
              <TabsContent value="assumptions" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Uji Asumsi Klasik"
                  reason="Angka uji Normalitas K-S, Multikolinearitas (VIF), Heteroskedastisitas Glejser, Durbin-Watson, serta Asisten Penyembuh Asumsi tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {/* Asisten Penyembuh Asumsi Klasik (One-Click Troubleshooter) */}
                {((results.normality && !results.normality[0]?.normal) ||
                  (results.heteroscedasticity &&
                    results.heteroscedasticity.some((h) => h.significant))) && (
                  <div className="p-4 sm:p-5 rounded-xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-500/30 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-sm text-foreground">
                            Asisten Penyembuh Asumsi Klasik
                          </span>
                          <Badge variant="brand" className="text-[10px]">
                            Solusi Metodologis Sah
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Asumsi normalitas atau heteroskedastisitas belum terpenuhi? OlahData menyediakan 2 tindakan penyelamat terukur sesuai metodologi riset Prof. Dr. Imam Ghozali (2018):
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* 1. Outlier Residual Eliminator */}
                      <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">
                            1. Deteksi &amp; Eliminasi Outlier Residual
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            |Z_res| &gt; 2,5
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {results.residualOutliers && results.residualOutliers.totalOutliers > 0
                            ? `Ditemukan ${results.residualOutliers.totalOutliers} responden dengan residual ekstrim (Baris: ${results.residualOutliers.outliers.map((o) => o.rowNumber).join(', ')}). Estimasi nilai Sig. normalitas baru: ~${formatNumber(results.residualOutliers.estimatedNormalSigIfRemoved, 3)}.`
                            : 'Tidak terdeteksi outlier residual ekstrim (|Z| > 2,5). Model residual relatif stabil.'}
                        </p>
                        {results.residualOutliers && results.residualOutliers.totalOutliers > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              handleEliminateOutliers(
                                results.residualOutliers!.outliers.map((o) => o.rowNumber)
                              )
                            }
                            className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer font-medium flex items-center justify-center gap-1.5"
                          >
                            {isFree && <Lock className="w-3.5 h-3.5" />}
                            Kecualikan {results.residualOutliers.totalOutliers} Responden Outlier &amp; Jalankan Ulang
                            {isFree && (
                              <Badge variant="outline" className="text-[10px] text-white border-white/40 ml-1 py-0">
                                Pro
                              </Badge>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* 2. Peralihan Metode Uji Sah (Park & Spearman) */}
                      <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">
                            2. Peralihan Uji Heteroskedastisitas Sah
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            Park &amp; Spearman
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Jika Uji Glejser tidak lolos (p &lt; 0,05), beralihlah ke Uji Park (ln(e²)) atau Korelasi Rank Spearman. Jika Sig. &gt; 0,05, model dinyatakan bebas heteroskedastisitas tanpa perlu memotong data.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={heteroMethod === 'park' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setHeteroMethod(heteroMethod === 'park' ? 'glejser' : 'park')}
                            className="text-xs rounded-md cursor-pointer font-medium"
                          >
                            {heteroMethod === 'park' ? 'Aktif: Uji Park' : 'Pilih Uji Park'}
                          </Button>
                          <Button
                            type="button"
                            variant={heteroMethod === 'spearman' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setHeteroMethod(heteroMethod === 'spearman' ? 'glejser' : 'spearman')}
                            className="text-xs rounded-md cursor-pointer font-medium"
                          >
                            {heteroMethod === 'spearman' ? 'Aktif: Spearman' : 'Pilih Spearman'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                    tableNumber="Tabel 4.6"
                    title="Hasil Uji Normalitas Kolmogorov-Smirnov Residual"
                    note={`Uji dilakukan terhadap unstandardized residual model regresi (N = ${results.respondentCount}). Kriteria: Sig. ≥ 0,05 berdistribusi normal.`}
                    columns={normalityCols}
                    data={results.normality || []}
                    rowKey={(r) => r.test}
                    highlightedValue={highlightedNumber}
                  />

                  {/* Visualizer Plot Histogram Residual & Kurva Normal + Normal P-P Plot */}
                  <AcademicResidualPlots
                    n={results.respondentCount}
                    isNormal={results.normality?.[0]?.normal ?? true}
                  />

                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.6"
                    intinya={
                      results.normality?.[0]?.normal
                        ? `Nilai Sig. Kolmogorov-Smirnov sebesar ${formatNumber(results.normality[0].pValue, 3)} (≥ 0,05) membuktikan data residual berdistribusi normal.`
                        : `Nilai Sig. Kolmogorov-Smirnov sebesar ${results.normality?.[0] ? formatNumber(results.normality[0].pValue, 3) : '-'} (< 0,05) mengindikasikan residual belum berdistribusi normal.`
                    }
                    interpretation={results.explanations.normality}
                    guidingQuestions={[
                      'Apakah asumsi normalitas residual terpenuhi sehingga estimasi OLS tidak bias?',
                      'Bagaimana pola sebaran titik residual pada Kurva Normal dan Normal P-P Plot?',
                      'Apakah ada nilai residual ekstrim (outlier) yang perlu diteliti lebih lanjut?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />

                  {/* Bekal Sidang Skripsi */}
                  <ThesisDefenseCompanion
                    testType="normality"
                    dataMetrics={{
                      n: results.respondentCount,
                      ksSig: results.normality?.[0]?.pValue,
                    }}
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
                    tableNumber="Tabel 4.7"
                    title="Hasil Uji Multikolinearitas Variabel Bebas (Tolerance & VIF)"
                    note="* Ambang batas: Nilai Tolerance > 0,10 dan Variance Inflation Factor (VIF) < 10,00."
                    columns={multicollinearityCols}
                    data={results.multicollinearity || []}
                    rowKey={(r) => r.variable}
                    highlightedValue={highlightedNumber}
                  />

                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.7"
                    intinya={
                      results.multicollinearity?.some((m) => m.problematic)
                        ? 'Ditemukan indikasi multikolinearitas pada variabel bebas (VIF ≥ 10,00).'
                        : 'Seluruh variabel bebas memiliki VIF < 10,00 dan Tolerance > 0,10, membuktikan model regresi bebas dari masalah multikolinearitas.'
                    }
                    interpretation={results.explanations.multicollinearity}
                    guidingQuestions={[
                      'Apakah seluruh variabel bebas memiliki nilai VIF < 10,00 dan Tolerance > 0,10?',
                      'Apakah ada korelasi yang terlalu tinggi antar variabel independen?',
                      'Bagaimana keterkaitan antar variabel independen memengaruhi stabilitas koefisien regresi?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />

                  {/* Bekal Sidang Skripsi */}
                  <ThesisDefenseCompanion
                    testType="multicollinearity"
                    dataMetrics={{
                      n: results.respondentCount,
                      maxVif: results.multicollinearity?.reduce((max, m) => Math.max(max, m.vif), 0),
                      minTolerance: results.multicollinearity?.reduce((min, m) => Math.min(min, m.tolerance), 1),
                    }}
                  />
                </div>

                {/* 4c. Heteroskedastisitas */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        3. Uji Heteroskedastisitas
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Memeriksa apakah varians residual konstan (homoskedastisitas). Tersedia 3 metode baku akademik.
                      </p>
                    </div>

                    {/* 3-Way Method Switcher */}
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setHeteroMethod('glejser')}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                          heteroMethod === 'glejser'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>Uji Glejser</span>
                        {results.heteroscedasticity && !results.heteroscedasticity.some((h) => h.significant) ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeteroMethod('park')}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                          heteroMethod === 'park'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>Uji Park (ln(e²))</span>
                        {results.parkHetero && !results.parkHetero.some((p) => p.significant) ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeteroMethod('spearman')}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer transition-all flex items-center gap-1.5',
                          heteroMethod === 'spearman'
                            ? 'bg-background text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>Rank Spearman</span>
                        {results.spearmanHetero && !results.spearmanHetero.some((s) => s.significant) ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bebas Heteroskedastisitas" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Terindikasi Gejala" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Recommendation banner if Glejser failed but alternative passed */}
                  {results.heteroscedasticity?.some((h) => h.significant) &&
                    ((results.parkHetero && !results.parkHetero.some((p) => p.significant)) ||
                      (results.spearmanHetero && !results.spearmanHetero.some((s) => s.significant))) && (
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs text-foreground flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                            Solusi Metodologis Sah: Gunakan {results.parkHetero && !results.parkHetero.some((p) => p.significant) ? 'Uji Park' : 'Korelasi Rank Spearman'} untuk Bab 4
                          </span>
                          <p className="text-muted-foreground mt-0.5 leading-relaxed">
                            Meskipun Uji Glejser menunjukkan p &lt; 0,05, metode alternatif yang sah secara ekonometrika ({results.parkHetero && !results.parkHetero.some((p) => p.significant) ? 'Uji Park (Gujarati)' : 'Korelasi Rank Spearman (Prof. Dr. Imam Ghozali, 2018)'}) membuktikan seluruh variabel memiliki Sig. &gt; 0,05 (bebas heteroskedastisitas). Anda dapat menggunakan hasil tabel ini untuk penulisan skripsi tanpa memotong data.
                          </p>
                        </div>
                      </div>
                    )}

                  {heteroMethod === 'glejser' && (
                    <ResultTable
                      tableNumber="Tabel 4.8"
                      title="Hasil Uji Heteroskedastisitas Menggunakan Metode Glejser"
                      note="* Variabel dependen uji adalah Nilai Absolut Residual |e_i|. Kriteria: Sig. > 0,05 tidak terdapat gejala heteroskedastisitas."
                      columns={heteroscedasticityCols}
                      data={results.heteroscedasticity || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  )}

                  {heteroMethod === 'park' && (
                    <ResultTable
                      tableNumber="Tabel 4.8"
                      title="Hasil Uji Heteroskedastisitas Menggunakan Metode Uji Park"
                      note="* Rujukan: Damodar Gujarati / Prof. Dr. Imam Ghozali. Variabel dependen adalah ln(e²). Kriteria: Sig. > 0,05 bebas heteroskedastisitas."
                      columns={parkHeteroCols}
                      data={results.parkHetero || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  )}

                  {heteroMethod === 'spearman' && (
                    <ResultTable
                      tableNumber="Tabel 4.8"
                      title="Hasil Uji Heteroskedastisitas Menggunakan Korelasi Rank Spearman"
                      note="* Rujukan: Prof. Dr. Imam Ghozali (2018). Uji korelasi Rank Spearman antara variabel independen dengan absolute residual. Kriteria: Sig. > 0,05 bebas heteroskedastisitas."
                      columns={spearmanHeteroCols}
                      data={results.spearmanHetero || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  )}

                  {/* Visualizer Plot Scatter Residual vs Fitted */}
                  <AcademicHeteroscedasticityPlot
                    n={results.respondentCount}
                    isHomoscedastic={!results.heteroscedasticity?.some((h) => h.significant)}
                  />

                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.8"
                    intinya={
                      results.heteroscedasticity?.some((h) => h.significant)
                        ? 'Terdapat variabel yang terindikasi heteroskedastisitas (p < 0,05 pada Uji Glejser).'
                        : 'Nilai Sig. Uji Glejser seluruh variabel bebas berada di atas 0,05, membuktikan tidak ada gejala heteroskedastisitas pada residual.'
                    }
                    interpretation={results.explanations.heteroscedasticity}
                    guidingQuestions={[
                      'Apakah varians residual bersifat konstan (homoskedastisitas) di seluruh rentang nilai prediksi?',
                      'Bagaimana pola sebaran titik pada grafik Scatterplot Residual vs Predicted?',
                      'Jika terjadi ketidaksamaan varians, metode penyelamat apa (Park atau Spearman) yang membuktikan keabsahan model?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />

                  {/* Bekal Sidang Skripsi */}
                  <ThesisDefenseCompanion
                    testType="heteroscedasticity"
                    dataMetrics={{
                      n: results.respondentCount,
                      glejserSigMin: results.heteroscedasticity?.reduce((min, h) => Math.min(min, h.pValue), 1),
                    }}
                  />
                </div>

                {/* 4d. Autokorelasi Durbin-Watson */}
                {(results.durbinWatson || enabledOptionalTables.includes('tabel_4_9_dw')) && results.durbinWatson && (
                  <ProResultBlur
                    isLocked={isFree && !isSample}
                    isSample={isSample}
                    testName="Uji Autokorelasi Durbin-Watson"
                    reason="Uji autokorelasi Durbin-Watson untuk model regresi runtun waktu tersedia pada Paket Bulanan & Paket Skripsi."
                  >
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="border-b border-border pb-2">
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          4. Uji Autokorelasi (Durbin-Watson)
                        </h3>
                      </div>

                      <AssumptionAlert
                        status={results.durbinWatson.status === 'bebas' ? 'passed' : 'violated'}
                        title={
                          results.durbinWatson.status === 'bebas'
                            ? `Asumsi Non-Autokorelasi Terpenuhi (d = ${formatNumber(results.durbinWatson.dwStatistic, 4)})`
                            : `Perhatian: Terindikasi Gejala Autokorelasi (d = ${formatNumber(results.durbinWatson.dwStatistic, 4)})`
                        }
                        description={`Nilai statistik Durbin-Watson sebesar ${formatNumber(results.durbinWatson.dwStatistic, 4)} berada pada rentang batas kritis dL = ${formatNumber(results.durbinWatson.dL, 4)} dan dU = ${formatNumber(results.durbinWatson.dU, 4)} (4 - dU = ${formatNumber(4 - results.durbinWatson.dU, 4)}).`}
                        recommendation={
                          results.durbinWatson.status === 'bebas'
                            ? 'Tidak terdapat autokorelasi positif maupun negatif pada residual model regresi.'
                            : 'Periksa urutan data observasi atau tambahkan variabel kontrol bila relevan.'
                        }
                      />

                      <ResultTable
                        tableNumber="Tabel 4.9"
                        title="Hasil Uji Autokorelasi Durbin-Watson Model Regresi"
                        note={`Derajat signifikansi α = 0,05, k = ${kPredictors}, N = ${results.respondentCount}. Kriteria bebas autokorelasi: dU < d < 4 - dU.`}
                        columns={durbinWatsonCols}
                        data={[results.durbinWatson]}
                        rowKey={() => 'dw-1'}
                        highlightedValue={highlightedNumber}
                      />

                      <Chapter4InterpretationCard
                        tableNumber="Tabel 4.9"
                        intinya={results.durbinWatson.conclusion}
                        interpretation={
                          results.explanations.durbinWatson ||
                          `Nilai statistik Durbin-Watson sebesar ${formatNumber(results.durbinWatson.dwStatistic, 4)} membuktikan bahwa residual regresi terbebas dari masalah autokorelasi linier.`
                        }
                        guidingQuestions={[
                          'Apakah nilai statistik Durbin-Watson berada di antara rentang dU dan 4 - dU?',
                          'Apakah ada ketergantungan residual antar waktu observasi responden?',
                          'Mengapa data survei kuesioner cross-sectional umumnya bebas masalah autokorelasi?',
                        ]}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    </div>
                  </ProResultBlur>
                )}

                {/* 4e. Linearitas (Deviation from Linearity) */}
                {results.linearity && results.linearity.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="border-b border-border pb-2">
                      <h3 className="font-serif text-lg font-bold text-foreground">
                        5. Uji Linearitas (Deviation from Linearity)
                      </h3>
                    </div>

                    <ResultTable
                      tableNumber="Tabel 4.6c"
                      title="Hasil Uji Linearitas Hubungan Variabel Bebas dan Terikat (ANOVA)"
                      note="* Kriteria hubungan linier: Sig. Deviation from Linearity > 0,05 atau Sig. Linearity < 0,05."
                      columns={linearityCols}
                      data={results.linearity}
                      rowKey={(r) => r.independentVar}
                      highlightedValue={highlightedNumber}
                    />

                    {results.explanations.linearity && (
                      <ExplanationBox
                        title="Interpretasi Uji Linearitas"
                        summarySentence={
                          results.linearity.every((l) => l.isLinear)
                            ? 'Seluruh variabel bebas memiliki hubungan linier yang signifikan dengan variabel terikat.'
                            : 'Terdapat variabel yang deviasi dari linearitasnya mendekati batas signifikansi.'
                        }
                        explanation={results.explanations.linearity}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    )}
                  </div>
                )}
                </ProResultBlur>
              </TabsContent>

              {/* 5. REGRESI LINIER BERGANDA */}
              <TabsContent value="regression" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Regresi Linier & Uji Hipotesis"
                  reason="Nilai t-hitung parsial, F-hitung simultan, koefisien determinasi R², sumbangan efektif (SE%), dan draf narasi Bab 4 lengkap tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {/* 5a. Koefisien Regresi & Uji t Parsial (Tabel 4.10a) */}
                  <div className="space-y-4">
                    <ResultTable
                      tableNumber="Tabel 4.10a"
                      title="Hasil Analisis Regresi Linier Berganda dan Uji t Parsial"
                      note={`Taraf signifikansi α = 0,05. df residual = ${results.respondentCount - (results.regression?.length || 3)}. Kriteria: Sig. < 0,05 = Signifikan.`}
                      columns={regressionCols}
                      data={results.regression || []}
                      rowKey={(r) => r.variable}
                      highlightedValue={highlightedNumber}
                    />
                  </div>

                  {/* Ringkasan Model Regresi Akademik (N, R, R2, adj R2, F, p, SE) */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="border-b border-border pb-1.5">
                      <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                        Ringkasan Model Regresi (Model Summary)
                      </span>
                      <h4 className="font-semibold text-sm text-foreground">
                        Statistik Kelayakan &amp; Kebaikan Model (Goodness of Fit)
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3.5 rounded-xl border border-border bg-card text-center shadow-xs">
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">N Responden</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">{results.respondentCount}</p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Korelasi (R)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(Math.sqrt(Math.max(0, results.determination.rSquare)), 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">R² (R-Square)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-primary tabular-nums">
                          {results.determination ? formatNumber(results.determination.rSquare, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Adjusted R²</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(results.determination.adjustedRSquare, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">F Hitung</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.fTest ? formatNumber(results.fTest.fHitung, 3) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sig. F (p)</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {results.fTest ? (results.fTest.pValue < 0.001 ? '< 0,001' : formatNumber(results.fTest.pValue, 4)) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5 p-1.5 rounded-lg bg-muted/40">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Std. Error</span>
                        <p className="text-sm sm:text-base font-bold font-mono text-foreground tabular-nums">
                          {results.determination ? formatNumber(results.determination.stdError, 3) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5b. Koefisien Determinasi R² (Tabel 4.10b) */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <ResultTable
                      tableNumber="Tabel 4.10b"
                      title="Hasil Analisis Koefisien Determinasi (Model Summary)"
                      note="* Model regresi OLS dengan variabel independen terstandarisasi."
                      columns={determinationCols}
                      data={results.determination ? [results.determination] : []}
                      rowKey={() => 'det-1'}
                      highlightedValue={highlightedNumber}
                    />
                  </div>

                  {/* 5c. Uji F Simultan (Tabel 4.10c) */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <ResultTable
                      tableNumber="Tabel 4.10c"
                      title="Hasil Uji Signifikansi Simultan (Uji F / ANOVA Model)"
                      note={`F tabel pada derajat bebas df1 = ${kPredictors}, df2 = ${results.respondentCount - (results.regression?.length || 3)}, α = 0,05. Kriteria: F hitung > F tabel dan Sig. < 0,05.`}
                      columns={fTestCols}
                      data={results.fTest ? [results.fTest] : []}
                      rowKey={() => 'ftest-1'}
                      highlightedValue={highlightedNumber}
                    />
                  </div>

                  {/* 5d. Sumbangan Efektif (SE%) & Sumbangan Relatif (SR%) (Tabel 4.10d) */}
                  {results.regression && results.regression.some((r) => r.sePercent !== undefined) && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <ResultTable
                        tableNumber="Tabel 4.10d"
                        title="Perhitungan Sumbangan Efektif (SE %) dan Sumbangan Relatif (SR %) Variabel Bebas"
                        note={`* Sumbangan Efektif total = R² × 100% (${results.determination ? formatNumber(results.determination.rSquare * 100, 2) : '0'}%), dan total Sumbangan Relatif = 100,00%. Formula: SE = Beta × r_xy × 100%, SR = (SE / R²) × 100%.`}
                        columns={seSrCols}
                        data={results.regression.filter((r) => !r.variable.toLowerCase().includes('konstanta') && r.sePercent !== undefined)}
                        rowKey={(r) => r.variable}
                        highlightedValue={highlightedNumber}
                      />
                    </div>
                  )}

                  {/* Narasi Interpretasi Model Regresi Tabel 4.10 */}
                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.10"
                    intinya={regressionIntinya}
                    interpretation={results.explanations.regression}
                    guidingQuestions={[
                      'Bagaimana arah (positif/negatif) dan besaran koefisien regresi masing-masing variabel bebas?',
                      'Variabel bebas manakah yang memberikan sumbangan efektif (SE%) paling dominan terhadap variabel terikat?',
                      'Berapa persen kemampuan model regresi (R²) dalam menjelaskan fenomena yang diteliti?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />

                  {/* 5e. Ringkasan Pembuktian & Keputusan Hipotesis Penelitian (Tabel 4.11) */}
                  {hypothesisRows.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="border-b border-border pb-2">
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          Pembuktian &amp; Keputusan Hipotesis Penelitian
                        </h3>
                      </div>

                      <ResultTable
                        tableNumber="Tabel 4.11"
                        title="Ringkasan Pembuktian dan Keputusan Pengujian Hipotesis Penelitian"
                        note="* Hipotesis diterima apabila t hitung > t tabel (atau F hitung > F tabel) dan nilai signifikansi p-value < 0,05 dengan arah koefisien sejalan dengan teori yang diajukan."
                        columns={hypothesisCols}
                        data={hypothesisRows}
                        rowKey={(r) => r.hypothesis}
                        highlightedValue={highlightedNumber}
                      />

                      <Chapter4InterpretationCard
                        tableNumber="Tabel 4.11"
                        intinya={
                          hypothesisRows.every((h) => h.isAccepted)
                            ? 'Seluruh hipotesis penelitian yang diajukan terbukti diterima secara signifikan pada taraf signifikansi α = 0,05.'
                            : `Sebanyak ${hypothesisRows.filter((h) => h.isAccepted).length} dari ${hypothesisRows.length} hipotesis penelitian terbukti diterima secara statistik.`
                        }
                        interpretation={
                          results.explanations.hypotheses ||
                          `Berdasarkan ringkasan Tabel 4.11, pengujian hipotesis secara empiris memperlihatkan penerimaan dan penolakan hipotesis penelitian berdasarkan kriteria signifikansi (p < 0,05) serta perbandingan nilai statistik uji terhadap nilai tabel distribusi.`
                        }
                        guidingQuestions={[
                          'Hipotesis mana saja yang terbukti diterima dan hipotesis mana yang ditolak?',
                          'Apakah arah pengaruh empiris (positif/negatif) selaras dengan kajian teori awal Anda?',
                          'Faktor kontekstual apa di lapangan yang menjelaskan mengapa suatu hipotesis diterima atau ditolak?',
                        ]}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    </div>
                  )}

                {/* Bekal Sidang Skripsi */}
                <ThesisDefenseCompanion
                  testType="regression"
                  dataMetrics={{
                    n: results.respondentCount,
                    df: results.respondentCount - (results.regression?.length || 3),
                    fHitung: results.fTest?.fHitung,
                    fTabel: results.fTest?.fTabel,
                    rSquare: results.determination?.rSquare,
                    tHitung: results.regression?.[1]?.tHitung,
                    tTabel: results.regression?.[1]?.tTabel,
                  }}
                />
                </ProResultBlur>
              </TabsContent>

              {/* 6. KORELASI PEARSON */}
              <TabsContent value="correlation" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Korelasi Pearson Product Moment"
                  reason="Matriks korelasi Pearson dan signifikansi p-value antar variabel lengkap tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  <ResultTable
                    tableNumber="Tabel 4.12"
                    title="Matriks Korelasi Pearson Antar Variabel Penelitian"
                    note={`Korelasi diuji pada tingkat signifikansi α = 0,05 (dua arah, N = ${results.respondentCount}).`}
                    columns={correlationCols}
                    data={results.correlation || []}
                    rowKey={(r) => `${r.variable1}-${r.variable2}`}
                    highlightedValue={highlightedNumber}
                  />

                  <Chapter4InterpretationCard
                    tableNumber="Tabel 4.12"
                    intinya={correlationIntinya}
                    interpretation={results.explanations.correlation}
                    guidingQuestions={[
                      'Bagaimana tingkat keeratan (derajat korelasi) antar masing-masing variabel penelitian?',
                      'Apakah arah korelasi seluruh variabel bersifat positif linier searah?',
                      'Apakah terdapat variabel dengan korelasi yang sangat tinggi (r > 0,80) yang berpotensi multikolinearitas?',
                    ]}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />
                </ProResultBlur>
              </TabsContent>

              {/* 7. PAIRED SAMPLE T-TEST & N-GAIN */}
              <TabsContent value="paired-ttest" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Paired Sample t-Test & N-Gain"
                  reason="Nilai t-hitung perlakuan, taraf signifikansi p-value, dan skor N-Gain efektivitas pembelajaran tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {results.pairedTTest && (
                    <div className="space-y-4">
                      <ResultTable
                        tableNumber="Tabel 4.11"
                        title="Hasil Uji Beda Rata-rata Berpasangan (Paired Sample t-Test)"
                        note={`Taraf signifikansi α = 0,05 (uji 2 sisi). Derajat kebebasan df = N - 1 = ${results.pairedTTest.df}. Korelasi r = ${formatNumber(results.pairedTTest.correlation, 3)} (Sig. = ${formatNumber(results.pairedTTest.sigCorrelation, 4)}).`}
                        columns={pairedTTestCols}
                        data={[results.pairedTTest]}
                        rowKey={() => 'paired-1'}
                        highlightedValue={highlightedNumber}
                      />

                      {results.explanations.pairedTTest && (
                        <ExplanationBox
                          title="Interpretasi Paired Sample t-Test"
                          summarySentence={
                            results.pairedTTest.significant
                              ? `Nilai t hitung ${formatNumber(results.pairedTTest.tHitung, 3)} > t tabel ${formatNumber(results.pairedTTest.tTabel, 3)} (Sig. = ${formatNumber(results.pairedTTest.pValue, 4)} < 0,05) membuktikan perlakuan berpengaruh secara signifikan.`
                              : `Nilai t hitung ${formatNumber(results.pairedTTest.tHitung, 3)} tidak melampaui t tabel (Sig. ≥ 0,05).`
                          }
                          explanation={results.explanations.pairedTTest}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}

                      <ThesisDefenseCompanion
                        testType="paired-ttest"
                        dataMetrics={{
                          n: results.respondentCount,
                          df: results.pairedTTest.df,
                          tHitung: results.pairedTTest.tHitung,
                          tTabel: results.pairedTTest.tTabel,
                        }}
                      />
                    </div>
                  )}

                  {results.nGain && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <ResultTable
                        tableNumber="Tabel 4.12"
                        title="Hasil Analisis Efektivitas Pembelajaran (N-Gain Score & Persen)"
                        note={`* Skor ideal maksimal = ${results.nGain.idealMaxScore}. Formula N-Gain = (%Post - %Pre) / (100 - %Pre). Klasifikasi Hake (1998) & Kriteria Efektivitas Meltzer (2002).`}
                        columns={nGainCols}
                        data={[results.nGain]}
                        rowKey={() => 'ngain-1'}
                        highlightedValue={highlightedNumber}
                      />

                      {/* Distribusi Kategori Hake & Meltzer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Distribusi Kategori Hake (1998)
                          </span>
                          <div className="space-y-1.5 text-xs">
                            {results.nGain.hakeDistribution.map((dist) => (
                              <div key={dist.category} className="flex items-center justify-between">
                                <span className="text-foreground">{dist.category} (g {dist.category === 'Tinggi' ? '≥ 0,70' : dist.category === 'Sedang' ? '0,30 - 0,69' : '< 0,30'}):</span>
                                <Badge variant={dist.category === 'Tinggi' ? 'pine' : dist.category === 'Sedang' ? 'amber' : 'secondary'}>
                                  {dist.count} siswa ({formatNumber(dist.percentage, 1)}%)
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Distribusi Tafsiran Meltzer (2002)
                          </span>
                          <div className="space-y-1.5 text-xs">
                            {results.nGain.meltzerDistribution.map((dist) => (
                              <div key={dist.category} className="flex items-center justify-between">
                                <span className="text-foreground">{dist.category}:</span>
                                <Badge variant={dist.category === 'Efektif' ? 'pine' : dist.category === 'Cukup Efektif' ? 'brand' : 'amber'}>
                                  {dist.count} siswa ({formatNumber(dist.percentage, 1)}%)
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {results.explanations.ngain && (
                        <ExplanationBox
                          title="Interpretasi Uji N-Gain Score"
                          summarySentence={`Nilai rata-rata N-Gain sebesar ${formatNumber(results.nGain.meanNGainScore, 3)} (${formatNumber(results.nGain.meanNGainPercent, 1)}%) termasuk dalam kategori "${results.nGain.hakeCategory}" dan tingkat efektivitas "${results.nGain.meltzerCategory}".`}
                          explanation={results.explanations.ngain}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}

                      <ThesisDefenseCompanion
                        testType="ngain"
                        dataMetrics={{
                          nGainScore: results.nGain.meanNGainScore,
                          nGainPercent: results.nGain.meanNGainPercent,
                          hakeCategory: results.nGain.hakeCategory,
                          meltzerCategory: results.nGain.meltzerCategory,
                        }}
                      />
                    </div>
                  )}
                </ProResultBlur>
              </TabsContent>

              {/* 8. INDEPENDENT SAMPLE T-TEST */}
              <TabsContent value="independent-ttest" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Independent Sample t-Test & Uji Homogenitas Levene"
                  reason="Uji homogenitas Levene, nilai t-hitung kelompok bebas, dan draf pembahasan Bab 4 lengkap tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {results.independentTTest && (
                    <div className="space-y-6">
                      {/* Ringkasan Statistik Kelompok */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Statistik Deskriptif Kelompok</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {results.independentTTest.groups.map((grp) => (
                            <div key={grp.groupName} className="p-4 rounded-xl border border-border bg-card space-y-1">
                              <div className="font-semibold text-foreground text-sm">{grp.groupName}</div>
                              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pt-2">
                                <div>N: <span className="font-mono font-medium text-foreground">{grp.n}</span></div>
                                <div>Mean: <span className="font-mono font-medium text-foreground">{formatNumber(grp.mean, 3)}</span></div>
                                <div>Std. Deviasi: <span className="font-mono font-medium text-foreground">{formatNumber(grp.stdDev, 3)}</span></div>
                                <div>Std. Error: <span className="font-mono font-medium text-foreground">{formatNumber(grp.stdError, 3)}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <ResultTable
                        tableNumber="Tabel 4.13"
                        title="Hasil Uji Beda Dua Kelompok Bebas (Independent Samples t-Test)"
                        note={`* Uji Homogenitas Levene: F = ${formatNumber(results.independentTTest.levene.fStatistic, 3)}, Sig. = ${formatNumber(results.independentTTest.levene.pValue, 4)}. Baris yang ditandai bintang (★ Rekomendasi) adalah baris yang sah digunakan sesuai hasil uji Levene.`}
                        columns={independentTTestCols}
                        data={results.independentTTest.rows.map((row, idx) => ({
                          ...row,
                          fLevene: idx === 0 ? results.independentTTest!.levene.fStatistic : '-',
                          sigLevene: idx === 0 ? results.independentTTest!.levene.pValue : '-',
                        }))}
                        rowKey={(r) => r.assumption}
                        highlightedValue={highlightedNumber}
                      />

                      {results.explanations.independentTTest && (
                        <Chapter4InterpretationCard
                          tableNumber="Tabel 4.13"
                          intinya={
                            results.independentTTest.recommendedRow.pValue < 0.05
                              ? `Terdapat perbedaan yang signifikan antara kedua kelompok (t = ${formatNumber(results.independentTTest.recommendedRow.tHitung, 3)}, Sig. = ${formatNumber(results.independentTTest.recommendedRow.pValue, 4)} < 0,05).`
                              : `Tidak terdapat perbedaan signifikan antara kedua kelompok (Sig. ≥ 0,05).`
                          }
                          interpretation={results.explanations.independentTTest}
                          guidingQuestions={[
                            'Apakah asumsi homogenitas varians terpenuhi berdasarkan hasil Uji Levene?',
                            'Kelompok manakah yang memiliki skor rata-rata (mean) lebih unggul secara empiris?',
                            'Apakah perbedaan antar kelompok tersebut bermakna secara praktis dalam konteks penelitian Anda?',
                          ]}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}

                      <ThesisDefenseCompanion
                        testType="independent-ttest"
                        dataMetrics={{
                          n: results.respondentCount,
                          df: results.independentTTest.recommendedRow.df,
                          leveneSig: results.independentTTest.levene.pValue,
                          tHitung: results.independentTTest.recommendedRow.tHitung,
                        }}
                      />
                    </div>
                  )}
                </ProResultBlur>
              </TabsContent>

              {/* 9. ONE-WAY ANOVA */}
              <TabsContent value="oneway-anova" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="One-Way ANOVA & Uji Lanjutan Post-Hoc"
                  reason="Nilai F-hitung ANOVA, taraf signifikansi p-value, dan perbandingan berganda Post-Hoc Tukey HSD tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {results.oneWayAnova && (
                    <div className="space-y-6">
                      <ResultTable
                        tableNumber="Tabel 4.14"
                        title="Hasil Analisis Varians Satu Jalur (One-Way ANOVA)"
                        note={`F tabel (df1 = ${results.oneWayAnova.dfBetween}, df2 = ${results.oneWayAnova.dfWithin}, α = 0,05) = ${formatNumber(results.oneWayAnova.fTabel, 3)}. Kriteria: F hitung > F tabel dan Sig. < 0,05.`}
                        columns={oneWayAnovaCols}
                        data={[
                          {
                            source: 'Between Groups (Antar Kelompok)',
                            ss: results.oneWayAnova.ssBetween,
                            df: results.oneWayAnova.dfBetween,
                            ms: results.oneWayAnova.msBetween,
                            f: results.oneWayAnova.fHitung,
                            sig: results.oneWayAnova.pValue,
                          },
                          {
                            source: 'Within Groups (Dalam Kelompok)',
                            ss: results.oneWayAnova.ssWithin,
                            df: results.oneWayAnova.dfWithin,
                            ms: results.oneWayAnova.msWithin,
                            f: '-',
                            sig: '-',
                          },
                          {
                            source: 'Total',
                            ss: results.oneWayAnova.ssTotal,
                            df: results.oneWayAnova.dfTotal,
                            ms: 0,
                            f: '-',
                            sig: '-',
                          },
                        ]}
                        rowKey={(r) => r.source}
                        highlightedValue={highlightedNumber}
                      />

                      {/* Uji Post-Hoc Tukey HSD jika ada */}
                      {results.oneWayAnova.postHocTukey && results.oneWayAnova.postHocTukey.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">
                              Uji Lanjutan Post-Hoc Perbandingan Berganda (Tukey HSD)
                            </h4>
                            <Badge variant="outline" className="text-xs">Post-Hoc Tukey</Badge>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="p-2.5 font-semibold text-foreground">(I) Kelompok</th>
                                  <th className="p-2.5 font-semibold text-foreground">(J) Kelompok</th>
                                  <th className="p-2.5 font-semibold text-right text-foreground">Mean Diff (I-J)</th>
                                  <th className="p-2.5 font-semibold text-right text-foreground">Std. Error</th>
                                  <th className="p-2.5 font-semibold text-right text-foreground">Sig.</th>
                                  <th className="p-2.5 font-semibold text-center text-foreground">Kesimpulan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border font-mono">
                                {results.oneWayAnova.postHocTukey.map((thsd, idx) => (
                                  <tr key={idx} className="hover:bg-muted/30">
                                    <td className="p-2.5 font-sans font-medium text-foreground">{thsd.groupI}</td>
                                    <td className="p-2.5 font-sans text-muted-foreground">{thsd.groupJ}</td>
                                    <td className="p-2.5 text-right font-medium text-foreground">{formatNumber(thsd.meanDiff, 3)}</td>
                                    <td className="p-2.5 text-right text-muted-foreground">{formatNumber(thsd.stdError, 3)}</td>
                                    <td className="p-2.5 text-right font-semibold">{formatNumber(thsd.pValue, 4)}</td>
                                    <td className="p-2.5 text-center font-sans">
                                      <Badge variant={thsd.significant ? 'pine' : 'secondary'} className="text-[11px]">
                                        {thsd.significant ? 'Berbeda Nyata' : 'Tidak Berbeda'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {results.explanations.oneWayAnova && (
                        <Chapter4InterpretationCard
                          tableNumber="Tabel 4.14"
                          intinya={
                            results.oneWayAnova.significant
                              ? `Nilai F hitung ${formatNumber(results.oneWayAnova.fHitung, 3)} > F tabel ${formatNumber(results.oneWayAnova.fTabel, 3)} (Sig. = ${formatNumber(results.oneWayAnova.pValue, 4)} < 0,05) membuktikan terdapat perbedaan rata-rata yang signifikan antar kelompok.`
                              : `Nilai F hitung ${formatNumber(results.oneWayAnova.fHitung, 3)} tidak melampaui F tabel (Sig. ≥ 0,05).`
                          }
                          interpretation={results.explanations.oneWayAnova}
                          guidingQuestions={[
                            'Apakah variasi skor antar kelompok lebih besar secara signifikan dibandingkan variasi di dalam kelompok?',
                            'Berdasarkan uji lanjutan Post-Hoc Tukey HSD, pasangan kelompok mana saja yang berbeda secara nyata?',
                            'Apa implikasi temuan perbedaan rata-rata ini terhadap pengambilan kebijakan atau saran praktis skripsi?',
                          ]}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}

                      <ThesisDefenseCompanion
                        testType="oneway-anova"
                        dataMetrics={{
                          n: results.respondentCount,
                          df: results.oneWayAnova.dfBetween,
                          fHitung: results.oneWayAnova.fHitung,
                          fTabel: results.oneWayAnova.fTabel,
                        }}
                      />
                    </div>
                  )}
                </ProResultBlur>
              </TabsContent>

              {/* 10. UJI NON-PARAMETRIK */}
              <TabsContent value="nonparametric" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Uji Non-Parametrik Alternatif"
                  reason="Uji Wilcoxon Signed-Rank, Mann-Whitney U, dan Kruskal-Wallis tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {results.nonParametric && (
                    <div className="space-y-6">
                      <ResultTable
                        tableNumber="Tabel 4.15"
                        title="Hasil Pengujian Statistik Non-Parametrik Alternatif"
                        note={`Metode alternatif bebas asumsi distribusi normalitas: ${results.nonParametric.testName}. Alasan peralihan: ${results.nonParametric.reason}.`}
                        columns={nonParametricCols}
                        data={[results.nonParametric]}
                        rowKey={(r) => r.testName}
                        highlightedValue={highlightedNumber}
                      />

                      {results.explanations.nonParametric && (
                        <ExplanationBox
                          title={`Interpretasi Uji ${results.nonParametric.testName}`}
                          summarySentence={results.nonParametric.conclusion}
                          explanation={results.explanations.nonParametric}
                          onHoverNumber={setHighlightedNumber}
                          activeNumber={highlightedNumber}
                        />
                      )}

                      <ThesisDefenseCompanion
                        testType="nonparametric"
                        dataMetrics={{
                          n: results.respondentCount,
                          ksSig: 0.02,
                        }}
                      />
                    </div>
                  )}
                </ProResultBlur>
              </TabsContent>

              {/* 11. TABULASI SILANG, CHI-SQUARE, & ESTIMASI RISIKO */}
              <TabsContent value="crosstab" className="space-y-6 mt-4">
                <ProResultBlur
                  isLocked={isFree && !isSample}
                  isSample={isSample}
                  testName="Tabulasi Silang, Chi-Square, & Odds Ratio"
                  reason="Uji Pearson Chi-Square, Fisher's Exact Test, Continuity Correction, dan estimasi risiko Odds Ratio (OR) 95% CI tersedia pada Paket Bulanan & Paket Skripsi."
                >
                  {results.crosstab && results.chiSquare && (
                  <div className="space-y-6">
                    {/* APA 7th Matriks Tabulasi Silang */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                        <div>
                          <span className="text-xs font-bold text-primary font-mono uppercase tracking-wider block">
                            Tabel 4.15a (Format Baku APA 7th Edition)
                          </span>
                          <h3 className="text-base font-bold text-foreground font-serif">
                            Hasil Tabulasi Silang {results.crosstab.rowVar} dan {results.crosstab.colVar}
                          </h3>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          Total N = {results.crosstab.totalN}
                        </Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse tabular-nums">
                          <thead>
                            <tr className="border-t-[1.5pt] border-b border-foreground/90 font-bold">
                              <th className="py-2.5 px-3 text-left">{results.crosstab.rowVar}</th>
                              <th className="py-2.5 px-3 text-left">Keterangan</th>
                              {results.crosstab.colCategories.map((col) => (
                                <th key={col} className="py-2.5 px-3 text-right">{col}</th>
                              ))}
                              <th className="py-2.5 px-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.crosstab.rowCategories.map((rowCat, rIdx) => {
                              const rowTotal = results.crosstab!.rowTotals[rIdx];
                              return (
                                <React.Fragment key={rowCat}>
                                  <tr className="border-t border-border/60 hover:bg-muted/30">
                                    <td rowSpan={3} className="py-2.5 px-3 font-semibold text-foreground align-top">
                                      {rowCat}
                                    </td>
                                    <td className="py-1 px-3 text-muted-foreground">Count (Frekuensi Aktual)</td>
                                    {results.crosstab!.colCategories.map((_, cIdx) => (
                                      <td key={cIdx} className="py-1 px-3 text-right font-bold text-foreground">
                                        {results.crosstab!.matrix[rIdx][cIdx]}
                                      </td>
                                    ))}
                                    <td className="py-1 px-3 text-right font-bold text-foreground">{rowTotal}</td>
                                  </tr>
                                  <tr className="hover:bg-muted/30">
                                    <td className="py-1 px-3 text-muted-foreground">Expected Count (Frekuensi Harapan)</td>
                                    {results.crosstab!.colCategories.map((_, cIdx) => (
                                      <td key={cIdx} className="py-1 px-3 text-right text-muted-foreground">
                                        {formatNumber(results.crosstab!.expectedMatrix[rIdx][cIdx], 1)}
                                      </td>
                                    ))}
                                    <td className="py-1 px-3 text-right text-muted-foreground font-semibold">
                                      {formatNumber(rowTotal, 1)}
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-muted/30">
                                    <td className="py-1 px-3 text-muted-foreground">% dalam {results.crosstab!.rowVar}</td>
                                    {results.crosstab!.colCategories.map((_, cIdx) => (
                                      <td key={cIdx} className="py-1 px-3 text-right text-foreground">
                                        {formatNumber(results.crosstab!.rowPercentages[rIdx][cIdx], 1)}%
                                      </td>
                                    ))}
                                    <td className="py-1 px-3 text-right text-foreground">100,0%</td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                            <tr className="border-t border-b-[1.5pt] border-foreground/90 font-bold bg-muted/20">
                              <td rowSpan={2} className="py-2.5 px-3 align-top">Total</td>
                              <td className="py-1 px-3">Count</td>
                              {results.crosstab.colCategories.map((_, cIdx) => (
                                <td key={cIdx} className="py-1 px-3 text-right">
                                  {results.crosstab!.colTotals[cIdx]}
                                </td>
                              ))}
                              <td className="py-1 px-3 text-right">{results.crosstab.totalN}</td>
                            </tr>
                            <tr className="border-b-[1.5pt] border-foreground/90 font-semibold bg-muted/20 text-muted-foreground">
                              <td className="py-1 px-3">Expected Count</td>
                              {results.crosstab.colCategories.map((_, cIdx) => (
                                <td key={cIdx} className="py-1 px-3 text-right">
                                  {formatNumber(results.crosstab!.colTotals[cIdx], 1)}
                                </td>
                              ))}
                              <td className="py-1 px-3 text-right text-foreground font-bold">
                                {formatNumber(results.crosstab.totalN, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic">
                        Catatan: Tabel berstandar APA 7th Edition tanpa garis vertikal. N = {results.crosstab.totalN} responden.
                      </p>
                    </div>

                    {/* Chi-Square Tests Table */}
                    {(() => {
                      const cs = results.chiSquare;
                      const is2x2 = results.crosstab.rowCategories.length === 2 && results.crosstab.colCategories.length === 2;
                      const hasCellLt5 = cs.minExpectedCount < 5;

                      const csData: Array<{
                        test: string;
                        value: number | string;
                        df: number | string;
                        sig: number;
                        exactSig?: number;
                        significant: boolean;
                        isRecommended: boolean;
                      }> = [
                        {
                          test: 'Pearson Chi-Square',
                          value: cs.pearsonChiSquare,
                          df: cs.df,
                          sig: cs.pearsonSig,
                          significant: cs.pearsonSig < 0.05,
                          isRecommended: !is2x2 || !hasCellLt5,
                        },
                      ];
                      if (cs.continuityCorrection !== undefined) {
                        csData.push({
                          test: "Continuity Correction (Yates' Correction)",
                          value: cs.continuityCorrection,
                          df: 1,
                          sig: cs.continuityCorrectionSig || 0,
                          significant: (cs.continuityCorrectionSig || 0) < 0.05,
                          isRecommended: is2x2 && !hasCellLt5,
                        });
                      }
                      if (cs.likelihoodRatio !== undefined) {
                        csData.push({
                          test: 'Likelihood Ratio',
                          value: cs.likelihoodRatio,
                          df: cs.df,
                          sig: cs.likelihoodRatioSig || 0,
                          significant: (cs.likelihoodRatioSig || 0) < 0.05,
                          isRecommended: false,
                        });
                      }
                      if (cs.fisherExact !== undefined) {
                        csData.push({
                          test: "Fisher's Exact Test",
                          value: '-',
                          df: '-',
                          sig: cs.fisherExact,
                          exactSig: cs.fisherExact,
                          significant: cs.fisherExact < 0.05,
                          isRecommended: is2x2 && hasCellLt5,
                        });
                      }

                      return (
                        <ResultTable
                          tableNumber="Tabel 4.15b"
                          title="Hasil Pengujian Asosiasi Independensi Chi-Square dan Fisher's Exact Test"
                          note={cs.cochranFootnote}
                          columns={chiSquareTableCols}
                          data={csData}
                          rowKey={(r) => r.test}
                          highlightedValue={highlightedNumber}
                        />
                      );
                    })()}

                    {/* Risk Estimate (Odds Ratio) if 2x2 */}
                    {results.riskEstimate && (
                      <ResultTable
                        tableNumber="Tabel 4.15c"
                        title={`Estimasi Risiko Epidemiologi (Odds Ratio & Relative Risk) untuk ${results.riskEstimate.exposureVar}`}
                        note="Tingkat kepercayaan 95% Confidence Interval (metode Woolf/Logit)."
                        columns={riskEstimateTableCols}
                        data={[
                          {
                            measure: `Odds Ratio (OR) untuk ${results.riskEstimate.exposureVar}`,
                            value: results.riskEstimate.oddsRatio,
                            ciLower: results.riskEstimate.ciLower,
                            ciUpper: results.riskEstimate.ciUpper,
                            isSignificantRisk: results.riskEstimate.isSignificantRisk,
                            isProtective: results.riskEstimate.isProtective,
                          },
                          {
                            measure: `Relative Risk (RR) untuk Kohort ${results.crosstab.colCategories[0]}`,
                            value: results.riskEstimate.forCohortRisk1,
                            ciLower: results.riskEstimate.forCohortRisk1CiLower,
                            ciUpper: results.riskEstimate.forCohortRisk1CiUpper,
                            isSignificantRisk: results.riskEstimate.forCohortRisk1CiLower > 1.0,
                            isProtective: results.riskEstimate.forCohortRisk1CiUpper < 1.0,
                          },
                          {
                            measure: `Relative Risk (RR) untuk Kohort ${results.crosstab.colCategories[1]}`,
                            value: results.riskEstimate.forCohortRisk2,
                            ciLower: results.riskEstimate.forCohortRisk2CiLower,
                            ciUpper: results.riskEstimate.forCohortRisk2CiUpper,
                            isSignificantRisk: results.riskEstimate.forCohortRisk2CiLower > 1.0,
                            isProtective: results.riskEstimate.forCohortRisk2CiUpper < 1.0,
                          },
                        ]}
                        rowKey={(r) => r.measure}
                        highlightedValue={highlightedNumber}
                      />
                    )}

                    {/* Symmetric Measures Table */}
                    {results.symmetricMeasures && (() => {
                      const sm = results.symmetricMeasures;
                      const smRows: Array<{
                        measure: string;
                        value: number | string;
                        pValue: number;
                        category: string;
                      }> = [];

                      if (sm.phi !== undefined) {
                        smRows.push({
                          measure: 'Phi (φ)',
                          value: sm.phi,
                          pValue: sm.pValue,
                          category: sm.phiStrength || '-',
                        });
                      }
                      smRows.push(
                        {
                          measure: "Cramer's V",
                          value: sm.cramersV,
                          pValue: sm.pValue,
                          category: sm.cramersVStrength,
                        },
                        {
                          measure: 'Contingency Coefficient (C)',
                          value: sm.contingencyCoeff,
                          pValue: sm.pValue,
                          category: sm.contingencyCoeffStrength,
                        }
                      );

                      return (
                        <ResultTable
                          tableNumber="Tabel 4.15d"
                          title="Koefisien Kekuatan Hubungan (Symmetric Measures)"
                          note="Ukuran keeratan asosiasi variabel nominal."
                          columns={symmetricMeasuresTableCols}
                          data={smRows}
                          rowKey={(r) => r.measure}
                          highlightedValue={highlightedNumber}
                        />
                      );
                    })()}

                    {/* Interpretasi Naratif Akademik Tabel 4.15 */}
                    {results.explanations.chiSquare && (
                      <Chapter4InterpretationCard
                        tableNumber="Tabel 4.15"
                        intinya={results.chiSquare.conclusion}
                        interpretation={results.explanations.chiSquare}
                        guidingQuestions={[
                          'Apakah kaidah Cochran terpenuhi (sel dengan frekuensi harapan < 5 kurang dari 20%)?',
                          'Apakah terdapat hubungan asosiasi yang bermakna antara kedua variabel kategorik?',
                          'Jika berupa tabel 2x2, berapa nilai Odds Ratio (OR) atau Relative Risk (RR) dan batas 95% Confidence Interval-nya?',
                        ]}
                        onHoverNumber={setHighlightedNumber}
                        activeNumber={highlightedNumber}
                      />
                    )}

                    {/* Bekal Sidang Skripsi */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ThesisDefenseCompanion
                        testType="chisquare"
                        dataMetrics={{
                          n: results.respondentCount,
                          df: results.chiSquare.df,
                          chiSquareValue: results.chiSquare.pearsonChiSquare,
                          chiSquareSig: results.chiSquare.pearsonSig,
                          fisherSig: results.chiSquare.fisherExact,
                          minExpectedCount: results.chiSquare.minExpectedCount,
                          cellsLessThan5Count: results.chiSquare.cellsLessThan5Count,
                          cellsLessThan5Percent: results.chiSquare.cellsLessThan5Percent,
                        }}
                      />
                      <ThesisDefenseCompanion
                        testType="odds-ratio"
                        dataMetrics={{
                          n: results.respondentCount,
                          oddsRatio: results.riskEstimate?.oddsRatio,
                          orCiLower: results.riskEstimate?.ciLower,
                          orCiUpper: results.riskEstimate?.ciUpper,
                        }}
                      />
                    </div>
                  </div>
                )}
                </ProResultBlur>
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
            results={results}
            projectTitle={project?.title}
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
      )}

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
        onOpenReferenceTables={() => setShowReferenceTables(true)}
      />

      {/* Statistical Reference Tables Dialog (Ber-Stabilo Otomatis) */}
      <StatisticalReferenceTablesDialog
        open={showReferenceTables}
        onOpenChange={setShowReferenceTables}
        respondentCount={results.respondentCount}
        predictorCount={
          results.regression
            ? results.regression.filter((r) => r.variable !== '(Konstanta)').length
            : 2
        }
        rTabel={results.validity?.[0]?.rTabel}
        tTabel={results.tTabel}
        fTabel={results.fTabel}
      />

      {/* Chapter 4 Async Word & PDF Exporter Modal */}
      <Chapter4AsyncExportModal
        open={chapter4ModalOpen}
        onOpenChange={setChapter4ModalOpen}
        results={results}
        projectTitle={project?.title}
        onCopyAllTables={handleCopyAllTables}
        initialFormat={chapter4ExportFormat}
      />
    </div>
  );
}
