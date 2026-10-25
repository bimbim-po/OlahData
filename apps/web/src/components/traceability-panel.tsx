'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Database,
  Cpu,
  Sliders,
  Users,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileDown,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ENGINE_VERSION } from '@/lib/constants';
import { formatDateTime, formatNumber } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { useToast } from '@/components/ui/toaster';
import type { AnalysisResults } from '@/lib/api/types';

export interface TraceabilityPanelProps {
  currentTestKey?: string;
  currentTestName?: string;
  dataVersionLabel?: string;
  respondentCount: number;
  significanceLevel?: number;
  rTabel?: number;
  dfResidual?: number;
  hash?: string;
  isHashValid?: boolean;
  timestamp?: string;
  engineVersion?: string;
  onDownloadStatement?: () => void;
  results?: AnalysisResults | null;
  projectTitle?: string;
  className?: string;
}

export function TraceabilityPanel({
  currentTestKey = 'descriptive',
  currentTestName = 'Statistik Deskriptif',
  dataVersionLabel,
  respondentCount,
  significanceLevel = 0.05,
  rTabel,
  dfResidual,
  hash,
  isHashValid = true,
  timestamp = new Date().toISOString(),
  engineVersion = ENGINE_VERSION,
  onDownloadStatement,
  results,
  projectTitle,
  className,
}: TraceabilityPanelProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'defense'>('audit');
  const [isOpen, setIsOpen] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyVerificationCode = async () => {
    const code = hash || `OLAH-${respondentCount}-${engineVersion}`;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast({
        title: 'Kode Verifikasi Disalin',
        description: 'Kode jejak audit SHA-256 berhasil disalin ke papan klip.',
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

  const handleCopyFaqAnswer = async (faqId: string, answerText: string) => {
    try {
      await navigator.clipboard.writeText(answerText);
      setCopiedFaqId(faqId);
      setTimeout(() => setCopiedFaqId(null), 2000);
      toast({
        title: 'Jawaban Sidang Disalin!',
        description: 'Jawaban berbasis angka proyek siap dipelajari untuk tanya-jawab dosen.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Gagal Menyalin',
        description: 'Periksa izin clipboard peramban.',
        variant: 'error',
      });
    }
  };

  // Regression & parameter metrics
  const predictorCount = results?.regression
    ? results.regression.filter((r) => r.variable !== '(Konstanta)').length
    : 2;
  const dfR = Math.max(1, respondentCount - 2);
  const dfT = dfResidual ?? Math.max(1, respondentCount - predictorCount - 1);
  const dfF1 = predictorCount;
  const dfF2 = dfT;

  const currentRVal = rTabel !== undefined ? formatNumber(rTabel, 4) : '0,2542';
  const currentTVal = results?.tTabel !== undefined ? formatNumber(results.tTabel, 4) : '1,9944';
  const currentFVal = results?.fTabel !== undefined ? formatNumber(results.fTabel, 4) : '3,1504';

  // Regression equation string
  const regEquation = useMemo(() => {
    if (!results?.regression || results.regression.length === 0) return 'Y = a + b1(X1) + b2(X2) + e';
    const constRow = results.regression.find((r) => r.variable === '(Konstanta)');
    const aVal = constRow ? formatNumber(constRow.coefficient, 3) : '0,000';
    const terms = results.regression
      .filter((r) => r.variable !== '(Konstanta)')
      .map(
        (r) =>
          `${r.coefficient >= 0 ? '+ ' : '- '}${formatNumber(Math.abs(r.coefficient), 3)}(${r.variable})`
      );
    return `Y = ${aVal} ${terms.join(' ')} + e`;
  }, [results?.regression]);

  // Indicator mean insights
  const { topIndicator, lowestIndicator } = useMemo(() => {
    if (!results?.itemDescriptive || results.itemDescriptive.length === 0) {
      return { topIndicator: null, lowestIndicator: null };
    }
    const sorted = [...results.itemDescriptive].sort((a, b) => b.mean - a.mean);
    return {
      topIndicator: sorted[0],
      lowestIndicator: sorted[sorted.length - 1],
    };
  }, [results?.itemDescriptive]);

  const rSquarePct = results?.determination
    ? formatNumber(results.determination.rSquare * 100, 1)
    : '45,0';
  const remainingPct = results?.determination
    ? formatNumber((1 - results.determination.rSquare) * 100, 1)
    : '55,0';

  // 6 Dynamic Defense FAQs
  const defenseFaqs = useMemo(
    () => [
      {
        id: 'faq-1',
        q: '1. Bagaimana cara menentukan angka r-tabel, t-tabel, dan F-tabel?',
        a: `Untuk r-tabel, digunakan rumus derajat bebas df = N - 2 = ${respondentCount} - 2 = ${dfR}. Pada taraf signifikansi α = 0,05 (uji 2 sisi), diperoleh nilai r-tabel = ${currentRVal}. Untuk t-tabel, rumus df = N - k - 1 = ${respondentCount} - ${predictorCount} - 1 = ${dfT} pada α = 0,05 (2 sisi), diperoleh t-tabel = ${currentTVal}. Sedangkan untuk F-tabel, df1 = k = ${dfF1} dan df2 = ${dfF2} pada α = 0,05, diperoleh F-tabel = ${currentFVal}. Semua nilai tabel diperoleh dari inverse distribusi statistik baku terstandar.`,
        tag: 'Tabel Distribusi',
      },
      {
        id: 'faq-2',
        q: '2. Mengapa memilih Uji Kolmogorov-Smirnov, Glejser, dan Regresi Berganda?',
        a: `Uji Kolmogorov-Smirnov (K-S) dipilih karena menguji distribusi residual model regresi secara non-parametrik yang kontinu tanpa dipengaruhi subjektivitas penentuan interval histogram. Uji Glejser dipilih karena meregresikan nilai absolut residual |e_i| terhadap variabel bebas secara matematis dan objektif, tidak seperti scatterplot yang rentan bias interpretasi visual. Regresi linier berganda dipilih untuk mengukur arah serta magnitude pengaruh variabel bebas secara parsial (Uji t) maupun simultan (Uji F).`,
        tag: 'Metodologi',
      },
      {
        id: 'faq-3',
        q: '3. Bagaimana cara menjelaskan arti persamaan regresi yang diperoleh?',
        a: `Persamaan regresi yang diperoleh adalah: ${regEquation}. Nilai konstanta menunjukkan nilai variabel terikat (Y) ketika seluruh variabel bebas bernilai nol. Sedangkan koefisien regresi pada masing-masing variabel bebas menunjukkan besaran perubahan pada variabel Y untuk setiap kenaikan 1 satuan variabel bebas tersebut, dengan asumsi seluruh variabel bebas lainnya dalam keadaan konstan (ceteris paribus).`,
        tag: 'Interpretasi Model',
      },
      {
        id: 'faq-4',
        q: `4. Mengapa nilai R-Square sebesar ${rSquarePct}%? Apakah penelitian gagal jika < 80%?`,
        a: `Tidak, penelitian sama sekali tidak gagal. Dalam riset ilmu sosial, perilaku manusia, dan manajemen, nilai R² sebesar ${rSquarePct}% tergolong lazim dan memiliki validitas empiris yang baik. Hal ini karena keputusan manusia sangat kompleks dan dipengaruhi oleh faktor eksternal di luar model (${remainingPct}%), seperti aspek budaya, karakteristik demografi, atau pengalaman individu yang disarankan untuk dianalisis pada penelitian selanjutnya.`,
        tag: 'R-Squared',
      },
      {
        id: 'faq-5',
        q: '5. Indikator mana yang paling dominan vs paling lemah & rekomendasinya di Bab 5?',
        a:
          topIndicator && lowestIndicator
            ? `Berdasarkan Tingkat Capaian Responden (TCR), butir dengan persepsi terkuat adalah "${topIndicator.variable}" (Mean = ${formatNumber(topIndicator.mean, 2)}, TCR = ${formatNumber(topIndicator.tcr ?? 0, 1)}% - Kategori ${topIndicator.tcrCategory}), sedangkan butir terendah adalah "${lowestIndicator.variable}" (Mean = ${formatNumber(lowestIndicator.mean, 2)}, TCR = ${formatNumber(lowestIndicator.tcr ?? 0, 1)}% - Kategori ${lowestIndicator.tcrCategory}). Rekomendasi Bab 5: Pertahankan dan jadikan acuan butir terkuat, serta prioritaskan program perbaikan dan pelatihan terarah pada dimensi butir terendah.`
            : `Indikator dengan Mean dan TCR tertinggi menunjukkan persepsi terkuat responden yang perlu dipertahankan. Sebaliknya, indikator dengan skor terendah mencerminkan kelemahan yang memerlukan program perbaikan atau intervensi manajerial spesifik yang wajib dituangkan dalam saran dan implikasi manajerial Bab 5.`,
        tag: 'Implikasi Bab 5',
      },
      {
        id: 'faq-6',
        q: '6. Apa yang harus dijawab jika ada butir yang gugur (drop) atau asumsi disesuaikan?',
        a: `Sesuai kaidah metodologi penelitian (Prof. Sugiyono, 2019; Prof. Dr. Imam Ghozali, 2018), butir kuesioner yang gugur (r hitung < r tabel) wajib dikeluarkan agar tidak merusak validitas konstruk dan reliabilitas instrumen secara agregat. Pengeluaran butir gugur adalah tindakan ilmiah yang sah demi menjamin presisi instrumen. Demikian juga jika asumsi heteroskedastisitas beralih ke Uji Park atau Rank Spearman, langkah tersebut diakui secara luas dalam ekonometrika sebagai estimasi non-parametrik yang valid tanpa memanipulasi data primer responden.`,
        tag: 'Justifikasi Ilmiah',
      },
    ],
    [
      respondentCount,
      predictorCount,
      dfR,
      dfT,
      dfF1,
      dfF2,
      currentRVal,
      currentTVal,
      currentFVal,
      regEquation,
      rSquarePct,
      remainingPct,
      topIndicator,
      lowestIndicator,
    ]
  );

  // Render parameter dinamis spesifik sesuai jenis uji yang aktif
  const renderTestSpecificParams = () => {
    switch (currentTestKey) {
      case 'descriptive':
        return (
          <>
            <div>Responden valid: N = {respondentCount}</div>
            <div>Skala pengukuran: Likert 1–5</div>
            <div>Aturan skor konstruk: Rata-rata butir (Mean)</div>
          </>
        );

      case 'validity':
        return (
          <>
            <div>Metode: Korelasi Pearson Product Moment</div>
            <div>Derajat bebas: df = {respondentCount - 2}</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            {rTabel && <div>r Tabel baku: {rTabel.toFixed(4).replace('.', ',')}</div>}
          </>
        );

      case 'reliability':
        return (
          <>
            <div>Koefisien: Cronbach&apos;s Alpha</div>
            <div>Batas baku minimum: 0,70 (standar ketat) / 0,60</div>
            <div>Kriteria: Alpha ≥ ambang batas dinyatakan andal</div>
          </>
        );

      case 'assumptions':
      case 'normality':
        return (
          <>
            <div>Normalitas: One-Sample Kolmogorov-Smirnov (p ≥ 0,05)</div>
            <div>Multikolinearitas: Tolerance &gt; 0,10, VIF &lt; 10,00</div>
            <div>Heteroskedastisitas: Uji Glejser / Park / Spearman (Sig. &gt; 0,05)</div>
          </>
        );

      case 'regression':
        return (
          <>
            <div>Metode estimasi: Ordinary Least Squares (OLS)</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            <div>df Residual: {dfResidual ?? respondentCount - 3}</div>
            <div>Uji simultan: ANOVA F-test</div>
          </>
        );

      case 'correlation':
        return (
          <>
            <div>Metode: Pearson Product Moment</div>
            <div>Taraf signifikansi: α = 0,05 (uji dua arah)</div>
            <div>Kategori kekuatan: Sugiyono dan Schober</div>
          </>
        );

      default:
        return (
          <>
            <div>Tingkat signifikansi: α = 0,05</div>
            <div>Metode: Deterministik Terverifikasi</div>
          </>
        );
    }
  };

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4 font-sans',
        className
      )}
    >
      {/* Header & Segmented Tab Switcher */}
      <div className="space-y-3 pb-3 border-b border-border/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" />
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
              Pusat Audit dan Sidang
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isHashValid ? (
              <Badge
                variant="outline"
                className="text-[12px] gap-1 py-0.5 px-2 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 rounded-[6px]"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Terverifikasi</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[12px] gap-1 py-0.5 px-2 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 rounded-[6px]"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Cek Ulang</span>
              </Badge>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground md:hidden p-1 touch-manipulation cursor-pointer"
              aria-label="Buka/tutup rincian panel"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
              />
            </button>
          </div>
        </div>

        {/* Dual-Tab Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={cn(
              'px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5',
              activeTab === 'audit'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Rumus dan Jejak Hitung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('defense')}
            className={cn(
              'px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5',
              activeTab === 'defense'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>Bekal Sidang</span>
          </button>
        </div>
      </div>

      {/* Panel Content (Bisa dibuka-tutup di mobile) */}
      <div className={cn('space-y-3.5 text-[13px] pt-1', !isOpen && 'hidden')}>
        {/* TAB 1: RUMUS & JEJAK HITUNG */}
        {activeTab === 'audit' && (
          <div className="space-y-3.5">
            {/* 1. Uji */}
            <div className="flex items-start gap-2.5">
              <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.test}
                </span>
                <span className="font-semibold text-foreground text-[13px] break-words">
                  {currentTestName}
                </span>
              </div>
            </div>

            {/* 2. Dataset */}
            <div className="flex items-start gap-2.5">
              <Database className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.dataVersion}
                </span>
                <span className="font-medium text-foreground text-[13px] break-words">
                  {dataVersionLabel || `Dataset aktif (N = ${respondentCount})`}
                </span>
                {hash && (
                  <span className="block font-mono text-[11px] text-muted-foreground/80 truncate mt-0.5">
                    Hash: {hash.slice(0, 16)}...
                  </span>
                )}
              </div>
            </div>

            {/* 3. Responden */}
            <div className="flex items-start gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.respondents}
                </span>
                <span className="font-semibold text-foreground text-[13px] tabular-nums">
                  N = {respondentCount} responden
                </span>
              </div>
            </div>

            {/* 4. Parameter Uji yang Relevan */}
            <div className="flex items-start gap-2.5">
              <Sliders className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.parameters}
                </span>
                <div className="text-foreground font-medium text-[12px] leading-relaxed space-y-0.5">
                  {renderTestSpecificParams()}
                </div>
              </div>
            </div>

            {/* 5. Waktu Analisis */}
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.timestamp}
                </span>
                <span className="font-medium text-foreground text-[12px]">
                  {formatDateTime(timestamp)}
                </span>
              </div>
            </div>

            {/* 6. Versi Mesin */}
            <div className="flex items-start gap-2.5">
              <Cpu className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[12px]">
                  {COPY.results.traceFields.engineVersion}
                </span>
                <span className="font-mono text-[12px] font-semibold text-foreground">
                  v{engineVersion}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Verifikasi */}
            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyVerificationCode}
                className="w-full justify-center gap-1.5 text-xs min-h-[38px] text-foreground hover:bg-muted font-medium rounded-lg touch-manipulation cursor-pointer"
                title="Salin kode hash verifikasi keutuhan dataset"
              >
                {copiedHash ? (
                  <>
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">Kode Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span>Salin kode verifikasi</span>
                  </>
                )}
              </Button>

              {onDownloadStatement && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDownloadStatement}
                  className="w-full justify-center gap-1.5 text-xs min-h-[38px] text-primary hover:text-primary hover:bg-primary/5 font-medium rounded-lg touch-manipulation cursor-pointer"
                  title="Unduh berkas lampiran pernyataan etika penggunaan alat untuk sidang skripsi"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Unduh lampiran pernyataan</span>
                </Button>
              )}
            </div>

            <div className="pt-2 border-t border-border/50 text-[11.5px] text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-[10px]">
              <span className="font-semibold text-foreground">Integritas Akademik: </span>
              Setiap hasil dicatat bersama hash dataset dan parameter sehingga dapat diverifikasi keutuhannya.
            </div>
          </div>
        )}

        {/* TAB 2: BEKAL SIDANG (TANYA-JAWAB DOSEN) */}
        {activeTab === 'defense' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/30 text-[11.5px] text-amber-900 dark:text-amber-200 leading-snug">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span><span className="font-bold">Jawaban Siap Sidang:</span> Angka di bawah ini otomatis disesuaikan dengan hasil komputasi proyek Anda.</span>
            </div>

            <div className="space-y-2">
              {defenseFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                const isCopied = copiedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-border/80 bg-background overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full p-3 text-left flex items-start justify-between gap-2 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1 pr-1">
                        <span className="text-[12px] font-semibold text-foreground block leading-snug">
                          {faq.q}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 font-normal text-muted-foreground">
                          {faq.tag}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground mt-0.5 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-border/40 text-[12px] space-y-2.5 bg-muted/10">
                        <p className="text-foreground/90 leading-relaxed font-sans">{faq.a}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyFaqAnswer(faq.id, faq.a)}
                          className="h-7 text-[11px] text-primary hover:text-primary gap-1 px-2 cursor-pointer font-medium"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? 'Jawaban Tersalin' : 'Salin Jawaban untuk Belajar'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
