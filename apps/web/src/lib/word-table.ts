/**
 * Helper utilitas untuk menyalin tabel dan teks ke Microsoft Word
 * Memastikan tabel yang disalin memiliki format baku APA 7th Edition:
 * - 3 garis horizontal (border atas 1,5pt, bawah header 1pt, bawah tabel 1,5pt)
 * - Tanpa garis vertikal (sesuai standar skripsi dan jurnal internasional)
 * - Font Times New Roman 11pt/12pt
 * - Penataan kolom angka rata kanan (tabular-nums)
 * - Mendukung penyalinan HTML (text/html) sehingga Word mengenali tabel asli,
 *   bukan sekadar teks tab-separated yang berantakan.
 */

export interface WordTableColumn {
  header: string;
  align?: 'left' | 'center' | 'right';
}

export interface WordTableData {
  tableNumber?: string;
  title: string;
  note?: string;
  columns: WordTableColumn[];
  rows: (string | number)[][];
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Membuat representasi HTML tabel berstandar APA 7th untuk Microsoft Word
 */
export function buildWordTableHtml(data: WordTableData): string {
  const { tableNumber, title, note, columns, rows } = data;

  // Judul tabel format APA 7th: Nomor tabel tebal, judul di baris baru miring/tebal
  const titleHtml = tableNumber
    ? `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 0 0 2pt 0; text-align: left; line-height: 1.25; color: #000000;"><strong>${escapeHtml(tableNumber)}</strong></p><p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-style: italic; margin: 0 0 6pt 0; text-align: left; line-height: 1.25; color: #000000;">${escapeHtml(title)}</p>`
    : `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin: 0 0 6pt 0; text-align: left; line-height: 1.25; color: #000000;">${escapeHtml(title)}</p>`;

  // Header cells dengan border atas 1.5pt dan border bawah 1.0pt
  const headerCells = columns
    .map((col) => {
      const align = col.align || 'left';
      return `<th style="border-top: 1.5pt solid #000000; border-bottom: 1.0pt solid #000000; border-left: none; border-right: none; padding: 5pt 8pt; font-weight: bold; text-align: ${align}; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; vertical-align: bottom;">${escapeHtml(col.header)}</th>`;
    })
    .join('');

  // Body rows: baris terakhir memiliki border bawah 1.5pt
  const bodyRows = rows
    .map((row, rIdx) => {
      const isLast = rIdx === rows.length - 1;
      const borderBottom = isLast ? '1.5pt solid #000000' : 'none';
      const rowStyle = isLast ? 'border-bottom: 1.5pt solid #000000;' : 'border: none;';

      const cells = row
        .map((cell, cIdx) => {
          const align = columns[cIdx]?.align || 'left';
          const cellContent = escapeHtml(String(cell ?? ''));
          return `<td style="border-top: none; border-bottom: ${borderBottom}; border-left: none; border-right: none; padding: 4.5pt 8pt; text-align: ${align}; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; vertical-align: middle;">${cellContent}</td>`;
        })
        .join('');

      return `<tr style="${rowStyle}">${cells}</tr>`;
    })
    .join('');

  const noteHtml = note
    ? `<p style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; font-style: italic; margin: 4pt 0 0 0; text-align: left; line-height: 1.2; color: #333333;">Catatan: ${escapeHtml(note)}</p>`
    : '';

  return `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; line-height: 1.15; margin: 8pt 0;">
  ${titleHtml}
  <table border="0" cellpadding="4" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000000; margin-top: 4pt; margin-bottom: 4pt;">
    <thead>
      <tr style="border-top: 1.5pt solid #000000; border-bottom: 1.0pt solid #000000;">
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
  ${noteHtml}
</div>
`.trim();
}

/**
 * Membuat representasi teks biasa (tab-separated) sebagai cadangan
 */
export function buildPlainTextTable(data: WordTableData): string {
  const { tableNumber, title, note, columns, rows } = data;
  const titleLine = tableNumber ? `${tableNumber} ${title}` : title;
  const headerLine = columns.map((c) => c.header).join('\t');
  const dataLines = rows.map((r) => r.map((cell) => String(cell ?? '')).join('\t'));
  const noteLine = note ? `Catatan: ${note}` : '';

  return [titleLine, headerLine, ...dataLines, noteLine].filter(Boolean).join('\n');
}

/**
 * Menyalin data HTML dan teks ke clipboard secara cross-browser
 * Menggunakan ClipboardItem (Async Clipboard API) dengan fallback execCommand
 */
export async function copyHtmlAndText(html: string, plainText: string): Promise<boolean> {
  // 1. Coba Async Clipboard API dengan ClipboardItem (Chrome, Edge, Firefox, Safari)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window.ClipboardItem !== 'undefined'
  ) {
    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new window.ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.warn('Async clipboard write with ClipboardItem failed, falling back to execCommand:', err);
    }
  }

  // 2. Fallback: Buat elemen DOM tersembunyi ber-contenteditable lalu panggil execCommand('copy')
  // Browser otomatis menyalin format HTML dan teks biasa ke clipboard OS Windows
  if (typeof document !== 'undefined') {
    try {
      const container = document.createElement('div');
      container.setAttribute('contenteditable', 'true');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.innerHTML = html;
      document.body.appendChild(container);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(container);
        selection.addRange(range);
        const successful = document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(container);
        if (successful) return true;
      }
    } catch (err) {
      console.warn('execCommand copy fallback failed, falling back to writeText:', err);
    }
  }

  // 3. Fallback terakhir: writeText biasa
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (err) {
      console.error('navigator.clipboard.writeText failed:', err);
    }
  }

  return false;
}

