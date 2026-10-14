import type { AnalysisResults, ExportOptions } from './api/types';
import { formatNumber } from './format';

/**
 * Pure TypeScript deterministic PDF 1.4 generator.
 * Produces 100% compliant, readable PDF documents without external native dependencies.
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
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Replace non-ascii chars safely for Type1 WinAnsi/Standard
    .replace(/[^\x20-\x7E]/g, '?');
}

export function generateAcademicPdfReport(
  results: AnalysisResults,
  options: {
    projectTitle?: string;
    sections?: string[];
    includeStatement?: boolean;
    watermark?: boolean;
  }
): Uint8Array {
  const projectTitle = options.projectTitle || 'Pengaruh Kualitas Layanan dan Kepuasan terhadap Loyalitas Pelanggan';
  const selectedSections = options.sections || ['descriptive', 'validity', 'reliability', 'normality', 'regression', 'correlation'];
  const includeStatement = options.includeStatement ?? true;
  const isWatermark = options.watermark ?? false;

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

    // Approximate char width for Helvetica: ~0.55 * size
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

  function drawLine(x1: number, y1: number, x2: number, y2: number, lineWidth: number = 0.5, color: [number, number, number] = [0, 0, 0]) {
    currentPageOps.push(
      `q ${color[0]} ${color[1]} ${color[2]} RG ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    );
  }

  function drawParagraph(text: string, opts: { font?: 'F1' | 'F2' | 'F3'; size?: number; lineHeight?: number; indent?: number } = {}) {
    const size = opts.size || 9.5;
    const lineHeight = opts.lineHeight || 14;
    const indent = opts.indent || 0;
    const font = opts.font || 'F1';

    // Simple word wrapping
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

  function drawApaTable(
    tableNum: string,
    title: string,
    cols: TableColumn[],
    rows: (string | number)[][],
    note?: string
  ) {
    const headerHeight = 22;
    const rowHeight = 18;
    const totalHeight = 40 + headerHeight + rows.length * rowHeight + (note ? 20 : 0);

    checkSpace(Math.min(totalHeight, 140));

    // Table Number & Title
    drawText(tableNum, MARGIN_LEFT, currentY, { font: 'F2', size: 10, color: [0.05, 0.05, 0.05] });
    currentY -= 14;
    drawText(title, MARGIN_LEFT, currentY, { font: 'F3', size: 9.5, color: [0.2, 0.2, 0.2] });
    currentY -= 14;

    const startX = MARGIN_LEFT;
    const endX = MARGIN_LEFT + CONTENT_WIDTH;

    // Top border (1.5pt)
    drawLine(startX, currentY, endX, currentY, 1.5, [0, 0, 0]);
    currentY -= 4;

    // Header labels
    let curX = startX;
    cols.forEach((col) => {
      const posX = col.align === 'right' ? curX + col.width - 4 : col.align === 'center' ? curX + col.width / 2 : curX + 4;
      drawText(col.header, posX, currentY - 10, {
        font: 'F2',
        size: 8.5,
        align: col.align || 'left',
        color: [0, 0, 0],
      });
      curX += col.width;
    });
    currentY -= 16;

    // Under header border (0.75pt)
    drawLine(startX, currentY, endX, currentY, 0.75, [0, 0, 0]);
    currentY -= 2;

    // Data rows
    rows.forEach((row) => {
      checkSpace(rowHeight);
      let rX = startX;
      row.forEach((cell, cIdx) => {
        const col = cols[cIdx];
        if (!col) return;
        const posX = col.align === 'right' ? rX + col.width - 4 : col.align === 'center' ? rX + col.width / 2 : rX + 4;
        drawText(String(cell ?? '-'), posX, currentY - 10, {
          font: 'F1',
          size: 8.5,
          align: col.align || 'left',
          color: [0.1, 0.1, 0.1],
        });
        rX += col.width;
      });
      currentY -= rowHeight;
    });

    // Bottom table border (1.5pt)
    drawLine(startX, currentY, endX, currentY, 1.5, [0, 0, 0]);
    currentY -= 12;

    // Note if present
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

  // --- Start Building Document ---
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

  const metaStr = `N = ${results.respondentCount} Responden • Format Baku APA 7th Edition • Engine OlahData`;
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
    drawApaTable('Tabel 4.1', 'Hasil Analisis Statistik Deskriptif Variabel Penelitian', cols, rows, `N = ${results.respondentCount} responden.`);
    if (results.explanations?.descriptive) {
      drawParagraph(results.explanations.descriptive, { indent: 20 });
    }
  }

  // 2. UJI VALIDITAS
  if (selectedSections.includes('validity') && results.validity?.length) {
    const cols: TableColumn[] = [
      { header: 'Butir Indikator', width: 100, align: 'left' },
      { header: 'Konstruk Variabel', width: 147, align: 'left' },
      { header: 'r Hitung', width: 80, align: 'right' },
      { header: 'r Tabel', width: 80, align: 'right' },
      { header: 'Status', width: 80, align: 'center' },
    ];
    const rows = results.validity.map((r) => [
      r.item,
      r.construct,
      formatNumber(r.rHitung, 3),
      formatNumber(r.rTabel, 4),
      r.valid ? 'Valid' : 'Gugur',
    ]);
    drawApaTable('Tabel 4.2', 'Hasil Pengujian Validitas Butir Kuesioner (Pearson Product Moment)', cols, rows, 'Uji dua sisi (two-tailed), signifikansi α = 0,05.');
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
      { header: 'Status', width: 70, align: 'center' },
    ];
    const rows = results.reliability.map((r) => [
      r.construct,
      formatNumber(r.itemCount),
      formatNumber(r.cronbachAlpha, 3),
      '0,600',
      r.reliable ? 'Reliabel' : 'Tidak',
    ]);
    drawApaTable('Tabel 4.3', "Hasil Pengujian Reliabilitas Konstruk (Cronbach's Alpha)", cols, rows, 'Kriteria andal: Cronbach Alpha >= 0,600.');
    if (results.explanations?.reliability) {
      drawParagraph(results.explanations.reliability, { indent: 20 });
    }
  }

  // 4. ASUMSI KLASIK
  if (selectedSections.includes('normality')) {
    if (results.normality?.length) {
      const cols: TableColumn[] = [
        { header: 'Uji Normalitas', width: 167, align: 'left' },
        { header: 'Statistik', width: 80, align: 'right' },
        { header: 'Asymp. Sig.', width: 80, align: 'right' },
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
      drawApaTable('Tabel 4.4', 'Hasil Uji Normalitas Residual Regresi', cols, rows, 'Residual berdistribusi normal jika Asymp. Sig. > 0,05.');
    }

    if (results.multicollinearity?.length) {
      const cols: TableColumn[] = [
        { header: 'Variabel Bebas (X)', width: 187, align: 'left' },
        { header: 'Tolerance', width: 100, align: 'right' },
        { header: 'VIF', width: 100, align: 'right' },
        { header: 'Kesimpulan', width: 100, align: 'center' },
      ];
      const rows = results.multicollinearity.map((r) => [
        r.variable,
        formatNumber(r.tolerance, 3),
        formatNumber(r.vif, 3),
        !r.problematic ? 'Bebas Multikol' : 'Bermasalah',
      ]);
      drawApaTable('Tabel 4.5', 'Hasil Uji Multikolinearitas (Tolerance & VIF)', cols, rows, 'Bebas multikolinearitas jika Tolerance > 0,10 dan VIF < 10,00.');
    }

    if (results.heteroscedasticity?.length) {
      const cols: TableColumn[] = [
        { header: 'Variabel Bebas (X)', width: 167, align: 'left' },
        { header: 't Hitung', width: 80, align: 'right' },
        { header: 'Sig. (p-value)', width: 80, align: 'right' },
        { header: 'Kriteria', width: 80, align: 'right' },
        { header: 'Kesimpulan', width: 80, align: 'center' },
      ];
      const rows = results.heteroscedasticity.map((r) => [
        r.variable,
        formatNumber(r.tHitung, 3),
        formatNumber(r.pValue, 3),
        '> 0,050',
        !r.significant ? 'Bebas Heteroskedastisitas' : 'Gejala Hetero',
      ]);
      drawApaTable('Tabel 4.6', 'Hasil Uji Heteroskedastisitas (Uji Glejser)', cols, rows, 'Bebas heteroskedastisitas jika nilai Sig. > 0,05.');
    }
  }

  // 5. REGRESI LINIER BERGANDA
  if (selectedSections.includes('regression') && results.regression?.length) {
    const cols: TableColumn[] = [
      { header: 'Variabel', width: 167, align: 'left' },
      { header: 'Koefisien (B)', width: 80, align: 'right' },
      { header: 'Std Error', width: 80, align: 'right' },
      { header: 't Hitung', width: 80, align: 'right' },
      { header: 'Sig.', width: 80, align: 'right' },
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
        { header: 'Sig.', width: 80, align: 'right' },
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
        { header: 'Model', width: 120, align: 'left' },
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

  // 7. PERNYATAAN PENGGUNAAN ALAT
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

  // Finish last page
  if (currentPageOps.length > 0) {
    pages.push(currentPageOps);
  }

  // Add Footers & Watermark to each page
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

  // --- Compile PDF Structure ---
  // Objects:
  // 1: Catalog
  // 2: Pages
  // 3: Font Helvetica
  // 4: Font Helvetica-Bold
  // 5: Font Helvetica-Oblique
  // Pages and Contents follow:
  // For page i: Page obj is (6 + i*2), Content obj is (7 + i*2)
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

  // Calculate byte offsets and construct xref
  const header = `%PDF-1.4\n%\xe2\xe3\xcf\xd3\n`;
  const encoder = new TextEncoder();
  let currentOffset = encoder.encode(header).length;

  const offsets: number[] = [0]; // obj 0 is free
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
