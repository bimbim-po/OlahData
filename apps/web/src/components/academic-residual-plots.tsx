'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BarChart3, LineChart, ScatterChart, Info } from 'lucide-react';
import {
  calculateHistogramData,
  calculateNormalPPPlotData,
  type HistogramResidualData,
  type NormalPPPlotData,
  formatPlotNumber,
  niceTicks,
  calculateStatsBoxDimensions,
  findHistogramStatsBoxCorner,
  findOptimalStatsBoxPosition,
  type ChartStatsItem,
} from '@/lib/residual-charts';
import { SvgStatsBox } from '@/components/chart-stats-box';

interface AcademicResidualPlotsProps {
  n?: number;
  isNormal?: boolean;
  isHomoscedastic?: boolean;
  unstandardizedResiduals?: number[];
  standardizedResiduals?: number[];
  className?: string;
}

export function AcademicResidualPlots({
  n = 100,
  isNormal = true,
  isHomoscedastic = true,
  unstandardizedResiduals,
  standardizedResiduals,
  className,
}: AcademicResidualPlotsProps) {
  // 1. Kalkulasi Data Histogram Residual & Kurva Normal Teoretis
  const histData: HistogramResidualData = React.useMemo(() => {
    const rawResids =
      (standardizedResiduals && standardizedResiduals.length > 0)
        ? standardizedResiduals
        : (unstandardizedResiduals && unstandardizedResiduals.length > 0)
        ? unstandardizedResiduals
        : [];

    return calculateHistogramData(rawResids);
  }, [standardizedResiduals, unstandardizedResiduals]);

  // 2. Kalkulasi Data Normal P-P Plot (Tepat N Titik)
  const ppData: NormalPPPlotData = React.useMemo(() => {
    const rawResids =
      (unstandardizedResiduals && unstandardizedResiduals.length > 0)
        ? unstandardizedResiduals
        : (standardizedResiduals && standardizedResiduals.length > 0)
        ? standardizedResiduals
        : [];

    return calculateNormalPPPlotData(rawResids);
  }, [unstandardizedResiduals, standardizedResiduals]);

  // Dimensi SVG Histogram (Margin luas agar judul & tick tidak terpotong)
  const histW = 540;
  const histH = 320;
  const histMargin = { left: 62, right: 28, top: 28, bottom: 58 };
  const histPlotW = histW - histMargin.left - histMargin.right;
  const histPlotH = histH - histMargin.top - histMargin.bottom;

  // Nice Ticks Sumbu Y Histogram (Berlangkah rata: 1, 2, atau 5 * 10^n)
  const histYTicks = React.useMemo(() => {
    return niceTicks(0, histData.yAxisMax, 5, { forceZeroMin: true, integerOnly: true });
  }, [histData.yAxisMax]);
  const histYAxisMax = histYTicks[histYTicks.length - 1] || Math.max(1, histData.yAxisMax);

  // Nice Ticks Sumbu X Histogram
  const histXTicks = React.useMemo(() => {
    return niceTicks(histData.minZ, histData.maxZ, 6);
  }, [histData.minZ, histData.maxZ]);
  const histMinDomain = Math.min(histData.minZ, histXTicks[0]);
  const histMaxDomain = Math.max(histData.maxZ, histXTicks[histXTicks.length - 1]);

  // Kotak Statistik Histogram Dinamis
  const histStatsItems: ChartStatsItem[] = React.useMemo(() => [
    { label: 'Mean', value: formatPlotNumber(histData.mean, 2) },
    { label: 'Std. Dev.', value: formatPlotNumber(histData.stdDev, 2) },
    { label: 'N', value: formatPlotNumber(histData.n, 0) },
  ], [histData.mean, histData.stdDev, histData.n]);

  const histCorner = React.useMemo(
    () => findHistogramStatsBoxCorner(histData.bins, histMinDomain, histMaxDomain),
    [histData.bins, histMinDomain, histMaxDomain]
  );

  const histBoxDims = React.useMemo(
    () => calculateStatsBoxDimensions(histStatsItems, { title: 'Statistik Residual', fontSize: 11.5 }),
    [histStatsItems]
  );

  const histOptPos = React.useMemo(
    () => findOptimalStatsBoxPosition(histPlotW, histPlotH, histBoxDims.width, histBoxDims.height, histCorner),
    [histPlotW, histPlotH, histBoxDims.width, histBoxDims.height, histCorner]
  );

  // Dimensi SVG Normal P-P Plot (Area plot 1:1 aspek rasio strictly 274x274)
  const ppSize = 360;
  const ppMargin = { left: 62, right: 24, top: 24, bottom: 62 };
  const ppPlotSize = Math.min(
    ppSize - ppMargin.left - ppMargin.right,
    ppSize - ppMargin.top - ppMargin.bottom
  );

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2', className)}>
      {/* 1. Gambar 4.1: Histogram Residual dan Kurva Normal */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Gambar 4.1: Histogram Residual dan Kurva Normal
              </span>
            </div>
            <Badge variant={isNormal ? 'pine' : 'secondary'} className="text-[10px] font-mono shrink-0">
              {isNormal ? 'Kurva Simetris (Normal)' : 'Asimetris / Skewed'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Distribusi frekuensi standardized residual model regresi dengan overlay kurva normal teoretis.
          </p>
        </div>

        {/* Container SVG Responsif Tanpa Potong Sumbu */}
        <div className="w-full bg-muted/20 rounded-xl p-2 sm:p-3 flex items-center justify-center overflow-visible">
          {histData.isConstant || histData.bins.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
              <Info className="w-4 h-4 text-muted-foreground/60" />
              <span>{histData.message || 'Data residual belum tersedia atau bernilai konstan.'}</span>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${histW} ${histH}`}
              className="w-full h-auto max-h-[320px] overflow-visible text-primary font-sans select-none"
            >
              {/* Grid Y & Labels */}
              {histYTicks.map((tickVal) => {
                const yPos =
                  histMargin.top +
                  histPlotH -
                  (tickVal / histYAxisMax) * histPlotH;

                return (
                  <g key={`y-grid-${tickVal}`}>
                    <line
                      x1={histMargin.left}
                      y1={yPos}
                      x2={histMargin.left + histPlotW}
                      y2={yPos}
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeWidth="1"
                    />
                    <text
                      x={histMargin.left - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      className="text-[11px] fill-muted-foreground font-mono"
                    >
                      {formatPlotNumber(tickVal, 0)}
                    </text>
                  </g>
                );
              })}

              {/* Batang Histogram Riil (Frekuensi Aktual Data) */}
              {histData.bins.map((bin) => {
                const x0 =
                  histMargin.left +
                  ((bin.x0 - histMinDomain) / (histMaxDomain - histMinDomain)) *
                    histPlotW;
                const x1 =
                  histMargin.left +
                  ((bin.x1 - histMinDomain) / (histMaxDomain - histMinDomain)) *
                    histPlotW;
                const barW = Math.max(1, x1 - x0 - 1.5);
                const barH = (bin.count / histYAxisMax) * histPlotH;
                const yTop = histMargin.top + histPlotH - barH;

                return (
                  <rect
                    key={`bin-${bin.binIndex}`}
                    x={x0}
                    y={yTop}
                    width={barW}
                    height={barH}
                    className="fill-primary/40 stroke-primary transition-all duration-200 hover:fill-primary/60"
                    strokeWidth="1"
                    rx="1.5"
                  >
                    <title>{`Rentang: [${formatPlotNumber(bin.x0, 2)}, ${formatPlotNumber(bin.x1, 2)}] | Frekuensi: ${formatPlotNumber(bin.count, 0)}`}</title>
                  </rect>
                );
              })}

              {/* Sumbu X Ticks */}
              {histXTicks.map((t) => {
                const xPos =
                  histMargin.left +
                  ((t - histMinDomain) / (histMaxDomain - histMinDomain)) *
                    histPlotW;
                const label = formatPlotNumber(t, Math.abs(t % 1) > 1e-4 ? 1 : 0);

                return (
                  <g key={`x-tick-${t}`}>
                    <line
                      x1={xPos}
                      y1={histMargin.top + histPlotH}
                      x2={xPos}
                      y2={histMargin.top + histPlotH + 5}
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeWidth="1"
                    />
                    <text
                      x={xPos}
                      y={histMargin.top + histPlotH + 18}
                      textAnchor="middle"
                      className="text-[11px] fill-muted-foreground font-mono"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Kurva Normal Teoretis (Overlay Kepadatan Terskala) */}
              {histData.curvePoints.length > 1 && (
                <path
                  d={histData.curvePoints
                    .map((pt, idx) => {
                      const cx =
                        histMargin.left +
                        ((pt.x - histMinDomain) / (histMaxDomain - histMinDomain)) *
                          histPlotW;
                      const cy =
                        histMargin.top +
                        histPlotH -
                        (pt.y / histYAxisMax) * histPlotH;
                      return `${idx === 0 ? 'M' : 'L'} ${cx.toFixed(2)} ${cy.toFixed(2)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Sumbu Utama X & Y */}
              <line
                x1={histMargin.left}
                y1={histMargin.top}
                x2={histMargin.left}
                y2={histMargin.top + histPlotH}
                stroke="currentColor"
                strokeOpacity="0.5"
                strokeWidth="1.5"
              />
              <line
                x1={histMargin.left}
                y1={histMargin.top + histPlotH}
                x2={histMargin.left + histPlotW}
                y2={histMargin.top + histPlotH}
                stroke="currentColor"
                strokeOpacity="0.5"
                strokeWidth="1.5"
              />

              {/* Label Sumbu Utama */}
              <text
                x={histMargin.left + histPlotW / 2}
                y={histH - 14}
                textAnchor="middle"
                className="text-[12px] font-semibold fill-foreground"
              >
                Regression Standardized Residual
              </text>
              <text
                transform={`rotate(-90)`}
                x={-(histMargin.top + histPlotH / 2)}
                y={20}
                textAnchor="middle"
                className="text-[12px] font-semibold fill-foreground"
              >
                Frequency
              </text>

              {/* Kotak Statistik SPSS Bersama (Layout 2-Kolom Bebas Tumpang Tindih) */}
              <SvgStatsBox
                x={histMargin.left + histOptPos.x}
                y={histMargin.top + histOptPos.y}
                title="Statistik Residual"
                items={histStatsItems}
                fontSize={11.5}
              />
            </svg>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground italic leading-tight">
          Bentuk kurva lonceng yang relatif simetris menunjukkan sebaran residual mendekati distribusi normal baku.
        </p>
      </div>

      {/* 2. Gambar 4.2: Normal P-P Plot of Regression Residual */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Gambar 4.2: Normal P-P Plot Residual
              </span>
            </div>
            <Badge variant={isNormal ? 'pine' : 'secondary'} className="text-[10px] font-mono shrink-0">
              {isNormal ? 'Merapat di Diagonal' : 'Menyebar Jauh'}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Plot probabilitas kumulatif observasi ({ppData.n} titik responden) terhadap probabilitas kumulatif harapan normal.
          </p>
        </div>

        {/* Container SVG Responsif 1:1 Aspect Ratio */}
        <div className="w-full bg-muted/20 rounded-xl p-2 sm:p-3 flex items-center justify-center overflow-visible">
          {ppData.isConstant || ppData.points.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
              <Info className="w-4 h-4 text-muted-foreground/60" />
              <span>{ppData.message || 'Data residual belum tersedia atau bernilai konstan.'}</span>
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${ppSize} ${ppSize}`}
              className="w-full h-auto max-h-[320px] overflow-visible text-primary font-sans select-none"
            >
              {/* Garis Grid & Ticks (0; 0,2; 0,4; 0,6; 0,8; 1,0) */}
              {[0.0, 0.2, 0.4, 0.6, 0.8, 1.0].map((t) => {
                const x = ppMargin.left + t * ppPlotSize;
                const y = ppMargin.top + ppPlotSize - t * ppPlotSize;
                const label = t === 0 ? '0' : t === 1 ? '1,0' : formatPlotNumber(t, 1);

                return (
                  <g key={`pp-grid-${t}`}>
                    {/* Grid Lines */}
                    <line
                      x1={x}
                      y1={ppMargin.top}
                      x2={x}
                      y2={ppMargin.top + ppPlotSize}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeWidth="1"
                    />
                    <line
                      x1={ppMargin.left}
                      y1={y}
                      x2={ppMargin.left + ppPlotSize}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.1"
                      strokeWidth="1"
                    />

                    {/* Sumbu X Ticks */}
                    <line
                      x1={x}
                      y1={ppMargin.top + ppPlotSize}
                      x2={x}
                      y2={ppMargin.top + ppPlotSize + 5}
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={ppMargin.top + ppPlotSize + 18}
                      textAnchor="middle"
                      className="text-[11px] fill-muted-foreground font-mono"
                    >
                      {label}
                    </text>

                    {/* Sumbu Y Ticks */}
                    <line
                      x1={ppMargin.left - 5}
                      y1={y}
                      x2={ppMargin.left}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.4"
                      strokeWidth="1"
                    />
                    <text
                      x={ppMargin.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[11px] fill-muted-foreground font-mono"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Garis Diagonal 45 Derajat (0,0) -> (1,1) */}
              <line
                x1={ppMargin.left}
                y1={ppMargin.top + ppPlotSize}
                x2={ppMargin.left + ppPlotSize}
                y2={ppMargin.top}
                stroke="#EA580C"
                strokeWidth="2"
                strokeDasharray="4,3"
              />

              {/* Sumbu Pembatas Kotak Plot */}
              <line
                x1={ppMargin.left}
                y1={ppMargin.top}
                x2={ppMargin.left}
                y2={ppMargin.top + ppPlotSize}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
              <line
                x1={ppMargin.left}
                y1={ppMargin.top + ppPlotSize}
                x2={ppMargin.left + ppPlotSize}
                y2={ppMargin.top + ppPlotSize}
                stroke="currentColor"
                strokeOpacity="0.6"
                strokeWidth="1.5"
              />
              <line
                x1={ppMargin.left + ppPlotSize}
                y1={ppMargin.top}
                x2={ppMargin.left + ppPlotSize}
                y2={ppMargin.top + ppPlotSize}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1={ppMargin.left}
                y1={ppMargin.top}
                x2={ppMargin.left + ppPlotSize}
                y2={ppMargin.top}
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1"
                strokeDasharray="2,2"
              />

              {/* Tepat N Titik Responden Aktual */}
              {ppData.points.map((pt) => {
                const cx = ppMargin.left + pt.pObserved * ppPlotSize;
                const cy = ppMargin.top + ppPlotSize - pt.pExpected * ppPlotSize;

                return (
                  <circle
                    key={`point-${pt.index}`}
                    cx={cx}
                    cy={cy}
                    r="3"
                    className="fill-primary stroke-background hover:scale-150 transition-transform"
                    strokeWidth="1"
                  >
                    <title>{`Responden #${pt.index} | Obs: ${formatPlotNumber(pt.pObserved, 3)} | Exp: ${formatPlotNumber(pt.pExpected, 3)}`}</title>
                  </circle>
                );
              })}

              {/* Label Sumbu Utama */}
              <text
                x={ppMargin.left + ppPlotSize / 2}
                y={ppSize - 14}
                textAnchor="middle"
                className="text-[12px] font-semibold fill-foreground"
              >
                Observed Cum Prob
              </text>
              <text
                transform={`rotate(-90)`}
                x={-(ppMargin.top + ppPlotSize / 2)}
                y={20}
                textAnchor="middle"
                className="text-[12px] font-semibold fill-foreground"
              >
                Expected Cum Prob
              </text>
            </svg>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground italic leading-tight">
          Titik-titik sebaran residual menyebar dan merapat di sekitar garis diagonal 45°, memenuhi uji normalitas OLS.
        </p>
      </div>
    </div>
  );
}

export function AcademicHeteroscedasticityPlot({
  n = 100,
  isHomoscedastic = true,
  className,
}: {
  n?: number;
  isHomoscedastic?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScatterChart className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Gambar 4.3: Scatterplot Residual vs Predicted (Uji Heteroskedastisitas)
          </span>
        </div>
        <Badge variant={isHomoscedastic ? 'pine' : 'secondary'} className="text-[10px] font-mono">
          {isHomoscedastic ? 'Bebas Heteroskedastisitas' : 'Pola Menyempit/Melebar'}
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Grafik sebaran residual terhadap nilai prediksi regresi (ZPRED vs SRESID) untuk mengecek varians residual.
      </p>
    </div>
  );
}
