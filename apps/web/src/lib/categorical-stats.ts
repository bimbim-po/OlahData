/**
 * OlahData v2.0 - Modul Komputasi Statistik Kategorik & Epidemiologi (Fase 3)
 * Mendukung:
 * 1. Tabulasi Silang (Crosstabulation B x K) dengan Frekuensi Harapan (Expected Count) & Persentase Baris/Total
 * 2. Uji Chi-Square (Pearson, Yates' Continuity Correction, Likelihood Ratio, Fisher's Exact Test)
 * 3. Aturan Keputusan Cochran Otomatis (Penyorotan Fisher vs Pearson/Yates)
 * 4. Estimasi Risiko Epidemiologi: Odds Ratio (OR), Relative Risk (RR), & 95% Confidence Interval
 * 5. Ukuran Asosiasi Simetris (Phi, Cramer's V, Contingency Coefficient C)
 */

import {
  logGamma,
  chiSquarePValue,
  getChiSquareCritical,
  standardNormalCdf,
} from './math-stats';
import type { DatasetRow } from './api/types';

// =============================================================================
// INTERFACES & TYPES
// =============================================================================

export interface CrosstabCell {
  rowCat: string;
  colCat: string;
  count: number;
  expectedCount: number;
  rowPercent: number;
  colPercent: number;
  totalPercent: number;
}

export interface CrosstabTotal {
  category: string;
  count: number;
  expectedCount?: number;
  percent: number;
}

export interface CrosstabMatrix {
  rowVar: string;
  colVar: string;
  rowCategories: string[];
  colCategories: string[];
  cells: CrosstabCell[][]; // [rowIdx][colIdx]
  matrix: number[][];
  expectedMatrix: number[][];
  rowPercentages: number[][];
  totalPercentages: number[][];
  rowTotals: number[];
  colTotals: number[];
  totalN: number;
  grandTotal: number;
}

export interface ChiSquareTestRow {
  name: string;
  value: number;
  df: number | string;
  asympSig: number | string;
  exactSig2Sided?: number | string;
  exactSig1Sided?: number | string;
  isRecommended: boolean;
}

export interface ChiSquareResult {
  rowVar: string;
  colVar: string;
  is2x2: boolean;
  pearsonChiSquare: number;
  df: number;
  pearsonSig: number;
  continuityCorrection?: number;
  continuityCorrectionSig?: number;
  likelihoodRatio?: number;
  likelihoodRatioSig?: number;
  fisherExact?: number;
  fisherExact1Sided?: number;
  cochranFootnote: string;
  minExpectedCount: number;
  cellsLessThan5Count: number;
  cellsLessThan5Percent: number;
  totalN: number;
  rows: ChiSquareTestRow[];
  recommendedTest: string;
  cochran: {
    cellsLessThan5Count: number;
    cellsLessThan5Percent: number;
    minExpectedCount: number;
    isViolated: boolean;
    footnote: string;
    explanation: string;
  };
  conclusion: string;
}

export interface RiskEstimateRow {
  statistic: string;
  value: number;
  ciLower: number;
  ciUpper: number;
}

export interface RiskEstimateResult {
  exposureVar: string;
  outcomeVar: string;
  rowVar: string;
  colVar: string;
  rows: RiskEstimateRow[];
  oddsRatio: number;
  ciLower: number;
  ciUpper: number;
  forCohortRisk1: number;
  forCohortRisk1CiLower: number;
  forCohortRisk1CiUpper: number;
  forCohortRisk2: number;
  forCohortRisk2CiLower: number;
  forCohortRisk2CiUpper: number;
  isSignificantRisk: boolean;
  isProtective: boolean;
  totalN: number;
  nValid: number;
  conclusion: string;
  interpretation: string;
}

export interface SymmetricMeasuresResult {
  phi?: number;
  cramersV: number;
  contingencyCoeff: number;
  contingencyCoefficient: number;
  pValue: number;
  approxSig: number;
  phiStrength?: string;
  cramersVStrength: string;
  contingencyCoeffStrength: string;
  totalN: number;
  interpretation: string;
}

export interface CategoricalAnalysisOutput {
  crosstab: CrosstabMatrix;
  chiSquare: ChiSquareResult;
  riskEstimate?: RiskEstimateResult;
  symmetricMeasures: SymmetricMeasuresResult;
}

