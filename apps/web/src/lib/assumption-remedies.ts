/**
 * assumption-remedies.ts
 * Mesin Kalkulasi Statistik Deterministik: Penyembuhan Asumsi Klasik & Uji Alternatif
 * 
 * Rujukan Baku:
 * 1. Shapiro & Wilk (1965) / Royston (1992, 1995) Algorithm AS R94
 * 2. Lilliefors (1967) / Dallal & Wilkinson (1986) / Molin & Abdi (1998)
 * 3. Skewness-Kurtosis Z-Score (Prof. Dr. Imam Ghozali 2018, Hair et al. 2010)
 * 4. Casewise Diagnostics OLS (|Z_res| > 3.0 / 2.5)
 * 5. White Heteroscedasticity Test (Halbert White 1980 / Koenker 1981 / Wooldridge)
 * 6. Transformasi Ekonometrika Baku (Log10, Ln, Sqrt, Inverse)
 * 7. Matriks Korelasi Non-Parametrik Rank Spearman (Alternatif Pearson)
 */

import {
  standardNormalCdf,
  studentTPValueTwoTailed,
  chiSquarePValue,
} from './math-stats';
import type { DatasetRow } from './api/types';

// =============================================================================
// INTERFACES & TIPE DATA
// =============================================================================

export interface ShapiroWilkResult {
  test: 'Shapiro-Wilk';
  statistic: number; // W
  pValue: number;
  normal: boolean;
  df: number; // N
  zScore: number;
  significanceLevel: number;
  conclusion: string;
}

export interface LillieforsResult {
  test: 'Kolmogorov-Smirnov (Lilliefors)';
  statistic: number; // D
  pValue: number;
  normal: boolean;
  df: number;
  mean: number;
  stdDev: number;
  conclusion: string;
  note: string;
}

export interface SkewnessKurtosisResult {
  test: 'Skewness-Kurtosis (Z-Score)';
  n: number;
  skewness: number;
  seSkewness: number;
  zSkewness: number;
  pSkewness: number;
  kurtosis: number; // excess kurtosis
  seKurtosis: number;
  zKurtosis: number;
  pKurtosis: number;
  normalAt95: boolean; // |Z| <= 1.96
  normalAt99: boolean; // |Z| <= 2.58
  conclusion: string;
}

export interface CasewiseDiagnosticItem {
  caseNumber: number; // 1-based index
  caseId: string; // e.g. R014
  observedY: number;
  predictedY: number;
  residual: number;
  stdResidual: number; // Z-residual
  isOutlier: boolean;
}

export interface CasewiseDiagnosticsSummary {
  totalCases: number;
  thresholdZ: number;
  outlierCount: number;
  outlierCases: CasewiseDiagnosticItem[];
  allDiagnostics: CasewiseDiagnosticItem[];
  stdErrorResidual: number;
  recommendation: string;
}

export interface WhiteHeteroscedasticityResult {
  test: 'White Test';
  lmStatistic: number; // n * R^2
  df: number; // 2
  rSquareAux: number;
  pValue: number;
  significant: boolean; // p < 0.05
  homoscedastic: boolean; // p >= 0.05
  status: string;
  conclusion: string;
}

export interface TransformationRecommendation {
  variable: string;
  skewness: number;
  kurtosis: number;
  pattern: 'normal' | 'positive_moderate' | 'positive_severe' | 'negative';
  recommendedMethod: 'none' | 'sqrt' | 'log10' | 'ln' | 'inverse';
  recommendedLabel: string;
  explanation: string;
}

export interface TransformedVariableResult {
  transformed: number[];
  shiftConstant: number;
  formula: string;
  originalSkewness: number;
  newSkewness: number;
  improved: boolean;
}

export interface SpearmanCorrelationItem {
  var1: string;
  var2: string;
  rho: number;
  tHitung: number;
  pValue: number;
  significant: boolean;
  strength: string;
}

// =============================================================================
// FUNGSI MATEMATIKA DASAR
// =============================================================================

/**
 * Mengurutkan dan menetapkan peringkat (ranks) dengan penanganan nilai seri (tied ranks) rata-rata
 */
