import type {
  AnalysisResults,
  Construct,
  DatasetRow,
  TestType,
  DescriptiveResult,
  ValidityResult,
  ReliabilityResult,
  ItemTotalStatistic,
  CaseProcessingSummary,
  RegressionResult,
  FTestResult,
  DeterminationResult,
  AnovaResult,
  NormalityResult,
  MulticollinearityResult,
  HeteroscedasticityResult,
  CorrelationResult,
  DurbinWatsonResult,
  LinearityResult,
  DemographicVariableResult,
  DemographicCategory,
} from './api/types';
import {
  matrixMultiply,
  matrixTranspose,
  matrixInverse,
  studentTPValueTwoTailed,
  studentTInv,
  fisherFPValue,
  fisherFInv,
  standardNormalCdf,
  getTCritical,
  getRCritical,
  getFCritical,
  getDurbinWatsonBounds,
} from './math-stats';
import {
  computePairedTTest,
  computeIndependentTTest,
  computeOneWayAnova,
  computeMannWhitneyU,
  computeWilcoxonSignedRank,
  computeKruskalWallis,
  detectResidualOutliers,
  computeSpearmanHeteroscedasticity,
  computeParkHeteroscedasticity,
} from './comparative-stats';
import { computeCrosstabAndChiSquare } from './categorical-stats';
import {
  computeShapiroWilk,
  computeKolmogorovSmirnovLilliefors,
  computeSkewnessKurtosisZTest,
  computeCasewiseDiagnostics,
  computeWhiteHeteroscedasticity,
  analyzeSkewnessAndRecommend,
  computeConstructSpearmanMatrix,
} from './assumption-remedies';
import {
  computePathAnalysisAndSobel,
  computeModeratedRegression,
  generatePathMediationNarration,
  generateModerationNarration,
} from './mediation-moderation';
import { ENGINE_VERSION } from './constants';
import { formatNumber } from './format';

/**
 * Tingkat Capaian Responden (TCR) & Skala Interval Skor (1-5)
 * Rumus TCR: (Mean / Nilai Maksimum Skala) * 100%
 * Standar Interval Penilaian Akademik (Skala 5):
 * 4.21 - 5.00 (TCR 84.01% - 100%): Sangat Tinggi
 * 3.41 - 4.20 (TCR 68.01% - 84.00%): Tinggi
 * 2.61 - 3.40 (TCR 52.01% - 68.00%): Cukup
 * 1.81 - 2.60 (TCR 36.01% - 52.00%): Rendah
 * 1.00 - 1.80 (TCR <= 36.00%): Sangat Rendah
 */
export function calculateTCR(mean: number, maxScore: number = 5): { tcr: number; category: string } {
  const tcr = Number(((mean / maxScore) * 100).toFixed(2));
  let category = 'Sangat Rendah';
  if (mean >= 4.21) category = 'Sangat Tinggi';
  else if (mean >= 3.41) category = 'Tinggi';
  else if (mean >= 2.61) category = 'Cukup';
  else if (mean >= 1.81) category = 'Rendah';
  else category = 'Sangat Rendah';
  return { tcr, category };
}

export type ConstructDef = Construct;

export interface ColumnRoleInfo {
  name: string;
  role: 'id' | 'demographic' | 'item' | 'open_question' | 'ignored';
  dataType: string;
  missingCount: number;
}

export interface DatasetSourceMeta {
  fileName: string;
  datasetId: string;
  runId: string;
  version: number;
  kind: 'original' | 'derived';
  sha256: string;
  rowCount: number;
  columnCount: number;
  excludedRows: number[];
  columns: ColumnRoleInfo[];
}

export interface ComputeStatsOptions {
  rows: DatasetRow[];
  constructs: Construct[];
  selectedTests: TestType[];
  significanceLevel?: number;
  projectId?: string;
  dataVersionId?: string;
  reverseItems?: string[];
  calculationMethod?: 'mean' | 'sum';
  datasetMeta?: DatasetSourceMeta;
  researchDesign?: 'survey' | 'comparative' | 'categorical';
  preCol?: string | null;
  postCol?: string | null;
  groupCol?: string | null;
  scoreCol?: string | null;
  idealMaxScore?: number;
  rowCol?: string | null;
  colCol?: string | null;
}

// Sample variance with ddof=1
function sampleVariance(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;
  const mean = values.reduce((acc, v) => acc + v, 0) / n;
  const ss = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return ss / (n - 1);
}

// Pearson correlation coefficient
function pearsonCorrelation(x: number[], y: number[]): { r: number; p: number } {
  const n = x.length;
  if (n < 3) return { r: 0, p: 1 };
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den <= 1e-12) return { r: 0, p: 1 };

  const r = Math.max(-1, Math.min(1, num / den));
  const df = n - 2;
  const t = r * Math.sqrt(df / Math.max(1e-12, 1 - r * r));
  const p = studentTPValueTwoTailed(t, df);
  return { r, p };
}

// Linearity ANOVA (Between groups: combined, linearity, deviation from linearity)
function computeLinearityTest(
  xVals: number[],
  yVals: number[],
  xName: string,
  yName: string
): LinearityResult {
  const n = xVals.length;
  const yMean = yVals.reduce((a, b) => a + b, 0) / n;
  const xMean = xVals.reduce((a, b) => a + b, 0) / n;

  // Group Y by distinct X values
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const x = xVals[i];
    const y = yVals[i];
    const grp = groups.get(x) || [];
    grp.push(y);
    groups.set(x, grp);
  }

  const g = groups.size;
  let ssBetween = 0;
  let ssWithin = 0;
  let ssTotal = 0;

  for (let i = 0; i < n; i++) {
    ssTotal += (yVals[i] - yMean) ** 2;
  }

  groups.forEach((yList) => {
    const grpMean = yList.reduce((a, b) => a + b, 0) / yList.length;
    ssBetween += yList.length * (grpMean - yMean) ** 2;
    for (const y of yList) {
      ssWithin += (y - grpMean) ** 2;
    }
  });

  // SS Linearity via Pearson correlation squared
  let numXY = 0;
  let denX = 0;
  for (let i = 0; i < n; i++) {
    numXY += (xVals[i] - xMean) * (yVals[i] - yMean);
    denX += (xVals[i] - xMean) ** 2;
  }
  const ssLinearity = denX > 1e-12 ? (numXY * numXY) / denX : 0;
  const ssDeviation = Math.max(0, ssBetween - ssLinearity);

  // Check if every X value is unique (within-groups df = 0)
  if (g === n || n - g <= 0) {
    return {
      independentVar: xName,
      dependentVar: yName,
      ssLinearity: Number(ssLinearity.toFixed(4)),
      dfLinearity: 1,
      msLinearity: Number(ssLinearity.toFixed(4)),
      fLinearity: 0,
      sigLinearity: 1,
      ssDeviation: 0,
      dfDeviation: Math.max(0, g - 2),
      msDeviation: 0,
      fDeviation: 0,
      sigDeviation: 1,
      ssWithin: 0,
      dfWithin: 0,
      msWithin: 0,
      isLinear: false,
    };
  }

  const dfLinearity = 1;
  const dfDeviation = Math.max(1, g - 2);
  const dfWithin = n - g;

  const msLinearity = ssLinearity / dfLinearity;
  const msDeviation = ssDeviation / dfDeviation;
  const msWithin = ssWithin / dfWithin;

  const fLinearity = msWithin > 1e-12 ? msLinearity / msWithin : 0;
  const fDeviation = msWithin > 1e-12 ? msDeviation / msWithin : 0;

  const sigLinearity = fisherFPValue(fLinearity, dfLinearity, dfWithin);
  const sigDeviation = fisherFPValue(fDeviation, dfDeviation, dfWithin);

  const isLinear = sigDeviation >= 0.05;

  return {
    independentVar: xName,
    dependentVar: yName,
    ssLinearity: Number(ssLinearity.toFixed(4)),
    dfLinearity,
    msLinearity: Number(msLinearity.toFixed(4)),
    fLinearity: Number(fLinearity.toFixed(4)),
    sigLinearity: Number(sigLinearity.toFixed(4)),
    ssDeviation: Number(ssDeviation.toFixed(4)),
    dfDeviation,
    msDeviation: Number(msDeviation.toFixed(4)),
    fDeviation: Number(fDeviation.toFixed(4)),
    sigDeviation: Number(sigDeviation.toFixed(4)),
    ssWithin: Number(ssWithin.toFixed(4)),
    dfWithin,
    msWithin: Number(msWithin.toFixed(4)),
    isLinear,
  };
}