// =============================================================================
// FISHER'S EXACT TEST (2x2 HYPERGEOMETRIC EXACT CALCULATION)
// =============================================================================

function logFactorial(n: number): number {
  if (n <= 1) return 0;
  return logGamma(n + 1);
}

/**
 * Hypergeometric probability P(a | R1, R2, C1, C2, N)
 */
function hypergeometricProb(a: number, b: number, c: number, d: number): number {
  const R1 = a + b;
  const R2 = c + d;
  const C1 = a + c;
  const C2 = b + d;
  const N = R1 + R2;

  const logP =
    logFactorial(R1) +
    logFactorial(R2) +
    logFactorial(C1) +
    logFactorial(C2) -
    (logFactorial(N) +
      logFactorial(a) +
      logFactorial(b) +
      logFactorial(c) +
      logFactorial(d));

  return Math.exp(logP);
}

/**
 * Exact Two-Sided and One-Sided Fisher's Exact Test for 2x2 table:
 *   [a, b]
 *   [c, d]
 */
export function computeFisherExact2x2(
  a: number,
  b: number,
  c: number,
  d: number
): { pTwoSided: number; pOneSided: number } {
  const R1 = a + b;
  const C1 = a + c;
  const C2 = b + d;
  const minA = Math.max(0, R1 - C2);
  const maxA = Math.min(R1, C1);

  const observedProb = hypergeometricProb(a, b, c, d);
  let pTwoSided = 0;
  let pOneSided = 0;

  for (let x = minA; x <= maxA; x++) {
    const curA = x;
    const curB = R1 - x;
    const curC = C1 - x;
    const curD = C2 - curB;

    const p = hypergeometricProb(curA, curB, curC, curD);

    // Two-sided: sum probabilities <= observed (with floating point tolerance)
    if (p <= observedProb * (1 + 1e-10)) {
      pTwoSided += p;
    }

    // One-sided: direction of observation
    if (a >= (R1 * C1) / (R1 + c + d)) {
      if (x >= a) pOneSided += p;
    } else {
      if (x <= a) pOneSided += p;
    }
  }

  return {
    pTwoSided: Math.max(0, Math.min(1, pTwoSided)),
    pOneSided: Math.max(0, Math.min(1, pOneSided)),
  };
}

// =============================================================================
// MAIN COMPUTATION ENGINE: CROSSTAB, CHI-SQUARE, ODDS RATIO
// =============================================================================