export function rankData(values: number[]): number[] {
  const n = values.length;
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && Math.abs(indexed[j + 1].val - indexed[j].val) < 1e-12) {
      j++;
    }
    const avgRank = (i + 1 + j + 1) / 2.0;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Inverse Cumulative Normal Distribution Function (Acklam's Algorithm)
 * Presisi tinggi dengan eror relatif < 1.15e-9
 */
export function standardNormalInv(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];

  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];

  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];

  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

// =============================================================================
// 1. UJI NORMALITAS ALTERNATIF
// =============================================================================

/**
 * Uji Normalitas Shapiro-Wilk (W)
 * Menggunakan pendekatan algoritma Royston (1992, 1995) Algorithm AS R94
 * Sangat akurat untuk sampel kecil hingga menengah (3 <= N <= 2000)
 */
export function computeShapiroWilk(data: number[], alpha: number = 0.05): ShapiroWilkResult {
  const n = data.length;
  if (n < 3) {
    return {
      test: 'Shapiro-Wilk',
      statistic: 1,
      pValue: 1,
      normal: true,
      df: n,
      zScore: 0,
      significanceLevel: alpha,
      conclusion: 'Sampel terlalu kecil (N < 3) untuk uji Shapiro-Wilk.',
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const mean = sorted.reduce((acc, val) => acc + val, 0) / n;

  let ss = 0;
  for (let i = 0; i < n; i++) {
    const diff = sorted[i] - mean;
    ss += diff * diff;
  }

  if (ss <= 1e-12) {
    return {
      test: 'Shapiro-Wilk',
      statistic: 1,
      pValue: 1,
      normal: true,
      df: n,
      zScore: 0,
      significanceLevel: alpha,
      conclusion: 'Semua nilai data konstan/identik.',
    };
  }

  const m = new Float64Array(n);
  let sumM2 = 0;
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
    m[i] = standardNormalInv(p);
    sumM2 += m[i] * m[i];
  }

  const u = 1 / Math.sqrt(n);
  const a = new Float64Array(n);

  if (n === 3) {
    a[2] = 1 / Math.SQRT2;
    a[0] = -1 / Math.SQRT2;
    a[1] = 0;
  } else {
    const cN = m[n - 1] / Math.sqrt(sumM2);
    const cN1 = m[n - 2] / Math.sqrt(sumM2);

    const aN =
      cN +
      0.221157 * u -
      0.147981 * Math.pow(u, 2) -
      2.07119 * Math.pow(u, 3) +
      4.434685 * Math.pow(u, 4) -
      2.706056 * Math.pow(u, 5);

    const aN1 =
      cN1 -
      0.042981 * u -
      0.480186 * Math.pow(u, 2) -
      4.582148 * Math.pow(u, 3) +
      5.682633 * Math.pow(u, 4) -
      3.306894 * Math.pow(u, 5);

    a[n - 1] = aN;
    a[n - 2] = aN1;
    a[0] = -aN;
    a[1] = -aN1;

    const sumAExt = 2 * (aN * aN + aN1 * aN1);
    const sumMExt = 2 * (m[n - 1] * m[n - 1] + m[n - 2] * m[n - 2]);
    const phi = Math.max(1e-12, (sumM2 - sumMExt) / Math.max(1e-12, 1 - sumAExt));
    const sqrtPhi = Math.sqrt(phi);

    for (let i = 2; i < n - 2; i++) {
      a[i] = m[i] / sqrtPhi;
    }
  }

  let sumA2 = 0;
  for (let i = 0; i < n; i++) sumA2 += a[i] * a[i];
  const normA = Math.sqrt(sumA2);
  if (normA > 0) {
    for (let i = 0; i < n; i++) a[i] /= normA;
  }

  let b = 0;
  for (let i = 0; i < n; i++) {
    b += a[i] * sorted[i];
  }

  let w = (b * b) / ss;
  w = Math.max(0.0001, Math.min(1.0, w));

  let zScore = 0;
  let pValue = 1.0;

  if (n >= 12) {
    const y = Math.log(1 - w);
    const lnN = Math.log(n);
    const mu = -1.5861 - 0.31082 * lnN - 0.083751 * Math.pow(lnN, 2) + 0.0038915 * Math.pow(lnN, 3);
    const lnSigma = -0.4803 - 0.082676 * lnN + 0.0030302 * Math.pow(lnN, 2);
    const sigma = Math.exp(lnSigma);

    zScore = (y - mu) / sigma;
    pValue = standardNormalCdf(-zScore);
  } else {
    const gamma = -2.273 + 0.459 * n;
    const inner = gamma - Math.log(1 - w);
    const y = inner > 0 ? -Math.log(inner) : 0;
    const mu = 0.544 - 0.39978 * n + 0.025054 * Math.pow(n, 2) - 0.0006714 * Math.pow(n, 3);
    const lnSigma = 1.3822 - 0.77857 * n + 0.062767 * Math.pow(n, 2) - 0.0020322 * Math.pow(n, 3);
    const sigma = Math.exp(lnSigma);

    zScore = (y - mu) / sigma;
    pValue = standardNormalCdf(-zScore);
  }

  pValue = Math.max(0.0001, Math.min(1.0, pValue));
  const isNormal = pValue >= alpha;

  const conclusion = isNormal
    ? `Nilai W = ${w.toFixed(4)} dengan Sig. = ${pValue.toFixed(4)} (≥ ${alpha}). Residual berdistribusi normal berdasarkan Uji Shapiro-Wilk.`
    : `Nilai W = ${w.toFixed(4)} dengan Sig. = ${pValue.toFixed(4)} (< ${alpha}). Residual tidak berdistribusi normal berdasarkan Uji Shapiro-Wilk.`;

  return {
    test: 'Shapiro-Wilk',
    statistic: Number(w.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    normal: isNormal,
    df: n,
    zScore: Number(zScore.toFixed(3)),
    significanceLevel: alpha,
    conclusion,
  };
}

/**
 * Uji Kolmogorov-Smirnov dengan Koreksi Signifikansi Lilliefors (SPSS Style)
 * Formula Molin & Abdi (1998) / Dallal & Wilkinson (1986)
 */
export function computeKolmogorovSmirnovLilliefors(
  residuals: number[],
  alpha: number = 0.05
): LillieforsResult {
  const n = residuals.length;
  if (n < 4) {
    return {
      test: 'Kolmogorov-Smirnov (Lilliefors)',
      statistic: 0,
      pValue: 1,
      normal: true,
      df: n,
      mean: 0,
      stdDev: 0,
      conclusion: 'Sampel terlalu kecil untuk uji Lilliefors.',
      note: 'Membutuhkan minimal 4 responden.',
    };
  }

  let sum = 0;
  for (const r of residuals) sum += r;
  const mean = sum / n;

  let ss = 0;
  for (const r of residuals) ss += Math.pow(r - mean, 2);
  const stdDev = Math.sqrt(ss / (n - 1));

  if (stdDev <= 1e-12) {
    return {
      test: 'Kolmogorov-Smirnov (Lilliefors)',
      statistic: 0,
      pValue: 1,
      normal: true,
      df: n,
      mean: Number(mean.toFixed(4)),
      stdDev: 0,
      conclusion: 'Residual identik/tanpa variansi.',
      note: 'Varian residual mendekati nol.',
    };
  }

  const sorted = [...residuals].sort((a, b) => a - b);
  let maxD = 0;

  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / stdDev;
    const theoretical = standardNormalCdf(z);
    const empirical1 = (i + 1) / n;
    const empirical2 = i / n;

    const diff1 = Math.abs(empirical1 - theoretical);
    const diff2 = Math.abs(empirical2 - theoretical);
    const d = Math.max(diff1, diff2);
    if (d > maxD) maxD = d;
  }

  const dVal = maxD * Math.sqrt(n);
  const poly =
    -0.37782822932809 +
    1.67819837908004 * dVal -
    3.02959249450445 * Math.pow(dVal, 2) +
    2.80015710497799 * Math.pow(dVal, 3) -
    1.22687809044382 * Math.pow(dVal, 4) +
    0.24434685437637 * Math.pow(dVal, 5) -
    0.01704296234055 * Math.pow(dVal, 6);

  let pValue = Math.exp(-poly);

  if (pValue > 0.2) pValue = 0.2;
  if (pValue < 0.001) pValue = 0.001;

  const isNormal = pValue >= alpha;
  const conclusion = isNormal
    ? `Statistik Lilliefors D = ${maxD.toFixed(4)} dengan Sig. = ${pValue.toFixed(3)} (≥ ${alpha}). Asumsi normalitas residual terpenuhi (SPSS Lilliefors Correction).`
    : `Statistik Lilliefors D = ${maxD.toFixed(4)} dengan Sig. = ${pValue.toFixed(3)} (< ${alpha}). Residual belum berdistribusi normal menurut koreksi Lilliefors.`;

  return {
    test: 'Kolmogorov-Smirnov (Lilliefors)',
    statistic: Number(maxD.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    normal: isNormal,
    df: n,
    mean: Number(mean.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    conclusion,
    note: 'Koreksi signifikansi Lilliefors (SPSS Standard)',
  };
}

/**
 * Uji Normalitas Rasio Skewness dan Kurtosis (Z-Score)
 * Rujukan: Prof. Dr. Imam Ghozali (2018) / Hair et al. (2010)
 */
export function computeSkewnessKurtosisZTest(
  data: number[],
  _alpha: number = 0.05
): SkewnessKurtosisResult {
  const n = data.length;
  if (n < 4) {
    return {
      test: 'Skewness-Kurtosis (Z-Score)',
      n,
      skewness: 0,
      seSkewness: 0,
      zSkewness: 0,
      pSkewness: 1,
      kurtosis: 0,
      seKurtosis: 0,
      zKurtosis: 0,
      pKurtosis: 1,
      normalAt95: true,
      normalAt99: true,
      conclusion: 'Ukuran sampel tidak mencukupi untuk uji rasio Z.',
    };
  }

  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / n;

  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of data) {
    const diff = v - mean;
    const d2 = diff * diff;
    m2 += d2;
    m3 += d2 * diff;
    m4 += d2 * d2;
  }

  const s = Math.sqrt(m2 / (n - 1));
  if (s <= 1e-12) {
    return {
      test: 'Skewness-Kurtosis (Z-Score)',
      n,
      skewness: 0,
      seSkewness: 0,
      zSkewness: 0,
      pSkewness: 1,
      kurtosis: 0,
      seKurtosis: 0,
      zKurtosis: 0,
      pKurtosis: 1,
      normalAt95: true,
      normalAt99: true,
      conclusion: 'Data seragam tanpa penyebaran.',
    };
  }

  const g1 = (n * m3) / ((n - 1) * (n - 2) * Math.pow(s, 3));
  const term1 = (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(s, 4));
  const term2 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  const g2 = term1 - term2;

  const seSkew = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
  const seKurt = 2 * seSkew * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5)));

  const zSkew = seSkew > 0 ? g1 / seSkew : 0;
  const zKurt = seKurt > 0 ? g2 / seKurt : 0;

  const pSkew = 2 * (1 - standardNormalCdf(Math.abs(zSkew)));
  const pKurt = 2 * (1 - standardNormalCdf(Math.abs(zKurt)));

  const normalAt95 = Math.abs(zSkew) <= 1.96 && Math.abs(zKurt) <= 1.96;
  const normalAt99 = Math.abs(zSkew) <= 2.58 && Math.abs(zKurt) <= 2.58;

  let conclusion: string;
  if (normalAt95) {
    conclusion = `Nilai Z-Skewness = ${zSkew.toFixed(3)} (|Z| ≤ 1,96) dan Z-Kurtosis = ${zKurt.toFixed(3)} (|Z| ≤ 1,96). Berdasarkan kriteria Prof. Imam Ghozali & Hair et al., distribusi residual dinyatakan normal pada α = 0,05.`;
  } else if (normalAt99) {
    conclusion = `Nilai Z-Skewness = ${zSkew.toFixed(3)} dan Z-Kurtosis = ${zKurt.toFixed(3)} memenuhi kriteria normalitas pada tingkat kepercayaan 99% (|Z| ≤ 2,58).`;
  } else {
    conclusion = `Nilai Z-Skewness = ${zSkew.toFixed(3)} atau Z-Kurtosis = ${zKurt.toFixed(3)} melebihi ambang batas |Z| > 1,96, mengindikasikan kemiringan atau keruncingan kurva residual.`;
  }

  return {
    test: 'Skewness-Kurtosis (Z-Score)',
    n,
    skewness: Number(g1.toFixed(4)),
    seSkewness: Number(seSkew.toFixed(4)),
    zSkewness: Number(zSkew.toFixed(3)),
    pSkewness: Number(pSkew.toFixed(4)),
    kurtosis: Number(g2.toFixed(4)),
    seKurtosis: Number(seKurt.toFixed(4)),
    zKurtosis: Number(zKurt.toFixed(3)),
    pKurtosis: Number(pKurt.toFixed(4)),
    normalAt95,
    normalAt99,
    conclusion,
  };
}