/**
 * Menyalin tabel berformat APA 7th ke clipboard untuk Microsoft Word
 */
export async function copyWordTable(data: WordTableData): Promise<boolean> {
  const html = buildWordTableHtml(data);
  const plainText = buildPlainTextTable(data);
  return copyHtmlAndText(html, plainText);
}

/**
 * Menyalin teks penjelasan / interpretasi ke clipboard dengan format Word (Times New Roman 12pt, line 1.5, justify)
 */
export async function copyWordNarrative(text: string, title?: string): Promise<boolean> {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const titleHtml = title
    ? `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin: 0 0 6pt 0; text-align: left; color: #000000;">${escapeHtml(title)}</p>`
    : '';

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; text-align: justify; text-indent: 1cm; margin: 0 0 6pt 0; color: #000000;">${escapeHtml(p)}</p>`
    )
    .join('');

  const html = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000; line-height: 1.5;">
  ${titleHtml}
  ${paragraphsHtml}
</div>
`.trim();

  const plainText = title ? `${title}\n\n${text}` : text;
  return copyHtmlAndText(html, plainText);
}

/**
 * Menyalin tabel dan narasi pembahasan sekaligus untuk satu subbab Bab 4
 */
export async function copyTableAndNarrative(
  tableData: WordTableData,
  narrative: string,
  narrativeTitle?: string
): Promise<boolean> {
  const tableHtml = buildWordTableHtml(tableData);

  const paragraphs = narrative
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const narrativeHeadingHtml = narrativeTitle
    ? `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin: 12pt 0 4pt 0; text-align: left; color: #000000;">${escapeHtml(narrativeTitle)}</p>`
    : '';

  const narrativeParagraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; text-align: justify; text-indent: 1cm; margin: 0 0 6pt 0; color: #000000;">${escapeHtml(p)}</p>`
    )
    .join('');

  const combinedHtml = `
<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000; line-height: 1.5;">
  ${tableHtml}
  ${narrativeHeadingHtml}
  ${narrativeParagraphsHtml}
</div>
`.trim();

  const plainText = [
    buildPlainTextTable(tableData),
    '',
    narrativeTitle ? `${narrativeTitle}\n` : '',
    narrative,
  ]
    .filter(Boolean)
    .join('\n');

  return copyHtmlAndText(combinedHtml, plainText);
}

/**
 * Menghasilkan berkas dokumen Word (.doc) lengkap berbasis Office XML/HTML
 * yang dapat dibuka langsung oleh Microsoft Word dengan margin standar A4 skripsi (4-3-3-3 cm)
 */
export function buildWordDocumentContent(
  projectTitle: string,
  sections: { title: string; contentHtml: string }[]
): string {
  const sectionsHtml = sections
    .map(
      (sec) => `
    <div class="section-block" style="margin-bottom: 24pt;">
      <h2 style="font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #000000;">${escapeHtml(sec.title)}</h2>
      ${sec.contentHtml}
    </div>
  `
    )
    .join('');

  return `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(projectTitle)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 21.0cm 29.7cm; /* A4 */
      margin: 3.0cm 3.0cm 3.0cm 4.0cm; /* Standar skripsi: Atas 3cm, Kanan 3cm, Bawah 3cm, Kiri 4cm */
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
      background: #FFFFFF;
    }
    h1 {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin-top: 12pt;
      margin-bottom: 18pt;
      text-transform: uppercase;
    }
    h2 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 16pt;
      margin-bottom: 6pt;
    }
    p {
      text-align: justify;
      text-indent: 1.0cm;
      margin-top: 0;
      margin-bottom: 6pt;
      line-height: 1.5;
    }
    p.no-indent {
      text-indent: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 8pt;
      margin-bottom: 8pt;
    }
    th {
      border-top: 1.5pt solid #000000;
      border-bottom: 1.0pt solid #000000;
      border-left: none;
      border-right: none;
      padding: 5pt 6pt;
      font-weight: bold;
      font-size: 11pt;
    }
    td {
      border-top: none;
      border-bottom: none;
      border-left: none;
      border-right: none;
      padding: 4.5pt 6pt;
      font-size: 11pt;
    }
    tr.last-row td {
      border-bottom: 1.5pt solid #000000;
    }
  </style>
</head>
<body>
  <h1>LAPORAN HASIL PENGOLAHAN DATA SKRIPSI (BAB 4)</h1>
  <p class="no-indent" style="text-align: center; font-size: 11pt; color: #555555; margin-bottom: 18pt;">
    Proyek: <strong>${escapeHtml(projectTitle)}</strong> &bull; Format Baku APA 7th Edition
  </p>
  <hr style="border: none; border-top: 1pt solid #000000; margin-bottom: 18pt;" />
  ${sectionsHtml}
</body>
</html>
`.trim();
}