export function computeCrosstabAndChiSquare(
  rows: DatasetRow[],
  rowVar: string,
  colVar: string,
  alpha: number = 0.05
): CategoricalAnalysisOutput {
  // Extract and filter valid non-empty rows
  const validData: { rVal: string; cVal: string }[] = [];
  for (const row of rows) {
    const rRaw = String(row[rowVar] ?? '').trim();
    const cRaw = String(row[colVar] ?? '').trim();
    if (rRaw !== '' && cRaw !== '' && rRaw !== 'null' && cRaw !== 'undefined') {
      validData.push({ rVal: rRaw, cVal: cRaw });
    }
  }

  const N = validData.length;
  if (N < 2) {
    throw new Error('Jumlah sampel untuk analisis kategori minimal 2 responden valid.');
  }

  // Get distinct categories in order of appearance
  const rowCatsSet = new Set<string>();
  const colCatsSet = new Set<string>();
  for (const item of validData) {
    rowCatsSet.add(item.rVal);
    colCatsSet.add(item.cVal);
  }

  const rowCategories = Array.from(rowCatsSet);
  const colCategories = Array.from(colCatsSet);

  const numRows = rowCategories.length;
  const numCols = colCategories.length;

  if (numRows < 2 || numCols < 2) {
    throw new Error('Masing-masing variabel harus memiliki minimal 2 kategori unik.');
  }

  // 1. Observed Frequencies (O_ij)
  const obs: number[][] = Array.from({ length: numRows }, () => Array(numCols).fill(0));
  for (const item of validData) {
    const rIdx = rowCategories.indexOf(item.rVal);
    const cIdx = colCategories.indexOf(item.cVal);
    obs[rIdx][cIdx]++;
  }

  // Row and Column Totals
  const rowTotalsCount: number[] = obs.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotalsCount: number[] = Array.from({ length: numCols }, (_, cIdx) =>
    obs.reduce((sum, r) => sum + r[cIdx], 0)
  );

  // 2. Expected Frequencies (E_ij = Ri * Cj / N)
  const exp: number[][] = Array.from({ length: numRows }, (_, rIdx) =>
    Array.from({ length: numCols }, (_, cIdx) => (rowTotalsCount[rIdx] * colTotalsCount[cIdx]) / N)
  );

  // Check Cochran's rule (< 5 expected count)
  let cellsLessThan5Count = 0;
  let minExpectedCount = Infinity;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const e = exp[r][c];
      if (e < 5) cellsLessThan5Count++;
      if (e < minExpectedCount) minExpectedCount = e;
    }
  }

  const totalCells = numRows * numCols;
  const cellsLessThan5Percent = (cellsLessThan5Count / totalCells) * 100;
  const is2x2 = numRows === 2 && numCols === 2;

  // Build Crosstab Matrix Data
  const crosstabCells: CrosstabCell[][] = [];
  for (let r = 0; r < numRows; r++) {
    const rowList: CrosstabCell[] = [];
    for (let c = 0; c < numCols; c++) {
      const count = obs[r][c];
      const e = exp[r][c];
      const rowPct = rowTotalsCount[r] > 0 ? (count / rowTotalsCount[r]) * 100 : 0;
      const colPct = colTotalsCount[c] > 0 ? (count / colTotalsCount[c]) * 100 : 0;
      const totPct = N > 0 ? (count / N) * 100 : 0;

      rowList.push({
        rowCat: rowCategories[r],
        colCat: colCategories[c],
        count,
        expectedCount: e,
        rowPercent: rowPct,
        colPercent: colPct,
        totalPercent: totPct,
      });
    }
    crosstabCells.push(rowList);
  }

  const rowPercentages: number[][] = [];
  const totalPercentages: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    rowPercentages.push(obs[r].map((count) => (rowTotalsCount[r] > 0 ? (count / rowTotalsCount[r]) * 100 : 0)));
    totalPercentages.push(obs[r].map((count) => (N > 0 ? (count / N) * 100 : 0)));
  }

  const crosstab: CrosstabMatrix = {
    rowVar,
    colVar,
    rowCategories,
    colCategories,
    cells: crosstabCells,
    matrix: obs,
    expectedMatrix: exp,
    rowPercentages,
    totalPercentages,
    rowTotals: rowTotalsCount,
    colTotals: colTotalsCount,
    totalN: N,
    grandTotal: N,
  };

  // 3. Chi-Square Calculations
  // A. Pearson Chi-Square
  let pearsonChi2 = 0;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const o = obs[r][c];
      const e = exp[r][c];
      if (e > 0) {
        pearsonChi2 += Math.pow(o - e, 2) / e;
      }
    }
  }

  const df = (numRows - 1) * (numCols - 1);
  const pPearson = chiSquarePValue(pearsonChi2, df);

  // B. Likelihood Ratio G^2 = 2 * sum(O * ln(O / E))
  let likelihoodRatio = 0;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const o = obs[r][c];
      const e = exp[r][c];
      if (o > 0 && e > 0) {
        likelihoodRatio += 2 * o * Math.log(o / e);
      }
    }
  }
  const pLikelihood = chiSquarePValue(likelihoodRatio, df);

  // C. Linear-by-Linear Association (for ordinal or 2x2)
  const linearChi2 = pearsonChi2 * ((N - 1) / N);
  const pLinear = chiSquarePValue(linearChi2, 1);

  // Test rows array
  const testRows: ChiSquareTestRow[] = [];

  // Decision rule (Cochran):
  // For 2x2:
  // If min expected count < 5 -> recommend Fisher's Exact Test
  // If min expected count >= 5 -> recommend Continuity Correction or Pearson Chi-Square
  // For tables > 2x2:
  // If cells < 5 > 20% -> assumption violated
  let recommendFisher = is2x2 && cellsLessThan5Count > 0;
  let recommendContinuity = is2x2 && cellsLessThan5Count === 0;
  let recommendPearson = !is2x2;

  testRows.push({
    name: 'Pearson Chi-Square',
    value: pearsonChi2,
    df,
    asympSig: pPearson,
    isRecommended: recommendPearson,
  });

  // 2x2 Specific: Continuity Correction & Fisher's Exact
  let yatesChi2: number | undefined;
  let pYates: number | undefined;
  let fisherP2 = 1.0;
  let fisherP1 = 1.0;
  if (is2x2) {
    const a = obs[0][0];
    const b = obs[0][1];
    const c = obs[1][0];
    const d = obs[1][1];

    // Continuity Correction (Yates)
    const numerYates = Math.max(0, Math.abs(a * d - b * c) - N / 2);
    const denomYates = (a + b) * (c + d) * (a + c) * (b + d);
    yatesChi2 = denomYates > 0 ? (N * Math.pow(numerYates, 2)) / denomYates : 0;
    pYates = chiSquarePValue(yatesChi2, 1);

    testRows.push({
      name: 'Continuity Correction (Yates)',
      value: yatesChi2,
      df: 1,
      asympSig: pYates,
      isRecommended: recommendContinuity,
    });

    testRows.push({
      name: 'Likelihood Ratio',
      value: likelihoodRatio,
      df,
      asympSig: pLikelihood,
      isRecommended: false,
    });

    // Fisher's Exact Test
    const fisherRes = computeFisherExact2x2(a, b, c, d);
    fisherP2 = fisherRes.pTwoSided;
    fisherP1 = fisherRes.pOneSided;

    testRows.push({
      name: "Fisher's Exact Test",
      value: NaN,
      df: '-',
      asympSig: '-',
      exactSig2Sided: fisherP2,
      exactSig1Sided: fisherP1,
      isRecommended: recommendFisher,
    });
  } else {
    testRows.push({
      name: 'Likelihood Ratio',
      value: likelihoodRatio,
      df,
      asympSig: pLikelihood,
      isRecommended: false,
    });
  }

  testRows.push({
    name: 'Linear-by-Linear Association',
    value: linearChi2,
    df: 1,
    asympSig: pLinear,
    isRecommended: false,
  });

  // 4. Cochran's Footnote
  const footnoteA = `a. ${cellsLessThan5Count} cells (${cellsLessThan5Percent.toFixed(1)}%) have expected count less than 5. The minimum expected count is ${minExpectedCount.toFixed(2)}.`;
  const footnoteB = is2x2 ? 'b. Computed only for a 2x2 table.' : '';
  const cochranFootnote = `${footnoteA} ${footnoteB}`.trim();

  const isCochranViolated = is2x2 ? cellsLessThan5Count > 0 : cellsLessThan5Percent > 20;

  let cochranExplanation = '';
  if (is2x2) {
    if (cellsLessThan5Count > 0) {
      cochranExplanation = `Terdapat ${cellsLessThan5Count} sel dengan frekuensi harapan < 5 (sel terkecil = ${minExpectedCount.toFixed(2)}). Sesuai aturan Cochran, uji Fisher's Exact Test direkomendasikan sebagai acuan utama pengambilan keputusan.`;
    } else {
      cochranExplanation = `Seluruh sel memiliki frekuensi harapan ≥ 5 (sel terkecil = ${minExpectedCount.toFixed(2)}). Asumsi uji Chi-Square terpenuhi, uji Continuity Correction (Yates) atau Pearson Chi-Square sah digunakan.`;
    }
  } else {
    if (cellsLessThan5Percent > 20) {
      cochranExplanation = `Sebanyak ${cellsLessThan5Percent.toFixed(1)}% sel memiliki frekuensi harapan < 5 (> 20%). Asumsi Chi-Square dilanggar; disarankan melakukan penggabungan kategori atau menggunakan uji alternatif.`;
    } else {
      cochranExplanation = `Proporsi sel dengan frekuensi harapan < 5 hanya ${cellsLessThan5Percent.toFixed(1)}% (≤ 20%). Asumsi Chi-Square terpenuhi.`;
    }
  }

  const chosenSig = recommendFisher
    ? fisherP2
    : recommendContinuity
    ? (testRows.find((t) => t.name.includes('Continuity'))?.asympSig as number)
    : pPearson;

  const isSignificant = (typeof chosenSig === 'number' ? chosenSig : pPearson) < alpha;

  const conclusion = isSignificant
    ? `Terdapat hubungan yang signifikan secara statistik antara ${rowVar} dengan ${colVar} (p = ${typeof chosenSig === 'number' ? chosenSig.toFixed(4) : chosenSig} < 0,05).`
    : `Tidak terdapat hubungan yang signifikan antara ${rowVar} dengan ${colVar} (p = ${typeof chosenSig === 'number' ? chosenSig.toFixed(4) : chosenSig} ≥ 0,05).`;

  const chiSquare: ChiSquareResult = {
    rowVar,
    colVar,
    is2x2,
    pearsonChiSquare: pearsonChi2,
    df,
    pearsonSig: pPearson,
    continuityCorrection: is2x2 ? yatesChi2 : undefined,
    continuityCorrectionSig: is2x2 ? pYates : undefined,
    likelihoodRatio,
    likelihoodRatioSig: pLikelihood,
    fisherExact: is2x2 ? fisherP2 : undefined,
    fisherExact1Sided: is2x2 ? fisherP1 : undefined,
    cochranFootnote,
    minExpectedCount,
    cellsLessThan5Count,
    cellsLessThan5Percent,
    totalN: N,
    rows: testRows,
    recommendedTest: recommendFisher
      ? "Fisher's Exact Test"
      : recommendContinuity
      ? 'Continuity Correction (Yates)'
      : 'Pearson Chi-Square',
    cochran: {
      cellsLessThan5Count,
      cellsLessThan5Percent,
      minExpectedCount,
      isViolated: isCochranViolated,
      footnote: cochranFootnote,
      explanation: cochranExplanation,
    },
    conclusion,
  };

  // 5. Risk Estimate / Odds Ratio (for 2x2 table)
  let riskEstimate: RiskEstimateResult | undefined;
  if (is2x2) {
    const a = obs[0][0];
    const b = obs[0][1];
    const c = obs[1][0];
    const d = obs[1][1];

    // Odds Ratio = (a * d) / (b * c)
    let oddsRatio = 1;
    let seLnOr = 0;
    let orLower = 1;
    let orUpper = 1;

    if (b > 0 && c > 0 && a > 0 && d > 0) {
      oddsRatio = (a * d) / (b * c);
      seLnOr = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
      orLower = Math.exp(Math.log(oddsRatio) - 1.96 * seLnOr);
      orUpper = Math.exp(Math.log(oddsRatio) + 1.96 * seLnOr);
    } else {
      // Haldane-Anscombe correction (+0.5 to zero cells)
      const ah = a + 0.5;
      const bh = b + 0.5;
      const ch = c + 0.5;
      const dh = d + 0.5;
      oddsRatio = (ah * dh) / (bh * ch);
      seLnOr = Math.sqrt(1 / ah + 1 / bh + 1 / ch + 1 / dh);
      orLower = Math.exp(Math.log(oddsRatio) - 1.96 * seLnOr);
      orUpper = Math.exp(Math.log(oddsRatio) + 1.96 * seLnOr);
    }

    // Cohort Relative Risk 1 (for Col 0 outcome)
    const p1 = (a + b) > 0 ? a / (a + b) : 0;
    const p2 = (c + d) > 0 ? c / (c + d) : 0;
    let rr1 = p2 > 0 ? p1 / p2 : 1;
    let rr1Lower = 1;
    let rr1Upper = 1;
    if (a > 0 && c > 0) {
      const seLnRr1 = Math.sqrt((1 - p1) / a + (1 - p2) / c);
      rr1Lower = Math.exp(Math.log(rr1) - 1.96 * seLnRr1);
      rr1Upper = Math.exp(Math.log(rr1) + 1.96 * seLnRr1);
    }

    // Cohort Relative Risk 2 (for Col 1 outcome)
    const q1 = (a + b) > 0 ? b / (a + b) : 0;
    const q2 = (c + d) > 0 ? d / (c + d) : 0;
    let rr2 = q2 > 0 ? q1 / q2 : 1;
    let rr2Lower = 1;
    let rr2Upper = 1;
    if (b > 0 && d > 0) {
      const seLnRr2 = Math.sqrt((1 - q1) / b + (1 - q2) / d);
      rr2Lower = Math.exp(Math.log(rr2) - 1.96 * seLnRr2);
      rr2Upper = Math.exp(Math.log(rr2) + 1.96 * seLnRr2);
    }

    let interpretation = '';
    const formattedOr = oddsRatio.toFixed(3);
    const formattedCi = `${orLower.toFixed(3)} - ${orUpper.toFixed(3)}`;

    if (oddsRatio > 1.0) {
      interpretation = `Responden pada kategori ${rowCategories[0]} memiliki peluang (odds) ${formattedOr} kali lebih besar mengalami ${colCategories[0]} dibandingkan responden pada kategori ${rowCategories[1]} (95% CI: ${formattedCi}).`;
    } else if (oddsRatio < 1.0) {
      interpretation = `Responden pada kategori ${rowCategories[0]} memiliki peluang ${formattedOr} kali lebih rendah (faktor protektif) terhadap ${colCategories[0]} dibandingkan ${rowCategories[1]} (95% CI: ${formattedCi}).`;
    } else {
      interpretation = `Tidak terdapat perbedaan risiko antara kategori ${rowCategories[0]} dan ${rowCategories[1]} (Odds Ratio = 1,000).`;
    }

    const isSignificantRisk = orLower > 1.0;
    const isProtective = orUpper < 1.0;

    if (isSignificantRisk || isProtective) {
      interpretation += ' Karena rentang 95% Confidence Interval tidak mencakup angka 1,00, faktor risiko ini dinyatakan signifikan secara epidemiologi.';
    } else {
      interpretation += ' Karena rentang 95% Confidence Interval mencakup angka 1,00, faktor risiko ini belum terbukti signifikan secara statistik.';
    }

    riskEstimate = {
      exposureVar: rowVar,
      outcomeVar: colVar,
      rowVar,
      colVar,
      rows: [
        {
          statistic: `Odds Ratio for ${rowVar} (${rowCategories[0]} / ${rowCategories[1]})`,
          value: oddsRatio,
          ciLower: orLower,
          ciUpper: orUpper,
        },
        {
          statistic: `For cohort ${colVar} = ${colCategories[0]}`,
          value: rr1,
          ciLower: rr1Lower,
          ciUpper: rr1Upper,
        },
        {
          statistic: `For cohort ${colVar} = ${colCategories[1]}`,
          value: rr2,
          ciLower: rr2Lower,
          ciUpper: rr2Upper,
        },
      ],
      oddsRatio,
      ciLower: orLower,
      ciUpper: orUpper,
      forCohortRisk1: rr1,
      forCohortRisk1CiLower: rr1Lower,
      forCohortRisk1CiUpper: rr1Upper,
      forCohortRisk2: rr2,
      forCohortRisk2CiLower: rr2Lower,
      forCohortRisk2CiUpper: rr2Upper,
      isSignificantRisk,
      isProtective,
      totalN: N,
      nValid: N,
      conclusion: interpretation,
      interpretation,
    };
  }

  // 6. Symmetric Measures (Phi, Cramer's V, Contingency Coefficient)
  const phi = is2x2 ? Math.sqrt(pearsonChi2 / N) : undefined;
  const minDim = Math.min(numRows - 1, numCols - 1);
  const cramersV = minDim > 0 ? Math.sqrt(pearsonChi2 / (N * minDim)) : 0;
  const contingencyCoefficient = Math.sqrt(pearsonChi2 / (pearsonChi2 + N));

  let strength = 'Sangat Lemah';
  if (cramersV >= 0.5) strength = 'Sangat Kuat';
  else if (cramersV >= 0.3) strength = 'Kuat / Sedang';
  else if (cramersV >= 0.1) strength = 'Lemah';

  const symmetricMeasures: SymmetricMeasuresResult = {
    phi,
    cramersV,
    contingencyCoeff: contingencyCoefficient,
    contingencyCoefficient,
    pValue: pPearson,
    approxSig: pPearson,
    phiStrength: strength,
    cramersVStrength: strength,
    contingencyCoeffStrength: strength,
    totalN: N,
    interpretation: `Nilai koefisien Cramer's V sebesar ${cramersV.toFixed(3)} menunjukkan tingkat hubungan yang ${strength} antar kategori.`,
  };

  return {
    crosstab,
    chiSquare,
    riskEstimate,
    symmetricMeasures,
  };
}
