/**
 * chart-ui-utils.ts
 * Utilitas bersama UI rendering grafik OlahData (Web SVG, Standalone SVG, PDF Export).
 * Sesuai Standar Akademik Skripsi & Konvensi SPSS.
 */

export interface ChartStatsItem {
  label: string;
  value: string;
}

export interface StatsBoxDimensions {
  width: number;
  height: number;
  padX: number;
  padY: number;
  lineHeight: number;
  titleHeight: number;
  fontSize: number;
  maxLabelWidth: number;
  maxValueWidth: number;
}

export type StatsBoxCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ChartThemeColors {
  background: string;
  axis: string;
  text: string;
  textMuted: string;
  grid: string;
  barFill: string;
  barStroke: string;
  curve: string;
  diagonal: string;
  pointFill: string;
  pointStroke: string;
  boxBackground: string;
  boxBorder: string;
  boxTitle: string;
  boxLabel: string;
  boxValue: string;
}

export const CHART_THEMES: Record<'web' | 'web-dark' | 'print', ChartThemeColors> = {
  web: {
    background: 'transparent',
    axis: '#4B5563', // gray-600
    text: '#111827', // gray-900
    textMuted: '#6B7280', // gray-500
    grid: 'rgba(156, 163, 175, 0.2)',
    barFill: 'rgba(20, 71, 54, 0.45)', // OlahData deep pine
    barStroke: '#144736',
    curve: '#EA580C', // Orange accent
    diagonal: '#EA580C',
    pointFill: '#144736',
    pointStroke: '#0B2B21',
    boxBackground: 'rgba(255, 255, 255, 0.95)',
    boxBorder: '#D1D5DB',
    boxTitle: '#111827',
    boxLabel: '#4B5563',
    boxValue: '#111827',
  },
  'web-dark': {
    background: 'transparent',
    axis: '#9CA3AF',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    grid: 'rgba(156, 163, 175, 0.16)',
    barFill: 'rgba(52, 211, 153, 0.35)',
    barStroke: '#34D399',
    curve: '#FB923C',
    diagonal: '#FB923C',
    pointFill: '#34D399',
    pointStroke: '#064E3B',
    boxBackground: 'rgba(15, 23, 42, 0.92)',
    boxBorder: '#374151',
    boxTitle: '#F3F4F6',
    boxLabel: '#9CA3AF',
    boxValue: '#F9FAFB',
  },
  print: {
    background: '#FFFFFF',
    axis: '#000000',
    text: '#000000',
    textMuted: '#222222',
    grid: '#E5E7EB',
    barFill: '#D1D5DB',
    barStroke: '#000000',
    curve: '#000000',
    diagonal: '#000000',
    pointFill: '#FFFFFF',
    pointStroke: '#000000',
    boxBackground: '#FFFFFF',
    boxBorder: '#000000',
    boxTitle: '#000000',
    boxLabel: '#000000',
    boxValue: '#000000',
  },
};

/**
 * Format angka untuk seluruh teks grafik:
 * - Pemisah desimal koma ',' (standar Indonesia & UI OlahData).
 * - Menghilangkan "-0,00" menjadi "0,00".
 * - N ditampilkan sebagai bilangan bulat.
 * - Pembulatan wajar untuk menghindari overflow pada angka sangat kecil / besar.
 */
export function formatPlotNumber(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num) || !isFinite(num)) return '0';

  // Kasus N atau integer murni
  if (decimals === 0) {
    const intVal = Math.round(num);
    return intVal.toLocaleString('id-ID');
  }

  // Tangani angka sangat kecil mendekati 0 untuk menghindari "-0,00"
  const threshold = Math.pow(10, -decimals) / 2;
  if (Math.abs(num) < threshold) {
    return (0).toFixed(decimals).replace('.', ',');
  }

  // Jika nilai absolut sangat besar (>= 1e8)
  if (Math.abs(num) >= 1e8) {
    return num.toExponential(2).replace('.', ',');
  }

  // Format standar dengan koma desimal
  const fixed = num.toFixed(decimals);
  // Cek "-0,00..."
  if (/^-0(\.0+)?$/.test(fixed)) {
    return (0).toFixed(decimals).replace('.', ',');
  }

  // Ubah titik ke koma
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = Number(intPart).toLocaleString('id-ID');
  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

/**
 * Algoritma Nice Numbers (Wilcox / Heckbert).
 * Menghitung tick sumbu yang rapi dengan kelipatan 1, 2, atau 5 * 10^n.
 * Hasil seperti: [0, 4, 8, 12, 16], [0, 5, 10, 15], [0, 0,2; 0,4; 0,6; ...].
 */
