'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Activity,
  Zap,
  Loader2,
  Database,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Lock,
  Sparkles,
  TrendingUp,
  GitCompare,
  BarChart3,
  SlidersHorizontal,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';

import { useWizardStore, type WizardStep } from '@/stores/wizard-store';
import { FileDropzone } from '@/components/file-dropzone';
import { DataPreviewTable, type TargetCell } from '@/components/data-preview-table';
import { IssueList } from '@/components/issue-list';
import { VariableMapper } from '@/components/variable-mapper';
import { StepIndicator } from '@/components/step-indicator';
import { computeDeterministicStats } from '@/lib/stats-engine';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME, ENGINE_VERSION } from '@/lib/constants';
import { COPY } from '@/lib/copy';
import { formatNumber } from '@/lib/format';
import { mockTestOptions } from '@/lib/mock/results';
import { mockDataset, mockIssues } from '@/lib/mock/dataset-contoh';
import { getProject } from '@/lib/api';
import type { Project, TestType } from '@/lib/api/types';
import { useToast } from '@/components/ui/toaster';
import { usePlanGate, isSampleProject } from '@/lib/entitlements';

interface AnalisisPageProps {
  params: Promise<{ id: string }>;
}

const STEP_LABELS = [
  'Unggah Berkas',
  'Temuan Data',
  'Pertanyaan Penelitian',
  'Cek Kesiapan',
  'Hasil Bab 4',
];

const ANALYSIS_EXECUTION_STEPS = [
  '1/6 Validasi struktur matriks dan konsistensi data responden',
  '2/6 Menghitung korelasi Pearson & uji validitas (df = N-2)',
  '3/6 Menguji reliabilitas instrumen Cronbach\'s Alpha per variabel',
  '4/6 Menguji asumsi klasik (Normalitas Lilliefors, Multikolinearitas VIF, Heteroskedastisitas Glejser)',
  '5/6 Mengestimasi model regresi OLS, uji F simultan & uji t parsial',
  '6/6 Menyusun tabel format APA 7th dan narasi akademik Bab 4',
];

