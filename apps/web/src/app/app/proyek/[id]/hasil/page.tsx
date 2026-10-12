'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResultTable, type ColumnDef } from '@/components/result-table';
import { ExplanationBox } from '@/components/explanation-box';
import { AssumptionAlert } from '@/components/assumption-alert';
import { TraceabilityPanel } from '@/components/traceability-panel';
import { ExportDialog } from '@/components/export-dialog';
import { formatNumber, formatDateTime } from '@/lib/format';
import { getProject, getResult } from '@/lib/api';
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

export default function HasilPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || 'project-1';

  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('descriptive');
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [projData, resData] = await Promise.all([
          getProject(projectId),
          getResult(projectId),
        ]);
        if (isMounted) {
          setProject(projData || null);
          setResults(resData);
        }
      } catch (err) {
        console.error('Failed to load project results', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Tab names for traceability panel display
  const testNamesMap: Record<string, string> = {
    descriptive: 'Statistik Deskriptif',
    validity: 'Uji Validitas (Pearson Product Moment)',
    reliability: "Uji Reliabilitas (Cronbach's Alpha)",
    assumptions: 'Uji Asumsi Klasik (Normalitas, VIF, Glejser)',
    regression: 'Regresi Linier Berganda (OLS)',
    correlation: 'Korelasi Pearson',
  };

  if (isLoading || !results) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Memuat hasil analisis data skripsi...
        </p>
      </div>
    );
  }

  // --- Table Column Definitions ---

  // 1. Descriptive Table Columns
  const descriptiveCols: ColumnDef<DescriptiveResult>[] = [
    {
      key: 'variable',
      header: 'Variabel Penelitian',
      render: (r) => <span className="font-semibold text-foreground">{r.variable}</span>,
    },
    {
      key: 'n',
      header: 'N',
      align: 'right',
      getValue: (r) => formatNumber(r.n),
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
      header: 'Minimum',
      align: 'right',
      getValue: (r) => formatNumber(r.min, 3),
    },
    {
      key: 'max',
      header: 'Maksimum',
      align: 'right',
      getValue: (r) => formatNumber(r.max, 3),
    },
  ];

  // 2. Validity Table Columns
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
          className="text-xs px-2 py-0.5"
        >
          {r.valid ? 'Valid' : 'Gugur'}
        </Badge>
      ),
      getValue: (r) => (r.valid ? 'Valid' : 'Gugur'),
    },
  ];

  // 3. Reliability Table Columns
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
        <Badge variant="pine" className="text-xs px-2 py-0.5">
          {r.reliable ? 'Reliabel' : 'Tidak Reliabel'}
        </Badge>
      ),
      getValue: (r) => (r.reliable ? 'Reliabel' : 'Tidak Reliabel'),
    },
  ];

  // Reliability "Alpha if item deleted" flattened table
  type AlphaItem = { item: string; construct: string; alpha: number };
  const alphaIfDeletedRows: AlphaItem[] = (results.reliability || []).flatMap((rel) =>
    rel.alphaIfDeleted.map((aid) => ({
      item: aid.item,
      construct: rel.construct,
      alpha: aid.alpha,
    }))
  );

  const alphaIfDeletedCols: ColumnDef<AlphaItem>[] = [
    {
      key: 'item',
      header: 'Item Dihapus',
      className: 'font-mono font-semibold',
      getValue: (r) => r.item,
    },
    {
      key: 'construct',
      header: 'Konstruk',
      getValue: (r) => r.construct,
    },
    {
      key: 'alpha',
      header: 'Cronbach Alpha Baru',
      align: 'right',
      getValue: (r) => formatNumber(r.alpha, 3),
    },
    {
      key: 'status',
      header: 'Dampak Perubahan',
      align: 'center',
      render: () => (
        <span className="text-xs text-muted-foreground">Tidak perlu dihapus</span>
      ),
      getValue: () => 'Optimal',
    },
  ];

  // 4a. Normality Table Columns
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
        <Badge variant={r.normal ? 'pine' : 'destructive'} className="text-xs">
          {r.normal ? 'Normal' : 'Tidak Normal'}
        </Badge>
      ),
      getValue: (r) => (r.normal ? 'Normal' : 'Tidak Normal'),
    },
  ];

  // 4b. Multicollinearity Table Columns
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
        <Badge variant={!r.problematic ? 'pine' : 'destructive'} className="text-xs">
          {!r.problematic ? 'Bebas Multikolinearitas' : 'Ada Multikolinearitas'}
        </Badge>
      ),
      getValue: (r) => (!r.problematic ? 'Bebas' : 'Bermasalah'),
    },
  ];

  // 4c. Heteroscedasticity Table Columns
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
        <Badge variant={!r.significant ? 'pine' : 'destructive'} className="text-xs">
          {!r.significant ? 'Homoskedastis (Bebas Gejala)' : 'Terjadi Heteroskedastisitas'}
        </Badge>
      ),
      getValue: (r) => (!r.significant ? 'Bebas Gejala' : 'Terjadi Gejala'),
    },
  ];

  // 5a. Regression Table Columns
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
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-xs">
          {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 5b. F-Test Table Columns
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
      header: 'F Tabel (k=2, N=117)',
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
        <Badge variant={r.significant ? 'pine' : 'destructive'} className="text-xs">
          {r.significant ? 'Signifikan Simultan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  // 5c. Determination Table Columns
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
      key: 'percent',
      header: 'Kontribusi (%)',
      align: 'right',
      getValue: (r) => `${formatNumber(r.adjustedRSquare * 100, 1)}%`,
    },
    {
      key: 'stdError',
      header: 'Std. Error of Estimate',
      align: 'right',
      getValue: (r) => formatNumber(r.stdError, 3),
    },
  ];

  // 6. Correlation Table Columns
  const correlationCols: ColumnDef<CorrelationResult>[] = [
    {
      key: 'pair',
      header: 'Pasangan Variabel',
      render: (r) => (
        <span className="font-semibold text-foreground">
          {r.variable1} ↔ {r.variable2}
        </span>
      ),
      getValue: (r) => `${r.variable1} - ${r.variable2}`,
    },
    {
      key: 'coefficient',
      header: 'Koefisien Korelasi (r)',
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
      header: 'Tingkat Hubungan',
      align: 'center',
      render: (r) => <span className="text-xs font-medium">{r.strength}</span>,
      getValue: (r) => r.strength,
    },
    {
      key: 'significant',
      header: 'Signifikansi',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-xs">
          {r.significant ? 'Signifikan (p < 0,01)' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/app/proyek"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Proyek</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
              {project?.title || 'Detail Analisis'}
            </span>
            <span>/</span>
            <span className="text-primary font-medium">Hasil Bab 4</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block">
              Diperbarui: {formatDateTime(results.timestamp)}
            </span>
            <Badge variant="outline" className="font-mono text-[11px] py-0">
              Mesin v{ENGINE_VERSION}
            </Badge>
          </div>
        </div>

        {/* Page Main Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-card p-5 sm:p-6 rounded-[16px] border border-border shadow-xs">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="mint" className="gap-1.5 py-0.5 px-2.5 font-medium text-xs rounded-[6px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0E4331]" />
                <span>Selesai Dianalisis • Semua Uji Lulus</span>
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building className="h-3 w-3" />
                {project?.department || 'Program Studi Manajemen'}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                N = {results.respondentCount} Responden
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-snug">
              {project?.title || 'Hasil Analisis Kuesioner Skripsi'}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-[68ch]">
              Format tabel standar Bab 4 skripsimu. Angka di kalimat terhubung langsung ke sel tabel asalnya dan siap kamu salin ke Microsoft Word.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/app/proyek/${projectId}/wizard`)}
              className="gap-1.5 text-xs h-9 rounded-[10px]"
              title="Jalankan ulang analisis dengan parameter berbeda"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Jalankan Ulang</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setExportOpen(true)}
              className="gap-2 text-xs h-9 font-semibold shadow-xs rounded-[10px]"
            >
              <FileDown className="h-4 w-4" />
              <span>Ekspor Hasil Bab 4</span>
            </Button>
          </div>
        </div>

        {/* Main Content Layout (Tabs + Traceability Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Center Main Column: Statistical Tests Tabs */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation List */}
              <TabsList className="bg-card border border-border p-1 gap-1">
                <TabsTrigger value="descriptive" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Deskriptif</span>
                </TabsTrigger>
                <TabsTrigger value="validity" className="gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Validitas</span>
                </TabsTrigger>
                <TabsTrigger value="reliability" className="gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Reliabilitas</span>
                </TabsTrigger>
                <TabsTrigger value="assumptions" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Asumsi Klasik</span>
                </TabsTrigger>
                <TabsTrigger value="regression" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Regresi Linier</span>
                </TabsTrigger>
                <TabsTrigger value="correlation" className="gap-1.5">
                  <GitCompare className="h-3.5 w-3.5" />
                  <span>Korelasi</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. STATISTIK DESKRIPTIF */}
              <TabsContent value="descriptive" className="space-y-6 mt-4">
                <ResultTable
                  tableNumber="Tabel 4.1"
                  title="Hasil Analisis Statistik Deskriptif Variabel Penelitian"
                  note={`* Data dihitung dari N = ${results.respondentCount} responden valid menggunakan skala Likert 1-5.`}
                  columns={descriptiveCols}
                  data={results.descriptive || []}
                  rowKey={(r) => r.variable}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Statistik Deskriptif"
                  summarySentence="Seluruh variabel penelitian memiliki rata-rata skor di atas 3,80 dari skala 5, menandakan persepsi responden secara umum berada pada kategori tinggi."
                  explanation={results.explanations.descriptive}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </TabsContent>

              {/* 2. UJI VALIDITAS */}
              <TabsContent value="validity" className="space-y-6 mt-4">
                <AssumptionAlert
                  status="passed"
                  title="Seluruh Butir Pernyataan Dinyatakan Valid"
                  description={`Nilai r hitung korelasi Pearson Product Moment pada seluruh 18 item kuesioner berada di atas r tabel sebesar 0,1816 (df = 115, α = 0,05).`}
                  recommendation="Seluruh item kuesioner dapat diikutsertakan dalam pengujian hipotesis tanpa perlu menggugurkan indikator penelitian."
                />

                <ResultTable
                  tableNumber="Tabel 4.2"
                  title="Hasil Pengujian Validitas Instrumen Kuesioner (Pearson Product Moment)"
                  note="* Derajat bebas df = N - 2 = 115, taraf signifikansi α = 0,05 (r tabel = 0,1816). Kriteria uji: r hitung > r tabel = Valid."
                  columns={validityCols}
                  data={results.validity || []}
                  rowKey={(r) => r.item}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji Validitas"
                  summarySentence="Seluruh butir kuesioner terbukti valid (r hitung > 0,1816), sehingga semua indikator layak digunakan tanpa perlu digugurkan."
                  explanation={results.explanations.validity}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </TabsContent>

              {/* 3. UJI RELIABILITAS */}
              <TabsContent value="reliability" className="space-y-6 mt-4">
                <AssumptionAlert
                  status="passed"
                  title="Tingkat Reliabilitas Sangat Memuaskan (Alpha > 0,80)"
                  description="Koefisien Cronbach's Alpha pada seluruh konstruk penelitian melebihi nilai ambang batas minimal 0,60 (bahkan melampaui standar konservatif 0,70)."
                  recommendation="Instrumen kuesioner terbukti memiliki keandalan dan konsistensi internal yang sangat baik untuk pengumpulan data."
                />

                <ResultTable
                  tableNumber="Tabel 4.3"
                  title="Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)"
                  note="* Ambang batas reliabilitas standar kuesioner menurut Nunnaly & Ghozali adalah Cronbach's Alpha ≥ 0,60."
                  columns={reliabilityCols}
                  data={results.reliability || []}
                  rowKey={(r) => r.construct}
                  highlightedValue={highlightedNumber}
                />

                <ResultTable
                  tableNumber="Tabel 4.3b"
                  title="Koefisien Cronbach's Alpha Jika Butir Pernyataan Dihapus (Alpha If Item Deleted)"
                  note="* Menunjukkan estimasi nilai Cronbach's Alpha apabila butir bersangkutan dikeluarkan dari instrumen."
                  columns={alphaIfDeletedCols}
                  data={alphaIfDeletedRows}
                  rowKey={(r) => `${r.construct}-${r.item}`}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Uji Reliabilitas"
                  summarySentence="Nilai Cronbach's Alpha seluruh konstruk berada di atas 0,80 (jauh melampaui batas 0,60), membuktikan instrumen kuesionermu sangat konsisten."
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

                  <AssumptionAlert
                    status="passed"
                    title="Asumsi Normalitas Terpenuhi (p = 0,200 > 0,05)"
                    description="Uji One-Sample Kolmogorov-Smirnov terhadap unstandardized residual menghasilkan nilai Asymp. Sig. (2-tailed) sebesar 0,200 > 0,05."
                    recommendation="Data residual regresi berdistribusi secara normal. Model memenuhi prasyarat pengujian parametrik tanpa perlu transformasi data."
                  />

                  <ResultTable
                    tableNumber="Tabel 4.4"
                    title="Hasil Uji Normalitas Kolmogorov-Smirnov Residual"
                    note="* Variabel yang diuji adalah Unstandardized Residual model regresi. Kriteria: Sig. > 0,05 berdistribusi normal."
                    columns={normalityCols}
                    data={results.normality || []}
                    rowKey={(r) => r.test}
                    highlightedValue={highlightedNumber}
                  />

                  <ExplanationBox
                    title="Interpretasi Uji Normalitas"
                    summarySentence="Nilai Sig. Kolmogorov-Smirnov sebesar 0,200 (> 0,05) membuktikan data residual regresi berdistribusi normal."
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

                  <AssumptionAlert
                    status="passed"
                    title="Model Bebas Gejala Multikolinearitas (VIF = 1,603 < 10)"
                    description="Kedua variabel independen memiliki nilai Tolerance = 0,624 (> 0,10) dan nilai VIF = 1,603 (< 10,00)."
                    recommendation="Tidak ditemukan adanya korelasi berlebih atau singularitas antar variabel bebas dalam model estimasi."
                  />

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
                    summarySentence="Nilai VIF seluruh variabel bebas di bawah 10 (1,603) dan Tolerance > 0,10, membuktikan model regresi bebas dari masalah multikolinearitas."
                    explanation={results.explanations.multicollinearity}
                    onHoverNumber={setHighlightedNumber}
                    activeNumber={highlightedNumber}
                  />
                </div>

                {/* 4c. Heteroskedastisitas */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="border-b border-border pb-2">
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      3. Uji Heteroskedastisitas (Uji Glejser)
                    </h3>
                  </div>

                  <AssumptionAlert
                    status="passed"
                    title="Model Bebas Gejala Heteroskedastisitas (Homoskedastik)"
                    description="Uji Glejser meregresikan nilai residual absolut terhadap variabel independen. Nilai signifikansi seluruh variabel bebas berada di atas 0,05."
                    recommendation="Varians residual konstan across observations, sehingga estimasi standar error dan uji signifikansi OLS valid."
                  />

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
                    summarySentence="Nilai Sig. Uji Glejser seluruh variabel bebas berada di atas 0,05, membuktikan tidak ada gejala heteroskedastisitas pada residual."
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
                    note="* Variabel Terikat (Y): Loyalitas Pelanggan. Taraf signifikansi α = 0,05. t tabel (df = 114) = 1,981."
                    columns={regressionCols}
                    data={results.regression || []}
                    rowKey={(r) => r.variable}
                    highlightedValue={highlightedNumber}
                  />

                  <ExplanationBox
                    title="Interpretasi Model Regresi & Uji t Parsial"
                    summarySentence="Kualitas Layanan (t = 4,21, p < 0,001) dan Kepuasan (t = 5,83, p < 0,001) secara parsial berpengaruh positif dan signifikan terhadap Loyalitas."
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
                    note="* F tabel pada derajat bebas df1 = 2, df2 = 114, α = 0,05 adalah 3,076. Kriteria: F hitung > F tabel dan Sig. < 0,05."
                    columns={fTestCols}
                    data={results.fTest ? [results.fTest] : []}
                    rowKey={() => 'ftest-1'}
                    highlightedValue={highlightedNumber}
                  />

                  <ExplanationBox
                    title="Interpretasi Uji F Simultan"
                    summarySentence="Nilai F hitung 78,54 > F tabel 3,08 (Sig. < 0,001) membuktikan kedua variabel bebas secara serempak memengaruhi Loyalitas."
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
                    note="* Predictors: (Constant), Kepuasan Pelanggan (X2), Kualitas Layanan (X1). Dependent Variable: Loyalitas Pelanggan (Y)."
                    columns={determinationCols}
                    data={results.determination ? [results.determination] : []}
                    rowKey={() => 'det-1'}
                    highlightedValue={highlightedNumber}
                  />

                  <ExplanationBox
                    title="Interpretasi Koefisien Determinasi R²"
                    summarySentence="Nilai R² sebesar 0,580 menunjukkan 58% variasi Loyalitas dijelaskan oleh model, sedangkan 42% sisanya ditentukan faktor lain."
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
                  note="* Tingkat korelasi 2-tailed diuji pada tingkat signifikansi α = 0,01."
                  columns={correlationCols}
                  data={results.correlation || []}
                  rowKey={(r) => `${r.variable1}-${r.variable2}`}
                  highlightedValue={highlightedNumber}
                />

                <ExplanationBox
                  title="Interpretasi Korelasi Pearson"
                  summarySentence="Terdapat hubungan linier positif dan kuat antara variabel-variabel penelitian (r = 0,724, p < 0,001)."
                  explanation={results.explanations.correlation}
                  onHoverNumber={setHighlightedNumber}
                  activeNumber={highlightedNumber}
                />
              </TabsContent>
            </Tabs>

            {/* University thesis advisor guidance reminder */}
            <div className="rounded-[16px] border border-border bg-card p-5 sm:p-6 flex items-start gap-3.5 text-xs sm:text-sm text-foreground/90 shadow-xs">
              <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1.5 max-w-[68ch]">
                <h5 className="font-semibold text-foreground text-sm">
                  Panduan Penyusunan Bab 4 Skripsi
                </h5>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  Hasil pengolahan data dan narasi di atas disusun sesuai kaidah statistik baku. Kamu bisa langsung menyalinnya ke draf skripsi. Jika dosen pembimbing menanyakan sumber angka, tunjukkan sel tabel dan rincian di panel Jejak Hitung.
                </p>
                <p className="text-xs font-medium text-primary">
                  {COPY.reassurance.saved}
                </p>
              </div>
            </div>
          </main>

          {/* Right Column: Sticky Traceability Audit Panel */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6 space-y-4">
            <TraceabilityPanel
              currentTestName={testNamesMap[activeTab] || 'Analisis Statistik'}
              dataVersionLabel={`${project?.currentDataVersion || 'dv-2'} (117 responden, 3 baris dihapus)`}
              respondentCount={results.respondentCount}
              significanceLevel={results.significanceLevel}
              timestamp={results.timestamp}
              engineVersion={results.engineVersion}
              additionalParameters={{
                'Metode Estimasi': 'OLS',
                'df Residual': 114,
                'Uji Hipotesis': 'Two-tailed (α=0,05)',
              }}
            />

            {/* Tool usage statement banner in sidebar */}
            <div className="rounded-md border border-border bg-card p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Pernyataan Penggunaan Alat</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Kamu dapat melampirkan surat pernyataan transparansi penggunaan {APP_NAME} pada berkas lampiran skripsimu.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportOpen(true)}
                className="w-full text-xs h-7 text-primary hover:text-primary mt-1"
              >
                Unduh Lampiran Pernyataan
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        projectId={projectId}
        projectTitle={project?.title}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </div>
  );
}