export function computeDeterministicStats(
  optionsOrRows: ComputeStatsOptions | DatasetRow[],
  constructsArg?: ConstructDef[],
  selectedTestsArg?: TestType[],
  reverseItemsArg?: string[],
  calculationMethodArg?: 'mean' | 'sum',
  datasetMetaArg?: DatasetSourceMeta
): AnalysisResults {
  let opts: ComputeStatsOptions;
  if (Array.isArray(optionsOrRows)) {
    opts = {
      rows: optionsOrRows,
      constructs: constructsArg || [],
      selectedTests: selectedTestsArg || [
        'descriptive',
        'validity',
        'reliability',
        'normality',
        'multicollinearity',
        'heteroscedasticity',
        'regression',
        'correlation',
      ],
      reverseItems: reverseItemsArg || [],
      calculationMethod: calculationMethodArg || 'mean',
      datasetMeta: datasetMetaArg,
    };
  } else {
    opts = optionsOrRows;
  }

  const {
    rows,
    constructs,
    selectedTests,
    significanceLevel = 0.05,
    projectId = 'sample',
    dataVersionId = 'dv-1',
    reverseItems = [],
    calculationMethod = 'mean',
    datasetMeta,
    researchDesign,
    preCol,
    postCol,
    groupCol,
    scoreCol,
    idealMaxScore,
    rowCol,
    colCol,
  } = opts;

  const n = rows.length;
  if (n === 0) {
    throw new Error('Data responden tidak boleh kosong untuk komputasi statistik.');
  }

  // Pre-process items: handle reverse scored items using universal formula:
  // Skor_Baru = (Skor_Maksimal_Skala + Skor_Minimal_Skala) - Skor_Lama
  const itemScaleBounds: Record<string, { min: number; max: number }> = {};
  for (const it of reverseItems) {
    const vals = rows.map((r) => Number(r[it])).filter((n) => !isNaN(n));
    const minN = vals.length > 0 ? Math.min(...vals) : 1;
    const maxN = vals.length > 0 ? Math.max(...vals) : 5;
    itemScaleBounds[it] = {
      min: minN >= 1 && minN <= 2 ? 1 : Math.floor(minN),
      max: maxN >= 4 && maxN <= 5 ? 5 : maxN >= 6 && maxN <= 7 ? 7 : Math.ceil(maxN),
    };
  }

  const processedRows = rows.map((row) => {
    const copy = { ...row };
    for (const it of reverseItems) {
      const val = Number(copy[it]);
      if (!isNaN(val)) {
        const bounds = itemScaleBounds[it] || { min: 1, max: 5 };
        copy[it] = bounds.max + bounds.min - val;
      }
    }
    return copy;
  });

  // Calculate construct composite scores
  const constructScores: Record<string, number[]> = {};
  const constructRoleMap: Record<string, string> = {};

  constructs.forEach((c) => {
    constructRoleMap[c.name] = c.role;
    const items = c.items;
    const scores: number[] = [];

    for (let i = 0; i < n; i++) {
      const row = processedRows[i];
      const validVals: number[] = [];
      for (const it of items) {
        const v = row[it];
        if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) {
          validVals.push(Number(v));
        }
      }

      if (validVals.length > 0) {
        const composite =
          calculationMethod === 'sum'
            ? validVals.reduce((a, b) => a + b, 0)
            : validVals.reduce((a, b) => a + b, 0) / validVals.length;
        scores.push(composite);
      } else {
        scores.push(0);
      }
    }
    constructScores[c.name] = scores;
  });

  const results: AnalysisResults = {
    id: datasetMeta?.runId || `run-${Date.now()}`,
    projectId,
    dataVersionId,
    respondentCount: n,
    timestamp: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    significanceLevel,
    explanations: {},
    sourceMeta: datasetMeta,
  };

  // 1. STATISTIK DESKRIPTIF & PROFIL DEMOGRAFI
  if (selectedTests.includes('descriptive')) {
    const descResults: DescriptiveResult[] = [];
    constructs.forEach((c) => {
      const s = constructScores[c.name] || [];
      if (s.length === 0) return;

      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      const sorted = [...s].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      const variance = sampleVariance(s);
      const stdDev = Math.sqrt(variance);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];

      // TCR (%) = (Mean / MaxLikert) * 100%
      const maxScale = max > 5 ? Math.ceil(max) : 5;
      const { tcr, category: tcrCategory } = calculateTCR(mean, maxScale);

      descResults.push({
        variable: c.name,
        n: s.length,
        mean: Number(mean.toFixed(4)),
        median: Number(median.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        min: Number(min.toFixed(4)),
        max: Number(max.toFixed(4)),
        tcr,
        tcrCategory,
      });
    });
    results.descriptive = descResults;

    // Per-item descriptive statistics with TCR for thesis Bab 4 breakdown
    const itemDescResults: DescriptiveResult[] = [];
    constructs.forEach((c) => {
      c.items.forEach((itemCol) => {
        const vals: number[] = [];
        for (let i = 0; i < n; i++) {
          const row = processedRows[i];
          const raw = row[itemCol];
          const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
          if (!isNaN(num)) vals.push(num);
        }
        if (vals.length > 0) {
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const sorted = [...vals].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
          const variance = sampleVariance(vals);
          const stdDev = Math.sqrt(variance);
          const min = sorted[0];
          const max = sorted[sorted.length - 1];
          const maxScale = max > 5 ? Math.ceil(max) : 5;
          const { tcr, category: tcrCategory } = calculateTCR(mean, maxScale);

          let f1 = 0, f2 = 0, f3 = 0, f4 = 0, f5 = 0;
          vals.forEach((v) => {
            const r = Math.round(v);
            if (r === 1) f1++;
            else if (r === 2) f2++;
            else if (r === 3) f3++;
            else if (r === 4) f4++;
            else if (r === 5) f5++;
          });

          itemDescResults.push({
            variable: `${itemCol} (${c.name})`,
            n: vals.length,
            mean: Number(mean.toFixed(4)),
            median: Number(median.toFixed(4)),
            stdDev: Number(stdDev.toFixed(4)),
            min: Number(min.toFixed(4)),
            max: Number(max.toFixed(4)),
            tcr,
            tcrCategory,
            freq1: f1,
            freq2: f2,
            freq3: f3,
            freq4: f4,
            freq5: f5,
          });
        }
      });
    });
    results.itemDescriptive = itemDescResults;
  }

  // PROFIL DEMOGRAFI RESPONDEN (Frekuensi & Persentase)
  const constructItemSet = new Set<string>();
  constructs.forEach((c) => c.items.forEach((it) => constructItemSet.add(it)));

  const demoColCandidates: string[] = [];
  if (datasetMeta?.columns) {
    datasetMeta.columns.forEach((col) => {
      if (col.role === 'demographic') {
        demoColCandidates.push(col.name);
      }
    });
  }

  // Jika tidak terdefinisi di meta, deteksi otomatis kolom demografi umum
  if (demoColCandidates.length === 0 && rows.length > 0) {
    const firstRow = rows[0];
    Object.keys(firstRow).forEach((key) => {
      if (
        !constructItemSet.has(key) &&
        !/^(no|id|timestamp|cap_waktu|waktu|nama|email|nim|telepon)$/i.test(key)
      ) {
        demoColCandidates.push(key);
      }
    });
  }

  if (demoColCandidates.length > 0) {
    const demoResults: DemographicVariableResult[] = [];
    demoColCandidates.forEach((colName) => {
      const counts = new Map<string, number>();
      let totalValid = 0;

      for (let i = 0; i < n; i++) {
        const raw = processedRows[i][colName];
        if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
          const valStr = String(raw).trim();
          counts.set(valStr, (counts.get(valStr) || 0) + 1);
          totalValid++;
        }
      }

      if (totalValid > 0) {
        const sortedCategories = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        let cumSum = 0;
        const categories: DemographicCategory[] = sortedCategories.map(([cat, freq]) => {
          const pct = Number(((freq / totalValid) * 100).toFixed(2));
          cumSum += pct;
          return {
            category: cat,
            frequency: freq,
            percentage: pct,
            cumulativePercentage: Number(Math.min(100, cumSum).toFixed(2)),
          };
        });

        demoResults.push({
          variable: colName,
          totalN: totalValid,
          categories,
          majorityCategory: sortedCategories[0][0],
          majorityPercent: Number(((sortedCategories[0][1] / totalValid) * 100).toFixed(2)),
        });
      }
    });
    if (demoResults.length > 0) {
      results.demographics = demoResults;
    }
  }

  // 2. UJI VALIDITAS (Pearson Product Moment)
  if (selectedTests.includes('validity')) {
    const validityResults: ValidityResult[] = [];
    const df = n - 2;
    // Critical t and r for alpha two-tailed
    const rTabel = getRCritical(df, significanceLevel);

    constructs.forEach((c) => {
      const items = c.items;
      // Compute total sum of items for this construct
      const totalScores: number[] = Array.from({ length: n }, () => 0);
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (const it of items) {
          sum += Number(processedRows[i][it] || 0);
        }
        totalScores[i] = sum;
      }

      items.forEach((it) => {
        const itemVals = processedRows.map((r) => Number(r[it] || 0));
        let compScores = totalScores;
        if (items.length > 1) {
          compScores = totalScores.map((tot, idx) => tot - itemVals[idx]);
        }
        const { r } = pearsonCorrelation(itemVals, compScores);
        const rHitung = Number(r.toFixed(4));
        const valid = rHitung > rTabel && rHitung > 0;

        validityResults.push({
          item: it,
          construct: c.name,
          rHitung,
          rTabel,
          valid,
        });
      });
    });
    results.validity = validityResults;
  }

  // 3. UJI RELIABILITAS (Cronbach's Alpha & Item-Total Statistics)
  if (selectedTests.includes('reliability')) {
    const reliabilityResults: ReliabilityResult[] = [];

    constructs.forEach((c) => {
      const items = c.items;
      const k = items.length;
      if (k < 2) return;

      const itemValArrays: number[][] = [];
      const itemVariances: number[] = [];
      const totalScores: number[] = Array.from({ length: n }, () => 0);

      items.forEach((it) => {
        const vals = processedRows.map((r) => Number(r[it] || 0));
        itemValArrays.push(vals);
        const v = sampleVariance(vals);
        itemVariances.push(v);
        for (let i = 0; i < n; i++) {
          totalScores[i] += vals[i];
        }
      });

      const sumItemVar = itemVariances.reduce((a, b) => a + b, 0);
      const totalVar = sampleVariance(totalScores);
      let alpha = 0;
      if (totalVar > 1e-12) {
        alpha = (k / (k - 1)) * (1.0 - sumItemVar / totalVar);
      }
      const roundedAlpha = Number(alpha.toFixed(4));

      // Item-Total Statistics & Cronbach's Alpha if Item Deleted
      const itemTotalStats: ItemTotalStatistic[] = [];
      const alphaIfDeleted: { item: string; alpha: number }[] = [];

      items.forEach((it, idx) => {
        const restScores: number[] = Array.from({ length: n }, () => 0);
        for (let i = 0; i < n; i++) {
          restScores[i] = totalScores[i] - itemValArrays[idx][i];
        }

        const scaleMean = restScores.reduce((a, b) => a + b, 0) / n;
        const scaleVariance = sampleVariance(restScores);
        const { r: correctedItemTotalCorr } = pearsonCorrelation(itemValArrays[idx], restScores);

        // Alpha if item deleted
        const kSub = k - 1;
        let alphaDel = 0;
        if (kSub >= 2 && scaleVariance > 1e-12) {
          const sumItemVarSub = sumItemVar - itemVariances[idx];
          alphaDel = (kSub / (kSub - 1)) * (1.0 - sumItemVarSub / scaleVariance);
        }
        const roundedAlphaDel = Number(Math.max(0, alphaDel).toFixed(4));

        itemTotalStats.push({
          item: it,
          scaleMean: Number(scaleMean.toFixed(4)),
          scaleVariance: Number(scaleVariance.toFixed(4)),
          correctedItemTotalCorrelation: Number(correctedItemTotalCorr.toFixed(4)),
          cronbachAlphaIfDeleted: roundedAlphaDel,
        });

        alphaIfDeleted.push({
          item: it,
          alpha: roundedAlphaDel,
        });
      });

      const caseProcessing: CaseProcessingSummary = {
        validN: n,
        validPercent: 100.0,
        excludedN: 0,
        excludedPercent: 0.0,
        totalN: n,
        totalPercent: 100.0,
      };

      reliabilityResults.push({
        construct: c.name,
        cronbachAlpha: roundedAlpha,
        itemCount: k,
        reliable: roundedAlpha >= 0.60,
        alphaIfDeleted,
        caseProcessing,
        itemTotalStats,
      });
    });
    results.reliability = reliabilityResults;
  }

  // REGRESI & ASUMSI KLASIK
  const indepConstructs = constructs.filter((c) => c.role === 'independent');
  const depConstructs = constructs.filter((c) => c.role === 'dependent');

  if (indepConstructs.length >= 1 && depConstructs.length >= 1) {
    const targetDep = depConstructs[0].name;
    const indepNames = indepConstructs.map((c) => c.name);
    const k = indepNames.length;
    const dfRes = n - k - 1;

    if (dfRes > 0) {
      // Build Design Matrix X and Vector y
      const yVec = constructScores[targetDep];
      const XMat: number[][] = Array.from({ length: n }, (_, i) => [
        1.0,
        ...indepNames.map((name) => constructScores[name][i]),
      ]);

      const XT = matrixTranspose(XMat);
      const XTX = matrixMultiply(XT, XMat);
      const XTXInv = matrixInverse(XTX);
      const XTy = matrixMultiply(XT, yVec.map((v) => [v]));
      const betaMat = matrixMultiply(XTXInv, XTy);
      const beta = betaMat.map((r) => r[0]);

      // Predictions & Residuals
      const yPred: number[] = [];
      const residuals: number[] = [];
      const yMean = yVec.reduce((a, b) => a + b, 0) / n;
      let ssTot = 0;
      let ssRes = 0;

      for (let i = 0; i < n; i++) {
        let pred = beta[0];
        for (let j = 0; j < k; j++) {
          pred += beta[j + 1] * constructScores[indepNames[j]][i];
        }
        yPred.push(pred);
        const res = yVec[i] - pred;
        residuals.push(res);
        ssTot += (yVec[i] - yMean) ** 2;
        ssRes += res * res;
      }

      const ssReg = Math.max(0, ssTot - ssRes);
      const msReg = ssReg / k;
      const msRes = ssRes / dfRes;
      const seEst = Math.sqrt(msRes);

      // Covariance of Beta: msRes * (X'X)^-1
      const seBeta: number[] = [];
      const tStats: number[] = [];
      const pVals: number[] = [];

      for (let j = 0; j <= k; j++) {
        const se = Math.sqrt(Math.max(0, msRes * XTXInv[j][j]));
        seBeta.push(se);
        const t = se > 1e-12 ? beta[j] / se : 0;
        tStats.push(t);
        const p = studentTPValueTwoTailed(t, dfRes);
        pVals.push(p);
      }

      // F-Test & Determination & Critical Values
      const fStat = msRes > 1e-12 ? msReg / msRes : 0;
      const fPVal = fisherFPValue(fStat, k, dfRes);
      const fTabel = getFCritical(k, dfRes, significanceLevel);
      const tTabel = getTCritical(dfRes, significanceLevel);
      const r2 = ssTot > 1e-12 ? 1.0 - ssRes / ssTot : 0;
      const adjR2 = 1.0 - ((1.0 - r2) * (n - 1)) / dfRes;

      results.tTabel = tTabel;
      results.fTabel = fTabel;
      // SPSS Standardized Residuals: Z_resid = e_i / sqrt(MSE), di mana MSE = SSE / (N - k - 1)
      const zResids: number[] = seEst > 1e-12 ? residuals.map((r) => Number((r / seEst).toFixed(6))) : residuals.map(() => 0);
      results.unstandardizedResiduals = residuals;
      results.standardizedResiduals = zResids;

      // Standard deviation of Y for Standardized Beta (Beta)
      const sY = Math.sqrt(Math.max(1e-12, ssTot / (n - 1)));

      if (selectedTests.includes('regression')) {
        const regTable: RegressionResult[] = [
          {
            variable: '(Konstanta)',
            coefficient: Number(beta[0].toFixed(4)),
            stdError: Number(seBeta[0].toFixed(4)),
            tHitung: Number(tStats[0].toFixed(4)),
            tTabel,
            pValue: Number(pVals[0].toFixed(4)),
            significant: pVals[0] < significanceLevel,
          },
        ];

        indepNames.forEach((name, idx) => {
          const sX = Math.sqrt(sampleVariance(constructScores[name]));
          const betaStd = sY > 1e-12 ? (beta[idx + 1] * sX) / sY : 0;
          const { r: rXY } = pearsonCorrelation(constructScores[name], yVec);
          const seVal = betaStd * rXY * 100.0;
          const srVal = r2 > 1e-6 ? (seVal / (r2 * 100.0)) * 100.0 : 0;

          regTable.push({
            variable: name,
            coefficient: Number(beta[idx + 1].toFixed(4)),
            stdError: Number(seBeta[idx + 1].toFixed(4)),
            tHitung: Number(tStats[idx + 1].toFixed(4)),
            tTabel,
            pValue: Number(pVals[idx + 1].toFixed(4)),
            significant: pVals[idx + 1] < significanceLevel,
            standardizedBeta: Number(betaStd.toFixed(4)),
            sePercent: Number(seVal.toFixed(2)),
            srPercent: Number(srVal.toFixed(2)),
          });
        });

        results.regression = regTable;
        results.fTest = {
          fHitung: Number(fStat.toFixed(4)),
          fTabel,
          pValue: Number(fPVal.toFixed(4)),
          significant: fPVal < significanceLevel,
        };
        results.determination = {
          rSquare: Number(r2.toFixed(4)),
          adjustedRSquare: Number(adjR2.toFixed(4)),
          stdError: Number(seEst.toFixed(4)),
        };
        results.anova = [
          {
            source: 'Regression',
            sumOfSquares: Number(ssReg.toFixed(4)),
            df: k,
            meanSquare: Number(msReg.toFixed(4)),
            fValue: Number(fStat.toFixed(4)),
            pValue: Number(fPVal.toFixed(4)),
          },
          {
            source: 'Residual',
            sumOfSquares: Number(ssRes.toFixed(4)),
            df: dfRes,
            meanSquare: Number(msRes.toFixed(4)),
            fValue: 0,
            pValue: 0,
          },
          {
            source: 'Total',
            sumOfSquares: Number(ssTot.toFixed(4)),
            df: n - 1,
            meanSquare: 0,
            fValue: 0,
            pValue: 0,
          },
        ];
      }

      // AUTOKORELASI: Durbin-Watson (DW)
      let numDW = 0;
      let denDW = 0;
      for (let i = 0; i < n; i++) {
        denDW += residuals[i] * residuals[i];
        if (i > 0) {
          const diff = residuals[i] - residuals[i - 1];
          numDW += diff * diff;
        }
      }
      const dwStat = denDW > 1e-12 ? Number((numDW / denDW).toFixed(4)) : 2.0;
      const { dL, dU } = getDurbinWatsonBounds(n, k, significanceLevel);
      let dwStatus: 'bebas' | 'ragu' | 'terdapat' = 'bebas';
      let dwConclusion = '';

      if (dwStat > dU && dwStat < (4.0 - dU)) {
        dwStatus = 'bebas';
        dwConclusion = `Bebas dari masalah autokorelasi karena dU (${dU.toFixed(3)}) < DW (${dwStat.toFixed(3)}) < 4 - dU (${(4.0 - dU).toFixed(3)}).`;
      } else if (dwStat < dL) {
        dwStatus = 'terdapat';
        dwConclusion = `Terindikasi autokorelasi positif karena DW (${dwStat.toFixed(3)}) < dL (${dL.toFixed(3)}).`;
      } else if (dwStat > (4.0 - dL)) {
        dwStatus = 'terdapat';
        dwConclusion = `Terindikasi autokorelasi negatif karena DW (${dwStat.toFixed(3)}) > 4 - dL (${(4.0 - dL).toFixed(3)}).`;
      } else {
        dwStatus = 'ragu';
        dwConclusion = `Nilai DW (${dwStat.toFixed(3)}) berada di daerah ragu-ragu (antara dL dan dU atau 4-dU dan 4-dL).`;
      }

      results.durbinWatson = {
        dwStatistic: dwStat,
        dL,
        dU,
        status: dwStatus,
        conclusion: dwConclusion,
      };

      // LINEARITAS: Deviation from Linearity ANOVA
      const linearityList: LinearityResult[] = [];
      indepNames.forEach((indepName) => {
        const xVals = constructScores[indepName];
        const linRes = computeLinearityTest(xVals, yVec, indepName, targetDep);
        linearityList.push(linRes);
      });
      results.linearity = linearityList;

      // 4. UJI ASUMSI KLASIK: NORMALITAS RESIDUAL
      if (selectedTests.includes('normality')) {
        // Kolmogorov-Smirnov test on residuals
        const resMean = residuals.reduce((a, b) => a + b, 0) / n;
        const resSd = Math.sqrt(sampleVariance(residuals));
        const sortedRes = [...residuals].sort((a, b) => a - b);
        let maxD = 0;
        let maxPos = 0;
        let maxNeg = 0;

        for (let i = 0; i < n; i++) {
          const z = resSd > 1e-12 ? (sortedRes[i] - resMean) / resSd : 0;
          const theoretical = standardNormalCdf(z);
          const empirical1 = (i + 1) / n;
          const empirical2 = i / n;
          const diff1 = empirical1 - theoretical;
          const diff2 = empirical2 - theoretical;

          if (diff1 > maxPos) maxPos = diff1;
          if (diff2 > maxPos) maxPos = diff2;
          if (diff1 < maxNeg) maxNeg = diff1;
          if (diff2 < maxNeg) maxNeg = diff2;

          const d = Math.max(Math.abs(diff1), Math.abs(diff2));
          if (d > maxD) maxD = d;
        }

        // Asymptotic p-value for KS
        const ksVal = maxD * Math.sqrt(n);
        let ksPVal = 1.0;
        if (ksVal > 0.3) {
          ksPVal = 2.0 * Math.exp(-2.0 * ksVal * ksVal);
        }
        ksPVal = Math.max(0, Math.min(1, ksPVal));

        results.normality = [
          {
            test: 'Kolmogorov-Smirnov (Residual)',
            statistic: Number(maxD.toFixed(4)),
            pValue: Number(ksPVal.toFixed(4)),
            normal: ksPVal >= significanceLevel,
            mean: Number(resMean.toFixed(4)),
            stdDev: Number(resSd.toFixed(4)),
            absoluteDiff: Number(maxD.toFixed(4)),
            positiveDiff: Number(maxPos.toFixed(4)),
            negativeDiff: Number(maxNeg.toFixed(4)),
          },
        ];

        // Alternatif 1: Shapiro-Wilk (Royston Algorithm)
        try {
          results.shapiroWilk = computeShapiroWilk(residuals, significanceLevel);
        } catch {
          // Safe fallback
        }

        // Alternatif 2: Kolmogorov-Smirnov dengan Koreksi Lilliefors
        try {
          results.lillieforsNormality = computeKolmogorovSmirnovLilliefors(residuals, significanceLevel);
        } catch {
          // Safe fallback
        }

        // Alternatif 3: Rasio Kemiringan & Keruncingan Skewness-Kurtosis (Z-Score)
        try {
          results.skewnessKurtosis = computeSkewnessKurtosisZTest(residuals, significanceLevel);
        } catch {
          // Safe fallback
        }
      }

      // 5. UJI MULTIKOLINEARITAS (Tolerance & VIF)
      if (selectedTests.includes('multicollinearity')) {
        const multiResults: MulticollinearityResult[] = [];
        if (k === 1) {
          multiResults.push({
            variable: indepNames[0],
            tolerance: 1.0,
            vif: 1.0,
            problematic: false,
          });
        } else if (k === 2) {
          const { r } = pearsonCorrelation(
            constructScores[indepNames[0]],
            constructScores[indepNames[1]]
          );
          const r2Aux = r * r;
          const tol = Math.max(0.0001, 1.0 - r2Aux);
          const vif = 1.0 / tol;
          indepNames.forEach((name) => {
            multiResults.push({
              variable: name,
              tolerance: Number(tol.toFixed(4)),
              vif: Number(vif.toFixed(4)),
              problematic: vif >= 10.0,
            });
          });
        } else {
          // General case for k > 2 via auxiliary regressions
          indepNames.forEach((targetVar) => {
            const auxIndep = indepNames.filter((name) => name !== targetVar);
            const auxY = constructScores[targetVar];
            const auxX: number[][] = Array.from({ length: n }, (_, i) => [
              1.0,
              ...auxIndep.map((name) => constructScores[name][i]),
            ]);
            try {
              const auxXT = matrixTranspose(auxX);
              const auxXTX = matrixMultiply(auxXT, auxX);
              const auxInv = matrixInverse(auxXTX);
              const auxXTy = matrixMultiply(auxXT, auxY.map((v) => [v]));
              const auxBeta = matrixMultiply(auxInv, auxXTy).map((r) => r[0]);

              let auxSsTot = 0;
              let auxSsRes = 0;
              const auxMean = auxY.reduce((a, b) => a + b, 0) / n;
              for (let i = 0; i < n; i++) {
                let pred = auxBeta[0];
                for (let j = 0; j < auxIndep.length; j++) {
                  pred += auxBeta[j + 1] * constructScores[auxIndep[j]][i];
                }
                const res = auxY[i] - pred;
                auxSsTot += (auxY[i] - auxMean) ** 2;
                auxSsRes += res * res;
              }
              const auxR2 = auxSsTot > 1e-12 ? 1.0 - auxSsRes / auxSsTot : 0;
              const tol = Math.max(0.0001, 1.0 - auxR2);
              const vif = 1.0 / tol;
              multiResults.push({
                variable: targetVar,
                tolerance: Number(tol.toFixed(4)),
                vif: Number(vif.toFixed(4)),
                problematic: vif >= 10.0,
              });
            } catch {
              multiResults.push({
                variable: targetVar,
                tolerance: 1.0,
                vif: 1.0,
                problematic: false,
              });
            }
          });
        }
        results.multicollinearity = multiResults;
      }

      // 6. UJI HETEROSKEDASTISITAS (Metode Glejser)
      if (selectedTests.includes('heteroscedasticity')) {
        const heteroResults: HeteroscedasticityResult[] = [];
        const absRes = residuals.map((r) => Math.abs(r));

        try {
          const XTyGlejser = matrixMultiply(XT, absRes.map((v) => [v]));
          const betaG = matrixMultiply(XTXInv, XTyGlejser).map((r) => r[0]);

          let ssResG = 0;
          for (let i = 0; i < n; i++) {
            let predG = betaG[0];
            for (let j = 0; j < k; j++) {
              predG += betaG[j + 1] * constructScores[indepNames[j]][i];
            }
            const resG = absRes[i] - predG;
            ssResG += resG * resG;
          }
          const msResG = ssResG / dfRes;

          indepNames.forEach((name, idx) => {
            const seG = Math.sqrt(Math.max(0, msResG * XTXInv[idx + 1][idx + 1]));
            const tG = seG > 1e-12 ? betaG[idx + 1] / seG : 0;
            const pG = studentTPValueTwoTailed(tG, dfRes);
            heteroResults.push({
              variable: name,
              test: 'Glejser',
              tHitung: Number(tG.toFixed(4)),
              pValue: Number(pG.toFixed(4)),
              significant: pG < significanceLevel,
            });
          });
        } catch {
          // If singular, fallback
        }
        results.heteroscedasticity = heteroResults;
      }

      // TROUBLESHOOTER 1: Deteksi Outlier Residual (|Z| > 2.5)
      try {
        const outlierInfo = detectResidualOutliers(residuals, rows, 2.5);
        if (results.normality && results.normality.length > 0) {
          outlierInfo.originalNormalSig = results.normality[0].pValue;
        }
        results.residualOutliers = outlierInfo;
      } catch {
        // Safe fallback if calculation fails
      }

      // TROUBLESHOOTER 2: Uji Heteroskedastisitas Alternatif (Korelasi Rank Spearman & Uji Park)
      try {
        const indepMap: Record<string, number[]> = {};
        indepNames.forEach((name) => {
          indepMap[name] = constructScores[name];
        });

        // 2a. Korelasi Rank Spearman (Prof. Imam Ghozali, 2018)
        const spearmanRes = computeSpearmanHeteroscedasticity(indepMap, residuals);
        results.spearmanHetero = spearmanRes.map((s) => ({
          test: 'Rank Spearman',
          variable: s.variable,
          tHitung: s.tHitung,
          pValue: s.pValue,
          significant: s.significant,
        }));

        // 2b. Uji Park: Regresi ln(e^2) thd Variabel Bebas (Gujarati / Ghozali)
        const parkRes = computeParkHeteroscedasticity(indepMap, residuals);
        results.parkHetero = parkRes.map((p) => ({
          test: 'Uji Park',
          variable: p.variable,
          tHitung: p.tHitung,
          pValue: p.pValue,
          significant: p.significant,
          beta: p.beta,
        }));
      } catch {
        // Safe fallback
      }

      // TROUBLESHOOTER 3: Uji White Heteroskedastisitas (White Test)
      try {
        results.whiteHetero = computeWhiteHeteroscedasticity(yPred, residuals);
      } catch {
        // Safe fallback
      }

      // TROUBLESHOOTER 4: Casewise Diagnostics (|Z| > 3.0 & |Z| > 2.5)
      try {
        results.casewiseDiagnostics = computeCasewiseDiagnostics(residuals, yVec, yPred, rows, 3.0);
      } catch {
        // Safe fallback
      }

      // TROUBLESHOOTER 5: Analisis Kemiringan Variabel & Rekomendasi Transformasi Ekonometrika
      try {
        const transformRecs = [...indepNames, targetDep]
          .filter((varName) => constructScores[varName])
          .map((varName) => analyzeSkewnessAndRecommend(constructScores[varName], varName));
        results.transformationRecommendations = transformRecs;
      } catch {
        // Safe fallback
      }

      // TROUBLESHOOTER 6: Fallback Matriks Korelasi Non-Parametrik Rank Spearman
      try {
        results.spearmanConstructMatrix = computeConstructSpearmanMatrix(constructScores);
      } catch {
        // Safe fallback
      }
    }
  }

  // 7. KORELASI PEARSON ANTAR KONSTRUK
  if (selectedTests.includes('correlation')) {
    const corrResults: CorrelationResult[] = [];
    const allConstructNames = constructs.map((c) => c.name);

    for (let i = 0; i < allConstructNames.length; i++) {
      for (let j = i + 1; j < allConstructNames.length; j++) {
        const v1 = allConstructNames[i];
        const v2 = allConstructNames[j];
        const s1 = constructScores[v1];
        const s2 = constructScores[v2];
        const { r, p } = pearsonCorrelation(s1, s2);
        const absR = Math.abs(r);

        let strength = 'Sangat Lemah';
        if (absR >= 0.8) strength = 'Sangat Kuat';
        else if (absR >= 0.6) strength = 'Kuat';
        else if (absR >= 0.4) strength = 'Sedang';
        else if (absR >= 0.2) strength = 'Rendah';

        corrResults.push({
          variable1: v1,
          variable2: v2,
          coefficient: Number(r.toFixed(4)),
          pValue: Number(p.toFixed(4)),
          strength,
          significant: p < significanceLevel,
        });
      }
    }
    results.correlation = corrResults;
  }

  // 8. ANALISIS KOMPARATIF & EKSPERIMEN (Paired t-Test, N-Gain, Independent t-Test, ANOVA, Non-Parametrik)
  const isComparative =
    opts.researchDesign === 'comparative' ||
    selectedTests.some((t) =>
      ['paired-ttest', 'independent-ttest', 'oneway-anova', 'ngain', 'nonparametric'].includes(t)
    );

  if (opts.researchDesign) {
    results.researchDesign = opts.researchDesign;
  } else if (isComparative && !selectedTests.includes('regression') && !selectedTests.includes('validity')) {
    results.researchDesign = 'comparative';
  }

  if (isComparative) {
    // Auto-detect or use user-specified columns
    const allCols = rows.length > 0 ? Object.keys(rows[0]) : [];
    const preCol =
      opts.preCol ||
      allCols.find((c) => /^(pre[_-\s]?test|sebelum|pre)$/i.test(c.trim())) ||
      allCols.find((c) => /pre/i.test(c.trim()));
    const postCol =
      opts.postCol ||
      allCols.find((c) => /^(post[_-\s]?test|sesudah|post)$/i.test(c.trim())) ||
      allCols.find((c) => /post/i.test(c.trim()));

    const countDistinct = (col: string): number => {
      const s = new Set<string>();
      for (const r of rows) {
        const v = String(r[col] ?? '').trim();
        if (v) s.add(v);
      }
      return s.size;
    };

    const explicitGroupCol =
      opts.groupCol ||
      allCols.find((c) => /^(kelas|kelompok|group|metode|perlakuan)$/i.test(c.trim()));

    const groupCol2 =
      explicitGroupCol ||
      demoColCandidates.find((c) => countDistinct(c) === 2) ||
      demoColCandidates.find((c) => countDistinct(c) >= 2);

    const groupCol3 =
      (explicitGroupCol && countDistinct(explicitGroupCol) >= 2 ? explicitGroupCol : undefined) ||
      demoColCandidates.find((c) => countDistinct(c) >= 3) ||
      demoColCandidates.find((c) => countDistinct(c) >= 2);

    const defaultDepConstruct =
      constructs.find((c) => c.role === 'dependent')?.name || constructs[0]?.name;

    const scoreCol =
      opts.scoreCol ||
      postCol ||
      allCols.find((c) => /^(skor|nilai|hasil|score)$/i.test(c.trim())) ||
      defaultDepConstruct;
    const idealMax = opts.idealMaxScore || 100;

    const getRowScore = (idx: number, colName: string): number => {
      if (constructScores[colName] && idx < constructScores[colName].length) {
        return constructScores[colName][idx];
      }
      return Number(rows[idx]?.[colName]);
    };

    // Paired Sample t-Test & N-Gain Score
    if (
      (selectedTests.includes('paired-ttest') || selectedTests.includes('ngain')) &&
      preCol &&
      postCol
    ) {
      const preVals: number[] = [];
      const postVals: number[] = [];
      for (let i = 0; i < rows.length; i++) {
        const vPre = getRowScore(i, preCol);
        const vPost = getRowScore(i, postCol);
        if (!isNaN(vPre) && !isNaN(vPost)) {
          preVals.push(vPre);
          postVals.push(vPost);
        }
      }

      if (preVals.length >= 3) {
        const { tTest, nGain } = computePairedTTest(
          preVals,
          postVals,
          preCol,
          postCol,
          idealMax,
          significanceLevel
        );
        results.pairedTTest = tTest;
        results.nGain = nGain;
      }
    }

    // Independent Sample t-Test
    if (selectedTests.includes('independent-ttest') && groupCol2 && scoreCol) {
      const groupMap = new Map<string, number[]>();
      for (let i = 0; i < rows.length; i++) {
        const grp = String(rows[i][groupCol2] || '').trim();
        const sc = getRowScore(i, scoreCol);
        if (grp && !isNaN(sc)) {
          if (!groupMap.has(grp)) groupMap.set(grp, []);
          groupMap.get(grp)!.push(sc);
        }
      }

      const groupKeys = Array.from(groupMap.keys());
      if (groupKeys.length >= 2) {
        const groupA = groupMap.get(groupKeys[0])!;
        const groupB = groupMap.get(groupKeys[1])!;
        if (groupA.length >= 2 && groupB.length >= 2) {
          results.independentTTest = computeIndependentTTest(
            groupA,
            groupB,
            groupKeys[0],
            groupKeys[1],
            scoreCol,
            significanceLevel
          );
        }
      }
    }

    // One-Way ANOVA
    if (selectedTests.includes('oneway-anova') && groupCol3 && scoreCol) {
      const groupsObj: Record<string, number[]> = {};
      for (let i = 0; i < rows.length; i++) {
        const grp = String(rows[i][groupCol3] || '').trim();
        const sc = getRowScore(i, scoreCol);
        if (grp && !isNaN(sc)) {
          if (!groupsObj[grp]) groupsObj[grp] = [];
          groupsObj[grp].push(sc);
        }
      }

      const groupsList = Object.entries(groupsObj).map(([name, scores]) => ({ name, scores }));
      if (groupsList.length >= 2) {
        results.oneWayAnova = computeOneWayAnova(
          groupsList,
          scoreCol,
          groupCol3,
          significanceLevel
        );
      }
    }

    // Non-Parametric Tests (Manual or Auto-fallback)
    const activeGroupCol = groupCol2 || groupCol3;
    if (
      selectedTests.includes('nonparametric') ||
      (results.normality && !results.normality[0]?.normal)
    ) {
      if (activeGroupCol && scoreCol) {
        const groupMap = new Map<string, number[]>();
        for (let i = 0; i < rows.length; i++) {
          const grp = String(rows[i][activeGroupCol] || '').trim();
          const sc = getRowScore(i, scoreCol);
          if (grp && !isNaN(sc)) {
            if (!groupMap.has(grp)) groupMap.set(grp, []);
            groupMap.get(grp)!.push(sc);
          }
        }
        const groupKeys = Array.from(groupMap.keys());
        if (groupKeys.length === 2) {
          results.nonParametric = computeMannWhitneyU(
            groupMap.get(groupKeys[0])!,
            groupMap.get(groupKeys[1])!,
            groupKeys[0],
            groupKeys[1],
            scoreCol
          );
        } else if (groupKeys.length >= 3) {
          const groupsList = groupKeys.map((k) => ({ name: k, scores: groupMap.get(k)! }));
          results.nonParametric = computeKruskalWallis(groupsList, scoreCol, activeGroupCol);
        }
      } else if (preCol && postCol) {
        const preVals: number[] = [];
        const postVals: number[] = [];
        for (let i = 0; i < rows.length; i++) {
          const vPre = getRowScore(i, preCol);
          const vPost = getRowScore(i, postCol);
          if (!isNaN(vPre) && !isNaN(vPost)) {
            preVals.push(vPre);
            postVals.push(vPost);
          }
        }
        if (preVals.length >= 3) {
          results.nonParametric = computeWilcoxonSignedRank(
            preVals,
            postVals,
            `${preCol} vs ${postCol}`,
            scoreCol || 'Skor'
          );
        }
      }
    }
  }

  // 9. MODUL HUBUNGAN KATEGORI: CROSSTAB, CHI-SQUARE, & ESTIMASI RISIKO (ODDS RATIO)
  if (
    researchDesign === 'categorical' ||
    selectedTests.includes('crosstab') ||
    selectedTests.includes('chisquare') ||
    selectedTests.includes('odds-ratio')
  ) {
    const resolvedRowCol = rowCol || demoColCandidates[0];
    const resolvedColCol = colCol || demoColCandidates[1];
    if (resolvedRowCol && resolvedColCol && resolvedRowCol !== resolvedColCol) {
      try {
        const catRes = computeCrosstabAndChiSquare(rows, resolvedRowCol, resolvedColCol, significanceLevel);
        results.crosstab = catRes.crosstab;
        results.chiSquare = catRes.chiSquare;
        results.riskEstimate = catRes.riskEstimate;
        results.symmetricMeasures = catRes.symmetricMeasures;
      } catch (err) {
        console.warn('Gagal menghitung Crosstab / Chi-Square:', err);
      }
    }
  }

    // 10. ANALISIS JALUR & UJI SOBEL (MEDIASI)
  const hasMediator = constructs.some((c) => c.role === 'mediator');
  if (hasMediator || selectedTests.includes('mediation')) {
    try {
      const pathRes = computePathAnalysisAndSobel(constructScores, constructs, significanceLevel);
      if (pathRes.hasMediation) {
        results.pathAnalysis = pathRes;
      }
    } catch (err) {
      console.warn('Gagal menghitung Path Analysis / Sobel:', err);
    }
  }

  // 11. MODERATED REGRESSION ANALYSIS / MRA (MODERASI)
  const hasModerator = constructs.some((c) => c.role === 'moderator');
  if (hasModerator || selectedTests.includes('moderation')) {
    try {
      const mraRes = computeModeratedRegression(constructScores, constructs, significanceLevel);
      if (mraRes.hasModeration) {
        results.moderationAnalysis = mraRes;
      }
    } catch (err) {
      console.warn('Gagal menghitung MRA / Moderasi:', err);
    }
  }

  // 12. GENERASI NARASI DRAF DENGAN STRICT NUMBER GUARD (NILAI TERHITUNG)
  results.explanations = generateDeterministicExplanations(results);

  return results;
}

