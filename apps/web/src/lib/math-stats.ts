/**
 * Accurate mathematical functions for deterministic statistical computation.
 * Matches SciPy / R output with 1e-6 precision.
 */

// Matrix operations
export function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result: number[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const a = A[i][k];
      for (let j = 0; j < colsB; j++) {
        result[i][j] += a * B[k][j];
      }
    }
  }
  return result;
}

export function matrixTranspose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

export function matrixInverse(A: number[][]): number[][] {
  const n = A.length;
  // Augment with identity matrix
  const M: number[][] = A.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) {
      r.push(i === j ? 1 : 0);
    }
    return r;
  });

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    const temp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = temp;

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error('Matriks singular atau multikolinearitas sempurna terdeteksi.');
    }

    for (let j = 0; j < 2 * n; j++) {
      M[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = 0; j < 2 * n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row.slice(n));
}

// Special mathematical functions for distributions

// Lanczos approximation for log gamma
export function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095856205,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Incomplete beta function via continued fraction
export function betainc(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return 0;
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use symmetry transformation if x > (a + 1) / (a + b + 2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betainc(1 - x, b, a);
  }

  const factor = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x) - logGamma(a) - logGamma(b) + logGamma(a + b)
  ) / a;

  // Continued fraction evaluation (Lentz's method)
  const maxIterations = 200;
  const eps = 1e-14;
  let c = 1.0;
  let d = 1.0 - (a + b) * x / (a + 1.0);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    // Even step
    let numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1.0 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    h *= d * c;

    // Odd step
    numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1.0 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1.0 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1.0 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1.0) < eps) break;
  }

  return factor * h;
}

// Student's t cumulative distribution function (CDF)
export function studentTCdf(t: number, df: number): number {
  if (df <= 0) return 0.5;
  const x = df / (df + t * t);
  const prob = 0.5 * betainc(x, df / 2, 0.5);
  return t >= 0 ? 1.0 - prob : prob;
}

// Student's t two-tailed p-value
export function studentTPValueTwoTailed(t: number, df: number): number {
  if (df <= 0 || isNaN(t)) return 1.0;
  const absT = Math.abs(t);
  const x = df / (df + absT * absT);
  return Math.max(0, Math.min(1, betainc(x, df / 2, 0.5)));
}

// Inverse Student's t (quantile / percent point function) via binary search
export function studentTInv(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  let low = -100;
  let high = 100;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const cdf = studentTCdf(mid, df);
    if (cdf < p) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

// Fisher F distribution CDF
export function fisherFCdf(f: number, df1: number, df2: number): number {
  if (f <= 0) return 0;
  const x = (df1 * f) / (df1 * f + df2);
  return betainc(x, df1 / 2, df2 / 2);
}

// Fisher F distribution p-value (upper tail: P(F >= f))
export function fisherFPValue(f: number, df1: number, df2: number): number {
  if (f <= 0 || isNaN(f)) return 1.0;
  return Math.max(0, Math.min(1, 1.0 - fisherFCdf(f, df1, df2)));
}

// Fisher F distribution inverse (critical value) via binary search
export function fisherFInv(p: number, df1: number, df2: number): number {
  let low = 0.0001;
  let high = 1000.0;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const cdf = fisherFCdf(mid, df1, df2);
    if (cdf < p) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

// Standard normal distribution CDF
export function standardNormalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Error function approximation (Abramowitz & Stegun 7.1.26, max error < 1.5e-7)
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}
