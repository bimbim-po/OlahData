'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Activity,
  Sparkles,
  Loader2,
  Database,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

import { useWizardStore, type WizardStep } from '@/stores/wizard-store';
import { FileDropzone } from '@/components/file-dropzone';
import { DataPreviewTable, type TargetCell } from '@/components/data-preview-table';
import { IssueList } from '@/components/issue-list';
import { VariableMapper } from '@/components/variable-mapper';
import { TestCard } from '@/components/test-card';
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
import { getProject } from '@/lib/api';
import type { Project, TestOption, TestType } from '@/lib/api/types';
import { detectLikertTextColumns } from '@/lib/google-forms-recode';
import { useToast } from '@/components/ui/toaster';

interface AnalisisPageProps {
  params: Promise<{ id: string }>;
}

const STEP_LABELS = [
  'Unggah Data',
  'Validasi Data',
  'Petakan Variabel',
  'Pilih Uji',
  'Ringkasan & Jalankan',
];

const ANALYSIS_EXECUTION_STEPS = [
  '1/5 Validasi struktur matriks dan konsistensi data',
  '2/5 Menghitung korelasi Pearson & reliabilitas Cronbach\'s Alpha',
  '3/5 Menguji asumsi klasik (Normalitas, Multikolinearitas, Heteroskedastisitas)',
  '4/5 Menghitung regresi OLS, uji F simultan & uji t parsial',
  '5/5 Menyusun narasi interpretasi akademik terstandar',
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
    columns,
    usingSampleData,
    issues,
    removedRows,
    dataVersion,
    reverseItems,
    toggleReverseItem,
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
    toggleTest,
    removeRowByNumber,
    isRunning,
    setRunning,
    setRunId,
    setDatasetId,
    setCurrentResults,
    columnRoles,
    applyLikertRecode,
  } = useWizardStore();

  const { toast } = useToast();
  const [project, setProject] = React.useState<Project | null>(null);
  const [targetCell, setTargetCell] = React.useState<TargetCell | null>(null);
  const [currentExecutionStep, setCurrentExecutionStep] = React.useState(0);

  // Auto-detect Google Forms Likert scale textual responses
  const detectedLikertColumns = React.useMemo(() => {
    if (fileData.length === 0) return [];
    return detectLikertTextColumns(fileData, columns);
  }, [fileData, columns]);

  const handleRecodeLikert = () => {
    if (detectedLikertColumns.length === 0) return;
    const cols = detectedLikertColumns.map((c) => c.column);
    const total = applyLikertRecode(cols);
    toast({
      title: 'Jawaban Teks Berhasil Dikonversi!',
      description: `${total} sel pada ${cols.length} kolom jawaban telah diubah ke skala angka 1–5 secara deterministik.`,
      variant: 'success',
    });
  };

  // Initialize Project in store
  React.useEffect(() => {
    setProjectId(projectId);
    getProject(projectId).then((p) => {
      if (p) setProject(p);
    });
  }, [projectId, setProjectId]);

  // Auto-select recommended tests if none selected yet
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

  // Filter columns for Likert reverse scoring: prioritize construct items, or exclude demographic & ID columns
  const availableLikertItems = React.useMemo(() => {
    const mappedItems = Array.from(new Set(constructs.flatMap((c) => c.items))).filter(Boolean);
    if (mappedItems.length > 0) return mappedItems;
    const demographicRegex = /^(no|id|responden|subjek|sample|nama|jenis[\s_]?kelamin|gender|jk|usia|umur|pendidikan|pekerjaan|penghasilan|gaji|jurusan|semester|angkatan|status|kategori|alamat|tanggal|tgl)$/i;
    return columns.filter((col) => !demographicRegex.test(col.trim()));
  }, [constructs, columns]);

  // Auto-detect columns when columns change
  React.useEffect(() => {
    if (columns.length > 0) {
      // Auto-detect experimental columns
      const detectedPre =
        columns.find((c) => /^(pre[_-\s]?test|sebelum|pre)$/i.test(c.trim())) ||
        columns.find((c) => /pre/i.test(c.trim()));
      const detectedPost =
        columns.find((c) => /^(post[_-\s]?test|sesudah|post)$/i.test(c.trim())) ||
        columns.find((c) => /post/i.test(c.trim()));
      const detectedGroup = columns.find((c) =>
        /^(kelas|kelompok|group|metode|perlakuan)$/i.test(c.trim())
      );
      if (detectedPre && detectedPost) {
        if (!preCol) setComparativeMapping({ preCol: detectedPre });
        if (!postCol) setComparativeMapping({ postCol: detectedPost, scoreCol: detectedPost });
      }
      if (detectedGroup && !groupCol) {
        setComparativeMapping({ groupCol: detectedGroup });
      }

      // Auto-detect categorical columns (Health / Social)
      const detectedRow = columns.find((c) =>
        /^(kebiasaan[\s_]?merokok|status[\s_]?merokok|merokok|paparan|faktor[\s_]?risiko|perlakuan|pekerjaan)$/i.test(c.trim())
      );
      const detectedCol = columns.find((c) =>
        /^(kejadian[\s_]?hipertensi|hipertensi|status[\s_]?gizi|penyakit|outcome|sembuh|status[\s_]?imunisasi)$/i.test(c.trim())
      );
      if (detectedRow && !rowCol) {
        setCategoricalMapping({ rowCol: detectedRow });
      }
      if (detectedCol && !colCol) {
        setCategoricalMapping({ colCol: detectedCol });
      }
    }
  }, [columns, preCol, postCol, groupCol, rowCol, colCol, setComparativeMapping, setCategoricalMapping]);

  // Compute test options with dynamic reasons based on constructs
  const dynamicTestOptions = React.useMemo<TestOption[]>(() => {
    let pool = mockTestOptions;
    if (researchDesign === 'survey') {
      pool = mockTestOptions.filter((t) =>
        ['descriptive', 'validity', 'reliability', 'normality', 'multicollinearity', 'heteroscedasticity', 'regression', 'correlation'].includes(t.id)
      );
    } else if (researchDesign === 'comparative') {
      pool = mockTestOptions.filter((t) =>
        ['descriptive', 'paired-ttest', 'ngain', 'independent-ttest', 'oneway-anova', 'nonparametric'].includes(t.id)
      );
    } else if (researchDesign === 'categorical') {
      pool = mockTestOptions.filter((t) =>
        ['descriptive', 'crosstab', 'chisquare', 'odds-ratio'].includes(t.id)
      );
    }

    return pool.map((opt) => {
      if (researchDesign === 'categorical') {
        if (opt.id === 'crosstab' || opt.id === 'chisquare') {
          return {
            ...opt,
            recommended: true,
            recommendReason: 'Analisis baku hubungan variabel kategorik (Crosstab & Chi-Square).',
          };
        }
        if (opt.id === 'odds-ratio') {
          return {
            ...opt,
            recommended: true,
            recommendReason: 'Estimasi risiko Odds Ratio & 95% CI (standar FKM/Kedokteran).',
          };
        }
        if (opt.id === 'descriptive') {
          return {
            ...opt,
            recommended: true,
            recommendReason: 'Sebaran frekuensi dasar sampel responden.',
          };
        }
        return opt;
      }

      if (researchDesign === 'comparative') {
        if (opt.id === 'paired-ttest' || opt.id === 'ngain') {
          return {
            ...opt,
            recommended: Boolean(preCol && postCol),
            recommendReason: 'Direkomendasikan untuk desain pra-pasca perlakuan.',
          };
        }
        if (opt.id === 'independent-ttest') {
          return {
            ...opt,
            recommended: Boolean(groupCol && scoreCol),
            recommendReason: 'Direkomendasikan untuk uji beda kelompok independen (Uji Levene & t-test).',
          };
        }
        if (opt.id === 'oneway-anova') {
          return {
            ...opt,
            recommended: false,
            recommendReason: 'Gunakan jika terdapat 3 kelompok atau lebih.',
          };
        }
        if (opt.id === 'nonparametric') {
          return {
            ...opt,
            recommended: true,
            recommendReason: 'Alternatif resmi bebas asumsi distribusi normal.',
          };
        }
        if (opt.id === 'descriptive') {
          return {
            ...opt,
            recommended: true,
            recommendReason: 'Ringkasan statistik dasar sampel penelitian.',
          };
        }
        return {
          ...opt,
          recommended: false,
        };
      }

      if (opt.id === 'regression') {
        return {
          ...opt,
          recommendReason: `Sesuai dengan desain penelitian: ${independentConstructs.length} variabel bebas (X) dan ${dependentConstructs.length} variabel terikat (Y).`,
        };
      }
      if (opt.id === 'multicollinearity') {
        return {
          ...opt,
          recommended: independentConstructs.length > 1,
          recommendReason:
            independentConstructs.length > 1
              ? `Prasyarat regresi berganda: terdapat ${independentConstructs.length} variabel bebas.`
              : 'Hanya 1 variabel bebas, multikolinearitas tidak disyaratkan.',
        };
      }
      return opt;
    });
  }, [researchDesign, preCol, postCol, groupCol, scoreCol, independentConstructs.length, dependentConstructs.length]);

  // Trigger deterministic progressive statistical analysis execution
  const handleRunAnalysis = async () => {
    setRunning(true);
    setCurrentExecutionStep(0);

    try {
      // Step 1: Validasi matriks
      await new Promise((r) => setTimeout(r, 200));
      setCurrentExecutionStep(1);

      // Step 2: Pearson & Cronbach
      await new Promise((r) => setTimeout(r, 200));
      setCurrentExecutionStep(2);

      // Step 3: Asumsi klasik
      await new Promise((r) => setTimeout(r, 200));
      setCurrentExecutionStep(3);

      // Generate unique IDs for this run
      const generatedRunId = `run-${Date.now()}`;
      const generatedDatasetId = datasetMeta?.datasetId || `ds-${Date.now()}`;
      setRunId(generatedRunId);
      setDatasetId(generatedDatasetId);

      // Build effective source metadata
      const effectiveMeta = datasetMeta
        ? {
            ...datasetMeta,
            runId: generatedRunId,
            datasetId: generatedDatasetId,
            version: dataVersion,
            excludedRows: removedRows,
          }
        : {
            fileName: fileName || 'data_kuesioner.csv',
            datasetId: generatedDatasetId,
            runId: generatedRunId,
            version: dataVersion,
            kind: 'original' as const,
            sha256: '',
            rowCount: fileData.length,
            columnCount: columns.length,
            excludedRows: removedRows,
            columns: columns.map((col) => ({
              name: col,
              role: (constructs.some((con) => con.items.includes(col))
                ? 'item'
                : columnRoles[col]
                ? columnRoles[col]
                : col.toLowerCase().includes('id') || col.toLowerCase() === 'no'
                ? 'id'
                : /^(jenis[\s_]?kelamin|gender|usia|umur|pendidikan|pekerjaan|jurusan|angkatan)$/i.test(col.trim())
                ? 'demographic'
                : 'ignored') as 'id' | 'demographic' | 'item' | 'ignored',
              dataType: 'number',
              missingCount: 0,
            })),
          };

      // Step 4: Deterministic computation using mathematical pipeline
      const computed = computeDeterministicStats({
        rows: fileData,
        constructs,
        selectedTests,
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

      // Step 5: Narasi akademik terstandar
      await new Promise((r) => setTimeout(r, 200));
      setCurrentExecutionStep(4);

      // Store in memory and persistent storage
      setCurrentResults(computed);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`olahdata_results_${projectId}`, JSON.stringify(computed));
          localStorage.setItem(`olahdata_run_${generatedRunId}`, JSON.stringify(computed));
        } catch {
          // localStorage might be constrained
        }
      }

      await new Promise((r) => setTimeout(r, 300));
      setRunning(false);

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
      {/* Top Breadcrumb & Project Header */}
      <div className="border-b border-border bg-card/50 relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href={`/app/proyek/${projectId}`}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="Kembali ke Ringkasan Proyek"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Proyek #{projectId}
                </span>
                <span className="text-[11px] text-muted-foreground">•</span>
                <span className="text-[11px] font-medium text-primary">
                  Wisaya Analisis
                </span>
                {usingSampleData && (
                  <Badge variant="amber" className="text-[10px] py-0 px-1.5">
                    {COPY.badges.sampleData}
                  </Badge>
                )}
              </div>
              <h1 className="text-xs sm:text-base font-semibold text-foreground truncate">
                {project?.title || 'Pengolahan Data Kuesioner'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/app/bantuan#pemetaan-variabel" target="_blank" title="Panduan Pemetaan Variabel & Butir">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Bantuan</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 pb-32 sm:pb-16">
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          steps={STEP_LABELS}
          onStepClick={(step) => {
            // Only allow backward or valid navigation
            if (step < currentStep) setStep(step);
          }}
          maxAccessibleStep={currentStep}
        />

        {/* STEP 1: UNGGAH DATA */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 1: Unggah Data Kuesioner
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Unggah spreadsheet data kuesioner Anda (.xlsx, .xls) atau CSV berisikan tabulasi jawaban responden.
              </p>
            </div>

            <FileDropzone />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <Link href="/app">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Proyek
                </Link>
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {fileData.length === 0 && (
                  <span className="text-xs text-muted-foreground text-center sm:text-right font-medium">
                    Unggah berkas kuesioner Anda terlebih dahulu untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={fileData.length === 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                  title={fileData.length === 0 ? 'Unggah berkas kuesioner Anda terlebih dahulu' : undefined}
                >
                  Lanjut ke Validasi Data
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDASI DATA */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Langkah 2: Validasi Kualitas Data
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                  Pemeriksaan integritas skala Likert, baris kosong, dan jawaban terduplikasi.
                </p>
              </div>
            </div>

            {/* Smart Google Forms Auto-Recode Banner */}
            {detectedLikertColumns.length > 0 && (
              <div className="p-4 sm:p-5 rounded-[16px] border border-primary/30 bg-primary/10 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">
                      Terdeteksi Jawaban Teks Google Forms pada {detectedLikertColumns.length} Kolom
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[68ch]">
                      Kolom seperti <code className="font-mono text-primary font-semibold">{detectedLikertColumns.slice(0, 3).map((c) => c.column).join(', ')}{detectedLikertColumns.length > 3 ? '...' : ''}</code> berisi teks (&quot;Sangat Setuju&quot;, &quot;Setuju&quot;, dll). Konversi otomatis ke skala angka 1–5 agar siap diolah statistik secara deterministik.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRecodeLikert}
                  className="shrink-0 font-semibold cursor-pointer gap-1.5 rounded-[10px]"
                >
                  <Sparkles className="w-4 h-4" />
                  Konversi Otomatis ke Angka 1-5
                </Button>
              </div>
            )}

            {/* Critical Error Alert if any */}
            {criticalErrorCount > 0 && (
              <div className="p-4 sm:p-5 rounded-[16px] border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <span className="font-bold block">
                    {criticalErrorCount} baris data perlu dicek
                  </span>
                  <p className="text-destructive/90 text-xs leading-relaxed max-w-[68ch]">
                    Perbaiki atau keluarkan baris bermasalah sebelum melanjutkan ke tahap analisis.
                  </p>
                </div>
              </div>
            )}

            {/* Main Preview and Issue Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Preview Table */}
              <div className="lg:col-span-8 order-2 lg:order-1">
                <DataPreviewTable
                  data={fileData}
                  columns={columns}
                  issues={issues}
                  targetCell={targetCell}
                  onRemoveRow={(rowNo) => removeRowByNumber(rowNo)}
                />
              </div>

              {/* Issues List */}
              <div className="lg:col-span-4 order-1 lg:order-2">
                <IssueList
                  issues={issues}
                  onSelectIssue={(row, col, severity) => {
                    setTargetCell({ row, col, severity });
                  }}
                  onRemoveRow={(rowNo) => removeRowByNumber(rowNo)}
                  onReupload={() => setStep(0)}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {criticalErrorCount > 0 && (
                  <span className="text-xs text-destructive text-center sm:text-right font-medium">
                    Perbaiki {criticalErrorCount} baris bermasalah untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={criticalErrorCount > 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                  title={criticalErrorCount > 0 ? `Terdapat ${criticalErrorCount} baris bermasalah yang perlu diperbaiki` : undefined}
                >
                  Lanjut ke Petakan Variabel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PETAKAN VARIABEL */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 3: Tentukan Desain & Petakan Variabel
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Pilih desain penelitian skripsi Anda (Model Regresi Kuesioner atau Uji Beda Eksperimen / Pra-Pasca) lalu tentukan variabelnya.
              </p>
            </div>

            {/* Template Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  'p-4 rounded-xl border text-left transition-all cursor-pointer',
                  researchDesign === 'survey'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-border/80'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-foreground">
                    Kuesioner / Regresi Skripsi
                  </span>
                  <Badge variant={researchDesign === 'survey' ? 'brand' : 'outline'} className="text-[10px]">
                    Model X → Y
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Untuk penelitian survei kuesioner skala Likert: Uji Validitas, Reliabilitas, Asumsi Klasik, dan Regresi Linier Berganda.
                </p>
              </button>

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
                  'p-4 rounded-xl border text-left transition-all cursor-pointer',
                  researchDesign === 'comparative'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-border/80'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-foreground">
                    Uji Perbandingan & Eksperimen
                  </span>
                  <Badge variant={researchDesign === 'comparative' ? 'brand' : 'outline'} className="text-[10px]">
                    t-Test, N-Gain, ANOVA
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Khusus FKIP, Psikologi, & Keperawatan: Paired Sample t-Test, Efektivitas N-Gain (Hake 1998), Independent t-Test (Levene), & Non-Parametrik.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResearchDesign('categorical');
                  setSelectedTests([
                    'crosstab',
                    'chisquare',
                    'odds-ratio',
                    'descriptive',
                  ]);
                }}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all cursor-pointer',
                  researchDesign === 'categorical'
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                    : 'border-border bg-card hover:border-border/80'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-foreground">
                    Hubungan Kategori (Chi-Square)
                  </span>
                  <Badge variant={researchDesign === 'categorical' ? 'brand' : 'outline'} className="text-[10px]">
                    Crosstab &amp; OR
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Khusus FKM, Kebidanan, Keperawatan, &amp; Sosiologi: Tabulasi Silang (B × K), Chi-Square, Fisher Exact, &amp; Odds Ratio (95% CI).
                </p>
              </button>
            </div>

            {/* SURVEY TEMPLATE MAPPING */}
            {researchDesign === 'survey' && (
              <>
                <VariableMapper
                  columns={columns}
                  constructs={constructs}
                  onChange={setConstructs}
                />
              </>
            )}

            {/* COMPARATIVE TEMPLATE MAPPING */}
            {researchDesign === 'comparative' && (
              <div className="p-5 rounded-[16px] border border-border bg-card shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      Pemetaan Kolom Variabel Eksperimen & Beda Rata-rata
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih kolom data yang sesuai untuk uji sampel berpasangan (Pre-test vs Post-test) atau perbandingan kelompok (Kelas Eksperimen vs Kontrol).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pre-test column */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Kolom Nilai Pra-Perlakuan (Pre-test):
                    </label>
                    <select
                      value={preCol || ''}
                      onChange={(e) => setComparativeMapping({ preCol: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Pilih Kolom Pre-test --</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Data skor awal responden sebelum diberikan intervensi pembelajaran/perlakuan.
                    </p>
                  </div>

                  {/* Post-test column */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Kolom Nilai Pasca-Perlakuan (Post-test):
                    </label>
                    <select
                      value={postCol || ''}
                      onChange={(e) =>
                        setComparativeMapping({
                          postCol: e.target.value || null,
                          scoreCol: e.target.value || scoreCol,
                        })
                      }
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Pilih Kolom Post-test --</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Data skor akhir responden setelah perlakuan selesai diberikan.
                    </p>
                  </div>

                  {/* Group column */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Kolom Kelompok / Kelas (Faktor Independen):
                    </label>
                    <select
                      value={groupCol || ''}
                      onChange={(e) => setComparativeMapping({ groupCol: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Pilih Kolom Kelas / Kelompok --</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Digunakan untuk Independent Sample t-Test & ANOVA (misal: &quot;Kelas Eksperimen&quot; vs &quot;Kelas Kontrol&quot;).
                    </p>
                  </div>

                  {/* Ideal Max Score */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Skor Maksimal Ideal Instrumen Tes:
                    </label>
                    <input
                      type="number"
                      value={idealMaxScore}
                      onChange={(e) =>
                        setComparativeMapping({ idealMaxScore: Number(e.target.value) || 100 })
                      }
                      min={10}
                      max={1000}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Diperlukan untuk rumus Richard R. Hake: (Post - Pre) / (Skor Maksimal - Pre). Standar umumnya 100.
                    </p>
                  </div>
                </div>

                {/* Status Box */}
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">Kesiapan Analisis Komparatif:</span>
                    <p className="text-[11px] text-muted-foreground">
                      {preCol && postCol
                        ? `✓ Pasangan Pre-Post siap (${preCol} → ${postCol}) untuk Paired t-Test & N-Gain.`
                        : '• Belum memilih pasangan Pre-test & Post-test.'}
                      {groupCol ? ` ✓ Kolom kelompok siap (${groupCol}) untuk Independent t-Test & Levene.` : ''}
                    </p>
                  </div>
                  <Badge
                    variant={isMappingValid ? 'success' : 'amber'}
                    className="text-[11px]"
                  >
                    {isMappingValid ? 'Parameter Lengkap' : 'Pilih Parameter'}
                  </Badge>
                </div>
              </div>
            )}

            {/* CATEGORICAL TEMPLATE MAPPING */}
            {researchDesign === 'categorical' && (
              <div className="p-5 rounded-[16px] border border-border bg-card shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Pemetaan Variabel Kategorik (Tabulasi Silang &amp; Chi-Square)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih variabel baris (faktor paparan/risiko/independen) dan variabel kolom (kejadian penyakit/luaran/dependen) berskala data nominal atau ordinal.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row variable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Variabel Baris (Faktor Paparan / Independen):
                    </label>
                    <select
                      value={rowCol || ''}
                      onChange={(e) => setCategoricalMapping({ rowCol: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="">-- Pilih Variabel Baris --</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Contoh: Kebiasaan Merokok, Status Gizi, Tingkat Stres, Kelompok Intervensi.
                    </p>
                  </div>

                  {/* Column variable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Variabel Kolom (Kejadian / Luaran / Dependen):
                    </label>
                    <select
                      value={colCol || ''}
                      onChange={(e) => setCategoricalMapping({ colCol: e.target.value || null })}
                      className="w-full text-xs rounded-lg border border-border bg-background p-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="">-- Pilih Variabel Kolom --</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Contoh: Kejadian Hipertensi, Status Kesembuhan, Tingkat Kepatuhan.
                    </p>
                  </div>
                </div>

                {/* Status Box */}
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">Kesiapan Analisis Chi-Square:</span>
                    <p className="text-[11px] text-muted-foreground">
                      {rowCol && colCol
                        ? `✓ Variabel siap: ${rowCol} (Baris) × ${colCol} (Kolom) untuk Tabulasi Silang, Chi-Square, Fisher Exact, & Odds Ratio.`
                        : '• Silakan tentukan Variabel Baris dan Variabel Kolom di atas.'}
                    </p>
                  </div>
                  <Badge
                    variant={rowCol && colCol ? 'success' : 'amber'}
                    className="text-[11px]"
                  >
                    {rowCol && colCol ? 'Parameter Lengkap' : 'Pilih Parameter'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Pengaturan Lanjutan Skor Konstruk */}
            {researchDesign === 'survey' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Pengaturan Lanjutan Skor & Butir Negatif
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tentukan metode agregasi skor variabel dan balik nilai butir yang menggunakan kalimat negatif.
                  </p>
                </div>

                {/* Calculation method selector */}
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/50 border border-border/50 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalculationMethod('mean')}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                      calculationMethod === 'mean'
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Rata-rata (Mean)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMethod('sum')}
                    className={cn(
                      'px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer',
                      calculationMethod === 'sum'
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Penjumlahan (Sum)
                  </button>
                </div>
              </div>

              {/* Reverse scored items selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Item Pertanyaan Negatif (Reverse Score):
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {reverseItems.length > 0
                      ? `${reverseItems.length} butir dibalik nilainya (skala 1-5 diinversi)`
                      : 'Belum ada butir yang dibalik'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik butir instrumen di bawah jika butir tersebut memuat pernyataan negatif sehingga nilainya dibalik otomatis (misal skor 5 menjadi 1, skor 4 menjadi 2) sesuai kaidah metodologi penelitian kuantitatif.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1 max-h-32 overflow-y-auto">
                  {availableLikertItems.map((col) => {
                    const isReverse = reverseItems.includes(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => toggleReverseItem(col)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-md border font-mono transition-all cursor-pointer',
                          isReverse
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 dark:bg-amber-400 dark:text-slate-950 shadow-xs ring-1 ring-amber-500/50'
                            : 'bg-muted/30 text-foreground border-border hover:border-amber-600/50'
                        )}
                        title={isReverse ? 'Klik untuk membatalkan reverse scoring' : 'Klik untuk mengaktifkan reverse scoring'}
                      >
                        {col} {isReverse && '🔄'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={prevStep}
                className="cursor-pointer rounded-[10px] min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Validasi
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {!isMappingValid && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 text-center sm:text-right font-medium">
                    {researchDesign === 'comparative'
                      ? 'Pilih kolom Pre-test & Post-test atau Kelas & Skor untuk lanjut'
                      : 'Diperlukan min. 1 variabel bebas (X) dan 1 variabel terikat (Y)'}
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={!isMappingValid}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                  title={!isMappingValid ? 'Petakan minimal 1 variabel bebas (X) dan 1 variabel terikat (Y)' : undefined}
                >
                  Lanjut ke Pilih Uji
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PILIH UJI */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Langkah 4: Pilih Uji Statistik
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                  Pilih uji statistik yang Anda butuhkan untuk Bab 4 skripsi. Uji yang direkomendasikan telah disesuaikan otomatis dengan konstruk penelitian Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allRec = dynamicTestOptions.filter((t) => t.recommended).map((t) => t.id);
                    setSelectedTests(allRec);
                  }}
                  className="text-xs cursor-pointer rounded-[10px]"
                >
                  Pilih yang direkomendasikan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTests(dynamicTestOptions.map((t) => t.id));
                  }}
                  className="text-xs cursor-pointer rounded-[10px]"
                >
                  Pilih semua
                </Button>
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicTestOptions.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  isSelected={selectedTests.includes(test.id)}
                  onToggle={toggleTest}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {selectedTests.length === 0 && (
                  <span className="text-xs text-destructive text-center sm:text-right font-medium">
                    Pilih minimal 1 uji statistik untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={selectedTests.length === 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
                  title={selectedTests.length === 0 ? 'Pilih minimal 1 uji statistik' : undefined}
                >
                  Lanjut ke Ringkasan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: RINGKASAN & JALANKAN */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Langkah 5: Ringkasan Konfigurasi & Jalankan Analisis
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Tinjau ringkasan parameter sebelum mesin statistik melakukan komputasi formula matriks dan regresi.
              </p>
            </div>

            {/* Summary Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dataset & Sample Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">
                      Spesifikasi Dataset
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Integritas data setelah pembersihan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Nama File:</span>
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {fileName || 'data_kuesioner.xlsx'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Status Data:</span>
                    <span className="font-semibold text-foreground">
                      {dataVersion > 1 ? `Revisi ${dataVersion}` : 'Data Asli Terverifikasi'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Jumlah Sampel Valid:</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatNumber(fileData.length)} responden
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Baris Dieliminasi:</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {removedRows.length} baris
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Metode Komposit:</span>
                    <span className="font-semibold text-foreground uppercase text-[11px]">
                      {calculationMethod === 'mean' ? 'Rata-rata (Mean)' : 'Penjumlahan (Sum)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Butir Negatif Dibalik:</span>
                    <span className="font-mono text-foreground text-[11px]">
                      {reverseItems.length > 0 ? `${reverseItems.length} butir (${reverseItems.join(', ')})` : 'Tidak ada'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Constructs Mapping */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">
                      Konstruk Penelitian
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {constructs.length} konstruk terdefinisi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {constructs.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-[10px] bg-muted/40 border border-border/40 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-foreground block">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.items.length} butir ({c.items.join(', ')})
                        </span>
                      </div>
                      <Badge
                        variant={c.role === 'independent' ? 'pine' : 'amber'}
                        className="text-[10px] shrink-0 rounded-[6px]"
                      >
                        {c.role === 'independent' ? 'Bebas (X)' : 'Terikat (Y)'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Selected Tests */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">
                      Uji yang Dijalankan
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {selectedTests.length} uji statistik terpilih
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTests.map((testId) => {
                      const test = mockTestOptions.find((t) => t.id === testId);
                      return (
                        <Badge
                          key={testId}
                          variant="secondary"
                          className="text-xs py-1 px-2.5 font-normal bg-card border border-border rounded-[6px]"
                        >
                          {test?.name || testId}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Badges of Academic Transparency */}
            <div className="p-4 sm:p-5 rounded-[16px] border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-foreground">
                    Prinsip Transparansi & Komputasi
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-[68ch]">
                  Mesin statistik versi {ENGINE_VERSION} mengeksekusi perhitungan rumus baku. Laporan Bab 4 dan jejak hitung akan langsung tersedia setelah selesai.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Badge variant="engine" className="text-xs py-1 rounded-[6px]">
                  {COPY.badges.computedByEngine}
                </Badge>
                <Badge variant="ai" className="text-xs py-1 rounded-[6px]">
                  {COPY.badges.writtenByAI}
                </Badge>
              </div>
            </div>

            {/* Execution / Running Box */}
            {isRunning ? (
              <div className="p-8 rounded-[16px] border-2 border-primary/40 bg-card shadow-lg text-center space-y-6 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="font-sans text-xl font-bold tracking-tight text-foreground">
                    Memproses Analisis Statistik...
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Menghitung formula regresi linier berganda dan menyusun tabel hasil format skripsi.
                  </p>
                </div>

                {/* Progressive Checklist */}
                <div className="max-w-md mx-auto text-left space-y-2.5 pt-2">
                  {ANALYSIS_EXECUTION_STEPS.map((stepText, idx) => {
                    const isDone = idx < currentExecutionStep;
                    const isCurrent = idx === currentExecutionStep;

                    return (
                      <div
                        key={stepText}
                        className={cn(
                          'p-3 rounded-[10px] border text-xs flex items-center gap-2.5 transition-all',
                          isDone
                            ? 'bg-[#BFEBD9]/30 border-[#98D8BE] text-[#0E4331] dark:text-emerald-300 font-medium'
                            : isCurrent
                            ? 'bg-primary/10 border-primary text-primary font-semibold ring-1 ring-primary'
                            : 'bg-muted/30 border-border/40 text-muted-foreground'
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#0E4331] dark:text-emerald-400 shrink-0" />
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
            ) : (
              /* Ready to run CTA */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={prevStep}
                  className="cursor-pointer rounded-[10px] min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Pilih Uji
                </Button>

                <Button
                  type="button"
                  size="lg"
                  onClick={handleRunAnalysis}
                  className="cursor-pointer font-bold px-8 bg-primary hover:bg-primary/90 text-white shadow-md text-base rounded-[10px] min-h-[44px]"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Jalankan Analisis
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