// =============================================================================
// 2. DIAGNOSTIK OUTLIER CASEWISE (CASEWISE DIAGNOSTICS)
// =============================================================================

export function computeCasewiseDiagnostics(
  residuals: number[],
  yObserved: number[],
  yPredicted: number[],
  rows?: DatasetRow[],
  thresholdZ: number = 3.0
): CasewiseDiagnosticsSummary {
  const n = residuals.length;
  if (n < 5) {
    return {
      totalCases: n,
      thresholdZ,
      outlierCount: 0,
      outlierCases: [],
      allDiagnostics: [],
      stdErrorResidual: 0,
      recommendation: 'Sampel terlalu sedikit untuk Casewise Diagnostics.',
    };
  }

  let ssRes = 0;
  for (const r of residuals) ssRes += r * r;
  const seRes = Math.sqrt(ssRes / Math.max(1, n - 2));

  const allDiagnostics: CasewiseDiagnosticItem[] = [];
  const outlierCases: CasewiseDiagnosticItem[] = [];

  for (let i = 0; i < n; i++) {
    const res = residuals[i];
    const stdRes = seRes > 0 ? res / seRes : 0;
    const isOutlier = Math.abs(stdRes) > thresholdZ;

    const rowObj = rows && rows[i] ? rows[i] : null;
    const caseId = rowObj?.id
      ? String(rowObj.id)
      : rowObj?.No
      ? `R${String(rowObj.No).padStart(3, '0')}`
      : `R${String(i + 1).padStart(3, '0')}`;

    const item: CasewiseDiagnosticItem = {
      caseNumber: i + 1,
      caseId,
      observedY: Number(yObserved[i].toFixed(3)),
      predictedY: Number(yPredicted[i].toFixed(3)),
      residual: Number(res.toFixed(4)),
      stdResidual: Number(stdRes.toFixed(3)),
      isOutlier,
    };

    allDiagnostics.push(item);
    if (isOutlier) {
      outlierCases.push(item);
    }
  }

  const rec =
    outlierCases.length > 0
      ? `Terdapat ${outlierCases.length} responden terindikasi outlier ekstrem (|Z residual| > ${thresholdZ}): ${outlierCases.map((o) => o.caseId).join(', ')}. Mengecualikan responden ini pada versi analisis baru berpotensi memulihkan normalitas residual secara signifikan tanpa memanipulasi data mentah.`
      : `Tidak ditemukan outlier residual ekstrem pada ambang batas |Z| > ${thresholdZ}. Sebaran residual relatif stabil dan memenuhi asumsi model.`;

  return {
    totalCases: n,
    thresholdZ,
    outlierCount: outlierCases.length,
    outlierCases,
    allDiagnostics,
    stdErrorResidual: Number(seRes.toFixed(4)),
    recommendation: rec,
  };
}

