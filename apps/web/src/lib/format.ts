const idFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const idCurrencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const idPercentFormatter = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number, decimals?: number): string {
  if (decimals !== undefined) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return idFormatter.format(value);
}

/**
 * Format p-value / Sig. sesuai standar baku akademik APA 7th:
 * Jika p < 0,001, wajib ditampilkan sebagai "< 0,001" (bukan "0,000").
 */
export function formatPValue(pValue: number, decimals: number = 3): string {
  if (pValue < 0.001) {
    return '< 0,001';
  }
  return formatNumber(pValue, decimals);
}

/**
 * Satu fungsi tunggal untuk menurunkan label kesimpulan signifikansi statistik.
 * Aturan baku:
 * 1. Konstanta regresi BUKAN hipotesis penelitian -> diberi label '—'.
 * 2. Variabel bebas: p < alpha -> 'Signifikan', p >= alpha -> 'Tidak signifikan'.
 */
export function getSignificanceLabel(
  pValue: number,
  alpha: number = 0.05,
  isConstant: boolean = false
): string {
  if (isConstant) {
    return '—';
  }
  return pValue < alpha ? 'Signifikan' : 'Tidak signifikan';
}

export function formatCurrency(value: number): string {
  return idCurrencyFormatter.format(value).replace('IDR', 'Rp').trim();
}

export function formatPercent(value: number): string {
  return idPercentFormatter.format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Safely parse Indonesian formatted numbers and currency strings before calculations.
 * Supports:
 * - "Rp 1.250.000,00" -> 1250000
 * - "Rp. 1.250.000" -> 1250000
 * - "1.250,5" -> 1250.5
 * - "1.250.000" -> 1250000
 * - "-2,5" -> -2.5
 * - 0 / "0" -> 0 (strictly separate from null / undefined / NaN / missing data)
 */
export function parseIndonesianNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  if (typeof input !== 'string') {
    return null;
  }

  let str = input.trim();
  if (str === '') return null;

  const lower = str.toLowerCase();
  if (['-', 'n/a', 'na', 'null', 'none', '#n/a', 'nan', '<kosong>'].includes(lower)) {
    return null;
  }

  // Strip currency prefixes e.g. "Rp", "IDR", "Rp."
  str = str.replace(/^(?:Rp\.?|IDR)\s*/i, '').trim();

  // If there are dots as thousand separators and comma as decimal separator: e.g. "1.250.000,50" or "1.250,5"
  if (/^-?[\d.]+(?:,\d+)?$/.test(str) && (str.includes('.') || str.includes(','))) {
    if (str.includes(',')) {
      // Dots are thousands, comma is decimal
      const clean = str.replace(/\./g, '').replace(',', '.');
      const num = Number(clean);
      return isNaN(num) ? null : num;
    }
    // Only dots: check if it's grouped as thousands e.g. "1.250.000" or "25.000"
    if (/^-?\d{1,3}(?:\.\d{3})+$/.test(str)) {
      const clean = str.replace(/\./g, '');
      const num = Number(clean);
      return isNaN(num) ? null : num;
    }
  }

  // Indonesian decimal comma without thousand dots e.g. "4,0", "3,75", "-2,5"
  if (/^-?\d+,\d+$/.test(str)) {
    const num = Number(str.replace(',', '.'));
    return isNaN(num) ? null : num;
  }

  // Standard numeric parse
  const num = Number(str);
  return isNaN(num) ? null : num;
}

/**
 * Sanitize string cells that start with `=`, `+`, `-`, `@`, `\t`, or `\r`
 * by prefixing them with a single quote (`'`) to prevent CSV / Spreadsheet formula injection.
 */
export function sanitizeSpreadsheetCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * RFC-4180 escape a cell value:
 * If the cell contains comma, semicolon, double quote, or newlines,
 * wrap it in double quotes and escape internal quotes by doubling them.
 */
export function escapeCsvCell(cell: string): string {
  if (/[",;\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Generate RFC-4180 compliant CSV string with UTF-8 BOM (\uFEFF)
 * and CSV formula injection protection.
 */
export function generateSafeCsv(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const sanitizedHeaders = headers.map((h) => escapeCsvCell(sanitizeSpreadsheetCell(h)));
  const lines: string[] = [sanitizedHeaders.join(',')];

  for (const row of rows) {
    const rowValues = headers.map((h) => {
      const val = row[h];
      const sanitized = sanitizeSpreadsheetCell(val);
      return escapeCsvCell(sanitized);
    });
    lines.push(rowValues.join(','));
  }

  // Prepend UTF-8 BOM so Microsoft Excel opens UTF-8 properly
  return '\uFEFF' + lines.join('\r\n');
}