export function niceTicks(
  min: number,
  max: number,
  targetCount: number = 5,
  options?: { forceZeroMin?: boolean; integerOnly?: boolean }
): number[] {
  if (isNaN(min) || isNaN(max)) return [0];

  let effectiveMin = min;
  let effectiveMax = max;

  if (effectiveMin > effectiveMax) {
    const tmp = effectiveMin;
    effectiveMin = effectiveMax;
    effectiveMax = tmp;
  }

  if (options?.forceZeroMin && effectiveMin >= 0) {
    effectiveMin = 0;
  }

  // Kasus rentang 0 (data konstan)
  if (Math.abs(effectiveMax - effectiveMin) < 1e-9) {
    if (Math.abs(effectiveMin) < 1e-9) {
      return [0, 1, 2, 3, 4];
    }
    const val = effectiveMin;
    const pad = Math.abs(val) * 0.2 || 1;
    effectiveMin = val - pad;
    effectiveMax = val + pad;
  }

  const rawRange = effectiveMax - effectiveMin;

  function niceNum(range: number, round: boolean): number {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction: number;

    if (round) {
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3) niceFraction = 2;
      else if (fraction < 7) niceFraction = 5;
      else niceFraction = 10;
    } else {
      if (fraction <= 1) niceFraction = 1;
      else if (fraction <= 2) niceFraction = 2;
      else if (fraction <= 5) niceFraction = 5;
      else niceFraction = 10;
    }

    return niceFraction * Math.pow(10, exponent);
  }

  const safeCount = Math.max(2, targetCount);
  let tickSpacing = niceNum(rawRange / (safeCount - 1), true);

  if (options?.integerOnly && tickSpacing < 1) {
    tickSpacing = 1;
  }

  let niceMin = Math.floor(effectiveMin / tickSpacing) * tickSpacing;
  let niceMax = Math.ceil(effectiveMax / tickSpacing) * tickSpacing;

  if (options?.forceZeroMin && effectiveMin >= 0) {
    niceMin = 0;
  }

  const ticks: number[] = [];
  const maxIterations = 50;
  let current = niceMin;
  let count = 0;

  // Hitung jumlah desimal untuk menghindari floating point error (misal 0.30000000000000004)
  const stepDecimals = Math.max(0, -Math.floor(Math.log10(tickSpacing) + 1e-6));
  const precision = Math.min(8, stepDecimals + 1);

  while (current <= niceMax + tickSpacing * 0.5 && count < maxIterations) {
    const cleanTick = Number(current.toFixed(precision));
    ticks.push(cleanTick === 0 ? 0 : cleanTick);
    current += tickSpacing;
    count++;
  }

  return ticks;
}

/**
 * Estimasi lebar teks berbasis karakter (SSR & Offscreen Safe).
 * Mendukung Monospace (angka & nilai statistik) dan Proportional Sans-Serif.
 */