// =============================================================================
// 3. UJI HETEROSKEDASTISITAS ALTERNATIF: WHITE TEST
// =============================================================================

export function computeWhiteHeteroscedasticity(
  yPredicted: number[],
  residuals: number[]
): WhiteHeteroscedasticityResult {
  const n = residuals.length;
  if (n <= 3) {
    return {
      test: 'White Test',
      lmStatistic: 0,
      df: 2,
      rSquareAux: 0,
      pValue: 1.0,
      significant: false,
      homoscedastic: true,
      status: 'Bebas Heteroskedastisitas',
      conclusion: 'Ukuran sampel tidak mencukupi untuk Uji White.',
    };
  }

  const eSq = residuals.map((r) => r * r);
  const meanESq = eSq.reduce((a, b) => a + b, 0) / n;

  let ssTot = 0;
  for (const val of eSq) ssTot += Math.pow(val - meanESq, 2);

  if (ssTot <= 1e-12) {
    return {
      test: 'White Test',
      lmStatistic: 0,
      df: 2,
      rSquareAux: 0,
      pValue: 1.0,
      significant: false,
      homoscedastic: true,
      status: 'Bebas Heteroskedastisitas',
      conclusion: 'Varians residual konstan sempurna (homoskedastis).',
    };
  }

  const yPredSq = yPredicted.map((y) => y * y);
  const meanY = yPredicted.reduce((a, b) => a + b, 0) / n;
  const meanY2 = yPredSq.reduce((a, b) => a + b, 0) / n;

  let sY_Y = 0;
  let sY2_Y2 = 0;
  let sY_Y2 = 0;
  let sY_e = 0;
  let sY2_e = 0;

  for (let i = 0; i < n; i++) {
    const dy = yPredicted[i] - meanY;
    const dy2 = yPredSq[i] - meanY2;
    const de = eSq[i] - meanESq;

    sY_Y += dy * dy;
    sY2_Y2 += dy2 * dy2;
    sY_Y2 += dy * dy2;
    sY_e += dy * de;
    sY2_e += dy2 * de;
  }

  const det = sY_Y * sY2_Y2 - sY_Y2 * sY_Y2;
  let r2Aux = 0;

  if (Math.abs(det) > 1e-12) {
    const beta1 = (sY_e * sY2_Y2 - sY2_e * sY_Y2) / det;
    const beta2 = (sY2_e * sY_Y - sY_e * sY_Y2) / det;
    const alpha0 = meanESq - beta1 * meanY - beta2 * meanY2;

    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const predESq = alpha0 + beta1 * yPredicted[i] + beta2 * yPredSq[i];
      const err = eSq[i] - predESq;
      ssRes += err * err;
    }

    r2Aux = Math.max(0, Math.min(1.0, 1.0 - ssRes / ssTot));
  } else {
    const beta1 = sY_Y > 0 ? sY_e / sY_Y : 0;
    const alpha0 = meanESq - beta1 * meanY;
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const pred = alpha0 + beta1 * yPredicted[i];
      ssRes += Math.pow(eSq[i] - pred, 2);
    }
    r2Aux = Math.max(0, Math.min(1.0, 1.0 - ssRes / ssTot));
  }

  const lm = n * r2Aux;
  const df = 2;
  const pValue = chiSquarePValue(lm, df);
  const isSignificant = pValue < 0.05;
  const homoscedastic = !isSignificant;

  const status = homoscedastic ? 'Bebas Heteroskedastisitas' : 'Terindikasi Heteroskedastisitas';
  const conclusion = homoscedastic
    ? `Statistik Uji White LM = ${lm.toFixed(3)} (p-value = ${pValue.toFixed(3)} > 0,05). Model regresi bebas dari masalah heteroskedastisitas berdasarkan White Test (Halbert White, 1980).`
    : `Statistik Uji White LM = ${lm.toFixed(3)} (p-value = ${pValue.toFixed(3)} ≤ 0,05). Terindikasi gejala heteroskedastisitas pada residual model regresi.`;

  return {
    test: 'White Test',
    lmStatistic: Number(lm.toFixed(4)),
    df,
    rSquareAux: Number(r2Aux.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    significant: isSignificant,
    homoscedastic,
    status,
    conclusion,
  };
}

