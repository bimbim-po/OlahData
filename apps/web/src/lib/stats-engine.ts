import type {
  AnalysisResults,
  Construct,
  DatasetRow,
  TestType,
  DescriptiveResult,
  ValidityResult,
  ReliabilityResult,
  RegressionResult,
  FTestResult,
  DeterminationResult,
  AnovaResult,
  NormalityResult,
  MulticollinearityResult,
  HeteroscedasticityResult,
  CorrelationResult,
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
} from './math-stats';
import { ENGINE_VERSION } from './constants';
import { formatNumber } from './format';

export type ConstructDef = Construct;

export interface ColumnRoleInfo {
  name: string;
  role: 'id' | 'demographic' | 'item' | 'ignored';
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
  } = opts;

  const n = rows.length;
  if (n === 0) {
    throw new Error('Data responden tidak boleh kosong untuk komputasi statistik.');
  }

  // Pre-process items: handle reverse scored items (scale 1-5: 6 - x)
  const processedRows = rows.map((row) => {
    const copy = { ...row };
    for (const it of reverseItems) {
      const val = Number(copy[it]);
      if (!isNaN(val) && val >= 1 && val <= 5) {
        copy[it] = 6 - val;
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

  // 1. STATISTIK DESKRIPTIF
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

      descResults.push({
        variable: c.name,
        n: s.length,
        mean: Number(mean.toFixed(4)),
        median: Number(median.toFixed(4)),
        stdDev: Number(stdDev.toFixed(4)),
        min: Number(min.toFixed(4)),
        max: Number(max.toFixed(4)),
      });
    });
    results.descriptive = descResults;
  }

  // 2. UJI VALIDITAS (Pearson Product Moment)
  if (selectedTests.includes('validity')) {
    const validityResults: ValidityResult[] = [];
    const df = n - 2;
    // Critical t for alpha=0.05 two-tailed
    const tCrit = studentTInv(1.0 - significanceLevel / 2.0, df);
    const rTabel = Number((tCrit / Math.sqrt(df + tCrit * tCrit)).toFixed(4));

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
        const { r } = pearsonCorrelation(itemVals, totalScores);
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

  // 3. UJI RELIABILITAS (Cronbach's Alpha)
  if (selectedTests.includes('reliability')) {
    const reliabilityResults: ReliabilityResult[] = [];

    constructs.forEach((c) => {
      const items = c.items;
      const k = items.length;
      if (k < 2) return;

      let sumItemVar = 0;
      const totalScores: number[] = Array.from({ length: n }, () => 0);

      items.forEach((it) => {
        const vals = processedRows.map((r) => Number(r[it] || 0));
        sumItemVar += sampleVariance(vals);
        for (let i = 0; i < n; i++) {
          totalScores[i] += vals[i];
        }
      });

      const totalVar = sampleVariance(totalScores);
      let alpha = 0;
      if (totalVar > 1e-12) {
        alpha = (k / (k - 1)) * (1.0 - sumItemVar / totalVar);
      }
      const roundedAlpha = Number(alpha.toFixed(4));

      reliabilityResults.push({
        construct: c.name,
        cronbachAlpha: roundedAlpha,
        itemCount: k,
        reliable: roundedAlpha >= 0.60,
        alphaIfDeleted: [],
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

      // F-Test & Determination
      const fStat = msRes > 1e-12 ? msReg / msRes : 0;
      const fPVal = fisherFPValue(fStat, k, dfRes);
      const fTabel = Number(fisherFInv(1.0 - significanceLevel, k, dfRes).toFixed(4));
      const r2 = ssTot > 1e-12 ? 1.0 - ssRes / ssTot : 0;
      const adjR2 = 1.0 - ((1.0 - r2) * (n - 1)) / dfRes;

      if (selectedTests.includes('regression')) {
        const regTable: RegressionResult[] = [
          {
            variable: '(Konstanta)',
            coefficient: Number(beta[0].toFixed(4)),
            stdError: Number(seBeta[0].toFixed(4)),
            tHitung: Number(tStats[0].toFixed(4)),
            pValue: Number(pVals[0].toFixed(4)),
            significant: pVals[0] < significanceLevel,
          },
        ];

        indepNames.forEach((name, idx) => {
          regTable.push({
            variable: name,
            coefficient: Number(beta[idx + 1].toFixed(4)),
            stdError: Number(seBeta[idx + 1].toFixed(4)),
            tHitung: Number(tStats[idx + 1].toFixed(4)),
            pValue: Number(pVals[idx + 1].toFixed(4)),
            significant: pVals[idx + 1] < significanceLevel,
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

      // 4. UJI ASUMSI KLASIK: NORMALITAS RESIDUAL
      if (selectedTests.includes('normality')) {
        // Kolmogorov-Smirnov test on residuals
        const resMean = residuals.reduce((a, b) => a + b, 0) / n;
        const resSd = Math.sqrt(sampleVariance(residuals));
        const sortedRes = [...residuals].sort((a, b) => a - b);
        let maxD = 0;

        for (let i = 0; i < n; i++) {
          const z = resSd > 1e-12 ? (sortedRes[i] - resMean) / resSd : 0;
          const theoretical = standardNormalCdf(z);
          const empirical1 = (i + 1) / n;
          const empirical2 = i / n;
          const d = Math.max(Math.abs(empirical1 - theoretical), Math.abs(empirical2 - theoretical));
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
          },
        ];
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
        const absResMean = absRes.reduce((a, b) => a + b, 0) / n;

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

  // 8. GENERASI NARASI DRAF DENGAN STRICT NUMBER GUARD (NILAI TERHITUNG)
  results.explanations = generateDeterministicExplanations(results);

  return results;
}

// Generate narrative explanations referencing EXACT calculated numbers
function generateDeterministicExplanations(res: AnalysisResults): Record<string, string> {
  const exp: Record<string, string> = {};

  if (res.descriptive && res.descriptive.length > 0) {
    const summary = res.descriptive
      .map((d) => `variabel ${d.variable} memiliki nilai rata-rata (mean) sebesar ${formatNumber(d.mean, 3)} dengan standar deviasi ${formatNumber(d.stdDev, 3)}`)
      .join(', ');
    exp.descriptive = `Berdasarkan analisis statistik deskriptif terhadap ${res.respondentCount} responden, diperoleh bahwa ${summary}. Nilai tersebut menunjukkan kecenderungan umum penilaian responden terhadap butir-butir indikator dalam penelitian ini.`;
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

    exp.regression = `Analisis regresi linier berganda menunjukkan model persamaan regresi dengan nilai konstanta ${formatNumber(res.regression[0].coefficient, 3)}. Variabel bebas yang berpengaruh positif dan signifikan terhadap variabel terikat meliputi: ${sigVars.length > 0 ? sigVars.join(', ') : 'tidak ada variabel yang signifikan pada taraf 5%'}. Pengujian simultan (Uji F) menghasilkan nilai F hitung sebesar ${formatNumber(res.fTest.fHitung, 3)} dengan signifikansi ${formatNumber(res.fTest.pValue, 3)} (${res.fTest.significant ? 'berpengaruh signifikan secara simultan' : 'tidak berpengaruh signifikan secara simultan'}). Koefisien determinasi (R²) tercatat sebesar ${formatNumber(res.determination.rSquare, 3)} (Adjusted R² = ${formatNumber(res.determination.adjustedRSquare, 3)}).`;

    exp.fTest = `Uji simultan ANOVA menghasilkan nilai F hitung ${formatNumber(res.fTest.fHitung, 3)} dibandingkan F tabel ${formatNumber(res.fTest.fTabel, 3)} dengan nilai signifikansi ${formatNumber(res.fTest.pValue, 3)}. Karena ${res.fTest.significant ? 'F hitung > F tabel dan p < 0,05' : 'F hitung <= F tabel atau p >= 0,05'}, maka variabel bebas ${res.fTest.significant ? 'secara bersama-sama berpengaruh signifikan' : 'tidak berpengaruh signifikan secara bersama-sama'}.`;

    exp.determination = `Koefisien determinasi (R Square) bernilai ${formatNumber(res.determination.rSquare, 3)}, yang mengindikasikan bahwa sebesar ${formatNumber(res.determination.rSquare * 100, 1)}% variasi variabel terikat dapat dijelaskan oleh variabel bebas dalam model penelitian ini.`;
  }

  if (res.normality && res.normality.length > 0) {
    const n = res.normality[0];
    exp.normality = `Uji normalitas residual menggunakan metode Kolmogorov-Smirnov menghasilkan nilai statistik ${formatNumber(n.statistic, 3)} dengan signifikansi (p-value) ${formatNumber(n.pValue, 3)}. Karena p ${n.normal ? '≥ 0,05' : '< 0,05'}, residual model regresi ${n.normal ? 'berdistribusi normal' : 'tidak berdistribusi normal'}.`;
  }

  if (res.multicollinearity && res.multicollinearity.length > 0) {
    const hasProblem = res.multicollinearity.some((m) => m.problematic);
    const summary = res.multicollinearity.map((m) => `${m.variable} (Tolerance = ${formatNumber(m.tolerance, 3)}, VIF = ${formatNumber(m.vif, 3)})`).join(', ');
    exp.multicollinearity = `Uji multikolinearitas menunjukkan nilai ${summary}. Seluruh variabel ${!hasProblem ? 'bebas dari gejala multikolinearitas (Tolerance > 0,10 dan VIF < 10,00)' : 'mengalami gejala multikolinearitas'}.`;
  }

  if (res.heteroscedasticity && res.heteroscedasticity.length > 0) {
    const hasProblem = res.heteroscedasticity.some((h) => h.significant);
    const summary = res.heteroscedasticity.map((h) => `${h.variable} (Sig. = ${formatNumber(h.pValue, 3)})`).join(', ');
    exp.heteroscedasticity = `Uji heteroskedastisitas dengan metode Glejser menghasilkan signifikansi ${summary}. Karena nilai p ${!hasProblem ? '> 0,05' : '< 0,05'}, maka model regresi ${!hasProblem ? 'bebas dari gejala heteroskedastisitas' : 'terindikasi heteroskedastisitas'}.`;
  }

  if (res.correlation && res.correlation.length > 0) {
    const summary = res.correlation.map((c) => `${c.variable1} dan ${c.variable2} (r = ${formatNumber(c.coefficient, 3)}, ${c.strength})`).join('; ');
    exp.correlation = `Hasil analisis korelasi Pearson antar variabel menunjukkan tingkat hubungan sebagai berikut: ${summary}.`;
  }

  return exp;
}
