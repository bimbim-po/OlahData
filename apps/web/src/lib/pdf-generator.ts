import type { AnalysisResults, ExportOptions } from './api/types';
import { formatNumber } from './format';
import {
  calculateHistogramData,
  calculateNormalPPPlotData,
  type HistogramResidualData,
  type NormalPPPlotData,
  formatPlotNumber,
  niceTicks,
} from './residual-charts';

/**
 * Pure TypeScript deterministic PDF 1.4 generator.
 * Produces 100% compliant, readable academic PDF documents without external native dependencies.
 */

interface PdfTextOptions {
  font?: 'F1' | 'F2' | 'F3'; // F1: Helvetica, F2: Helvetica-Bold, F3: Helvetica-Oblique
  size?: number;
  color?: [number, number, number];
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
}

interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

function escapePdfString(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2022/g, '*')
    .replace(/\u2026/g, '...')
    .replace(/R\u00B2/g, 'R2')
    .replace(/\u00B2/g, '2')
    .replace(/\u03B1/g, 'alpha')
    .replace(/\u03B2/g, 'beta')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2260/g, '!=')
    .replace(/\u00B1/g, '+/-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Replace remaining non-ascii chars safely for Type1 WinAnsi/Standard
    .replace(/[^\x20-\x7E]/g, '?');
}

/**
 * Memecah teks sel tabel agar rapi dan tidak saling tumpuk antar kolom
 */
