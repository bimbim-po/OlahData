'use client';

import * as React from 'react';
import {
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample dataset: 6 respondents x 4 columns Likert 1-5 (KL1, KL2, KL3, KL4)
const RAW_SAMPLE_ROWS = [
  { resp: 'R001', x1: 4, x2: 4, x3: 4, x4: 4, total: 16 },
  { resp: 'R002', x1: 3, x2: 4, x3: 4, x4: 4, total: 15 },
  { resp: 'R003', x1: 5, x2: 5, x3: 5, x4: 5, total: 20 },
  { resp: 'R004', x1: 4, x2: 4, x3: 4, x4: 3, total: 15 },
  { resp: 'R005', x1: 4, x2: 3, x3: 4, x4: 4, total: 15 },
  { resp: 'R006', x1: 3, x2: 4, x3: 3, x4: 4, total: 14 },
];

const CYCLE_NUMBERS = ['0,796', '0,753', '0,826'];

export interface LiveDemoProps {
  className?: string;
}

export function LiveDemo({ className }: LiveDemoProps) {
  // Tab: 'raw' (Data Mentah) | 'result' (Hasil Tabel APA 7th dan Narasi Bab 4)
  const [activeTab, setActiveTab] = React.useState<'raw' | 'result'>('result');
  const [hoveredNumber, setHoveredNumber] = React.useState<string | null>(null);
  const [isTransforming, setIsTransforming] = React.useState<boolean>(false);
  const [isUserInteracting, setIsUserInteracting] = React.useState<boolean>(false);
  const [inViewport, setInViewport] = React.useState<boolean>(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const cycleIndexRef = React.useRef<number>(0);
  const transformTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // IntersectionObserver to only run auto-cycle when in viewport
  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInViewport(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-cycle highlight every 2.8 seconds when Tab 2 is active and not interacted by user
  React.useEffect(() => {
    if (!inViewport || isUserInteracting || activeTab !== 'result' || isTransforming) {
      return;
    }

    const interval = setInterval(() => {
      cycleIndexRef.current = (cycleIndexRef.current + 1) % CYCLE_NUMBERS.length;
      setHoveredNumber(CYCLE_NUMBERS[cycleIndexRef.current]);
    }, 2800);

    return () => clearInterval(interval);
  }, [inViewport, isUserInteracting, activeTab, isTransforming]);

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      if (transformTimerRef.current) clearTimeout(transformTimerRef.current);
    };
  }, []);

  // Run Transformation Flow Demo: Tab 1 (scan raw data) -> Tab 2 (result table + narrative)
  const handleRunTransformation = () => {
    if (transformTimerRef.current) clearTimeout(transformTimerRef.current);

    setIsTransforming(true);
    setActiveTab('raw');
    setHoveredNumber(null);

    transformTimerRef.current = setTimeout(() => {
      setActiveTab('result');
      setHoveredNumber('0,796');
      setIsTransforming(false);
    }, 1300);
  };

  const isHighlighted = (num: string) => {
    return hoveredNumber === num;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsUserInteracting(true)}
      onMouseLeave={() => {
        setIsUserInteracting(false);
        setHoveredNumber(null);
      }}
      className={cn(
        'group relative flex flex-col p-5 sm:p-6 lg:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-900 transition-all',
        className
      )}
      aria-label="Demo interaktif transformasi data kuesioner menjadi tabel Bab 4"
    >
      {/* Top Header & Segmented Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800/70">
        {/* Segmented Control / Stepper Tabs */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('raw');
              setHoveredNumber(null);
            }}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation',
              activeTab === 'raw'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs border border-slate-200/80 dark:border-slate-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>1. Data Contoh (Excel)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('result');
              setHoveredNumber('0,796');
            }}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation',
              activeTab === 'result'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs border border-slate-200/80 dark:border-slate-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <FileText className="h-4 w-4 text-primary" />
            <span>2. Tabel APA 7th dan Narasi</span>
          </button>
        </div>

        {/* Action Controls: Lihat Alur Transformasi */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRunTransformation}
            disabled={isTransforming}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer touch-manipulation',
              isTransforming
                ? 'bg-primary/10 text-primary border-primary/30 animate-pulse'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs'
            )}
            title="Putar animasi transformasi dari data mentah ke tabel Bab 4"
          >
            {isTransforming ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Lihat Alur Transformasi</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas: Tab 1 or Tab 2 */}
      <div className="pt-4 min-h-[320px] flex flex-col justify-between">
        {activeTab === 'raw' ? (
          /* TAB 1: DATA MENTAH KUESIONER */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Cuplikan Tabulasi Responden (Data Mentah)
              </span>
              <span className="text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                Potongan 6 baris × 4 butir (Skala Likert 1–5)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-left">
                    <th className="px-4 py-3 font-medium">Resp ID</th>
                    <th
                      className={cn(
                        'px-4 py-3 text-right font-medium transition-colors duration-300 tabular-nums',
                        isTransforming && 'bg-[#FFE14D]/40 text-[#243044] font-bold'
                      )}
                    >
                      KL1
                    </th>
                    <th
                      className={cn(
                        'px-4 py-3 text-right font-medium transition-colors duration-300 tabular-nums',
                        isTransforming && 'bg-[#FFE14D]/40 text-[#243044] font-bold'
                      )}
                    >
                      KL2
                    </th>
                    <th
                      className={cn(
                        'px-4 py-3 text-right font-medium transition-colors duration-300 tabular-nums',
                        isTransforming && 'bg-[#FFE14D]/40 text-[#243044] font-bold'
                      )}
                    >
                      KL3
                    </th>
                    <th
                      className={cn(
                        'px-4 py-3 text-right font-medium transition-colors duration-300 tabular-nums',
                        isTransforming && 'bg-[#FFE14D]/40 text-[#243044] font-bold'
                      )}
                    >
                      KL4
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      Total Skor
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums text-slate-800 dark:text-slate-200">
                  {RAW_SAMPLE_ROWS.map((row, idx) => (
                    <tr
                      key={row.resp}
                      className={cn(
                        'border-b border-slate-200/50 dark:border-slate-800/50 last:border-b-0 transition-colors',
                        idx % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-900/40',
                        isTransforming && 'bg-[#FFE14D]/15'
                      )}
                    >
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {row.resp}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.x1}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.x2}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.x3}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.x4}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Dihitung dari instrumen kuesioner N=100 mahasiswa tanpa SPSS.
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('result');
                  setHoveredNumber('0,796');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <span>Lihat Hasil Tabel Bab 4</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: TABEL APA 7TH & DRAF NARASI BAB 4 (DEFAULT ACTIVE) */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Tabel 4.8 APA 7th */}
            <div>
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm inline">
                    Tabel 4.8 Hasil Uji Reliabilitas Instrumen
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Mesin Deterministik
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-xs hidden sm:inline-block">
                  Format Baku APA 7th Edition
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-xs sm:text-sm font-sans border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 dark:border-slate-100 text-xs font-semibold text-slate-900 dark:text-slate-100 text-left">
                      <th className="px-4 py-3 text-left">Konstruk Variabel</th>
                      <th className="px-4 py-3 text-right tabular-nums">Jumlah Butir</th>
                      <th className="px-4 py-3 text-right tabular-nums">Cronbach&apos;s Alpha</th>
                      <th className="px-4 py-3 text-center">Simpulan</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums text-xs sm:text-sm">
                    {/* Row 1: Kualitas Layanan (X1) */}
                    <tr
                      className={cn(
                        'border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150',
                        isHighlighted('0,796') && 'bg-slate-50 dark:bg-slate-800/40'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-left">
                        Kualitas Layanan (X1)
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                        4
                      </td>
                      <td
                        onClick={() => {
                          setHoveredNumber(hoveredNumber === '0,796' ? null : '0,796');
                          setIsUserInteracting(true);
                        }}
                        onMouseEnter={() => {
                          setHoveredNumber('0,796');
                          setIsUserInteracting(true);
                        }}
                        className={cn(
                          'px-4 py-3 text-right font-semibold transition-all duration-150 cursor-pointer select-text tabular-nums',
                          isHighlighted('0,796')
                            ? 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                            : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                        role="button"
                        tabIndex={0}
                        aria-label="Nilai Cronbach Alpha 0,796. Klik untuk menelusuri penjelasannya"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setHoveredNumber(hoveredNumber === '0,796' ? null : '0,796');
                            setIsUserInteracting(true);
                          }
                        }}
                      >
                        0,796
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Reliabel
                        </span>
                      </td>
                    </tr>

                    {/* Row 2: Kepuasan Pelanggan (X2) */}
                    <tr
                      className={cn(
                        'border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150',
                        isHighlighted('0,753') && 'bg-slate-50 dark:bg-slate-800/40'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-left">
                        Kepuasan Pelanggan (X2)
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                        5
                      </td>
                      <td
                        onClick={() => {
                          setHoveredNumber(hoveredNumber === '0,753' ? null : '0,753');
                          setIsUserInteracting(true);
                        }}
                        onMouseEnter={() => {
                          setHoveredNumber('0,753');
                          setIsUserInteracting(true);
                        }}
                        className={cn(
                          'px-4 py-3 text-right font-semibold transition-all duration-150 cursor-pointer select-text tabular-nums',
                          isHighlighted('0,753')
                            ? 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                            : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                        role="button"
                        tabIndex={0}
                        aria-label="Nilai Cronbach Alpha 0,753. Klik untuk menelusuri penjelasannya"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setHoveredNumber(hoveredNumber === '0,753' ? null : '0,753');
                            setIsUserInteracting(true);
                          }
                        }}
                      >
                        0,753
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Reliabel
                        </span>
                      </td>
                    </tr>

                    {/* Row 3: Loyalitas Pelanggan (Y) */}
                    <tr
                      className={cn(
                        'border-b-2 border-slate-900 dark:border-slate-100 transition-colors duration-150',
                        isHighlighted('0,826') && 'bg-slate-50 dark:bg-slate-800/40'
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-left">
                        Loyalitas Pelanggan (Y)
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums">
                        5
                      </td>
                      <td
                        onClick={() => {
                          setHoveredNumber(hoveredNumber === '0,826' ? null : '0,826');
                          setIsUserInteracting(true);
                        }}
                        onMouseEnter={() => {
                          setHoveredNumber('0,826');
                          setIsUserInteracting(true);
                        }}
                        className={cn(
                          'px-4 py-3 text-right font-semibold transition-all duration-150 cursor-pointer select-text tabular-nums',
                          isHighlighted('0,826')
                            ? 'bg-[#FFE14D] text-[#243044] font-bold ring-2 ring-[#FFE14D] rounded-md'
                            : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                        role="button"
                        tabIndex={0}
                        aria-label="Nilai Cronbach Alpha 0,826. Klik untuk menelusuri penjelasannya"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setHoveredNumber(hoveredNumber === '0,826' ? null : '0,826');
                            setIsUserInteracting(true);
                          }
                        }}
                      >
                        0,826
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E4331] bg-[#BFEBD9] px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Reliabel
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Draf Narasi Interpretasi Bab 4 dengan Angka Bertinta (Leading-8 untuk breathing room antar baris) */}
            <div className="mt-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-5 sm:p-6 space-y-3 select-text">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Draf interpretasi hasil (kaidah Bab 4):
                </span>
                <span className="text-xs tabular-nums">Ambang batas: α &gt; 0,70</span>
              </div>

              {/* Teks HTML murni dengan leading-8 agar badge baris atas dan bawah tidak bertumpukan */}
              <p className="text-sm leading-8 text-slate-700 dark:text-slate-300 font-sans select-text">
                Berdasarkan Tabel 4.8 di atas, variabel Kualitas Layanan (X1) memiliki nilai Cronbach&apos;s Alpha sebesar{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHoveredNumber(hoveredNumber === '0,796' ? null : '0,796');
                    setIsUserInteracting(true);
                  }}
                  onMouseEnter={() => {
                    setHoveredNumber('0,796');
                    setIsUserInteracting(true);
                  }}
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold tabular-nums border cursor-pointer transition-all duration-150 select-text',
                    isHighlighted('0,796')
                      ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-primary/60'
                  )}
                  aria-label="Angka 0,796 tersambung ke sel tabel Cronbach Alpha Kualitas Layanan"
                >
                  0,796
                </button>
                {', '}variabel Kepuasan Pelanggan (X2) sebesar{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHoveredNumber(hoveredNumber === '0,753' ? null : '0,753');
                    setIsUserInteracting(true);
                  }}
                  onMouseEnter={() => {
                    setHoveredNumber('0,753');
                    setIsUserInteracting(true);
                  }}
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold tabular-nums border cursor-pointer transition-all duration-150 select-text',
                    isHighlighted('0,753')
                      ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-primary/60'
                  )}
                  aria-label="Angka 0,753 tersambung ke sel tabel Cronbach Alpha Kepuasan"
                >
                  0,753
                </button>
                {', dan variabel Loyalitas Pelanggan (Y) sebesar '}
                <button
                  type="button"
                  onClick={() => {
                    setHoveredNumber(hoveredNumber === '0,826' ? null : '0,826');
                    setIsUserInteracting(true);
                  }}
                  onMouseEnter={() => {
                    setHoveredNumber('0,826');
                    setIsUserInteracting(true);
                  }}
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold tabular-nums border cursor-pointer transition-all duration-150 select-text',
                    isHighlighted('0,826')
                      ? 'bg-[#FFE14D] text-[#243044] border-[#FFE14D] ring-2 ring-[#FFE14D]'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-primary/60'
                  )}
                  aria-label="Angka 0,826 tersambung ke sel tabel Cronbach Alpha Loyalitas"
                >
                  0,826
                </button>
                {' '}(total 14 butir instrumen valid). Karena seluruh nilai lebih besar dari ambang batas 0,70, seluruh instrumen penelitian dinyatakan memenuhi kriteria reliabilitas.
              </p>
            </div>
          </div>
        )}

        {/* Footer Cue: Active Highlight Tracker */}
        <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors duration-200',
                hoveredNumber ? 'bg-[#FFE14D] ring-2 ring-[#FFE14D]/60' : 'bg-primary animate-pulse'
              )}
            />
            <span className="text-slate-800 dark:text-slate-200 font-medium text-xs">
              {hoveredNumber
                ? `Menyorot nilai ${hoveredNumber} di tabel dan narasi`
                : 'Arahkan kursor atau sentuh angka bertinta untuk memeriksa sel asal'}
            </span>
          </div>
          <span className="hidden sm:inline text-xs tabular-nums font-mono text-slate-400">
            Jejak Hitung Aktif
          </span>
        </div>
      </div>
    </div>
  );
}