// =============================================================================
// 4. TRANSFORMASI DATA & REKOMENDASI OTOMATIS
// =============================================================================

export function calculateSkewness(values: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let m2 = 0;
  let m3 = 0;
  for (const v of values) {
    const diff = v - mean;
    m2 += diff * diff;
    m3 += diff * diff * diff;
  }
  const s = Math.sqrt(m2 / (n - 1));
  if (s <= 1e-12) return 0;
  return (n * m3) / ((n - 1) * (n - 2) * Math.pow(s, 3));
}

export function analyzeSkewnessAndRecommend(
  values: number[],
  varName: string
): TransformationRecommendation {
  const skew = calculateSkewness(values);
  const n = values.length;
  let m2 = 0;
  let m4 = 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  for (const v of values) {
    const diff = v - mean;
    m2 += diff * diff;
    m4 += diff * diff * diff * diff;
  }
  const s = Math.sqrt(m2 / Math.max(1, n - 1));
  const kurt = s > 0 ? (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(s, 4)) - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3)) : 0;

  if (Math.abs(skew) <= 0.5) {
    return {
      variable: varName,
      skewness: Number(skew.toFixed(3)),
      kurtosis: Number(kurt.toFixed(3)),
      pattern: 'normal',
      recommendedMethod: 'none',
      recommendedLabel: 'Tidak Perlu Transformasi',
      explanation: `Nilai kemiringan variabel ${varName} adalah ${skew.toFixed(2)} (|g1| ≤ 0,5), mengindikasikan distribusi sudah relatif simetris dan siap diuji OLS.`,
    };
  }

  if (skew > 0.5 && skew <= 1.0) {
    return {
      variable: varName,
      skewness: Number(skew.toFixed(3)),
      kurtosis: Number(kurt.toFixed(3)),
      pattern: 'positive_moderate',
      recommendedMethod: 'sqrt',
      recommendedLabel: 'Transformasi Sqrt (Akar Kuadrat)',
      explanation: `Variabel ${varName} memiliki kemiringan positif sedang (Skewness = ${skew.toFixed(2)}). Transformasi Sqrt(X) direkomendasikan untuk menarik ekor kanan data mendekati kurva normal.`,
    };
  }

  if (skew > 1.0 && skew <= 3.0) {
    return {
      variable: varName,
      skewness: Number(skew.toFixed(3)),
      kurtosis: Number(kurt.toFixed(3)),
      pattern: 'positive_severe',
      recommendedMethod: 'log10',
      recommendedLabel: 'Transformasi Log10 / Ln',
      explanation: `Variabel ${varName} memiliki kemiringan positif substansial (Skewness = ${skew.toFixed(2)}). Transformasi Log10(X) atau Ln(X) merupakan prosedur baku ekonometrika untuk menormalkan data.`,
    };
  }

  if (skew > 3.0) {
    return {
      variable: varName,
      skewness: Number(skew.toFixed(3)),
      kurtosis: Number(kurt.toFixed(3)),
      pattern: 'positive_severe',
      recommendedMethod: 'inverse',
      recommendedLabel: 'Transformasi Inverse (1/X)',
      explanation: `Variabel ${varName} memiliki kemiringan ekstrim berbentuk L (Skewness = ${skew.toFixed(2)}). Transformasi Inverse 1/X direkomendasikan untuk menekan variansi ekstrim.`,
    };
  }

  return {
    variable: varName,
    skewness: Number(skew.toFixed(3)),
    kurtosis: Number(kurt.toFixed(3)),
    pattern: 'negative',
    recommendedMethod: 'sqrt',
    recommendedLabel: 'Reflect & Sqrt Transformasi',
    explanation: `Variabel ${varName} memiliki kemiringan negatif (Skewness = ${skew.toFixed(2)}). Transformasi refleksi Sqrt(K - X) direkomendasikan untuk menormalkan sebaran.`,
  };
}

