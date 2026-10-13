'use client';

import * as React from 'react';
import { Play, RotateCcw, FastForward, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COPY } from '@/lib/copy';

// Sample dataset: 6 respondents x 5 columns Likert 1-5
const RAW_SAMPLE_ROWS = [
  { resp: 'R001', x1: 4, x2: 5, x3: 4, total: 13 },
  { resp: 'R002', x1: 3, x2: 3, x3: 3, total: 9 },
  { resp: 'R003', x1: 5, x2: 5, x3: 5, total: 15 },
  { resp: 'R004', x1: 4, x2: 4, x3: 4, total: 12 },
  { resp: 'R005', x1: 5, x2: 4, x3: 5, total: 14 },
  { resp: 'R006', x1: 3, x2: 4, x3: 3, total: 10 },
];

export interface LiveDemoProps {
  className?: string;
  autoPlay?: boolean;
}

export function LiveDemo({ className, autoPlay = true }: LiveDemoProps) {
  // Choreography stages:
  // 0 = Initial (0.0-0.3s)
  // 1 = Raw questionnaire sheet with highlighter sweep (0.3-1.5s)
  // 2 = Result table emerges with computed badge (1.5-3.0s)
  // 3 = Narrative explanation emerges with connected numbers (3.0-4.2s)
  // 4 = Complete & Interactive (4.2s+)
  const [stage, setStage] = React.useState<number>(0);
  const [hoveredNumber, setHoveredNumber] = React.useState<string | null>(null);
  const [isInteractive, setIsInteractive] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timerRefs = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = React.useCallback(() => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  }, []);

  const markSessionComplete = React.useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('olahdata_demo_played', 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  const startChoreography = React.useCallback(() => {
    clearAllTimers();
    setStage(0);
    setIsInteractive(false);
    setHoveredNumber(null);

    // Timeline:
    // 0.3s -> Stage 1: Raw data table + highlight sweep
    const t1 = setTimeout(() => {
      setStage(1);
    }, 300);

    // 1.5s -> Stage 2: Result table emerges
    const t2 = setTimeout(() => {
      setStage(2);
    }, 1500);

    // 3.0s -> Stage 3: Narrative text emerges
    const t3 = setTimeout(() => {
      setStage(3);
    }, 3000);

    // 4.2s -> Stage 4: Interactive end state
    const t4 = setTimeout(() => {
      setStage(4);
      setIsInteractive(true);
      markSessionComplete();
    }, 4200);

    timerRefs.current = [t1, t2, t3, t4];
  }, [clearAllTimers, markSessionComplete]);

  // Check reduced motion & sessionStorage on mount
  React.useEffect(() => {
    // 1. Reduced motion check
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. SessionStorage check
    let alreadyPlayed = false;
    try {
      if (typeof window !== 'undefined') {
        alreadyPlayed = sessionStorage.getItem('olahdata_demo_played') === 'true';
      }
    } catch {
      // Ignore sessionStorage access errors (e.g. private mode)
    }

    if (prefersReducedMotion || alreadyPlayed || !autoPlay) {
      // Jump straight to interactive state
      setStage(4);
      setIsInteractive(true);
      return;
    }

    // Set up IntersectionObserver to trigger animation when demo enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startChoreography();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      clearAllTimers();
    };
  }, [autoPlay, startChoreography, clearAllTimers]);

  const skipToEnd = () => {
    clearAllTimers();
    setStage(4);
    setIsInteractive(true);
    markSessionComplete();
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    startChoreography();
  };

  const isHighlighted = (num: string) => {
    return isInteractive && hoveredNumber === num;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'group relative flex flex-col rounded-[16px] border border-border bg-card p-4 sm:p-5 shadow-xs overflow-hidden select-none',
        className
      )}
      aria-label="Demo interaktif transformasi data kuesioner menjadi tabel Bab 4"
    >
      {/* Top Header Bar: Metadata & Skip/Replay controls */}
      <div className="flex items-center justify-between pb-3 border-b border-border/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-muted font-medium text-[11px] text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Data contoh: Kuesioner Kepuasan (N=120)
          </span>
          <span className="hidden sm:inline-block text-[11px] text-muted-foreground">
            Skala Likert 1–5
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isInteractive ? (
            <button
              type="button"
              onClick={skipToEnd}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer touch-manipulation"
              title="Lewati animasi dan lihat hasil interaktif"
            >
              <span>Lewati</span>
              <FastForward className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReplay}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer touch-manipulation"
              title="Putar ulang animasi koreografi"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Putar ulang</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Choreography Canvas */}
      <div className="pt-3.5 space-y-4">
        {/* SECTION 1: Questionnaire Data Sheet (0.3s - 1.5s) */}
        <div
          className={cn(
            'transition-opacity duration-300',
            stage >= 1 ? 'opacity-100' : 'opacity-80'
          )}
        >
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="font-semibold text-foreground">
              1. Lembar Tabulasi Responden
            </span>
            <span className="text-muted-foreground tabular-nums">
              Potongan 6 baris × 3 butir pertanyaan
            </span>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-border/70 bg-muted/20">
            <table className="w-full text-[11px] font-sans border-collapse">
              <thead>
                <tr className="border-b border-border/70 bg-muted/50 text-muted-foreground text-left">
                  <th className="py-1 px-2.5 font-medium">Resp</th>
                  <th
                    className={cn(
                      'py-1 px-2 text-right font-medium transition-colors duration-500',
                      stage === 1 && 'bg-[#FFE14D]/40 text-[#243044] font-semibold'
                    )}
                  >
                    X1.1
                  </th>
                  <th
                    className={cn(
                      'py-1 px-2 text-right font-medium transition-colors duration-500',
                      stage === 1 && 'bg-[#FFE14D]/40 text-[#243044] font-semibold'
                    )}
                  >
                    X1.2
                  </th>
                  <th
                    className={cn(
                      'py-1 px-2 text-right font-medium transition-colors duration-500',
                      stage === 1 && 'bg-[#FFE14D]/40 text-[#243044] font-semibold'
                    )}
                  >
                    X1.3
                  </th>
                  <th className="py-1 px-2.5 text-right font-medium text-foreground">
                    Total X1
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-foreground/80">
                {RAW_SAMPLE_ROWS.map((row, idx) => (
                  <tr
                    key={row.resp}
                    className={cn(
                      'border-b border-border/40 last:border-b-0 transition-colors',
                      idx % 2 === 1 && 'bg-muted/10'
                    )}
                  >
                    <td className="py-1 px-2.5 text-muted-foreground font-mono">
                      {row.resp}
                    </td>
                    <td
                      className={cn(
                        'py-1 px-2 text-right transition-colors duration-500',
                        stage === 1 && 'bg-[#FFE14D]/30 text-[#243044] font-semibold'
                      )}
                    >
                      {row.x1}
                    </td>
                    <td
                      className={cn(
                        'py-1 px-2 text-right transition-colors duration-500',
                        stage === 1 && 'bg-[#FFE14D]/30 text-[#243044] font-semibold'
                      )}
                    >
                      {row.x2}
                    </td>
                    <td
                      className={cn(
                        'py-1 px-2 text-right transition-colors duration-500',
                        stage === 1 && 'bg-[#FFE14D]/30 text-[#243044] font-semibold'
                      )}
                    >
                      {row.x3}
                    </td>
                    <td className="py-1 px-2.5 text-right font-semibold text-foreground">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Result Table (emerges at Stage 2: 1.5s - 3.0s) */}
        <div
          className={cn(
            'transition-all duration-400 ease-out',
            stage >= 2
              ? 'opacity-100 translate-y-0'
              : 'opacity-40 translate-y-1 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground text-[11px] inline">
                2. Tabel 4.8 Hasil Uji Reliabilitas
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium text-[10px]">
                <ShieldCheck className="h-3 w-3" />
                Dihitung oleh program
              </span>
            </div>
            <span className="text-muted-foreground hidden sm:inline-block">
              Format Baku APA 7th
            </span>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-border/80 bg-card">
            <table className="w-full text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b-2 border-foreground text-[11px] font-semibold text-foreground text-left">
                  <th className="py-1.5 px-2.5">Konstruk Variabel</th>
                  <th className="py-1.5 px-2 text-right">Butir</th>
                  <th className="py-1.5 px-2.5 text-right">Cronbach&apos;s Alpha</th>
                  <th className="py-1.5 px-2.5 text-center">Simpulan</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-xs">
                {/* Row 1: Motivasi / Kualitas Layanan (X1) */}
                <tr
                  className={cn(
                    'border-b border-border/70 transition-all duration-200',
                    stage >= 2 ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <td className="py-2 px-2.5 font-medium text-foreground">
                    Kualitas Layanan (X1)
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    3
                  </td>
                  <td
                    onClick={() => {
                      if (isInteractive) {
                        setHoveredNumber(hoveredNumber === '0,872' ? null : '0,872');
                      }
                    }}
                    onMouseEnter={() => isInteractive && setHoveredNumber('0,872')}
                    onMouseLeave={() => isInteractive && setHoveredNumber(null)}
                    className={cn(
                      'py-2 px-2.5 text-right font-semibold transition-all duration-150 cursor-pointer',
                      (stage === 2 || stage === 3 || isHighlighted('0,872')) &&
                        'bg-[#FFE14D] text-[#243044] ring-2 ring-[#FFE14D] rounded-[4px]'
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label="Nilai Cronbach Alpha 0,872. Klik untuk menelusuri penjelasannya"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setHoveredNumber(hoveredNumber === '0,872' ? null : '0,872');
                      }
                    }}
                  >
                    0,872
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Reliabel
                    </span>
                  </td>
                </tr>

                {/* Row 2: Kepuasan Pelanggan (Y) */}
                <tr
                  className={cn(
                    'border-b-2 border-foreground transition-all duration-200 delay-100',
                    stage >= 2 ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <td className="py-2 px-2.5 font-medium text-foreground">
                    Kepuasan Pelanggan (Y)
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground">
                    4
                  </td>
                  <td
                    onClick={() => {
                      if (isInteractive) {
                        setHoveredNumber(hoveredNumber === '0,845' ? null : '0,845');
                      }
                    }}
                    onMouseEnter={() => isInteractive && setHoveredNumber('0,845')}
                    onMouseLeave={() => isInteractive && setHoveredNumber(null)}
                    className={cn(
                      'py-2 px-2.5 text-right font-semibold transition-all duration-150 cursor-pointer',
                      isHighlighted('0,845') &&
                        'bg-[#FFE14D] text-[#243044] ring-2 ring-[#FFE14D] rounded-[4px]'
                    )}
                    role="button"
                    tabIndex={0}
                    aria-label="Nilai Cronbach Alpha 0,845. Klik untuk menelusuri penjelasannya"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setHoveredNumber(hoveredNumber === '0,845' ? null : '0,845');
                      }
                    }}
                  >
                    0,845
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4331] bg-[#BFEBD9] px-2 py-0.5 rounded-[4px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Reliabel
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Connected Narrative Explanation (Stage 3: 3.0s - 4.2s) */}
        <div
          className={cn(
            'rounded-[10px] border border-border/90 bg-muted/30 p-3 sm:p-3.5 space-y-1.5 transition-all duration-400 ease-out',
            stage >= 3
              ? 'opacity-100 translate-y-0'
              : 'opacity-40 translate-y-1 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/50 pb-1">
            <span className="font-semibold text-foreground">
              3. Draf interpretasi (dibantu AI, dari angka terhitung):
            </span>
            <span className="text-[10px] tabular-nums">Ambang batas: α &gt; 0,70</span>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
            Berdasarkan Tabel 4.8 di atas, variabel Kualitas Layanan (X1) memiliki nilai Cronbach&apos;s Alpha sebesar{' '}
            <button
              type="button"
              onClick={() => {
                if (isInteractive) {
                  setHoveredNumber(hoveredNumber === '0,872' ? null : '0,872');
                }
              }}
              onMouseEnter={() => isInteractive && setHoveredNumber('0,872')}
              onMouseLeave={() => isInteractive && setHoveredNumber(null)}
              className={cn(
                'inline-block px-1.5 py-0.5 rounded-[4px] font-bold tabular-nums border cursor-pointer transition-all duration-150',
                (stage >= 3 || isHighlighted('0,872'))
                  ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]'
                  : 'bg-card text-foreground border-border/80'
              )}
              aria-label="Angka 0,872 tersambung ke sel tabel Cronbach Alpha Kualitas Layanan"
            >
              0,872
            </button>
            {' '}dan variabel Kepuasan Pelanggan (Y) sebesar{' '}
            <button
              type="button"
              onClick={() => {
                if (isInteractive) {
                  setHoveredNumber(hoveredNumber === '0,845' ? null : '0,845');
                }
              }}
              onMouseEnter={() => isInteractive && setHoveredNumber('0,845')}
              onMouseLeave={() => isInteractive && setHoveredNumber(null)}
              className={cn(
                'inline-block px-1.5 py-0.5 rounded-[4px] font-bold tabular-nums border cursor-pointer transition-all duration-150',
                isHighlighted('0,845')
                  ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]'
                  : 'bg-card text-foreground border-border/80'
              )}
              aria-label="Angka 0,845 tersambung ke sel tabel Cronbach Alpha Kepuasan"
            >
              0,845
            </button>
            . Karena kedua nilai lebih besar dari 0,70, instrumen penelitian dinyatakan memenuhi kriteria reliabilitas (alfa Cronbach &gt; 0,70).
          </p>
        </div>

        {/* SECTION 4: Interactive Cue & Replay (Stage 4: 4.2s+) */}
        {isInteractive && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground animate-in fade-in duration-300">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FFE14D] ring-2 ring-[#FFE14D]" />
              Sentuh angka bersorot kuning untuk melihat sel asalnya di tabel
            </span>
            <span className="hidden sm:inline text-[10px] tabular-nums">
              Jejak hitung aktif
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