export function estimateTextWidth(text: string, fontSize: number, isMono: boolean = false): number {
  if (!text) return 0;
  const len = text.length;
  if (isMono) {
    // Font mono (Courier / Consolas) rata-rata 0.62 lebar font
    return Math.round(len * fontSize * 0.62);
  }

  // Heuristik proporsional untuk sans-serif (Arial/Inter)
  let width = 0;
  for (let i = 0; i < len; i++) {
    const ch = text[i];
    if (/[ilI1\.,:;'!]/.test(ch)) {
      width += fontSize * 0.28;
    } else if (/[mwMW@]/.test(ch)) {
      width += fontSize * 0.82;
    } else if (/[A-Z]/.test(ch)) {
      width += fontSize * 0.66;
    } else if (/[0-9]/.test(ch)) {
      width += fontSize * 0.56;
    } else {
      width += fontSize * 0.52;
    }
  }

  return Math.round(width);
}

/**
 * Kalkulasi dimensi dinamis kotak statistik:
 * - Layout dua kolom: label rata kiri, nilai rata kanan.
 * - Tiap statistik berada di baris sendiri (elemen teks terpisah).
 * - Lebar kotak dinamis: max(labelW) + gap + max(valW) + 2 * padding, minimal selebar judul.
 * - Tinggi kotak: padding vertikal + total baris * lineHeight.
 */
export function calculateStatsBoxDimensions(
  items: ChartStatsItem[],
  options?: {
    title?: string;
    fontSize?: number;
    padX?: number;
    padY?: number;
    minGap?: number;
  }
): StatsBoxDimensions {
  const fontSize = options?.fontSize ?? 11.5;
  const padX = options?.padX ?? 10;
  const padY = options?.padY ?? 8;
  const minGap = options?.minGap ?? 14;
  const lineHeight = Math.round(fontSize * 1.5);

  let maxLabelWidth = 0;
  let maxValueWidth = 0;

  items.forEach((item) => {
    const lW = estimateTextWidth(item.label, fontSize, false);
    const vW = estimateTextWidth(item.value, fontSize, true); // nilai pakai mono
    if (lW > maxLabelWidth) maxLabelWidth = lW;
    if (vW > maxValueWidth) maxValueWidth = vW;
  });

  const contentWidth = maxLabelWidth + minGap + maxValueWidth;
  const titleWidth = options?.title ? estimateTextWidth(options.title, fontSize * 1.05, false) : 0;
  const width = Math.max(contentWidth, titleWidth) + padX * 2;

  const titleHeight = options?.title ? lineHeight + 4 : 0;
  const height = padY * 2 + titleHeight + items.length * lineHeight;

  return {
    width,
    height,
    padX,
    padY,
    lineHeight,
    titleHeight,
    fontSize,
    maxLabelWidth,
    maxValueWidth,
  };
}

/**
 * Memilih sudut penempatan kotak statistik pada histogram agar tidak menutupi kurva / batang tinggi.
 */
export function findHistogramStatsBoxCorner(
  bins: { x0: number; x1: number; count: number }[],
  minZ: number,
  maxZ: number
): StatsBoxCorner {
  if (!bins || bins.length === 0) return 'top-right';
  const span = maxZ - minZ;
  if (span <= 0) return 'top-right';

  // Kuadran kiri: minZ s/d minZ + 0.4 * span
  const leftCutoff = minZ + 0.4 * span;
  // Kuadran kanan: maxZ - 0.4 * span s/d maxZ
  const rightCutoff = maxZ - 0.4 * span;

  let leftMax = 0;
  let rightMax = 0;

  bins.forEach((b) => {
    const mid = (b.x0 + b.x1) / 2;
    if (mid <= leftCutoff) {
      if (b.count > leftMax) leftMax = b.count;
    }
    if (mid >= rightCutoff) {
      if (b.count > rightMax) rightMax = b.count;
    }
  });

  // Pilih kuadran yang puncak batangnya lebih rendah
  return rightMax <= leftMax ? 'top-right' : 'top-left';
}

/**
 * Penempatan otomatis kotak statistik:
 * Memilih sudut (top-right, top-left, bottom-right, bottom-left)
 * yang paling sedikit tumpang tindih dengan elemen data.
 */
export function findOptimalStatsBoxPosition(
  plotW: number,
  plotH: number,
  boxW: number,
  boxH: number,
  corner: StatsBoxCorner = 'top-right'
): { x: number; y: number; corner: StatsBoxCorner } {
  const marginOffset = 10; // Jarak >= 10px dari tepi plot

  let x = marginOffset;
  let y = marginOffset;

  switch (corner) {
    case 'top-left':
      x = marginOffset;
      y = marginOffset;
      break;
    case 'top-right':
      x = Math.max(marginOffset, plotW - boxW - marginOffset);
      y = marginOffset;
      break;
    case 'bottom-left':
      x = marginOffset;
      y = Math.max(marginOffset, plotH - boxH - marginOffset);
      break;
    case 'bottom-right':
      x = Math.max(marginOffset, plotW - boxW - marginOffset);
      y = Math.max(marginOffset, plotH - boxH - marginOffset);
      break;
  }

  return { x, y, corner };
}

/**
 * Menghasilkan blok string SVG untuk Kotak Statistik SPSS (Pure SVG string).
 * Digunakan oleh residual-charts.ts saat menghasilkan gambar cetak/ekspor.
 */
export function renderSvgStatsBoxString(
  x: number,
  y: number,
  items: ChartStatsItem[],
  options?: {
    title?: string;
    fontSize?: number;
    theme?: 'web' | 'web-dark' | 'print';
  }
): string {
  const theme = options?.theme || 'web';
  const colors = CHART_THEMES[theme];
  const fontSize = options?.fontSize ?? 11.5;
  const dims = calculateStatsBoxDimensions(items, {
    title: options?.title,
    fontSize,
  });

  const titleSvg = options?.title
    ? `<text x="${x + dims.padX}" y="${y + dims.padY + fontSize}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${colors.boxTitle}">${options.title}</text>`
    : '';

  let rowsSvg = '';
  items.forEach((item, idx) => {
    const rowY =
      y +
      dims.padY +
      (options?.title ? dims.titleHeight : 0) +
      idx * dims.lineHeight +
      fontSize;

    rowsSvg += `
      <g>
        <text x="${x + dims.padX}" y="${rowY}" text-anchor="start" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${colors.boxLabel}">${item.label}</text>
        <text x="${x + dims.width - dims.padX}" y="${rowY}" text-anchor="end" font-family="'Courier New', Courier, monospace" font-size="${fontSize}" font-weight="600" fill="${colors.boxValue}">${item.value}</text>
      </g>
    `;
  });

  return `
    <g class="stats-box">
      <rect x="${x}" y="${y}" width="${dims.width}" height="${dims.height}" fill="${colors.boxBackground}" stroke="${colors.boxBorder}" stroke-width="1" rx="5"/>
      ${titleSvg}
      ${rowsSvg}
    </g>
  `.trim();
}