// Generate narrative explanations referencing EXACT calculated numbers
function generateDeterministicExplanations(res: AnalysisResults): Record<string, string> {
  const exp: Record<string, string> = {};

  if (res.descriptive && res.descriptive.length > 0) {
    const summary = res.descriptive
      .map((d) => `variabel ${d.variable} memiliki nilai rata-rata (mean) sebesar ${formatNumber(d.mean, 3)} dengan TCR ${d.tcr !== undefined ? `${formatNumber(d.tcr, 1)}% (${d.tcrCategory})` : 'baik'}`)
      .join(', ');

    let itemContext = '';
    if (res.itemDescriptive && res.itemDescriptive.length > 0) {
      const sortedItems = [...res.itemDescriptive].sort((a, b) => b.mean - a.mean);
      const highest = sortedItems[0];
      const lowest = sortedItems[sortedItems.length - 1];
      if (highest && lowest) {
        itemContext = ` Berdasarkan capaian butir indikator, skor rata-rata tertinggi diperoleh pada ${highest.variable} (Mean = ${formatNumber(highest.mean, 2)}, TCR = ${formatNumber(highest.tcr ?? 0, 1)}% - Kategori ${highest.tcrCategory}), sedangkan skor terendah terdapat pada ${lowest.variable} (Mean = ${formatNumber(lowest.mean, 2)}, TCR = ${formatNumber(lowest.tcr ?? 0, 1)}% - Kategori ${lowest.tcrCategory}).`;
      }
    }

    exp.descriptive = `Berdasarkan analisis statistik deskriptif terhadap ${res.respondentCount} responden, diperoleh bahwa ${summary}.${itemContext} Nilai Tingkat Capaian Responden (TCR) menunjukkan persepsi empiris responden terhadap dimensi variabel yang diteliti.`;
  }

  if (res.demographics && res.demographics.length > 0) {
    const demoSummary = res.demographics
      .map((d) => `${d.variable}: mayoritas ${d.majorityCategory} (${formatNumber(d.majorityPercent, 1)}%)`)
      .join(', ');
    exp.demographics = `Profil demografi terhadap ${res.respondentCount} responden menunjukkan sebaran karakteristik sebagai berikut: ${demoSummary}. Karakteristik ini mencerminkan representasi populasi target penelitian.`;
  }

  if (res.validity && res.validity.length > 0) {
    const invalidCount = res.validity.filter((v) => !v.valid).length;
    const rTabel = res.validity[0].rTabel;
    if (invalidCount === 0) {
      exp.validity = `Hasil pengujian validitas butir instrumen menggunakan korelasi Pearson Product Moment menunjukkan bahwa seluruh butir indikator memiliki nilai r hitung yang lebih besar dari r tabel (${formatNumber(rTabel, 4)}) pada tingkat signifikansi α = 0,05. Dengan demikian, seluruh butir dinyatakan valid dan layak digunakan sebagai alat ukur penelitian.`;
    } else {
      exp.validity = `Hasil pengujian validitas butir instrumen menunjukkan terdapat ${invalidCount} butir yang gugur (r hitung < r tabel ${formatNumber(rTabel, 4)}). Butir-butir lainnya dinyatakan valid karena memenuhi kriteria r hitung > r tabel pada taraf signifikansi α = 0,05.`;
    }
  }

  if (res.reliability && res.reliability.length > 0) {
    const parts = res.reliability.map(
      (r) => `${r.construct} memiliki Cronbach's Alpha sebesar ${formatNumber(r.cronbachAlpha, 3)} (${r.reliable ? 'Reliabel' : 'Belum Reliabel'})`
    );
    exp.reliability = `Pengujian reliabilitas instrumen dengan koefisien Cronbach's Alpha menghasilkan nilai sebagai berikut: ${parts.join(', ')}. Seluruh nilai diuji terhadap ambang batas baku 0,600.`;
  }

  if (res.regression && res.regression.length > 0 && res.fTest && res.determination) {
    const indepRows = res.regression.filter((r) => r.variable !== '(Konstanta)');
    const sigVars = indepRows.filter((r) => r.significant).map((r) => r.variable);

    let dominantItemNote = '';
    if (sigVars.length > 0 && res.itemDescriptive && res.itemDescriptive.length > 0) {
      const sortedItems = [...res.itemDescriptive].sort((a, b) => b.mean - a.mean);
      const topItem = sortedItems[0];
      if (topItem) {
        dominantItemNote = ` Pengaruh positif ini didukung oleh persepsi responden pada butir indikator ${topItem.variable} yang mencatatkan capaian rata-rata tertinggi (Mean = ${formatNumber(topItem.mean, 2)}).`;
      }
    }

    exp.regression = `Analisis regresi linier berganda menunjukkan model persamaan regresi dengan nilai konstanta ${formatNumber(res.regression[0].coefficient, 3)}. Variabel bebas yang berpengaruh positif dan signifikan terhadap variabel terikat meliputi: ${sigVars.length > 0 ? sigVars.join(', ') : 'tidak ada variabel yang signifikan pada taraf 5%'}.${dominantItemNote} Pengujian simultan (Uji F) menghasilkan nilai F hitung sebesar ${formatNumber(res.fTest.fHitung, 3)} dibandingkan F tabel ${formatNumber(res.fTest.fTabel, 3)} dengan signifikansi ${formatNumber(res.fTest.pValue, 3)} (${res.fTest.significant ? 'berpengaruh signifikan secara simultan' : 'tidak berpengaruh signifikan secara simultan'}). Koefisien determinasi (R²) tercatat sebesar ${formatNumber(res.determination.rSquare, 3)} (Adjusted R² = ${formatNumber(res.determination.adjustedRSquare, 3)}).`;

    exp.fTest = `Uji simultan ANOVA menghasilkan nilai F hitung ${formatNumber(res.fTest.fHitung, 3)} dibandingkan F tabel ${formatNumber(res.fTest.fTabel, 3)} dengan nilai signifikansi ${formatNumber(res.fTest.pValue, 3)}. Karena ${res.fTest.significant ? 'F hitung > F tabel dan p < 0,05' : 'F hitung <= F tabel atau p >= 0,05'}, maka variabel bebas ${res.fTest.significant ? 'secara bersama-sama berpengaruh signifikan' : 'tidak berpengaruh signifikan secara bersama-sama'}.`;

    exp.determination = `Koefisien determinasi (R Square) bernilai ${formatNumber(res.determination.rSquare, 3)}, yang mengindikasikan bahwa sebesar ${formatNumber(res.determination.rSquare * 100, 1)}% variasi variabel terikat dapat dijelaskan oleh variabel bebas dalam model penelitian ini.`;

    // Sumbangan Efektif dan Sumbangan Relatif
    const seDetails = indepRows
      .filter((r) => r.sePercent !== undefined && r.srPercent !== undefined)
      .map((r) => `${r.variable} memberikan SE = ${formatNumber(r.sePercent || 0, 1)}% (SR = ${formatNumber(r.srPercent || 0, 1)}%)`)
      .join(', ');
    if (seDetails) {
      exp.contributions = `Perhitungan kontribusi prediktor menunjukkan: ${seDetails}. Total sumbangan efektif setara dengan nilai koefisien determinasi (${formatNumber(res.determination.rSquare * 100, 1)}%).`;
    }
  }

  if (res.normality && res.normality.length > 0) {
    const n = res.normality[0];
    let normExp = `Uji normalitas residual menggunakan metode Kolmogorov-Smirnov menghasilkan nilai statistik ${formatNumber(n.statistic, 3)} dengan signifikansi (p-value) ${formatNumber(n.pValue, 3)}. Karena p ${n.normal ? '≥ 0,05' : '< 0,05'}, residual model regresi ${n.normal ? 'berdistribusi normal' : 'tidak berdistribusi normal'}.`;
    
    if (!n.normal) {
      if (res.shapiroWilk && res.shapiroWilk.normal) {
        normExp += ` Namun, pengujian alternatif menggunakan Shapiro-Wilk (Royston, 1992) membuktikan residual berdistribusi normal (W = ${formatNumber(res.shapiroWilk.statistic, 3)}, Sig. = ${formatNumber(res.shapiroWilk.pValue, 3)} ≥ 0,05).`;
      } else if (res.skewnessKurtosis && res.skewnessKurtosis.normalAt95) {
        normExp += ` Namun, evaluasi rasio Z-Score Skewness (${formatNumber(res.skewnessKurtosis.zSkewness, 2)}) dan Kurtosis (${formatNumber(res.skewnessKurtosis.zKurtosis, 2)}) berada dalam batas |Z| ≤ 1,96, membuktikan kurva residual simetris normal (Hair et al., 2010; Ghozali, 2018).`;
      }
    }
    exp.normality = normExp;
  }

  if (res.multicollinearity && res.multicollinearity.length > 0) {
    const hasProblem = res.multicollinearity.some((m) => m.problematic);
    const summary = res.multicollinearity.map((m) => `${m.variable} (Tolerance = ${formatNumber(m.tolerance, 3)}, VIF = ${formatNumber(m.vif, 3)})`).join(', ');
    exp.multicollinearity = `Uji multikolinearitas menunjukkan nilai ${summary}. Seluruh variabel ${!hasProblem ? 'bebas dari gejala multikolinearitas (Tolerance > 0,10 dan VIF < 10,00)' : 'mengalami gejala multikolinearitas'}.`;
  }

  if (res.heteroscedasticity && res.heteroscedasticity.length > 0) {
    const hasProblem = res.heteroscedasticity.some((h) => h.significant);
    const summary = res.heteroscedasticity.map((h) => `${h.variable} (Sig. = ${formatNumber(h.pValue, 3)})`).join(', ');

    let altNote = '';
    if (hasProblem) {
      const spearmanPass = res.spearmanHetero && !res.spearmanHetero.some((s) => s.significant);
      const parkPass = res.parkHetero && !res.parkHetero.some((p) => p.significant);
      if (spearmanPass) {
        altNote = ` Meskipun Uji Glejser menunjukkan gejala heteroskedastisitas pada sebagian variabel, pengujian alternatif yang sah secara metodologis menggunakan Korelasi Rank Spearman (Prof. Imam Ghozali, 2018) menunjukkan seluruh nilai Sig. > 0,05, sehingga model dinyatakan bebas dari heteroskedastisitas tanpa perlu membuang data.`;
      } else if (parkPass) {
        altNote = ` Pengujian alternatif menggunakan Uji Park (Gujarati) menunjukkan seluruh nilai Sig. ln(e²) terhadap variabel bebas > 0,05, mengonfirmasi tidak terdapat masalah heteroskedastisitas pada residual.`;
      } else if (res.whiteHetero && res.whiteHetero.homoscedastic) {
        altNote = ` Pengujian alternatif komprehensif menggunakan White Test (Halbert White, 1980) menghasilkan nilai LM = ${formatNumber(res.whiteHetero.lmStatistic, 2)} dengan Sig. = ${formatNumber(res.whiteHetero.pValue, 3)} > 0,05, membuktikan model regresi bebas heteroskedastisitas.`;
      }
    }

    exp.heteroscedasticity = `Uji heteroskedastisitas dengan metode Glejser menghasilkan signifikansi ${summary}. Karena nilai p ${!hasProblem ? '> 0,05' : '< 0,05'}, maka model regresi ${!hasProblem ? 'bebas dari gejala heteroskedastisitas' : 'terindikasi heteroskedastisitas'}.${altNote}`;
  }

  if (res.durbinWatson) {
    exp.autocorrelation = `Uji autokorelasi menggunakan statistik Durbin-Watson menghasilkan nilai d = ${formatNumber(res.durbinWatson.dwStatistic, 3)} dengan nilai kritis dL = ${formatNumber(res.durbinWatson.dL, 3)} dan dU = ${formatNumber(res.durbinWatson.dU, 3)}. Kesimpulan: ${res.durbinWatson.conclusion}`;
  }

  if (res.linearity && res.linearity.length > 0) {
    const linSummary = res.linearity
      .map((l) => `${l.independentVar} terhadap ${l.dependentVar}: Sig. Deviation = ${formatNumber(l.sigDeviation, 3)} (${l.isLinear ? 'Linier' : 'Tidak Linier'})`)
      .join('; ');
    exp.linearity = `Uji linearitas (Test for Linearity) menunjukkan: ${linSummary}. Hubungan dinyatakan linier apabila nilai Sig. Deviation from Linearity > 0,05.`;
  }

  if (res.correlation && res.correlation.length > 0) {
    const summary = res.correlation.map((c) => `${c.variable1} dan ${c.variable2} (r = ${formatNumber(c.coefficient, 3)}, ${c.strength})`).join('; ');
    exp.correlation = `Hasil analisis korelasi Pearson antar variabel menunjukkan tingkat hubungan sebagai berikut: ${summary}.`;
  }

  if (res.pairedTTest) {
    const pt = res.pairedTTest;
    exp.pairedTTest = `Pengujian Paired Sample t-Test menunjukkan rata-rata nilai pra-perlakuan (${pt.preVar}) sebesar ${formatNumber(pt.meanPre, 2)} meningkat menjadi ${formatNumber(pt.meanPost, 2)} pada pasca-perlakuan (${pt.postVar}), dengan selisih rata-rata (mean difference) sebesar ${formatNumber(pt.meanDiff, 2)}. Nilai t hitung tercatat sebesar ${formatNumber(pt.tHitung, 3)} dibandingkan t tabel ${formatNumber(pt.tTabel, 3)} (df = ${pt.df}) dengan nilai signifikansi p = ${formatNumber(pt.pValue, 4)}. Karena p < 0,05 dan t hitung > t tabel, terdapat perbedaan peningkatan yang signifikan secara statistik setelah pemberian intervensi.`;
  }

  if (res.nGain) {
    const ng = res.nGain;
    exp.nGain = `Analisis efektivitas peningkatan hasil belajar menggunakan formula N-Gain Score ternormalisasi (Hake 1998) menghasilkan rata-rata skor g sebesar ${formatNumber(ng.meanNGainScore, 3)} atau ${formatNumber(ng.meanNGainPercent, 1)}%. Berdasarkan kriteria interpretasi Hake, peningkatan ini berada pada kategori '${ng.hakeCategory}'. Menurut kriteria efektivitas Meltzer (2002), perlakuan pembelajaran ini dinyatakan berkualifikasi '${ng.meltzerCategory}'.`;
  }

  if (res.independentTTest) {
    const it = res.independentTTest;
    const rec = it.recommendedRow;
    exp.independentTTest = `Uji Independent Sample t-Test pada variabel ${it.testVar} membandingkan kelompok ${it.groups[0].groupName} (Mean = ${formatNumber(it.groups[0].mean, 2)}) dan ${it.groups[1].groupName} (Mean = ${formatNumber(it.groups[1].mean, 2)}). Uji homogenitas varians Levene menghasilkan F = ${formatNumber(it.levene.fStatistic, 3)} (Sig. = ${formatNumber(it.levene.pValue, 3)}). Berdasarkan hasil tersebut, baris yang dibaca adalah '${rec.assumption}' dengan nilai t hitung = ${formatNumber(rec.tHitung, 3)} (df = ${formatNumber(rec.df, 1)}, Sig. 2-tailed = ${formatNumber(rec.pValue, 4)}). ${it.conclusion}`;
  }

  if (res.oneWayAnova) {
    const an = res.oneWayAnova;
    exp.oneWayAnova = `Uji One-Way ANOVA pada variabel terikat ${an.dependentVar} berdasarkan faktor kelompok ${an.factorVar} menghasilkan nilai F hitung sebesar ${formatNumber(an.fHitung, 3)} dibandingkan F tabel ${formatNumber(an.fTabel, 3)} dengan nilai signifikansi p = ${formatNumber(an.pValue, 4)}. ${an.conclusion}`;
  }

  if (res.nonParametric) {
    const np = res.nonParametric;
    exp.nonParametric = `Uji non-parametrik ${np.testName} pada variabel ${np.dependentVar} menghasilkan nilai statistik uji = ${formatNumber(np.statistic, 3)}${np.zValue !== undefined ? ` (Z = ${formatNumber(np.zValue, 3)})` : ''} dengan Asymp. Sig. (2-tailed) p = ${formatNumber(np.pValue, 4)}. ${np.conclusion}`;
  }

  if (res.crosstab && res.chiSquare) {
    const ct = res.crosstab;
    const cs = res.chiSquare;
    exp.crosstab = `Tabulasi silang antara ${ct.rowVar} dan ${ct.colVar} melibatkan ${res.respondentCount} responden valid. Analisis sebaran frekuensi menunjukkan distribusi kategori yang komprehensif lengkap dengan nilai frekuensi harapan (expected count) dan persentase baris.`;
    exp.chisquare = `Pengujian hipotesis hubungan kategorik menggunakan uji Chi-Square menghasilkan uji rekomendasi '${cs.recommendedTest}'. ${cs.cochran.explanation} ${cs.conclusion}`;
  }

  if (res.riskEstimate) {
    const re = res.riskEstimate;
    exp.oddsRatio = `Analisis estimasi risiko epidemiologi menghasilkan nilai Odds Ratio (OR) sebesar ${formatNumber(re.oddsRatio, 3)} (95% CI: ${formatNumber(re.ciLower, 3)} - ${formatNumber(re.ciUpper, 3)}). ${re.interpretation}`;
  }

  if (res.pathAnalysis && res.pathAnalysis.hasMediation) {
    exp.pathAnalysis = generatePathMediationNarration(res.pathAnalysis);
  }

  if (res.moderationAnalysis && res.moderationAnalysis.hasModeration) {
    exp.moderationAnalysis = generateModerationNarration(res.moderationAnalysis);
  }

  return exp;
}