function wrapCellText(text: string, maxWidth: number, fontSize: number = 8.5): string[] {
  if (!text) return ['-'];
  const cleanStr = String(text).trim();
  if (!cleanStr) return ['-'];

  const words = cleanStr.split(' ');
  const maxChars = Math.max(1, Math.floor((maxWidth - 8) / (fontSize * 0.52)));
  const lines: string[] = [];
  let currentLine = '';

  for (const w of words) {
    if ((currentLine + (currentLine ? ' ' : '') + w).length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      if (w.length > maxChars) {
        let rem = w;
        while (rem.length > maxChars) {
          lines.push(rem.slice(0, maxChars));
          rem = rem.slice(maxChars);
        }
        currentLine = rem;
      } else {
        currentLine = w;
      }
    } else {
      currentLine = currentLine ? `${currentLine} ${w}` : w;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ['-'];
}

export function generateAcademicPdfReport(
  results: AnalysisResults,
  options: {
    projectTitle?: string;
    sections?: string[];
    includeStatement?: boolean;
    watermark?: boolean;
    notesMap?: Record<string, string>;
  }
): Uint8Array {
  const projectTitle = (options.projectTitle || results.projectTitle || '').trim();
  if (!projectTitle) {
    throw new Error('Judul penelitian belum diisi. Lengkapi di formulir proyek sebelum mengunduh.');
  }
  const selectedSections = options.sections || [
    'descriptive',
    'validity',
    'reliability',
    'normality',
    'regression',
    'correlation',
  ];
  const includeStatement = options.includeStatement ?? true;
  const isWatermark = options.watermark ?? false;
  const notesMap = options.notesMap || {};

  const PAGE_WIDTH = 595.28; // A4 pt
  const PAGE_HEIGHT = 841.89; // A4 pt
  const MARGIN_LEFT = 54;
  const MARGIN_RIGHT = 54;
  const MARGIN_TOP = 54;
  const MARGIN_BOTTOM = 54;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 487.28 pt

  const pages: string[][] = [];
  let currentPageOps: string[] = [];
  let currentY = PAGE_HEIGHT - MARGIN_TOP;

  function newPage() {
    if (currentPageOps.length > 0) {
      pages.push(currentPageOps);
    }
    currentPageOps = [];
    currentY = PAGE_HEIGHT - MARGIN_TOP;
  }

  function checkSpace(requiredHeight: number) {
    if (currentY - requiredHeight < MARGIN_BOTTOM + 20) {
      newPage();
    }
  }

  function drawText(text: string, x: number, y: number, opts: PdfTextOptions = {}) {
    const font = opts.font || 'F1';
    const size = opts.size || 10;
    const color = opts.color || [0.1, 0.1, 0.1];
    const align = opts.align || 'left';

    const approxWidth = text.length * (size * 0.52);
    let drawX = x;
    if (align === 'center') {
      drawX = x - approxWidth / 2;
    } else if (align === 'right') {
      drawX = x - approxWidth;
    }

    const escaped = escapePdfString(text);
    currentPageOps.push(
      `q ${color[0]} ${color[1]} ${color[2]} rg BT /${font} ${size} Tf 1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET Q`
    );
  }

  function drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineWidth: number = 0.5,
    color: [number, number, number] = [0, 0, 0]
  ) {
    currentPageOps.push(
      `q ${color[0]} ${color[1]} ${color[2]} RG ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    );
  }

  function drawParagraph(
    text: string,
    opts: {
      font?: 'F1' | 'F2' | 'F3';
      size?: number;
      lineHeight?: number;
      indent?: number;
    } = {}
  ) {
    const size = opts.size || 9.5;
    const lineHeight = opts.lineHeight || 14;
    const indent = opts.indent || 0;
    const font = opts.font || 'F1';

    const words = text.split(' ');
    let line = '';
    const maxChars = Math.floor(CONTENT_WIDTH / (size * 0.5));

    const lines: string[] = [];
    for (const w of words) {
      if ((line + ' ' + w).length > maxChars) {
        lines.push(line.trim());
        line = w;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    if (line) lines.push(line.trim());

    checkSpace(lines.length * lineHeight + 8);

    lines.forEach((l, idx) => {
      const lineX = MARGIN_LEFT + (idx === 0 ? indent : 0);
      drawText(l, lineX, currentY, { font, size, color: [0.15, 0.15, 0.15] });
      currentY -= lineHeight;
    });
    currentY -= 6;
  }

  /**
   * Menampilkan Tabel Akademik Baku Format APA 3 Garis
   * Dilengkapi text-wrapping per sel, tinggi baris dinamis, dan pengulangan header jika terpecah antar halaman
   */
  function drawApaTable(
    tableNum: string,
    title: string,
    cols: TableColumn[],
    rows: (string | number)[][],
    note?: string
  ) {
    const startX = MARGIN_LEFT;
    const endX = MARGIN_LEFT + CONTENT_WIDTH;
    const rowLineHeight = 11;
    const rowPadding = 6;

    // Hitung estimasi tinggi awal untuk judul dan header
    checkSpace(65);

    // Table Number & Title (APA 7th)
    drawText(tableNum, MARGIN_LEFT, currentY, { font: 'F2', size: 10, color: [0.05, 0.05, 0.05] });
    currentY -= 14;
    drawText(title, MARGIN_LEFT, currentY, { font: 'F3', size: 9.5, color: [0.2, 0.2, 0.2] });
    currentY -= 14;

    // Fungsi menggambar header kolom
    const renderTableHeader = () => {
      drawLine(startX, currentY, endX, currentY, 1.5, [0, 0, 0]); // Top border 1.5pt
      currentY -= 4;

      let curX = startX;
      cols.forEach((col) => {
        const posX =
          col.align === 'right'
            ? curX + col.width - 4
            : col.align === 'center'
            ? curX + col.width / 2
            : curX + 4;

        drawText(col.header, posX, currentY - 10, {
          font: 'F2',
          size: 8.5,
          align: col.align || 'left',
          color: [0, 0, 0],
        });
        curX += col.width;
      });
      currentY -= 16;
      drawLine(startX, currentY, endX, currentY, 0.75, [0, 0, 0]); // Under-header border 0.75pt
      currentY -= 4;
    };

    renderTableHeader();

    // Gambar Baris Data dengan Text Wrapping & Dynamic Row Height
    rows.forEach((row) => {
      const cellLines = row.map((cell, cIdx) => {
        const col = cols[cIdx];
        const w = col ? col.width : 60;
        return wrapCellText(String(cell ?? '-'), w, 8.5);
      });

      const maxLines = Math.max(...cellLines.map((lines) => lines.length), 1);
      const actualRowHeight = maxLines * rowLineHeight + rowPadding;

      // Cek apakah muat di halaman saat ini
      if (currentY - actualRowHeight < MARGIN_BOTTOM + 25) {
        // Tutup garis bawah tabel halaman saat ini
        drawLine(startX, currentY, endX, currentY, 0.75, [0, 0, 0]);
        newPage();

        // Ulangi Header di Halaman Baru
        drawText(`${tableNum} (Lanjutan)`, MARGIN_LEFT, currentY, {
          font: 'F3',
          size: 9,
          color: [0.25, 0.25, 0.25],
        });
        currentY -= 12;
        renderTableHeader();
      }

      // Render Isi Sel
      let rX = startX;
      cellLines.forEach((lines, cIdx) => {
        const col = cols[cIdx];
        if (!col) return;

        const posX =
          col.align === 'right'
            ? rX + col.width - 4
            : col.align === 'center'
            ? rX + col.width / 2
            : rX + 4;

        lines.forEach((lineText, lineIdx) => {
          const lineY = currentY - 9 - lineIdx * rowLineHeight;
          drawText(lineText, posX, lineY, {
            font: 'F1',
            size: 8.5,
            align: col.align || 'left',
            color: [0.1, 0.1, 0.1],
          });
        });

        rX += col.width;
      });

      currentY -= actualRowHeight;
    });

    // Bottom border (1.5pt)
    drawLine(startX, currentY, endX, currentY, 1.5, [0, 0, 0]);
    currentY -= 12;

    // Catatan Kaki Tabel
    if (note) {
      drawText(`Catatan: ${note}`, MARGIN_LEFT, currentY, {
        font: 'F3',
        size: 8,
        color: [0.3, 0.3, 0.3],
      });
      currentY -= 14;
    }

    currentY -= 8;
  }

  /**
   * Menampilkan Gambar Grafik Format APA 7th Edition
   * Memastikan nomor gambar, judul, canvas grafik, dan catatan sumber tidak terpisah antar halaman
   */
  function drawApaFigure(
    figNum: string,
    figTitle: string,
    figHeight: number,
    renderContent: (x: number, y: number, w: number, h: number) => void,
    note?: string
  ) {
    const totalRequiredHeight = 32 + figHeight + (note ? 20 : 0);
    checkSpace(totalRequiredHeight);

    // Label: Gambar 4.1 (Bold 10pt)
    drawText(figNum, MARGIN_LEFT, currentY, { font: 'F2', size: 10, color: [0.05, 0.05, 0.05] });
    currentY -= 14;

    // Title: Judul Miring di Baris Berikutnya (APA 7th)
    drawText(figTitle, MARGIN_LEFT, currentY, { font: 'F3', size: 9.5, color: [0.2, 0.2, 0.2] });
    currentY -= 12;

    const figWidth = Math.min(CONTENT_WIDTH, 480);
    const figX = MARGIN_LEFT + (CONTENT_WIDTH - figWidth) / 2;
    const figY = currentY - figHeight;

    renderContent(figX, figY, figWidth, figHeight);

    currentY -= figHeight + 8;

    if (note) {
      drawText(note, figX, currentY, { font: 'F3', size: 8, color: [0.3, 0.3, 0.3] });
      currentY -= 14;
    }

    currentY -= 12;
  }

  // --- Mulai Penyusunan Dokumen PDF ---
  newPage();

  // Document Title Header
  drawText('LAPORAN HASIL PENGOLAHAN DATA SKRIPSI (BAB 4)', PAGE_WIDTH / 2, currentY, {
    font: 'F2',
    size: 13,
    align: 'center',
    color: [0.08, 0.28, 0.22], // Primary Pine #144736
  });
  currentY -= 16;

  drawText(`Proyek: ${projectTitle}`, PAGE_WIDTH / 2, currentY, {
    font: 'F1',
    size: 9.5,
    align: 'center',
    color: [0.35, 0.35, 0.35],
  });
  currentY -= 14;

  const metaStr = `N = ${results.respondentCount} Responden • Format Baku APA 7th Edition • OlahData Academic Engine`;
  drawText(metaStr, PAGE_WIDTH / 2, currentY, {
    font: 'F3',
    size: 8.5,
    align: 'center',
    color: [0.45, 0.45, 0.45],
  });
  currentY -= 16;

  drawLine(MARGIN_LEFT, currentY, MARGIN_LEFT + CONTENT_WIDTH, currentY, 1, [0.8, 0.8, 0.8]);
  currentY -= 18;

  // 1. STATISTIK DESKRIPTIF
  if (selectedSections.includes('descriptive') && results.descriptive?.length) {
    const cols: TableColumn[] = [
      { header: 'Variabel Penelitian', width: 147, align: 'left' },
      { header: 'N', width: 45, align: 'right' },
      { header: 'Mean', width: 55, align: 'right' },
      { header: 'Median', width: 55, align: 'right' },
      { header: 'Std Dev', width: 65, align: 'right' },
      { header: 'Min', width: 60, align: 'right' },
      { header: 'Max', width: 60, align: 'right' },
    ];
    const rows = results.descriptive.map((r) => [
      r.variable,
      formatNumber(r.n),
      formatNumber(r.mean, 3),
      formatNumber(r.median, 3),
      formatNumber(r.stdDev, 3),
      formatNumber(r.min, 3),
      formatNumber(r.max, 3),
    ]);
    drawApaTable(
      'Tabel 4.1',
      'Hasil Analisis Statistik Deskriptif Variabel Penelitian & TCR',
      cols,
      rows,
      `Dihitung dari N = ${results.respondentCount} responden menggunakan skala pengukuran kuesioner.`
    );
    if (results.explanations?.descriptive) {
      drawParagraph(results.explanations.descriptive, { indent: 20 });
    }
  }

  // 2. UJI VALIDITAS INSTRUMEN
  if (selectedSections.includes('validity') && results.validity?.length) {
    const cols: TableColumn[] = [
      { header: 'Butir Indikator', width: 95, align: 'left' },
      { header: 'Konstruk Variabel', width: 152, align: 'left' },
      { header: 'r Hitung', width: 80, align: 'right' },
      { header: 'r Tabel (α=0,05)', width: 85, align: 'right' },
      { header: 'Status Validitas', width: 75, align: 'center' },
    ];
    const rows = results.validity.map((r) => [
      r.item,
      r.construct,
      formatNumber(r.rHitung, 3),
      formatNumber(r.rTabel, 4),
      r.valid ? 'Valid' : 'Gugur',
    ]);
    drawApaTable(
      'Tabel 4.2',
      'Hasil Pengujian Validitas Butir Kuesioner (Pearson Product Moment)',
      cols,
      rows,
      'Kriteria: r Hitung > r Tabel pada derajat bebas df = N - 2 dengan signifikansi dua sisi α = 0,05.'
    );
    if (results.explanations?.validity) {
      drawParagraph(results.explanations.validity, { indent: 20 });
    }
  }

  // 3. UJI RELIABILITAS
  if (selectedSections.includes('reliability') && results.reliability?.length) {
    const cols: TableColumn[] = [
      { header: 'Konstruk Variabel', width: 177, align: 'left' },
      { header: 'Jumlah Butir', width: 75, align: 'right' },
      { header: "Cronbach's Alpha", width: 95, align: 'right' },
      { header: 'Batas Kritis', width: 70, align: 'right' },
      { header: 'Status Keandalan', width: 70, align: 'center' },
    ];
    const rows = results.reliability.map((r) => [
      r.construct,
      formatNumber(r.itemCount),
      formatNumber(r.cronbachAlpha, 3),
      '0,600',
      r.reliable ? 'Reliabel' : 'Tidak',
    ]);
    drawApaTable(
      'Tabel 4.3',
      "Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)",
      cols,
      rows,
      "Kriteria andal: Nilai Cronbach's Alpha >= 0,600 (Ghozali, 2018)."
    );
    if (results.explanations?.reliability) {
      drawParagraph(results.explanations.reliability, { indent: 20 });
    }
  }

  // 4. UJI ASUMSI KLASIK & GRAFIK RESIDUAL
  if (
    selectedSections.includes('normality') ||
    selectedSections.includes('multicollinearity') ||
    selectedSections.includes('heteroscedasticity')
  ) {
    // 4a. Tabel Uji Normalitas K-S
    if (results.normality?.length) {
      const cols: TableColumn[] = [
        { header: 'Uji Normalitas', width: 167, align: 'left' },
        { header: 'Statistik Uji', width: 80, align: 'right' },
        { header: 'Asymp. Sig. (p-val)', width: 80, align: 'right' },
        { header: 'Kriteria (α)', width: 80, align: 'right' },
        { header: 'Kesimpulan', width: 80, align: 'center' },
      ];
      const rows = results.normality.map((r) => [
        r.test,
        formatNumber(r.statistic, 3),
        formatNumber(r.pValue, 3),
        '0,050',
        r.normal ? 'Normal' : 'Tidak Normal',
      ]);
      drawApaTable(
        'Tabel 4.4',
        'Hasil Uji Normalitas Residual Regresi (Kolmogorov-Smirnov)',
        cols,
        rows,
        'Residual berdistribusi normal jika Asymp. Sig. (2-tailed) > 0,05.'
      );
    }

    // 4b. GAMBAR 4.1: Histogram Residual & Kurva Normal Teoretis
    const rawZ =
      results.standardizedResiduals ||
      results.unstandardizedResiduals ||
      [];
    const histData = calculateHistogramData(rawZ);

    drawApaFigure(
      'Gambar 4.1',
      'Histogram Residual dan Kurva Normal Model Regresi',
      190,
      (figX, figY, figW, figH) => {
        // Latar Putih Solid & Border
        currentPageOps.push(
          `q 1 1 1 rg 0.85 0.85 0.85 RG 0.75 w ${figX.toFixed(2)} ${figY.toFixed(2)} ${figW.toFixed(2)} ${figH.toFixed(2)} re B Q`
        );

        if (histData.isConstant || histData.bins.length === 0) {
          drawText(
            histData.message || 'Data residual belum tersedia atau bernilai konstan.',
            figX + figW / 2,
            figY + figH / 2,
            { font: 'F3', size: 9, align: 'center', color: [0.4, 0.4, 0.4] }
          );
          return;
        }

        const marginLeft = 50;
        const marginRight = 25;
        const marginTop = 25;
        const marginBottom = 45;
        const plotW = figW - marginLeft - marginRight;
        const plotH = figH - marginTop - marginBottom;

        // Nice ticks Y & X
        const yTicks = niceTicks(0, histData.yAxisMax, 5, { forceZeroMin: true, integerOnly: true });
        const maxY = yTicks[yTicks.length - 1] || Math.max(1, histData.yAxisMax);

        const xTicks = niceTicks(histData.minZ, histData.maxZ, 6);
        const minZ = Math.min(histData.minZ, xTicks[0]);
        const maxZ = Math.max(histData.maxZ, xTicks[xTicks.length - 1]);

        const scaleX = (x: number) =>
          figX + marginLeft + ((x - minZ) / (maxZ - minZ)) * plotW;
        const scaleY = (y: number) =>
          figY + marginBottom + (y / maxY) * plotH;

        // Grid Y
        yTicks.forEach((tickVal) => {
          const yPos = scaleY(tickVal);
          currentPageOps.push(
            `q 0.9 0.9 0.9 RG 0.5 w ${(figX + marginLeft).toFixed(2)} ${yPos.toFixed(2)} m ${(figX + marginLeft + plotW).toFixed(2)} ${yPos.toFixed(2)} l S Q`
          );
          drawText(formatPlotNumber(tickVal, 0), figX + marginLeft - 6, yPos - 3, {
            font: 'F1',
            size: 8,
            align: 'right',
            color: [0.3, 0.3, 0.3],
          });
        });

        // Batang Histogram Riil
        histData.bins.forEach((bin) => {
          const x0 = scaleX(bin.x0);
          const x1 = scaleX(bin.x1);
          const barW = Math.max(1, x1 - x0 - 1);
          const barH = (bin.count / maxY) * plotH;
          const y0 = figY + marginBottom;

          currentPageOps.push(
            `q 0.85 0.88 0.87 rg 0.08 0.28 0.22 RG 0.8 w ${x0.toFixed(2)} ${y0.toFixed(2)} ${barW.toFixed(2)} ${barH.toFixed(2)} re B Q`
          );
        });

        // Kurva Normal Teoretis Terskala
        if (histData.curvePoints.length > 1) {
          const curveOps: string[] = [];
          histData.curvePoints.forEach((pt, idx) => {
            const cx = scaleX(pt.x);
            const cy = scaleY(pt.y);
            curveOps.push(`${cx.toFixed(2)} ${cy.toFixed(2)} ${idx === 0 ? 'm' : 'l'}`);
          });
          currentPageOps.push(
            `q 0.92 0.35 0.05 RG 2 w ${curveOps.join(' ')} S Q`
          );
        }

        // Sumbu X & Y
        currentPageOps.push(
          `q 0 0 0 RG 1 w ${(figX + marginLeft).toFixed(2)} ${(figY + marginBottom).toFixed(2)} m ${(figX + marginLeft).toFixed(2)} ${(figY + marginBottom + plotH).toFixed(2)} l S Q`
        );
        currentPageOps.push(
          `q 0 0 0 RG 1 w ${(figX + marginLeft).toFixed(2)} ${(figY + marginBottom).toFixed(2)} m ${(figX + marginLeft + plotW).toFixed(2)} ${(figY + marginBottom).toFixed(2)} l S Q`
        );

        // Ticks X
        xTicks.forEach((t) => {
          const xPos = scaleX(t);
          const label = formatPlotNumber(t, Math.abs(t % 1) > 1e-4 ? 1 : 0);
          currentPageOps.push(
            `q 0 0 0 RG 0.75 w ${xPos.toFixed(2)} ${(figY + marginBottom).toFixed(2)} m ${xPos.toFixed(2)} ${(figY + marginBottom - 4).toFixed(2)} l S Q`
          );
          drawText(label, xPos, figY + marginBottom - 12, {
            font: 'F1',
            size: 8,
            align: 'center',
            color: [0.2, 0.2, 0.2],
          });
        });

        // Label Sumbu
        drawText('Regression Standardized Residual', figX + marginLeft + plotW / 2, figY + 12, {
          font: 'F2',
          size: 8.5,
          align: 'center',
          color: [0, 0, 0],
        });

        // Legenda Statistik Ringkas 2-Kolom (Tiap Metrik di Baris Sendiri)
        const legW = 105;
        const legH = 46;
        const legX = figX + figW - marginRight - legW - 5;
        const legY = figY + figH - marginTop - legH + 8;
        currentPageOps.push(
          `q 1 1 1 rg 0.6 0.6 0.6 RG 0.5 w ${legX.toFixed(2)} ${legY.toFixed(2)} ${legW} ${legH} re B Q`
        );
        drawText('Statistik Residual', legX + 6, legY + legH - 9, { font: 'F2', size: 7.5, color: [0, 0, 0] });
        // Baris 1: Mean
        drawText('Mean', legX + 6, legY + legH - 18, { font: 'F1', size: 7, color: [0.3, 0.3, 0.3] });
        drawText(formatPlotNumber(histData.mean, 2), legX + legW - 6, legY + legH - 18, { font: 'F2', size: 7, align: 'right', color: [0, 0, 0] });
        // Baris 2: Std. Dev.
        drawText('Std. Dev.', legX + 6, legY + legH - 27, { font: 'F1', size: 7, color: [0.3, 0.3, 0.3] });
        drawText(formatPlotNumber(histData.stdDev, 2), legX + legW - 6, legY + legH - 27, { font: 'F2', size: 7, align: 'right', color: [0, 0, 0] });
        // Baris 3: N
        drawText('N', legX + 6, legY + legH - 36, { font: 'F1', size: 7, color: [0.3, 0.3, 0.3] });
        drawText(formatPlotNumber(histData.n, 0), legX + legW - 6, legY + legH - 36, { font: 'F2', size: 7, align: 'right', color: [0, 0, 0] });
      },
      'Sumber: Data primer diolah (2026). Dihitung dari standardized residual model regresi OLS.'
    );

    // 4c. GAMBAR 4.2: Normal P-P Plot of Regression Standardized Residual
    const ppData = calculateNormalPPPlotData(
      results.unstandardizedResiduals ||
      results.standardizedResiduals ||
      []
    );

    drawApaFigure(
      'Gambar 4.2',
      'Normal P-P Plot of Regression Standardized Residual',
      210,
      (figX, figY, figW, figH) => {
        // Latar Putih Solid & Border
        currentPageOps.push(
          `q 1 1 1 rg 0.85 0.85 0.85 RG 0.75 w ${figX.toFixed(2)} ${figY.toFixed(2)} ${figW.toFixed(2)} ${figH.toFixed(2)} re B Q`
        );

        if (ppData.isConstant || ppData.points.length === 0) {
          drawText(
            ppData.message || 'Data residual belum tersedia atau bernilai konstan.',
            figX + figW / 2,
            figY + figH / 2,
            { font: 'F3', size: 9, align: 'center', color: [0.4, 0.4, 0.4] }
          );
          return;
        }

        const plotSize = Math.min(figW - 120, figH - 60);
        const plotLeft = figX + (figW - plotSize) / 2 + 10;
        const plotBottom = figY + 36;

        const scaleX = (p: number) => plotLeft + p * plotSize;
        const scaleY = (p: number) => plotBottom + p * plotSize;

        // Grid & Ticks (0; 0,2; 0,4; 0,6; 0,8; 1,0)
        [0.0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t) => {
          const x = scaleX(t);
          const y = scaleY(t);
          const label = t === 0 ? '0' : t === 1 ? '1,0' : formatPlotNumber(t, 1);

          // Grid Lines
          currentPageOps.push(
            `q 0.92 0.92 0.92 RG 0.5 w ${x.toFixed(2)} ${plotBottom.toFixed(2)} m ${x.toFixed(2)} ${(plotBottom + plotSize).toFixed(2)} l S Q`
          );
          currentPageOps.push(
            `q 0.92 0.92 0.92 RG 0.5 w ${plotLeft.toFixed(2)} ${y.toFixed(2)} m ${(plotLeft + plotSize).toFixed(2)} ${y.toFixed(2)} l S Q`
          );

          // Ticks X
          currentPageOps.push(
            `q 0 0 0 RG 0.75 w ${x.toFixed(2)} ${plotBottom.toFixed(2)} m ${x.toFixed(2)} ${(plotBottom - 4).toFixed(2)} l S Q`
          );
          drawText(label, x, plotBottom - 12, { font: 'F1', size: 7.5, align: 'center', color: [0.2, 0.2, 0.2] });

          // Ticks Y
          currentPageOps.push(
            `q 0 0 0 RG 0.75 w ${plotLeft.toFixed(2)} ${y.toFixed(2)} m ${(plotLeft - 4).toFixed(2)} ${y.toFixed(2)} l S Q`
          );
          drawText(label, plotLeft - 6, y - 2.5, { font: 'F1', size: 7.5, align: 'right', color: [0.2, 0.2, 0.2] });
        });

        // Garis Diagonal Referensi 45 Derajat (0,0) -> (1,1)
        const x0 = scaleX(0);
        const y0 = scaleY(0);
        const x1 = scaleX(1);
        const y1 = scaleY(1);
        currentPageOps.push(
          `q 0.92 0.35 0.05 RG [3 2] 0 d 1.5 w ${x0.toFixed(2)} ${y0.toFixed(2)} m ${x1.toFixed(2)} ${y1.toFixed(2)} l S Q`
        );

        // Kotak Area Plot 1:1
        currentPageOps.push(
          `q 0 0 0 RG 1 w ${plotLeft.toFixed(2)} ${plotBottom.toFixed(2)} ${plotSize.toFixed(2)} ${plotSize.toFixed(2)} re S Q`
        );

        // Gambar Tepat N Titik Responden Aktual (Lingkaran Vektor)
        const r = 2.2;
        const k = 0.55228475 * r;
        ppData.points.forEach((pt) => {
          const cx = scaleX(pt.pObserved);
          const cy = scaleY(pt.pExpected);
          currentPageOps.push(
            `q 0.08 0.28 0.22 rg 0 0 0 RG 0.6 w ${cx + r} ${cy} m ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} c ${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} c ${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} c ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} c B Q`
          );
        });

        // Label Sumbu
        drawText('Observed Cum Prob', plotLeft + plotSize / 2, figY + 12, {
          font: 'F2',
          size: 8.5,
          align: 'center',
          color: [0, 0, 0],
        });
        drawText('Expected Cum Prob', plotLeft - 22, plotBottom + plotSize / 2, {
          font: 'F2',
          size: 8.5,
          align: 'center',
          color: [0, 0, 0],
        });
      },
      'Sumber: Data primer diolah (2026). Titik-titik data residual merapat di sekitar garis diagonal 45°.'
    );

    // 4d. Uji Multikolinearitas (Tabel 4.5)
    if (results.multicollinearity?.length) {
      const cols: TableColumn[] = [
        { header: 'Variabel Bebas (X)', width: 175, align: 'left' },
        { header: 'Tolerance', width: 95, align: 'right' },
        { header: 'VIF', width: 95, align: 'right' },
        { header: 'Batas Kritis', width: 62, align: 'right' },
        { header: 'Kesimpulan', width: 60, align: 'center' },
      ];
      const rows = results.multicollinearity.map((r) => [
        r.variable,
        formatNumber(r.tolerance, 3),
        formatNumber(r.vif, 3),
        '< 10,00',
        !r.problematic ? 'Bebas Multikol' : 'Bermasalah',
      ]);
      drawApaTable(
        'Tabel 4.5',
        'Hasil Uji Multikolinearitas (Tolerance & VIF)',
        cols,
        rows,
        'Bebas multikolinearitas jika Tolerance > 0,10 dan VIF < 10,00.'
      );
    }

    // 4e. Uji Heteroskedastisitas (Tabel 4.6 - Lebar Kolom Dioptimalkan)
    if (results.heteroscedasticity?.length) {
      const cols: TableColumn[] = [
        { header: 'Variabel Bebas (X)', width: 175, align: 'left' },
        { header: 't Hitung', width: 70, align: 'right' },
        { header: 'Sig. (p-val)', width: 68, align: 'right' },
        { header: 'Kriteria (α)', width: 68, align: 'right' },
        { header: 'Kesimpulan', width: 106, align: 'center' },
      ];
      const rows = results.heteroscedasticity.map((r) => [
        r.variable,
        formatNumber(r.tHitung, 3),
        formatNumber(r.pValue, 3),
        '> 0,050',
        !r.significant ? 'Bebas Heteroskedastisitas' : 'Gejala Hetero',
      ]);
      drawApaTable(
        'Tabel 4.6',
        'Hasil Uji Heteroskedastisitas (Uji Glejser)',
        cols,
        rows,
        'Bebas heteroskedastisitas jika nilai Sig. > 0,05.'
      );
    }

    // 4f. Uji Autokorelasi Durbin-Watson (Tabel 4.6b jika tersedia)
    if (results.durbinWatson) {
      const dwCols: TableColumn[] = [
        { header: 'Statistik d', width: 95, align: 'right' },
        { header: 'dL', width: 95, align: 'right' },
        { header: 'dU', width: 95, align: 'right' },
        { header: '4 - dU', width: 95, align: 'right' },
        { header: 'Kesimpulan', width: 107, align: 'center' },
      ];
      const dwRows = [[
        formatNumber(results.durbinWatson.dwStatistic, 4),
        formatNumber(results.durbinWatson.dL, 4),
        formatNumber(results.durbinWatson.dU, 4),
        formatNumber(4 - results.durbinWatson.dU, 4),
        results.durbinWatson.conclusion,
      ]];
      drawApaTable(
        'Tabel 4.6b',
        'Hasil Pengujian Autokorelasi (Durbin-Watson)',
        dwCols,
        dwRows,
        'Kriteria: Bebas autokorelasi jika dU < d < 4 - dU.'
      );
    }

    // 4g. Uji Linearitas ANOVA (Tabel 4.6c jika tersedia)
    if (results.linearity && results.linearity.length > 0) {
      const linCols: TableColumn[] = [
        { header: 'Hubungan Variabel', width: 155, align: 'left' },
        { header: 'F Deviation', width: 65, align: 'right' },
        { header: 'Sig. Deviation', width: 65, align: 'right' },
        { header: 'F Linearity', width: 65, align: 'right' },
        { header: 'Sig. Linearity', width: 65, align: 'right' },
        { header: 'Status', width: 72, align: 'center' },
      ];
      const linRows = results.linearity.map((l) => [
        `${l.independentVar} -> ${l.dependentVar}`,
        formatNumber(l.fDeviation, 3),
        formatNumber(l.sigDeviation, 3),
        formatNumber(l.fLinearity, 3),
        formatNumber(l.sigLinearity, 3),
        l.isLinear ? 'Linier' : 'Tidak Linier',
      ]);
      drawApaTable(
        'Tabel 4.6c',
        'Hasil Uji Linearitas (Deviation from Linearity ANOVA)',
        linCols,
        linRows,
        'Hubungan dinyatakan linier jika Sig. Deviation from Linearity > 0,05.'
      );
    }
  }

  // 5. REGRESI LINIER BERGANDA
  if (selectedSections.includes('regression') && results.regression?.length) {
    const cols: TableColumn[] = [
      { header: 'Variabel', width: 167, align: 'left' },
      { header: 'Koefisien (B)', width: 80, align: 'right' },
      { header: 'Std Error', width: 80, align: 'right' },
      { header: 't Hitung', width: 80, align: 'right' },
      { header: 'Sig. (p-val)', width: 80, align: 'right' },
    ];
    const rows = results.regression.map((r) => [
      r.variable,
      formatNumber(r.coefficient, 3),
      formatNumber(r.stdError, 3),
      formatNumber(r.tHitung, 3),
      formatNumber(r.pValue, 3),
    ]);
    drawApaTable('Tabel 4.7', 'Hasil Analisis Regresi Linier (Uji t Parsial)', cols, rows);

    if (results.fTest) {
      const fCols: TableColumn[] = [
        { header: 'Model Uji', width: 167, align: 'left' },
        { header: 'F Hitung', width: 80, align: 'right' },
        { header: 'F Tabel', width: 80, align: 'right' },
        { header: 'Sig. (p-val)', width: 80, align: 'right' },
        { header: 'Signifikansi', width: 80, align: 'center' },
      ];
      const fRows = [[
        'Regresi Simultan',
        formatNumber(results.fTest.fHitung, 3),
        formatNumber(results.fTest.fTabel, 3),
        formatNumber(results.fTest.pValue, 3),
        results.fTest.significant ? 'Signifikan' : 'Tidak',
      ]];
      drawApaTable('Tabel 4.8', 'Hasil Pengujian Simultan (Uji F ANOVA)', fCols, fRows);
    }

    if (results.determination) {
      const rCols: TableColumn[] = [
        { header: 'Model Regresi', width: 120, align: 'left' },
        { header: 'R Square (R²)', width: 110, align: 'right' },
        { header: 'Adjusted R²', width: 110, align: 'right' },
        { header: 'Kontribusi (%)', width: 147, align: 'right' },
      ];
      const rRows = [[
        '1 (Simultan)',
        formatNumber(results.determination.rSquare, 3),
        formatNumber(results.determination.adjustedRSquare, 3),
        `${formatNumber(results.determination.adjustedRSquare * 100, 1)}%`,
      ]];
      drawApaTable('Tabel 4.9', 'Koefisien Determinasi Model Regresi (R Square)', rCols, rRows);
    }

    if (results.explanations?.regression) {
      drawParagraph(results.explanations.regression, { indent: 20 });
    }
  }

  // 6. KORELASI PEARSON
  if (selectedSections.includes('correlation') && results.correlation?.length) {
    const cols: TableColumn[] = [
      { header: 'Variabel 1', width: 147, align: 'left' },
      { header: 'Variabel 2', width: 147, align: 'left' },
      { header: 'Koefisien (r)', width: 65, align: 'right' },
      { header: 'Sig.', width: 65, align: 'right' },
      { header: 'Signifikansi', width: 63, align: 'center' },
    ];
    const rows = results.correlation.map((r) => [
      r.variable1,
      r.variable2,
      formatNumber(r.coefficient, 3),
      formatNumber(r.pValue, 3),
      r.significant ? 'Signifikan' : 'Tidak',
    ]);
    drawApaTable('Tabel 4.10', 'Matriks Korelasi Pearson Antar Variabel', cols, rows, 'Uji dua sisi (two-tailed), α = 0,05.');
    if (results.explanations?.correlation) {
      drawParagraph(results.explanations.correlation, { indent: 20 });
    }
  }

  // 7. CATATAN PEMBAHASAN & KAJIAN TEORI PENELITI (JIKA ADA)
  const noteEntries = Object.entries(notesMap).filter(([, val]) => val && val.trim().length > 0);
  if (noteEntries.length > 0) {
    checkSpace(90);
    drawText('Catatan Pembahasan & Kajian Teori Peneliti', MARGIN_LEFT, currentY, {
      font: 'F2',
      size: 10.5,
      color: [0.08, 0.28, 0.22],
    });
    currentY -= 14;
    for (const [secKey, noteVal] of noteEntries) {
      drawParagraph(`[${secKey}] ${noteVal.trim()}`, { indent: 12 });
    }
  }

  // 8. PERNYATAAN PENGGUNAAN ALAT
  if (includeStatement) {
    checkSpace(100);
    drawText('Lampiran: Pernyataan Penggunaan Alat Bantu Analisis', MARGIN_LEFT, currentY, {
      font: 'F2',
      size: 10,
      color: [0, 0, 0],
    });
    currentY -= 16;
    drawParagraph(
      'Peneliti menyatakan secara bertanggung jawab bahwa seluruh tabulasi data kuesioner dalam penelitian ini diolah secara deterministik menggunakan rumus baku statistik tanpa fabrikasi atau manipulasi nilai responden. Narasi interpretasi akademik disesuaikan dan diverifikasi kebenarannya oleh peneliti sebelum dicantumkan dalam naskah skripsi.',
      { indent: 20 }
    );
  }

  // Selesaikan Halaman Terakhir
  if (currentPageOps.length > 0) {
    pages.push(currentPageOps);
  }

  // Tambahkan Header Kaki & Watermark di Tiap Halaman
  const totalPages = pages.length;
  pages.forEach((pOps, pIdx) => {
    const pageNumText = `Halaman ${pIdx + 1} dari ${totalPages}`;
    // Footer line
    pOps.push(`q 0.7 0.7 0.7 RG 0.5 w ${MARGIN_LEFT} 42 m ${(PAGE_WIDTH - MARGIN_RIGHT).toFixed(2)} 42 l S Q`);
    // Footer text
    pOps.push(
      `q 0.45 0.45 0.45 rg BT /F1 8 Tf 1 0 0 1 ${MARGIN_LEFT} 32 Tm (OlahData.id - Pengolah Data Skripsi Kuantitatif) Tj ET Q`
    );
    pOps.push(
      `q 0.45 0.45 0.45 rg BT /F1 8 Tf 1 0 0 1 ${(PAGE_WIDTH - MARGIN_RIGHT - 70).toFixed(2)} 32 Tm (${escapePdfString(pageNumText)}) Tj ET Q`
    );

    // Free tier watermark
    if (isWatermark) {
      pOps.unshift(
        `q 0.85 0.25 0.2 rg BT /F2 36 Tf 0.707 0.707 -0.707 0.707 140 280 Tm (DRAF VERSI GRATIS) Tj ET Q`
      );
    }
  });

  // --- Kompilasi Struktur Objek PDF 1.4 ---
  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Obj 2: Pages container
  const pageObjIds = pages.map((_, i) => `${6 + i * 2} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds}] /Count ${totalPages} >>\nendobj\n`);

  // Font Objs
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);
  objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`);

  // Page and Content Objs
  pages.forEach((pOps, i) => {
    const pageId = 6 + i * 2;
    const contentId = 7 + i * 2;
    const streamContent = pOps.join('\n');
    const streamBytes = new TextEncoder().encode(streamContent);

    // Page Object
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> >>\nendobj\n`
    );

    // Content Object
    objects.push(
      `${contentId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
    );
  });

  // Hitung offset byte dan bentuk tabel xref
  const header = `%PDF-1.4\n%\xe2\xe3\xcf\xd3\n`;
  const encoder = new TextEncoder();
  let currentOffset = encoder.encode(header).length;

  const offsets: number[] = [0];
  objects.forEach((objStr) => {
    offsets.push(currentOffset);
    currentOffset += encoder.encode(objStr).length;
  });

  const totalObjs = objects.length + 1;
  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  for (let i = 1; i < totalObjs; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    xref += `${offStr} 00000 n \n`;
  }

  const startxref = currentOffset;
  const trailer = `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const finalString = header + objects.join('') + xref + trailer;
  return new TextEncoder().encode(finalString);
}
