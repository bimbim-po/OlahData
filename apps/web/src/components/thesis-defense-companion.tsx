'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toaster';

export type DefenseTestKey =
  | 'validity'
  | 'reliability'
  | 'normality'
  | 'multicollinearity'
  | 'heteroscedasticity'
  | 'regression'
  | 'paired-ttest'
  | 'ngain'
  | 'independent-ttest'
  | 'oneway-anova'
  | 'nonparametric';

interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  citation: {
    author: string;
    title: string;
    year: string;
    note: string;
  };
}

interface ThesisDefenseCompanionProps {
  testType: DefenseTestKey;
  dataMetrics?: {
    n?: number;
    df?: number;
    rTabel?: number;
    cronbachAlpha?: number;
    ksSig?: number;
    maxVif?: number;
    minTolerance?: number;
    glejserSigMin?: number;
    fHitung?: number;
    fTabel?: number;
    rSquare?: number;
    tHitung?: number;
    tTabel?: number;
    leveneSig?: number;
    nGainScore?: number;
    nGainPercent?: number;
    hakeCategory?: string;
    meltzerCategory?: string;
    chosenVar?: string;
  };
  className?: string;
}

export function ThesisDefenseCompanion({
  testType,
  dataMetrics = {},
  className,
}: ThesisDefenseCompanionProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    n = 60,
    df = 58,
    rTabel = 0.254,
    cronbachAlpha = 0.842,
    ksSig = 0.2,
    maxVif = 1.45,
    minTolerance = 0.69,
    glejserSigMin = 0.312,
    fHitung = 14.85,
    fTabel = 3.15,
    rSquare = 0.485,
    tHitung = 3.42,
    tTabel = 2.001,
    leveneSig = 0.428,
    nGainScore = 0.68,
    nGainPercent = 68.2,
    hakeCategory = 'Sedang',
    meltzerCategory = 'Cukup Efektif',
    chosenVar = 'Variabel Terkait',
  } = dataMetrics;

  const getQuestions = (): QuestionItem[] => {
    switch (testType) {
      case 'validity':
        return [
          {
            id: 'val-1',
            question: 'Mengapa menggunakan r-tabel dengan derajat kebebasan (df) = N - 2?',
            answer: `Izin menjawab Bapak/Ibu Penguji, dalam uji validitas Product Moment Pearson, derajat kebebasan ditentukan dengan rumus df = N - 2 karena terdapat 2 parameter estimasi rata-rata yang dihitung dari sampel (${n} responden, sehingga df = ${n - 2}). Pada taraf signifikansi 5% (uji dua arah), diperoleh nilai r-tabel sebesar ${rTabel.toFixed(3)}. Butir dinyatakan valid karena nilai r-hitung seluruh indikator lebih besar dari r-tabel.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Metode Penelitian Kuantitatif, Kualitatif, dan R&D',
              year: '2019',
              note: 'Penerbit Alfabeta Bandung, Bab Uji Validitas Instrumen, Hal. 178-182.',
            },
          },
          {
            id: 'val-2',
            question: 'Bagaimana jika ada butir pernyataan yang gugur/tidak valid? Mengapa tidak dipakai?',
            answer: `Jika ditemukan butir tidak valid (r-hitung < ${rTabel.toFixed(3)} atau korelasi negatif), secara metodologis butir tersebut harus didrop/dieliminasi dari analisis lanjutan dan tidak diikutsertakan dalam pembentukan skor komposit variabel. Hal ini bertujuan agar instrumen benar-benar murni mengukur konstruk teoritis yang diteliti tanpa bias butir yang membingungkan responden.`,
            citation: {
              author: 'Prof. Dr. Suharsimi Arikunto',
              title: 'Prosedur Penelitian Suatu Pendekatan Praktik',
              year: '2010',
              note: 'Rineka Cipta Jakarta, Bab Pengujian Validitas dan Gugurnya Butir Kuesioner.',
            },
          },
        ];

      case 'reliability':
        return [
          {
            id: 'rel-1',
            question: "Mengapa memilih rumus Cronbach's Alpha dan menetapkan standar minimal 0,70?",
            answer: `Izin menjawab Bapak/Ibu, Cronbach's Alpha digunakan karena kuesioner penelitian ini menggunakan skala bertingkat (Skala Likert 1-5), bukan skala dikotomi benar/salah (yang memakai KR-20). Berdasarkan kriteria Prof. Imam Ghozali dan Nunnally, nilai Cronbach's Alpha > 0,70 (pada data kami diperoleh ${cronbachAlpha.toFixed(3)}) menunjukkan konsistensi internal yang sangat baik dan reliabel untuk pengujian hipotesis.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Universitas Diponegoro, Bab Uji Reliabilitas, Hal. 45-48.',
            },
          },
        ];

      case 'normality':
        return [
          {
            id: 'norm-1',
            question: 'Apakah yang diuji normalitas itu data mentah variabel atau nilai residual regresi?',
            answer: `Izin menjelaskan Bapak/Ibu Penguji, yang wajib berdistribusi normal dalam uji asumsi klasik model regresi OLS adalah nilai residualnya (unstandardized residual), bukan data variabel mentahnya secara individual. Pada penelitian kami, uji One-Sample Kolmogorov-Smirnov menghasilkan nilai Asymp. Sig. (2-tailed) = ${ksSig.toFixed(3)} (> 0,05), sehingga residual terbukti berdistribusi normal secara meyakinkan.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Uji Asumsi Klasik Normalitas Residual, Hal. 161-163.',
            },
          },
        ];

      case 'multicollinearity':
        return [
          {
            id: 'multi-1',
            question: 'Bagaimana membuktikan tidak ada hubungan linear antar variabel bebas (multikolinearitas)?',
            answer: `Kami memeriksa nilai Tolerance dan VIF (Variance Inflation Factor). Model regresi bebas dari masalah multikolinearitas jika nilai Tolerance > 0,10 dan VIF < 10,0. Pada model kami, nilai VIF tertinggi adalah ${maxVif.toFixed(2)} (< 10) dan Tolerance terendah adalah ${minTolerance.toFixed(2)} (> 0,10), membuktikan tidak terdapat korelasi berlebih antar variabel independen.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Uji Multikolinearitas, Hal. 107-108.',
            },
          },
        ];

      case 'heteroscedasticity':
        return [
          {
            id: 'hetero-1',
            question: 'Mengapa memilih Uji Glejser dan apa kriterianya?',
            answer: `Uji Glejser meregresikan nilai mutlak residual (|Abs_Res|) terhadap seluruh variabel independen. Jika nilai signifikansi (Sig.) seluruh variabel bebas > 0,05 (pada penelitian kami Sig. terendah = ${glejserSigMin.toFixed(3)}), maka model regresi dinyatakan homoskedastisitas (bebas dari gangguan varians residual yang tidak konstan).`,
            citation: {
              author: 'Damodar N. Gujarati & Dawn C. Porter',
              title: 'Basic Econometrics (5th Edition)',
              year: '2009',
              note: 'McGraw-Hill, Bab Heteroscedasticity: What Happens if Error Variance is Nonconstant.',
            },
          },
        ];

      case 'regression':
        return [
          {
            id: 'reg-1',
            question: 'Apa perbedaan mendasar antara interpretasi Uji F simultan dan Uji t parsial?',
            answer: `Uji F menguji pengaruh seluruh variabel bebas secara bersama-sama/simultan terhadap variabel terikat (pada model kami diperoleh F-hitung = ${fHitung.toFixed(2)} > F-tabel = ${fTabel.toFixed(2)}, Sig. < 0,05, sehingga model fit dan signifikan). Sedangkan Uji t menguji signifikansi pengaruh masing-masing variabel bebas secara individual (parsial) dengan membandingkan t-hitung dengan t-tabel (${tTabel.toFixed(3)}). Nilai R² sebesar ${(rSquare * 100).toFixed(1)}% mencerminkan persentase variasi yang mampu dijelaskan oleh model.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Statistika untuk Penelitian',
              year: '2018',
              note: 'Penerbit Alfabeta Bandung, Bab Regresi Ganda dan Pengujian Hipotesis, Hal. 260-275.',
            },
          },
        ];

      case 'paired-ttest':
        return [
          {
            id: 'pair-1',
            question: 'Kapan tepatnya Paired Sample t-Test digunakan dalam penelitian eksperimen/pra-pasca?',
            answer: `Paired Sample t-Test digunakan ketika satu kelompok sampel yang sama diukur sebanyak dua kali (Pre-test dan Post-test) untuk melihat efektivitas suatu perlakuan/intervensi. Karena subjeknya berpasangan, pengujian berfokus pada rata-rata selisih skor (mean difference). Pada uji kami diperoleh t-hitung = ${tHitung.toFixed(3)} dengan Sig. < 0,05, yang membuktikan terdapat perbedaan peningkatan hasil belajar yang signifikan setelah perlakuan.`,
            citation: {
              author: 'Prof. Dr. Sugiyono',
              title: 'Metode Penelitian Pendidikan (Kuantitatif, Kualitatif, Kombinasi, R&D)',
              year: '2020',
              note: 'Penerbit Alfabeta Bandung, Bab Desain Eksperimen One Group Pretest-Posttest.',
            },
          },
        ];

      case 'ngain':
        return [
          {
            id: 'ngain-1',
            question: 'Mengapa menggunakan rumus N-Gain Score ternormalisasi (Hake 1998) daripada selisih skor biasa?',
            answer: `Penggunaan selisih skor mentah (Post - Pre) memiliki kelemahan bias 'ceiling effect', di mana siswa dengan skor awal tinggi sulit menunjukkan selisih besar. Rumus N-Gain Richard R. Hake membagi selisih dengan potensi peningkatan maksimal yang mungkin diraih (Max - Pre). Rata-rata N-Gain pada data kami adalah ${nGainScore.toFixed(2)} (${nGainPercent.toFixed(1)}%), yang masuk dalam kategori '${hakeCategory}' menurut kriteria Hake dan kualifikasi '${meltzerCategory}' menurut Meltzer (2002).`,
            citation: {
              author: 'Richard R. Hake & David E. Meltzer',
              title: 'Interactive-engagement vs traditional methods (Am. J. Phys) & The relationship between mathematics preparation',
              year: '1998 / 2002',
              note: 'American Journal of Physics 66(1), Hal. 64-74 dan Addendum Kategori Efektivitas.',
            },
          },
        ];

      case 'independent-ttest':
        return [
          {
            id: 'indep-1',
            question: "Mengapa harus memeriksa Uji Homogenitas Levene terlebih dahulu sebelum membaca baris t-hitung?",
            answer: `Izin menjelaskan Bapak/Ibu, rumus Uji-t dua sampel independen mensyaratkan asumsi kesamaan varians. Jika Uji Levene menghasilkan nilai Sig. > 0,05 (pada data kami Sig. = ${leveneSig.toFixed(3)}), maka varians kedua kelompok homogen sehingga baris yang dibaca adalah 'Equal variances assumed'. Sebaliknya jika Sig. ≤ 0,05, maka digunakan koreksi derajat kebebasan Welch-Satterthwaite pada baris 'Equal variances not assumed'.`,
            citation: {
              author: 'Prof. Dr. Imam Ghozali, M.Com, Ph.D, CA',
              title: 'Aplikasi Analisis Multivariate dengan Program IBM SPSS 25',
              year: '2018',
              note: 'Badan Penerbit Undip, Bab Independent Sample t-Test dan Uji Homogenitas Varians.',
            },
          },
        ];

      case 'oneway-anova':
        return [
          {
            id: 'anova-1',
            question: 'Kapan ANOVA satu arah digunakan dan mengapa dilanjutkan dengan uji Post-Hoc Tukey HSD?',
            answer: `One-Way ANOVA digunakan untuk membandingkan rata-rata dari tiga kelompok perlakuan atau lebih secara simultan. Jika nilai F-hitung signifikan (Sig. < 0,05), ANOVA hanya memberitahukan bahwa minimal ada satu pasang kelompok yang berbeda, tetapi tidak menyebutkan secara spesifik kelompok mana yang berbeda. Oleh karena itu, uji lanjut Post-Hoc Tukey HSD dilakukan untuk membandingkan kontras antar pasangan perlakuan secara presisi.`,
            citation: {
              author: 'Ronald E. Walpole, Raymond H. Myers, et al.',
              title: 'Probability & Statistics for Engineers & Scientists (9th Ed)',
              year: '2012',
              note: 'Pearson Education, Bab One-Way Analysis of Variance and Multiple Comparisons.',
            },
          },
        ];

      case 'nonparametric':
        return [
          {
            id: 'nonpar-1',
            question: 'Mengapa beralih ke uji non-parametrik (Mann-Whitney / Wilcoxon / Kruskal-Wallis)?',
            answer: `Uji parametrik seperti t-test dan ANOVA memerlukan asumsi bahwa data berdistribusi normal. Ketika data tidak memenuhi asumsi normalitas (Sig. < 0,05) dan jumlah sampel terbatas, uji non-parametrik berbasis pemeringkatan (ranking) menjadi metode resmi yang sah secara metodologis karena bebas dari asumsi distribusi populasi tertentu (distribution-free test).`,
            citation: {
              author: 'W.J. Conover & Prof. Dr. Sugiyono',
              title: 'Practical Nonparametric Statistics & Statistika Nonparametris untuk Penelitian',
              year: '1999 / 2019',
              note: 'John Wiley & Sons / Alfabeta, Bab Uji Dua Sampel Independen & Berpasangan Non-parametrik.',
            },
          },
        ];

      default:
        return [];
    }
  };

  const questions = getQuestions();
  if (questions.length === 0) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: 'Jawaban Disalin!',
      description: 'Gunakan draf jawaban ini untuk persiapan sidang skripsi.',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 transition-all dark:border-amber-400/20 dark:from-amber-950/20 dark:to-orange-950/10',
        className
      )}
    >
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                Bekal Sidang & Tanya-Jawab Dosen
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
              >
                Rujukan Metodologi Resmi
              </Badge>
            </div>
            <p className="text-xs text-amber-900/70 dark:text-amber-200/70">
              Pertanyaan umum penguji sidang skripsi, draf jawaban cerdas berbasis angka hasil uji Anda, dan rujukan buku.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <span>{isOpen ? 'Tutup' : 'Buka Bekal'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="mt-4 space-y-3 border-t border-amber-500/20 pt-4">
          {questions.map((item) => {
            const isItemExpanded = expandedQuestion === item.id || questions.length === 1;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-amber-500/20 bg-white/80 p-3.5 shadow-sm transition-all dark:border-amber-500/20 dark:bg-slate-900/80"
              >
                {/* Question Row */}
                <div
                  className="flex cursor-pointer items-start justify-between gap-3"
                  onClick={() =>
                    setExpandedQuestion(isItemExpanded && questions.length > 1 ? null : item.id)
                  }
                >
                  <div className="flex items-start gap-2.5">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {item.question}
                    </span>
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isItemExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Answer & Citation */}
                {isItemExpanded && (
                  <div className="mt-3 space-y-3 pl-6">
                    {/* Jawaban */}
                    <div className="rounded-md bg-amber-50/60 p-3 text-xs leading-relaxed text-slate-700 dark:bg-amber-950/30 dark:text-slate-300">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          <Sparkles className="h-3.5 w-3.5" />
                          Draf Jawaban Mahasiswa di Meja Sidang:
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.id, item.answer);
                          }}
                          className="h-6 gap-1 px-1.5 text-[10px] text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-900/50"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Salin Draf
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="italic leading-relaxed">{item.answer}</p>
                    </div>

                    {/* Rujukan Ilmiah */}
                    <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Rujukan Ilmiah:{' '}
                        </span>
                        {item.citation.author} ({item.citation.year}).{' '}
                        <span className="italic">{item.citation.title}</span>.{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {item.citation.note}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