export default function AnalisisPage({ params }: AnalisisPageProps) {
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    setProjectId,
    fileName,
    fileSize,
    fileData,
    setFileData,
    columns,
    usingSampleData,
    issues,
    removedRows,
    dataVersion,
    reverseItems,
    calculationMethod,
    setCalculationMethod,
    datasetMeta,
    researchDesign,
    setResearchDesign,
    preCol,
    postCol,
    groupCol,
    scoreCol,
    idealMaxScore,
    setComparativeMapping,
    rowCol,
    colCol,
    setCategoricalMapping,
    constructs,
    setConstructs,
    selectedTests,
    setSelectedTests,
    removeRowByNumber,
    removeRowsByNumbers,
    isRunning,
    setRunning,
    setRunId,
    setDatasetId,
    setCurrentResults,
    columnRoles,
  } = useWizardStore();

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams?.get('contoh') === '1';
  const isSample = isSampleProject(projectId) || isDemoParam || usingSampleData;
  const { isFree, isTestLocked, openUpgradeModal } = usePlanGate(projectId, isSample);

  const handleResetDemo = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`olahdata_results_${projectId}`);
        localStorage.removeItem('olahdata_results_sample');
      } catch {
        // ignore
      }
    }
    useWizardStore.getState().resetWizard();
    useWizardStore.getState().setFileData(
      'data_kuesioner_contoh_120.csv',
      [...mockDataset],
      Object.keys(mockDataset[0] || {}),
      true,
      14500
    );
    useWizardStore.getState().setIssues(mockIssues);
    useWizardStore.getState().setStep(1);
    toast({
      title: 'Data contoh berhasil direset',
      description: 'Dataset simulasi telah dikembalikan ke kondisi awal (N = 120 responden).',
      variant: 'success',
    });
  };

  const handleUseMyOwnData = () => {
    useWizardStore.getState().resetWizard();
    useWizardStore.getState().setStep(0);
  };
  const [project, setProject] = React.useState<Project | null>(null);
  const [targetCell, setTargetCell] = React.useState<TargetCell | null>(null);
  const [currentExecutionStep, setCurrentExecutionStep] = React.useState(0);

  // Advanced Options State (Folded accordion in Screen 4)
  const [alphaLevel, setAlphaLevel] = React.useState<0.05 | 0.01>(0.05);
  const [reliabilityThreshold, setReliabilityThreshold] = React.useState<0.7 | 0.6>(0.7);
  const [numberFormat, setNumberFormat] = React.useState<'id' | 'en'>('id');
  const [enableDurbinWatson, setEnableDurbinWatson] = React.useState<boolean>(false);

  // Initialize Project in store
  React.useEffect(() => {
    setProjectId(projectId);
    getProject(projectId).then((p) => {
      if (p) setProject(p);
    });
  }, [projectId, setProjectId]);

  // Auto-select standard tests on init
  React.useEffect(() => {
    if (selectedTests.length === 0) {
      const rec = mockTestOptions.filter((t) => t.recommended).map((t) => t.id);
      setSelectedTests(rec);
    }
  }, [selectedTests.length, setSelectedTests]);

  // Derived counts
  const criticalErrorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const independentConstructs = constructs.filter((c) => c.role === 'independent');
  const dependentConstructs = constructs.filter((c) => c.role === 'dependent');

  const isMappingValid =
    researchDesign === 'categorical'
      ? Boolean(rowCol && colCol)
      : researchDesign === 'comparative'
      ? Boolean((preCol && postCol) || (groupCol && scoreCol))
      : independentConstructs.length >= 1 && dependentConstructs.length >= 1;

  // Screening for weak items (e.g. KL5) via corrected item-total correlation
  const weakItems = React.useMemo(() => {
    if (fileData.length < 5 || constructs.length === 0) return [];
    const weak: { item: string; construct: string; r: number }[] = [];

    constructs.forEach((c) => {
      if (c.items.length >= 2) {
        const totals = fileData.map((row) =>
          c.items.reduce((sum, it) => {
            const v = Number(row[it]);
            if (isNaN(v)) return sum;
            // Check reverse
            const effective = reverseItems.includes(it) ? 6 - v : v;
            return sum + effective;
          }, 0)
        );

        c.items.forEach((it) => {
          const vals = fileData.map((row) => {
            const v = Number(row[it]);
            if (isNaN(v)) return 3;
            return reverseItems.includes(it) ? 6 - v : v;
          });
          const others = totals.map((tot, idx) => tot - vals[idx]);

          const meanV = vals.reduce((a, b) => a + b, 0) / vals.length;
          const meanO = others.reduce((a, b) => a + b, 0) / others.length;

          let num = 0;
          let denV = 0;
          let denO = 0;

          for (let i = 0; i < vals.length; i++) {
            const dv = vals[i] - meanV;
            const do_ = others[i] - meanO;
            num += dv * do_;
            denV += dv * dv;
            denO += do_ * do_;
          }

          const r = Math.sqrt(denV * denO) > 0 ? num / Math.sqrt(denV * denO) : 0;
          // Benchmark critical r approx for N=100 is ~0.196
          if (r < 0.15) {
            weak.push({ item: it, construct: c.name, r });
          }
        });
      }
    });

    return weak;
  }, [fileData, constructs, reverseItems]);

  // Traffic Light Status Calculations for Screen 4 (Cek Kesiapan)
  const sampleStatus: 'green' | 'yellow' | 'red' =
    fileData.length >= 30 ? 'green' : fileData.length >= 20 ? 'yellow' : 'red';

  const qualityStatus: 'green' | 'yellow' | 'red' =
    criticalErrorCount === 0 ? (warningCount === 0 ? 'green' : 'yellow') : 'red';

  const validityStatus: 'green' | 'yellow' | 'red' = weakItems.length === 0 ? 'green' : 'yellow';

  const itemCountStatus: 'green' | 'yellow' | 'red' =
    constructs.length > 0 && constructs.every((c) => c.items.length >= 3)
      ? 'green'
      : constructs.every((c) => c.items.length >= 2)
      ? 'yellow'
      : 'red';

  const suitabilityStatus: 'green' | 'yellow' | 'red' = isMappingValid ? 'green' : 'red';

  const hasRedLights =
    sampleStatus === 'red' ||
    qualityStatus === 'red' ||
    itemCountStatus === 'red' ||
    suitabilityStatus === 'red';

  // Handle Drop Weak Item in Screen 4
  const handleDropWeakItem = (itemName: string) => {
    const updated = constructs.map((c) => ({
      ...c,
      items: c.items.filter((it) => it !== itemName),
    }));
    setConstructs(updated);
    toast({
      title: `Pertanyaan ${itemName} Berhasil Dieliminasi`,
      description: 'Pertanyaan telah dikeluarkan dari variabel guna meningkatkan reliabilitas Alpha.',
      variant: 'default',
    });
  };

  // Run Chapter 4 Analysis
  const handleRunAnalysis = async () => {
    if (fileData.length === 0) {
      alert('Tidak ada data responden untuk dianalisis.');
      return;
    }
    if (hasRedLights) {
      alert('Terdapat indikator merah pada Cek Kesiapan. Harap selesaikan sebelum menjalankan paket Bab 4.');
      return;
    }

    setRunning(true);
    setCurrentExecutionStep(0);
    setStep(4); // Move to Screen 5

    try {
      const generatedRunId = `run-${Date.now()}`;
      setRunId(generatedRunId);
      const generatedDatasetId = `ds-${Date.now()}`;
      setDatasetId(generatedDatasetId);

      // Simulation steps for student reassurance (< 15 seconds)
      const stepDelays = [400, 500, 500, 600, 500, 400];
      for (let s = 0; s < ANALYSIS_EXECUTION_STEPS.length; s++) {
        setCurrentExecutionStep(s);
        await new Promise((r) => setTimeout(r, stepDelays[s]));
      }

      const effectiveMeta = datasetMeta || {
        fileName: fileName || 'data_kuesioner.xlsx',
        datasetId: generatedDatasetId,
        runId: generatedRunId,
        version: dataVersion,
        kind: dataVersion > 1 ? 'derived' : 'original',
        sha256: 'sha256-verified-dataset',
        rowCount: fileData.length,
        columnCount: columns.length,
        excludedRows: removedRows,
        columns: columns.map((col) => ({
          name: col,
          role: constructs.some((con) => con.items.includes(col))
            ? 'item'
            : columnRoles[col]
            ? columnRoles[col]
            : col.toLowerCase().includes('id') || col.toLowerCase() === 'no'
            ? 'id'
            : /^(jenis[\s_]?kelamin|gender|usia|umur|pendidikan|pekerjaan|jurusan|angkatan)$/i.test(col.trim())
            ? 'demographic'
            : 'ignored',
          dataType: 'number',
          missingCount: 0,
        })),
      };

      // Deterministic statistical computation
      const computed = computeDeterministicStats({
        rows: fileData,
        constructs,
        selectedTests: [
          'descriptive',
          'validity',
          'reliability',
          'normality',
          'multicollinearity',
          'heteroscedasticity',
          'regression',
          'correlation',
        ],
        reverseItems,
        calculationMethod,
        datasetMeta: effectiveMeta,
        researchDesign,
        preCol,
        postCol,
        groupCol,
        scoreCol,
        idealMaxScore,
        rowCol,
        colCol,
        projectId,
        dataVersionId: `dv-${dataVersion}`,
      });

      computed.projectId = projectId;
      computed.dataVersionId = `dv-${dataVersion}`;

      setCurrentResults(computed);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`olahdata_results_${projectId}`, JSON.stringify(computed));
          localStorage.setItem(`olahdata_run_${generatedRunId}`, JSON.stringify(computed));
        } catch {
          // localStorage fallback
        }
      }

      await new Promise((r) => setTimeout(r, 400));
      setRunning(false);

      // Navigate to comprehensive Bab 4 Results View
      const targetUrl = `/app/proyek/${projectId}/hasil?runId=${generatedRunId}`;
      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    } catch (err: unknown) {
      console.error('Computation error:', err);
      setRunning(false);
      alert('Terjadi kesalahan saat komputasi statistik: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Header */}
      <div className="border-b border-border bg-card/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href={`/app/proyek/${projectId}`}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="Kembali ke Ringkasan Proyek"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                {project?.title || 'Proyek Analisis Skripsi'}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Alur Kerja Kuesioner ke Bab 4 • {APP_NAME} Mesin Statistik v{ENGINE_VERSION}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {usingSampleData ? (
              <Badge variant="amber" className="text-xs rounded-[6px]">
                {COPY.badges.sampleData}
              </Badge>
            ) : fileData.length > 0 ? (
              <Badge variant="pine" className="text-xs rounded-[6px]">
                {formatNumber(fileData.length)} Responden
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Mode Data Contoh & Reset Demo */}
        {(usingSampleData || (isSample && fileData.length > 0)) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-foreground shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="amber" className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px]">
                  {COPY.badges.sampleData}
                </Badge>
                <h4 className="font-semibold text-sm text-foreground">
                  Anda Sedang Menggunakan Data Contoh
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[70ch]">
                Simulasi alur kuesioner ke Bab 4 dengan dataset contoh (N = 120). Anda bebas menguji eliminasi butir, filter demografi, dan menjalankan komputasi Bab 4.
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
                onClick={handleUseMyOwnData}
                className="cursor-pointer font-semibold rounded-xl min-h-[40px] px-4 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Pakai Data Saya
              </Button>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          steps={STEP_LABELS}
          onStepClick={(step) => {
            if (step < currentStep) setStep(step);
          }}
          maxAccessibleStep={currentStep}
        />

        {/* =========================================================================
            SCREEN 1: UNGGAH BERKAS (currentStep === 0)
           ========================================================================= */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 1: Unggah Berkas Kuesioner
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Unggah spreadsheet tabulasi jawaban responden Anda (.xlsx, .xls, atau .csv) atau coba langsung dengan data contoh.
              </p>
            </div>

            <FileDropzone onFileLoaded={() => setStep(1)} />

            {/* Bottom Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <Link href="/app">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Daftar Proyek
                </Link>
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {fileData.length === 0 && (
                  <span className="text-xs text-muted-foreground text-center sm:text-right font-medium">
                    Unggah berkas kuesioner Anda atau pilih data contoh untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={fileData.length === 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                >
                  Lanjut ke Temuan Data
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: TEMUAN DATA (currentStep === 1)
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Langkah 2: Temuan Kualitas Data
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                  Pemeriksaan integritas skala Likert, baris kosong, jawaban seragam, dan duplikasi data.
                </p>
              </div>
            </div>

            {/* 50-Respondent Quota Warning for Free Plan (Hard Rule #5: Waitlist mode, zero payment buttons) */}
            {!usingSampleData && isFree && fileData.length > 50 && (
              <div className="p-4 sm:p-5 rounded-[16px] border border-amber-500/30 bg-amber-500/10 text-foreground space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">
                        Dataset Memiliki {formatNumber(fileData.length)} Responden (Batas Paket Gratis: 50 Responden)
                      </h4>
                      <Badge variant="amber" className="text-[10px] flex items-center gap-1 rounded-[6px]">
                        <Lock className="w-3 h-3" />
                        Tersedia di paket Bulanan/Skripsi
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[72ch]">
                      Dataset Anda memiliki <strong className="text-foreground">{formatNumber(fileData.length)}</strong> responden. Pada paket Coba Gratis, batas pengolahan data kuesioner adalah 50 baris responden pertama. Anda dapat bergabung dengan daftar tunggu paket penuh atau melanjutkan dengan 50 responden pertama.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openUpgradeModal({
                        reason: `Analisis Penuh ${formatNumber(fileData.length)} Responden Skripsi`,
                        plan: 'monthly',
                      })
                    }
                    className="font-semibold text-xs rounded-[10px] bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Daftar Tunggu Paket untuk {formatNumber(fileData.length)} Responden
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const slicedRows = fileData.slice(0, 50);
                      setFileData(
                        fileName || 'data_kuesioner.xlsx',
                        slicedRows,
                        columns,
                        false,
                        fileSize ?? undefined,
                        datasetMeta ?? undefined
                      );
                      toast({
                        title: 'Mode 50 Responden Aktif',
                        description: 'Dataset dipotong menjadi 50 baris responden pertama untuk analisis gratis.',
                        variant: 'default',
                      });
                    }}
                    className="text-xs rounded-[10px] cursor-pointer"
                  >
                    Lanjutkan dengan 50 Responden Pertama
                  </Button>
                </div>
              </div>
            )}

            {/* Main Preview and Issue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Preview Table */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <DataPreviewTable
                  data={fileData}
                  columns={columns}
                  issues={issues}
                  targetCell={targetCell}
                  onRemoveRow={(rowNo) => removeRowByNumber(rowNo)}
                />
              </div>

              {/* Quality Issues List */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <IssueList
                  issues={issues}
                  rowCount={fileData.length}
                  columnCount={columns.length}
                  onSelectIssue={(row, col, severity) => {
                    setTargetCell({ row, col, severity });
                  }}
                  onRemoveRow={(rowNo) => removeRowByNumber(rowNo)}
                  onRemoveAllProblematicRows={(rows) => removeRowsByNumbers(rows)}
                  onReupload={() => setStep(0)}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Unggah
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {criticalErrorCount > 0 && (
                  <span className="text-xs text-destructive text-center sm:text-right font-medium">
                    Kecualikan atau perbaiki {criticalErrorCount} data bermasalah untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={criticalErrorCount > 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                >
                  Lanjut ke Pertanyaan Penelitian
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: PERTANYAAN PENELITIAN (currentStep === 2)
           ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 3: Pertanyaan Penelitian & Pemetaan Variabel
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Pilih fokus analisis skripsi Anda, lalu kelompokkan pertanyaan kuesioner ke dalam variabel bebas (X) dan terikat (Y).
              </p>
            </div>

            {/* 4 Large Selection Cards per Prompt 10 Specification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Regresi (Pengaruh variabel terhadap variabel lain) */}
              <button
                type="button"
                onClick={() => {
                  setResearchDesign('survey');
                  setSelectedTests([
                    'descriptive',
                    'validity',
                    'reliability',
                    'normality',
                    'multicollinearity',
                    'heteroscedasticity',
                    'regression',
                    'correlation',
                  ]);
                }}
                className={cn(
                  'p-4 rounded-[16px] border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between',
                  researchDesign === 'survey'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Pengaruh Variabel
                    </span>
                    <Badge variant={researchDesign === 'survey' ? 'brand' : 'outline'} className="text-[10px] rounded-[6px]">
                      Regresi X → Y
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pengaruh variabel terhadap variabel lain. Meliputi Validitas, Reliabilitas, Asumsi Klasik, dan Regresi OLS.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  {researchDesign === 'survey' ? '✓ Desain Terpilih' : 'Pilih Desain Ini'}
                </div>
              </button>

              {/* Card 2: Uji Beda (Beda antar kelompok) */}
              <button
                type="button"
                onClick={() => {
                  setResearchDesign('comparative');
                  setSelectedTests([
                    'paired-ttest',
                    'ngain',
                    'independent-ttest',
                    'nonparametric',
                    'descriptive',
                  ]);
                }}
                className={cn(
                  'p-4 rounded-[16px] border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between',
                  researchDesign === 'comparative'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <GitCompare className="w-4 h-4 text-primary" />
                      Beda Antar Kelompok
                    </span>
                    <Badge variant={researchDesign === 'comparative' ? 'brand' : 'outline'} className="text-[10px] rounded-[6px]">
                      Uji Beda
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Perbandingan nilai antar kelompok: Independent t-Test, Paired t-Test (Pre-Post), atau One-Way ANOVA.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  {researchDesign === 'comparative' ? '✓ Desain Terpilih' : 'Pilih Desain Ini'}
                </div>
              </button>

              {/* Card 3: Hubungan Antar Variabel (Korelasi) */}
              <button
                type="button"
                onClick={() => {
                  setResearchDesign('survey');
                  setSelectedTests([
                    'descriptive',
                    'validity',
                    'reliability',
                    'correlation',
                  ]);
                }}
                className={cn(
                  'p-4 rounded-[16px] border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between',
                  researchDesign === 'survey' && selectedTests.includes('correlation') && !selectedTests.includes('regression')
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary" />
                      Hubungan Variabel
                    </span>
                    <Badge variant="outline" className="text-[10px] rounded-[6px]">
                      Korelasi
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Uji keeratan asosiasi antar variabel: Korelasi Pearson Product Moment dan korelasi rank Spearman.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  {selectedTests.includes('correlation') && !selectedTests.includes('regression')
                    ? '✓ Desain Terpilih'
                    : 'Pilih Desain Ini'}
                </div>
              </button>

              {/* Card 4: Gambaran Saja (Deskriptif) */}
              <button
                type="button"
                onClick={() => {
                  setResearchDesign('survey');
                  setSelectedTests(['descriptive']);
                }}
                className={cn(
                  'p-4 rounded-[16px] border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between',
                  selectedTests.length === 1 && selectedTests[0] === 'descriptive'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Gambaran Saja
                    </span>
                    <Badge variant="outline" className="text-[10px] rounded-[6px]">
                      Deskriptif
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Statistik deskriptif: mean, median, standar deviasi, frekuensi profil responden, dan kategori Likert.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  {selectedTests.length === 1 && selectedTests[0] === 'descriptive'
                    ? '✓ Desain Terpilih'
                    : 'Pilih Desain Ini'}
                </div>
              </button>
            </div>

            {/* Variable Mapper Component */}
            <VariableMapper
              columns={columns}
              constructs={constructs}
              onChange={setConstructs}
            />

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Temuan Data
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {!isMappingValid && (
                  <span className="text-xs text-destructive text-center sm:text-right font-medium">
                    Tentukan minimal 1 Variabel Bebas (X) dan 1 Variabel Terikat (Y) untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={!isMappingValid}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                >
                  Lanjut ke Cek Kesiapan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 4: CEK KESIAPAN (currentStep === 3)
           ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 4: Cek Kesiapan Analisis Skripsi
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Pemeriksaan otomatis standar metodologi skripsi kuantitatif sebelum paket Bab 4 dijalankan.
              </p>
            </div>

            {/* 5 Traffic Light Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Lampu 1: Ukuran Sampel */}
              <div
                className={cn(
                  'p-4 rounded-[16px] border bg-card shadow-xs space-y-2.5',
                  sampleStatus === 'green'
                    ? 'border-emerald-500/30'
                    : sampleStatus === 'yellow'
                    ? 'border-amber-500/30'
                    : 'border-destructive/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    1. Ukuran Sampel Responden
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full animate-pulse',
                        sampleStatus === 'green'
                          ? 'bg-emerald-500'
                          : sampleStatus === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-destructive'
                      )}
                    />
                    <Badge
                      variant={sampleStatus === 'green' ? 'pine' : sampleStatus === 'yellow' ? 'amber' : 'destructive'}
                      className="text-[10px] rounded-[6px]"
                    >
                      {sampleStatus === 'green' ? 'Lampu Hijau' : sampleStatus === 'yellow' ? 'Lampu Kuning' : 'Lampu Merah'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {sampleStatus === 'green'
                    ? `Ukuran sampel memadai (N = ${fileData.length} responden ≥ 30). Memenuhi syarat Teorema Limit Pusat untuk analisis parametrik.`
                    : sampleStatus === 'yellow'
                    ? `Ukuran sampel (N = ${fileData.length}) memenuhi rasio minimal prediktor, namun di bawah N ≥ 30. Disarankan mencermati uji normalitas residual.`
                    : `Ukuran sampel (N = ${fileData.length}) kurang dari ambang batas minimal. Tambahkan data responden.`}
                </p>
              </div>

              {/* Lampu 2: Kualitas Data */}
              <div
                className={cn(
                  'p-4 rounded-[16px] border bg-card shadow-xs space-y-2.5',
                  qualityStatus === 'green'
                    ? 'border-emerald-500/30'
                    : qualityStatus === 'yellow'
                    ? 'border-amber-500/30'
                    : 'border-destructive/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    2. Kualitas & Kebersihan Data
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full animate-pulse',
                        qualityStatus === 'green'
                          ? 'bg-emerald-500'
                          : qualityStatus === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-destructive'
                      )}
                    />
                    <Badge
                      variant={qualityStatus === 'green' ? 'pine' : qualityStatus === 'yellow' ? 'amber' : 'destructive'}
                      className="text-[10px] rounded-[6px]"
                    >
                      {qualityStatus === 'green' ? 'Lampu Hijau' : qualityStatus === 'yellow' ? 'Lampu Kuning' : 'Lampu Merah'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {qualityStatus === 'green'
                    ? 'Data bersih: Tidak ada sel kosong, nilai di luar rentang skala, atau duplikasi identik.'
                    : qualityStatus === 'yellow'
                    ? `Tidak ada galat kritis. Terdapat ${warningCount} catatan peringatan yang telah Anda konfirmasi.`
                    : `Terdapat ${criticalErrorCount} data belum diperbaiki (sel kosong atau nilai di luar rentang skala). Selesaikan pada Langkah 2.`}
                </p>
              </div>

              {/* Lampu 3: Pertanyaan Diduga Tidak Valid */}
              <div
                className={cn(
                  'p-4 rounded-[16px] border bg-card shadow-xs space-y-2.5',
                  validityStatus === 'green' ? 'border-emerald-500/30' : 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    3. Korelasi Pertanyaan (Validitas Awal)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        validityStatus === 'green' ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    />
                    <Badge
                      variant={validityStatus === 'green' ? 'pine' : 'amber'}
                      className="text-[10px] rounded-[6px]"
                    >
                      {validityStatus === 'green' ? 'Lampu Hijau' : 'Lampu Kuning'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {validityStatus === 'green'
                    ? 'Seluruh pertanyaan memiliki korelasi awal yang kuat dan searah dengan variabelnya.'
                    : `Pertanyaan ${weakItems.map((w) => w.item).join(', ')} terdeteksi memiliki korelasi rendah (r < 0,15).`}
                </p>
                {weakItems.length > 0 && (
                  <div className="pt-1">
                    {weakItems.map((w) => (
                      <Button
                        key={w.item}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleDropWeakItem(w.item)}
                        className="text-[11px] h-7 px-2.5 rounded-[6px] border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                      >
                        Eliminasi {w.item} dari {w.construct}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lampu 4: Jumlah Pertanyaan per Variabel */}
              <div
                className={cn(
                  'p-4 rounded-[16px] border bg-card shadow-xs space-y-2.5',
                  itemCountStatus === 'green'
                    ? 'border-emerald-500/30'
                    : itemCountStatus === 'yellow'
                    ? 'border-amber-500/30'
                    : 'border-destructive/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    4. Jumlah Butir per Variabel
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        itemCountStatus === 'green'
                          ? 'bg-emerald-500'
                          : itemCountStatus === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-destructive'
                      )}
                    />
                    <Badge
                      variant={itemCountStatus === 'green' ? 'pine' : itemCountStatus === 'yellow' ? 'amber' : 'destructive'}
                      className="text-[10px] rounded-[6px]"
                    >
                      {itemCountStatus === 'green' ? 'Lampu Hijau' : itemCountStatus === 'yellow' ? 'Lampu Kuning' : 'Lampu Merah'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {itemCountStatus === 'green'
                    ? 'Seluruh variabel memiliki ≥ 3 pertanyaan yang memenuhi syarat reliabilitas instrumen.'
                    : itemCountStatus === 'yellow'
                    ? 'Beberapa variabel memiliki 2 butir pertanyaan. Diperbolehkan namun disarankan ≥ 3 butir.'
                    : 'Terdapat variabel dengan kurang dari 2 butir pertanyaan. Minimal 2 butir per variabel.'}
                </p>
              </div>

              {/* Lampu 5: Kesesuaian Desain Penelitian */}
              <div
                className={cn(
                  'p-4 rounded-[16px] border bg-card shadow-xs space-y-2.5 md:col-span-2 lg:col-span-2',
                  suitabilityStatus === 'green' ? 'border-emerald-500/30' : 'border-destructive/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    5. Kesesuaian Struktur Variabel dengan Jenis Penelitian
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        suitabilityStatus === 'green' ? 'bg-emerald-500' : 'bg-destructive'
                      )}
                    />
                    <Badge
                      variant={suitabilityStatus === 'green' ? 'pine' : 'destructive'}
                      className="text-[10px] rounded-[6px]"
                    >
                      {suitabilityStatus === 'green' ? 'Lampu Hijau' : 'Lampu Merah'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suitabilityStatus === 'green'
                    ? `Struktur variabel lengkap: ${independentConstructs.length} Variabel Bebas (X) dan ${dependentConstructs.length} Variabel Terikat (Y). Siap untuk regresi OLS dan uji hipotesis simultan & parsial.`
                    : 'Struktur variabel belum lengkap. Model membutuhkan minimal 1 Variabel Bebas (X) dan 1 Variabel Terikat (Y).'}
                </p>
              </div>
            </div>

            {/* Folded Advanced Options Accordion per Prompt 10 */}
            <details className="group border border-border rounded-[16px] bg-card p-5 transition-all">
              <summary className="cursor-pointer text-xs font-semibold text-foreground flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  Opsi Lanjutan Metodologi & Format Angka (Dilipat)
                </span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>

              <div className="mt-4 pt-4 border-t border-border/60 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tingkat Signifikansi Alpha */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <label className="font-semibold text-foreground block">
                      Taraf Signifikansi (α):
                    </label>
                    <select
                      value={alphaLevel}
                      onChange={(e) => setAlphaLevel(Number(e.target.value) as 0.05 | 0.01)}
                      className="w-full text-xs p-2 rounded border border-border bg-background text-foreground"
                    >
                      <option value={0.05}>α = 0,05 (Standar Ilmu Sosial / Bisnis)</option>
                      <option value={0.01}>α = 0,01 (Ketat / Medis & Kedokteran)</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Batas probabilitas penolakan H0 (p &lt; α).
                    </p>
                  </div>

                  {/* Ambang Batas Reliabilitas Cronbach's Alpha */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <label className="font-semibold text-foreground block">
                      Ambang Batas Reliabilitas:
                    </label>
                    <select
                      value={reliabilityThreshold}
                      onChange={(e) => setReliabilityThreshold(Number(e.target.value) as 0.7 | 0.6)}
                      className="w-full text-xs p-2 rounded border border-border bg-background text-foreground"
                    >
                      <option value={0.7}>0,70 (Standar Akademik Bawaan)</option>
                      <option value={0.6}>0,60 (Penelitian Eksploratori)</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Batas reliabel minimum Cronbach's Alpha.
                    </p>
                  </div>

                  {/* Format Gaya Angka */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <label className="font-semibold text-foreground block">
                      Gaya Format Angka:
                    </label>
                    <select
                      value={numberFormat}
                      onChange={(e) => setNumberFormat(e.target.value as 'id' | 'en')}
                      className="w-full text-xs p-2 rounded border border-border bg-background text-foreground"
                    >
                      <option value="id">Indonesia (Koma Desimal: 1.234,56)</option>
                      <option value="en">Internasional (Titik Desimal: 1,234.56)</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Format tanda desimal tabel APA 7th.
                    </p>
                  </div>

                  {/* Uji Autokorelasi Durbin-Watson Toggle */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <label className="font-semibold text-foreground block">
                      Uji Autokorelasi (Durbin-Watson):
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="toggle-dw"
                        checked={enableDurbinWatson}
                        onChange={(e) => setEnableDurbinWatson(e.target.checked)}
                        className="rounded border-border text-primary cursor-pointer"
                      />
                      <label htmlFor="toggle-dw" className="text-xs cursor-pointer select-none">
                        {enableDurbinWatson ? 'Aktif' : 'Nonaktif (Disarankan)'}
                      </label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Durbin-Watson diperuntukkan bagi data runtun waktu (time-series). Dinonaktifkan bawaan untuk kuesioner survei.
                    </p>
                  </div>
                </div>
              </div>
            </details>

            {/* Navigation & Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 pt-6 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Pemetaan
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {hasRedLights && (
                  <span className="text-xs text-destructive text-center sm:text-right font-medium">
                    Selesaikan indikator lampu merah sebelum menjalankan analisis
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={handleRunAnalysis}
                  disabled={hasRedLights || isRunning}
                  className="cursor-pointer font-bold px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-base rounded-[10px] min-h-[46px]"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Jalankan Paket Bab 4
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 5: HASIL BERURUTAN BAB 4 & PROGRESSIVE EXECUTION (currentStep === 4)
           ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="p-8 sm:p-12 rounded-[20px] border border-primary/30 bg-card shadow-lg text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Menjalankan Paket Komputasi Bab 4...
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Mesin statistik sedang memproses formula matriks regresi deterministik dan menyusun tabel format APA 7th. Perkiraan selesai: &lt; 15 detik.
                </p>
              </div>

              {/* Meaningful Progress Steps Checklist */}
              <div className="text-left space-y-2.5 pt-2">
                {ANALYSIS_EXECUTION_STEPS.map((stepText, idx) => {
                  const isDone = idx < currentExecutionStep;
                  const isCurrent = idx === currentExecutionStep;

                  return (
                    <div
                      key={stepText}
                      className={cn(
                        'p-3.5 rounded-[12px] border text-xs flex items-center gap-3 transition-all',
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium'
                          : isCurrent
                          ? 'bg-primary/10 border-primary text-primary font-semibold ring-1 ring-primary'
                          : 'bg-muted/30 border-border/40 text-muted-foreground'
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0" />
                      )}
                      <span className="truncate">{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
