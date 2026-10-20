'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BarChart3, LineChart, ScatterChart } from 'lucide-react';

interface AcademicResidualPlotsProps {
  n?: number;
  isNormal?: boolean;
  isHomoscedastic?: boolean;
  className?: string;
}

export function AcademicResidualPlots({
  n = 100,
  isNormal = true,
  isHomoscedastic = true,
  className,
}: AcademicResidualPlotsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4 pt-2', className)}>
      {/* 1. Histogram Residual & Normal Curve */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Gambar 4.1: Histogram Residual &amp; Kurva Normal
            </span>
          </div>
          <Badge variant={isNormal ? 'pine' : 'secondary'} className="text-[10px] font-mono">
            {isNormal ? 'Kurva Simetris (Normal)' : 'Mencong / Skewed'}
          </Badge>
        </div>

        {/* SVG Histogram & Bell Curve */}
        <div className="h-44 w-full bg-muted/20 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
          <svg viewBox="0 0 320 160" className="w-full h-full text-primary" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="20" y1="140" x2="300" y2="140" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
            <line x1="20" y1="20" x2="20" y2="140" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
            <line x1="160" y1="20" x2="160" y2="140" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3,3" strokeWidth="1" />

            {/* Histogram Bars */}
            <rect x="35" y="125" width="22" height="15" className="fill-primary/20 stroke-primary/40" />
            <rect x="62" y="105" width="22" height="35" className="fill-primary/30 stroke-primary/50" />
            <rect x="89" y="70" width="22" height="70" className="fill-primary/40 stroke-primary/60" />
            <rect x="116" y="40" width="22" height="100" className="fill-primary/60 stroke-primary/80" />
            <rect x="143" y="28" width="22" height="112" className="fill-primary/80 stroke-primary" />
            <rect x="170" y="32" width="22" height="108" className="fill-primary/70 stroke-primary/90" />
            <rect x="197" y="55" width="22" height="85" className="fill-primary/50 stroke-primary/70" />
            <rect x="224" y="85" width="22" height="55" className="fill-primary/30 stroke-primary/50" />
            <rect x="251" y="115" width="22" height="25" className="fill-primary/20 stroke-primary/40" />

            {/* Smooth Normal Density Curve (Bell curve) */}
            <path
              d="M 25 138 C 70 135, 110 95, 140 38 C 150 20, 160 20, 170 35 C 200 90, 240 135, 295 138"
              fill="none"
              stroke="rgb(234, 88, 12)"
              strokeWidth="2.5"
            />

            {/* Axis labels */}
            <text x="160" y="155" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
              Mean = 0.00 | Std. Dev = 0.98 | N = {n}
            </text>
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Bentuk lonceng simetris menunjukkan sebaran residual mendekati distribusi normal baku OLS.
        </p>
      </div>

      {/* 2. Normal P-P / Q-Q Plot of Regression Residual */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Gambar 4.2: Normal P-P Plot Residual
            </span>
          </div>
          <Badge variant={isNormal ? 'pine' : 'secondary'} className="text-[10px] font-mono">
            {isNormal ? 'Merapat di Diagonal' : 'Menyebar Jauh'}
          </Badge>
        </div>

        {/* SVG Normal P-P Plot */}
        <div className="h-44 w-full bg-muted/20 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
          <svg viewBox="0 0 320 160" className="w-full h-full text-primary" preserveAspectRatio="none">
            {/* Axes */}
            <line x1="30" y1="135" x2="290" y2="135" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
            <line x1="30" y1="15" x2="30" y2="135" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />

            {/* 45-degree theoretical reference diagonal line */}
            <line x1="30" y1="135" x2="290" y2="15" stroke="rgb(234, 88, 12)" strokeWidth="2" strokeDasharray="4,3" />

            {/* Observed cumulative points tightly clustered along diagonal */}
            {[
              [35, 131], [45, 124], [58, 118], [70, 111], [85, 102],
              [98, 96], [112, 88], [128, 80], [145, 73], [160, 67],
              [175, 60], [190, 52], [205, 46], [222, 38], [240, 31],
              [255, 25], [270, 19], [285, 16]
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="3"
                className="fill-primary stroke-background"
                strokeWidth="1"
              />
            ))}

            {/* Axis labels */}
            <text x="160" y="153" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">
              Observed Cum. Prob. (Titik residual merapat sepanjang garis diagonal)
            </text>
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Titik-titik data residual menyebar dan merapat di sekitar garis diagonal 45°, memenuhi uji normalitas.
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

      <div className="h-44 w-full bg-muted/20 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
        <svg viewBox="0 0 400 160" className="w-full h-full text-primary" preserveAspectRatio="none">
          {/* Zero reference horizontal line */}
          <line x1="30" y1="80" x2="380" y2="80" stroke="rgb(234, 88, 12)" strokeWidth="1.5" strokeDasharray="4,4" />
          {/* Frame */}
          <line x1="30" y1="15" x2="30" y2="145" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="30" y1="145" x2="380" y2="145" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />

          {/* Scattered points randomly distributed above and below zero without pattern */}
          {[
            [50, 45], [65, 110], [80, 75], [95, 30], [110, 120],
            [125, 60], [140, 95], [155, 40], [170, 115], [185, 70],
            [200, 50], [215, 105], [230, 35], [245, 85], [260, 65],
            [275, 125], [290, 45], [305, 90], [320, 55], [335, 110],
            [350, 75], [365, 40], [70, 65], [130, 130], [220, 25],
            [280, 100], [340, 80]
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              className="fill-primary/80 stroke-background"
              strokeWidth="1"
            />
          ))}

          {/* Labels */}
          <text x="205" y="155" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
            Regression Standardized Predicted Value (*ZPRED vs *SRESID)
          </text>
          <text x="35" y="75" className="text-[9px] fill-amber-600 font-mono font-bold">
            0 (Garis Nol)
          </text>
        </svg>
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        Titik-titik menyebar secara acak di atas dan di bawah angka 0 pada sumbu Y tanpa membentuk pola gelombang atau corong melebar, membuktikan asumsi homoskedastisitas terpenuhi.
      </p>
    </div>
  );
}