export function transformVariable(
  values: number[],
  method: 'log10' | 'ln' | 'sqrt' | 'inverse'
): TransformedVariableResult {
  const originalSkew = calculateSkewness(values);
  let minVal = Infinity;
  for (const v of values) {
    if (v < minVal) minVal = v;
  }

  let shiftConstant = 0;
  if (method === 'log10' || method === 'ln' || method === 'inverse') {
    if (minVal <= 0) {
      shiftConstant = Math.abs(minVal) + 1;
    }
  } else if (method === 'sqrt') {
    if (minVal < 0) {
      shiftConstant = Math.abs(minVal);
    }
  }

  let formula = '';
  const transformed: number[] = new Array(values.length);

  switch (method) {
    case 'log10':
      formula = shiftConstant > 0 ? `Log10(X + ${shiftConstant})` : 'Log10(X)';
      for (let i = 0; i < values.length; i++) {
        transformed[i] = Math.log10(Math.max(1e-6, values[i] + shiftConstant));
      }
      break;

    case 'ln':
      formula = shiftConstant > 0 ? `Ln(X + ${shiftConstant})` : 'Ln(X)';
      for (let i = 0; i < values.length; i++) {
        transformed[i] = Math.log(Math.max(1e-6, values[i] + shiftConstant));
      }
      break;

    case 'sqrt':
      formula = shiftConstant > 0 ? `Sqrt(X + ${shiftConstant})` : 'Sqrt(X)';
      for (let i = 0; i < values.length; i++) {
        transformed[i] = Math.sqrt(Math.max(0, values[i] + shiftConstant));
      }
      break;

    case 'inverse':
      formula = shiftConstant > 0 ? `1 / (X + ${shiftConstant})` : '1 / X';
      for (let i = 0; i < values.length; i++) {
        const denom = values[i] + shiftConstant;
        transformed[i] = 1 / (Math.abs(denom) > 1e-6 ? denom : 1e-6);
      }
      break;
  }

  const newSkew = calculateSkewness(transformed);
  const improved = Math.abs(newSkew) < Math.abs(originalSkew);

  return {
    transformed,
    shiftConstant,
    formula,
    originalSkewness: Number(originalSkew.toFixed(3)),
    newSkewness: Number(newSkew.toFixed(3)),
    improved,
  };
}

