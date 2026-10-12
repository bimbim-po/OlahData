import type { DatasetRow, DataIssue } from './api/types';
import { LIKERT_SCALE } from './constants';

export function analyzeDatasetQuality(rows: DatasetRow[], columns: string[]): DataIssue[] {
  const issues: DataIssue[] = [];
  let issueCounter = 1;

  // 1. Identify demographic / non-numeric columns
  columns.forEach((col) => {
    if (col === 'No' || col === 'id' || col === 'ID') return;
    const isLikertPattern = /^[A-Za-z]+[0-9]+$/.test(col);
    const nonNumericCount = rows.filter((r) => {
      const v = r[col];
      return v !== null && v !== undefined && v !== '' && isNaN(Number(v));
    }).length;

    const lower = col.toLowerCase();
    const isKnownDemographic =
      lower.includes('kelamin') ||
      lower.includes('gender') ||
      lower.includes('usia') ||
      lower.includes('umur') ||
      lower.includes('pendidikan') ||
      lower.includes('pekerjaan') ||
      lower.includes('nama');

    if (isKnownDemographic || (nonNumericCount > 0 && !isLikertPattern)) {
      issues.push({
        id: `issue-info-${col}`,
        severity: 'info',
        message: `Kolom non-numerik (demografi): ${col}`,
        column: col,
      });
    }
  });

  // 2. Identify duplicates, empty cells, and out-of-scale values
  const seenRowSignatures = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const rowNo = typeof row.No === 'number' ? row.No : rowIndex + 1;

    // Signature without row ID
    const signature = columns
      .filter((c) => c !== 'No' && c !== 'id' && c !== 'ID')
      .map((c) => String(row[c] ?? ''))
      .join('|');

    if (signature.length > 5) {
      if (seenRowSignatures.has(signature)) {
        const firstRowNo = seenRowSignatures.get(signature)!;
        issues.push({
          id: `issue-dup-${rowNo}`,
          severity: 'warning',
          message: `Baris duplikat (sama dengan baris ${firstRowNo})`,
          row: rowNo,
        });
      } else {
        seenRowSignatures.set(signature, rowNo);
      }
    }

    // Inspect cells
    columns.forEach((col) => {
      if (col === 'No' || col === 'id' || col === 'ID') return;
      const val = row[col];

      // Empty cell
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        issues.push({
          id: `issue-${issueCounter++}`,
          severity: 'error',
          message: 'Sel kosong',
          row: rowNo,
          column: col,
          value: null,
        });
      } else {
        const num = Number(val);
        const isItemCol =
          /^[A-Za-z]+[0-9]+$/.test(col) ||
          col.toLowerCase().startsWith('x') ||
          col.toLowerCase().startsWith('y');

        if (!isNaN(num) && isItemCol) {
          if (num < LIKERT_SCALE.min || num > LIKERT_SCALE.max) {
            issues.push({
              id: `issue-${issueCounter++}`,
              severity: 'error',
              message: `Nilai di luar skala ${LIKERT_SCALE.min}-${LIKERT_SCALE.max}`,
              row: rowNo,
              column: col,
              value: num,
            });
          }
        }
      }
    });
  });

  return issues;
}
