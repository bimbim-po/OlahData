'use client';

import * as React from 'react';
import {
  type ChartStatsItem,
  calculateStatsBoxDimensions,
} from '@/lib/chart-ui-utils';
import { cn } from '@/lib/utils';

export interface SvgStatsBoxProps {
  x: number;
  y: number;
  title?: string;
  items: ChartStatsItem[];
  fontSize?: number;
  className?: string;
}

/**
 * Komponen SvgStatsBox untuk seluruh grafik OlahData:
 * - Setiap metrik di baris sendiri (elemen teks terpisah dengan koordinat Y berbeda).
 * - Layout 2-kolom: label rata kiri (text-anchor: start), nilai rata kanan (text-anchor: end).
 * - Lebar kotak dinamis berdasarkan panjang teks terpanjang + padding + jarak (min. 14px).
 * - Tidak ada risiko teks saling berdempetan atau bertumpuk.
 */
export function SvgStatsBox({
  x,
  y,
  title,
  items,
  fontSize = 11.5,
  className,
}: SvgStatsBoxProps) {
  const dims = React.useMemo(
    () => calculateStatsBoxDimensions(items, { title, fontSize }),
    [items, title, fontSize]
  );

  return (
    <g className={cn('stats-box select-none pointer-events-none', className)}>
      {/* Background Kotak dengan Border Halus */}
      <rect
        x={x}
        y={y}
        width={dims.width}
        height={dims.height}
        rx="5"
        className="fill-background/95 stroke-border/80 shadow-xs backdrop-blur-xs"
        strokeWidth="1"
      />

      {/* Judul Kotak (Jika Ada) */}
      {title && (
        <text
          x={x + dims.padX}
          y={y + dims.padY + fontSize}
          className="font-bold fill-foreground"
          style={{ fontSize: `${fontSize}px` }}
        >
          {title}
        </text>
      )}

      {/* Baris Statistik Terpisah (Tiap metrik punya koordinat Y unik) */}
      {items.map((item, idx) => {
        const rowY =
          y +
          dims.padY +
          (title ? dims.titleHeight : 0) +
          idx * dims.lineHeight +
          fontSize;

        return (
          <g key={`stat-row-${item.label}-${idx}`}>
            {/* Label Rata Kiri */}
            <text
              x={x + dims.padX}
              y={rowY}
              textAnchor="start"
              className="fill-muted-foreground font-sans font-medium"
              style={{ fontSize: `${fontSize}px` }}
            >
              {item.label}
            </text>

            {/* Nilai Rata Kanan */}
            <text
              x={x + dims.width - dims.padX}
              y={rowY}
              textAnchor="end"
              className="fill-foreground font-mono font-semibold"
              style={{ fontSize: `${fontSize}px` }}
            >
              {item.value}
            </text>
          </g>
        );
      })}
    </g>
  );
}
