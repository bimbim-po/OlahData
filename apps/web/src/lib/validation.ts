import type { DatasetRow, DataIssue } from './api/types';
import { LIKERT_SCALE } from './constants';

export function analyzeDatasetQuality(rows: DatasetRow[], columns: string[]): DataIssue[] {
  const issues: DataIssue[] = [];
  let issueCounter = 1;

  // Filter questionnaire item columns (exclude demographics and ID)
  const ignoredCols = ['no', 'id', 'responden', 'timestamp', 'email address', 'surel'];
  const demographicKeywords = ['kelamin', 'gender', 'usia', 'umur', 'pendidikan', 'pekerjaan', 'pengeluaran', 'gaji', 'status', 'nama'];

  const itemColumns = columns.filter((col) => {
    const lower = col.toLowerCase();
    if (ignoredCols.includes(lower)) return false;
    if (demographicKeywords.some((k) => lower.includes(k))) return false;
    return true;
  });

  // 1. Identify demographic / non-numeric columns for informational purposes
  columns.forEach((col) => {
    const lower = col.toLowerCase();
    if (ignoredCols.includes(lower)) return;

    const nonNumericCount = rows.filter((r) => {
      const v = r[col];
      return v !== null && v !== undefined && v !== '' && isNaN(Number(v));
    }).length;

    const isDemographic = demographicKeywords.some((k) => lower.includes(k));

    if (isDemographic || nonNumericCount > rows.length * 0.4) {
      issues.push({
        id: `issue-info-${col}`,
        type: 'demographic_column',
        severity: 'info',
        message: `Kolom demografi/kategori: ${col}`,
        column: col,
        action: 'Digunakan untuk analisis karakteristik atau uji beda',
      });
    }
  });

  // 2. Identify duplicates, empty cells, and out-of-scale values
  const seenRowSignatures = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const rowNo = typeof row.No === 'number' ? row.No : rowIndex + 1;

    // Check duplicate rows across item columns
    if (itemColumns.length > 0) {
      const signature = itemColumns.map((c) => String(row[c] ?? '')).join('|');
      if (signature.replace(/\|/g, '').length > 0) {
        if (seenRowSignatures.has(signature)) {
          const firstRowNo = seenRowSignatures.get(signature)!;
          issues.push({
            id: `issue-${issueCounter++}`,
            type: 'duplicate_row',
            severity: 'warning',
            message: `Baris duplikat identik dengan responden baris ${firstRowNo}`,
            row: rowNo,
            duplicateOfRow: firstRowNo,
            action: 'Eksklusi responden duplikat',
          });
        } else {
          seenRowSignatures.set(signature, rowNo);
        }
      }
    }

    // Inspect individual cells
    columns.forEach((col) => {
      const lower = col.toLowerCase();
      if (ignoredCols.includes(lower)) return;

      const val = row[col];

      // Empty cell
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        issues.push({
          id: `issue-${issueCounter++}`,
          type: 'missing_cell',
          severity: 'error',
          message: `Sel kosong (missing value) pada pertanyaan ${col}`,
          row: rowNo,
          column: col,
          value: null,
          action: 'Eksklusi responden atau input ulang data mentah',
        });
      } else {
        const num = Number(val);
        const isItemCol = itemColumns.includes(col);

        if (!isNaN(num) && isItemCol) {
          if (num < LIKERT_SCALE.min || num > LIKERT_SCALE.max) {
            issues.push({
              id: `issue-${issueCounter++}`,
              type: 'out_of_scale',
              severity: 'error',
              message: `Nilai ${num} di luar rentang skala Likert (${LIKERT_SCALE.min} - ${LIKERT_SCALE.max}) pada pertanyaan ${col}`,
              row: rowNo,
              column: col,
              value: num,
              action: 'Koreksi ke skala 1-5 atau eksklusi baris',
            });
          }
        }
      }
    });

    // 3. Straight-lining (unengaged constant answers across all items)
    if (itemColumns.length >= 4) {
      const itemValues = itemColumns.map((c) => row[c]).filter((v) => v !== null && v !== undefined && v !== '');
      if (itemValues.length === itemColumns.length) {
        const firstVal = Number(itemValues[0]);
        if (!isNaN(firstVal)) {
          const isUniform = itemValues.every((v) => Number(v) === firstVal);
          if (isUniform) {
            issues.push({
              id: `issue-${issueCounter++}`,
              type: 'straight_lining',
              severity: 'warning',
              message: `Pola jawaban seragam konstan (seluruh pertanyaan dijawab ${firstVal})`,
              row: rowNo,
              value: firstVal,
              action: 'Eksklusi responden unengaged',
            });
          }
        }
      }
    }
  });

  // 4. Univariate outlier detection (|z| > 3 across construct or items)
  // Group item columns by prefix (e.g. KL, KP, LP) to calculate construct composite z-scores
  const constructPrefixes = Array.from(
    new Set(
      itemColumns
        .map((col) => {
          const m = col.match(/^([A-Za-z]+)\d+$/);
          return m ? m[1].toUpperCase() : null;
        })
        .filter((p): p is string => p !== null)
    )
  );

  constructPrefixes.forEach((prefix) => {
    const cols = itemColumns.filter((c) => c.toUpperCase().startsWith(prefix));
    if (cols.length < 2) return;

    // Calculate mean composite score for each respondent
    const scores = rows.map((r) => {
      const validVals = cols.map((c) => Number(r[c])).filter((n) => !isNaN(n));
      return validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : NaN;
    });

    const validScores = scores.filter((s) => !isNaN(s));
    if (validScores.length > 10) {
      const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      const variance = validScores.reduce((a, b) => a + (b - mean) ** 2, 0) / (validScores.length - 1);
      const sd = Math.sqrt(variance);

      if (sd > 1e-6) {
        scores.forEach((s, idx) => {
          if (!isNaN(s)) {
            const z = Math.abs((s - mean) / sd);
            if (z > 3.0) {
              const rowNo = typeof rows[idx].No === 'number' ? rows[idx].No : idx + 1;
              issues.push({
                id: `issue-${issueCounter++}`,
                type: 'univariate_outlier',
                severity: 'warning',
                message: `Pencilan univariat (|z| = ${z.toFixed(2)} > 3 pada variabel ${prefix})`,
                row: Number(rowNo),
                column: prefix,
                action: 'Eksklusi responden pencilan',
              });
            }
          }
        });
      }
    }
  });

  return issues;
}