// =============================================================================
// 5. MATRIKS KORELASI RANK SPEARMAN (FALLBACK NON-PARAMETRIK)
// =============================================================================

export function computeConstructSpearmanMatrix(
  constructScores: Record<string, number[]>
): SpearmanCorrelationItem[] {
  const varNames = Object.keys(constructScores);
  const results: SpearmanCorrelationItem[] = [];

  for (let i = 0; i < varNames.length; i++) {
    for (let j = i + 1; j < varNames.length; j++) {
      const v1 = varNames[i];
      const v2 = varNames[j];
      const arr1 = constructScores[v1];
      const arr2 = constructScores[v2];

      const n = Math.min(arr1.length, arr2.length);
      if (n < 3) continue;

      const rank1 = rankData(arr1);
      const rank2 = rankData(arr2);

      let sumD2 = 0;
      for (let k = 0; k < n; k++) {
        const d = rank1[k] - rank2[k];
        sumD2 += d * d;
      }

      const rho = 1 - (6 * sumD2) / (n * (n * n - 1));
      let t = 0;
      let p = 1.0;

      if (Math.abs(rho) >= 0.9999) {
        t = Math.sign(rho) * 999.99;
        p = 0.0001;
      } else if (n > 2) {
        t = (rho * Math.sqrt(n - 2)) / Math.sqrt(Math.max(1e-12, 1 - rho * rho));
        p = studentTPValueTwoTailed(t, n - 2);
      }

      const sig = p < 0.05;
      let strength = 'Sangat Lemah';
      const absRho = Math.abs(rho);
      if (absRho >= 0.8) strength = 'Sangat Kuat';
      else if (absRho >= 0.6) strength = 'Kuat';
      else if (absRho >= 0.4) strength = 'Sedang';
      else if (absRho >= 0.2) strength = 'Lemah';

      results.push({
        var1: v1,
        var2: v2,
        rho: Number(rho.toFixed(4)),
        tHitung: Number(t.toFixed(4)),
        pValue: Number(p.toFixed(4)),
        significant: sig,
        strength,
      });
    }
  }

  return results;
}
