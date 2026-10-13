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
} from 'lucide-react';

import { useWizardStore, type WizardStep } from '@/stores/wizard-store';
import { FileDropzone } from '@/components/file-dropzone';
import { DataPreviewTable, type TargetCell } from '@/components/data-preview-table';
import { IssueList } from '@/components/issue-list';
import { VariableMapper } from '@/components/variable-mapper';
import { TestCard } from '@/components/test-card';
import { StepIndicator } from '@/components/step-indicator';

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
    constructs,
    setConstructs,
    selectedTests,
    setSelectedTests,
    toggleTest,
    removeRowByNumber,
    isRunning,
    setRunning,
  } = useWizardStore();

  const [project, setProject] = React.useState<Project | null>(null);
  const [targetCell, setTargetCell] = React.useState<TargetCell | null>(null);
  const [currentExecutionStep, setCurrentExecutionStep] = React.useState(0);

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
  const isMappingValid = independentConstructs.length >= 1 && dependentConstructs.length >= 1;

  // Compute test options with dynamic reasons based on constructs
  const dynamicTestOptions = React.useMemo<TestOption[]>(() => {
    return mockTestOptions.map((opt) => {
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
  }, [independentConstructs.length, dependentConstructs.length]);

  // Trigger simulated progressive analysis execution
  const handleRunAnalysis = () => {
    setRunning(true);
    setCurrentExecutionStep(0);

    const stepInterval = 500; // 500ms * 5 steps = 2500ms total
    let step = 0;

    const intervalId = setInterval(() => {
      step += 1;
      if (step < ANALYSIS_EXECUTION_STEPS.length) {
        setCurrentExecutionStep(step);
      } else {
        clearInterval(intervalId);
        setTimeout(() => {
          setRunning(false);
          const targetUrl = `/app/proyek/${projectId}/hasil`;
          if (typeof window !== 'undefined') {
            window.location.href = targetUrl;
          } else {
            router.push(targetUrl);
          }
        }, 400);
      }
    }, stepInterval);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Breadcrumb & Project Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/app/proyek/${projectId}`}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Kembali ke Ringkasan Proyek"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  Proyek #{projectId}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-primary">
                  Wisaya Analisis
                </span>
                {usingSampleData && (
                  <Badge variant="amber" className="text-[10px] py-0 px-2">
                    {COPY.badges.sampleData}
                  </Badge>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-md sm:max-w-xl">
                {project?.title || 'Pengolahan Data Kuesioner'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono tabular-nums">
              Versi: dv-{dataVersion}
            </Badge>
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

            <div className="flex items-center justify-between pt-4 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {COPY.reassurance.saved}
              </span>
              <Button
                type="button"
                size="lg"
                onClick={nextStep}
                disabled={fileData.length === 0}
                className="cursor-pointer font-semibold rounded-[10px] ml-auto min-h-[44px]"
              >
                Lanjut ke Validasi Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono rounded-[6px]">
                  Versi Data Aktif: dv-{dataVersion}
                </Badge>
              </div>
            </div>

            {/* Critical Error Alert if any */}
            {criticalErrorCount > 0 && (
              <div className="p-4 sm:p-5 rounded-[16px] border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <span className="font-bold block">
                    Ditemukan {criticalErrorCount} Catatan Kritis pada Data
                  </span>
                  <p className="text-destructive/90 text-xs leading-relaxed max-w-[68ch]">
                    Perbaiki atau keluarkan baris yang bermasalah sebelum melanjutkan. Data penelitian Anda dijaga tetap murni tanpa manipulasi jawaban.
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
            <div className="flex items-center justify-between pt-4 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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

              <div className="flex items-center gap-3">
                {criticalErrorCount > 0 && (
                  <span className="text-xs text-destructive font-medium hidden sm:inline">
                    Selesaikan semua galat kritis untuk lanjut
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={criticalErrorCount > 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
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
                Langkah 3: Petakan Variabel Penelitian
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-[68ch]">
                Kelompokkan butir pernyataan kuesioner ke dalam konstruk variabel bebas (X) dan variabel terikat (Y).
              </p>
            </div>

            <VariableMapper
              columns={columns}
              constructs={constructs}
              onChange={setConstructs}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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

              <div className="flex items-center gap-3">
                {!isMappingValid && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium hidden sm:inline">
                    Diperlukan min. 1 variabel X dan 1 variabel Y
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={!isMappingValid}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
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
            <div className="flex items-center justify-between pt-4 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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

              <div className="flex items-center gap-3">
                {selectedTests.length === 0 && (
                  <span className="text-xs text-destructive font-medium hidden sm:inline">
                    Pilih minimal 1 uji statistik
                  </span>
                )}
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  disabled={selectedTests.length === 0}
                  className="cursor-pointer font-semibold rounded-[10px] min-h-[44px]"
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
                    <span className="text-muted-foreground">Versi Dataset:</span>
                    <span className="font-mono font-semibold text-foreground">
                      dv-{dataVersion}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Jumlah Sampel Valid:</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatNumber(fileData.length)} responden
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Baris Dieliminasi:</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {removedRows.length} baris
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
              <div className="flex items-center justify-between pt-4 border-t border-border sticky sm:static bottom-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-3 sm:p-0 -mx-4 sm:mx-0 z-20 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
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
