import type {
  Construct,
  MediationAnalysisSummary,
  ModerationAnalysisSummary,
  PathSubmodelResult,
  PathCoefficient,
  SobelMediationResult,
  MediationEffectItem,
  MraModelSummary,
  ModerationResultItem,
} from './api/types';
import {
  matrixMultiply,
  matrixTranspose,
  matrixInverse,
  studentTPValueTwoTailed,
  fisherFPValue,
  standardNormalCdf,
} from './math-stats';
import { formatNumber } from './format';

// =============================================================================
// OLS REGRESSION SOLVER UNTUK MODEL JALUR & MRA
// =============================================================================

export interface OLSFitResult {
  n: number;
  k: number;
  dfRes: number;
  dfReg: number;
  rSquare: number;
  adjustedRSquare: number;
  fStatistic: number;
  fPValue: number;
  ssTot: number;
  ssRes: number;
  ssReg: number;
  msRes: number;
  msReg: number;
  constant: {
    b: number;
    se: number;
    t: number;
    pValue: number;
  };
  coefficients: {
    name: string;
    variable: string;
    b: number;
    se: number;
    beta: number; // standardized
    t: number;
    pValue: number;
    significant: boolean;
  }[];
  residuals: number[];
  fittedValues: number[];
  residualError: number; // sqrt(1 - R^2)
}

/**
 * Menyelesaikan regresi OLS linear multivariat secara deterministik.
 * @param y Vektor variabel dependen (panjang n)
 * @param XMat Matriks prediktor ukuran n x k (tanpa kolom 1 konstanta)
 * @param varNames Nama masing-masing prediktor (panjang k)
 */
export function solveOLS(
  y: number[],
  XMat: number[][],
  varNames: string[]
): OLSFitResult {
  const n = y.length;
  const k = varNames.length;
  const dfRes = n - k - 1;
  const dfReg = k;

  if (n <= k + 1 || dfRes <= 0) {
    throw new Error(
      `Jumlah sampel (N = ${n}) tidak mencukupi untuk jumlah prediktor (k = ${k}). Minimal butuh ${k + 2} responden.`
    );
  }

  // Hitung mean dan deviasi standar untuk standarisasi beta
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let ssY = 0;
  for (let i = 0; i < n; i++) ssY += (y[i] - meanY) ** 2;
  const sdY = Math.sqrt(ssY / (n - 1)) || 1e-9;

  const meanX: number[] = [];
  const sdX: number[] = [];
  for (let j = 0; j < k; j++) {
    let sumX = 0;
    for (let i = 0; i < n; i++) sumX += XMat[i][j];
    const m = sumX / n;
    meanX.push(m);

    let ssX = 0;
    for (let i = 0; i < n; i++) ssX += (XMat[i][j] - m) ** 2;
    sdX.push(Math.sqrt(ssX / (n - 1)) || 1e-9);
  }

  // Susun matriks desain lengkap dengan intercept [1, x1, x2, ...]
  const fullX: number[][] = Array.from({ length: n }, (_, i) => [
    1.0,
    ...XMat[i],
  ]);

  const XT = matrixTranspose(fullX);
  const XTX = matrixMultiply(XT, fullX);

  // Inversi dengan regularisasi ridge minimal jika singular
  let XTXInv: number[][];
  try {
    XTXInv = matrixInverse(XTX);
  } catch {
    const ridgeXTX = XTX.map((row, rIdx) =>
      row.map((val, cIdx) => (rIdx === cIdx ? val + 1e-6 : val))
    );
    XTXInv = matrixInverse(ridgeXTX);
  }

  const XTy = matrixMultiply(XT, y.map((v) => [v]));
  const betaMat = matrixMultiply(XTXInv, XTy);
  const beta = betaMat.map((r) => r[0]);

  // Prediksi & Residual
  const fittedValues: number[] = [];
  const residuals: number[] = [];
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < n; i++) {
    let pred = beta[0];
    for (let j = 0; j < k; j++) {
      pred += beta[j + 1] * XMat[i][j];
    }
    fittedValues.push(pred);
    const res = y[i] - pred;
    residuals.push(res);
    ssTot += (y[i] - meanY) ** 2;
    ssRes += res * res;
  }

  const ssReg = Math.max(0, ssTot - ssRes);
  const rSquare = ssTot > 0 ? Math.min(1.0, Math.max(0.0, 1.0 - ssRes / ssTot)) : 0.0;
  const adjustedRSquare =
    dfRes > 0 ? 1.0 - (1.0 - rSquare) * ((n - 1) / dfRes) : rSquare;

  const msRes = dfRes > 0 ? ssRes / dfRes : 0.0;
  const msReg = dfReg > 0 ? ssReg / dfReg : 0.0;
  const fStatistic = msRes > 1e-12 ? msReg / msRes : 0.0;
  const fPValue = dfReg > 0 && dfRes > 0 ? fisherFPValue(fStatistic, dfReg, dfRes) : 1.0;

  // Koefisien, SE, t-statistic & p-value
  const constantSE = Math.sqrt(Math.max(0, msRes * XTXInv[0][0]));
  const constantT = constantSE > 1e-12 ? beta[0] / constantSE : 0.0;
  const constantP = studentTPValueTwoTailed(constantT, dfRes);

  const coefficients = varNames.map((name, idx) => {
    const b = beta[idx + 1];
    const se = Math.sqrt(Math.max(0, msRes * XTXInv[idx + 1][idx + 1]));
    const t = se > 1e-12 ? b / se : 0.0;
    const pValue = studentTPValueTwoTailed(t, dfRes);
    const betaStd = b * (sdX[idx] / sdY);
    const significant = pValue < 0.05;

    return {
      name,
      variable: name,
      b,
      se,
      beta: betaStd,
      t,
      pValue,
      significant,
    };
  });

  const residualError = Math.sqrt(Math.max(0, 1.0 - rSquare));

  return {
    n,
    k,
    dfRes,
    dfReg,
    rSquare,
    adjustedRSquare,
    fStatistic,
    fPValue,
    ssTot,
    ssRes,
    ssReg,
    msRes,
    msReg,
    constant: {
      b: beta[0],
      se: constantSE,
      t: constantT,
      pValue: constantP,
    },
    coefficients,
    residuals,
    fittedValues,
    residualError,
  };
}

// =============================================================================
// MESIN ANALISIS JALUR (PATH ANALYSIS) & UJI SOBEL
// =============================================================================

/**
 * Menjalankan analisis jalur (Path Analysis) 2 sub-struktur dan pengujian Sobel
 * untuk model variabel mediasi/intervening (X -> Z -> Y).
 */
export function computePathAnalysisAndSobel(
  constructScores: Record<string, number[]>,
  constructs: Construct[],
  alpha: number = 0.05
): MediationAnalysisSummary {
  const independentConstructs = constructs.filter((c) => c.role === 'independent');
  const mediatorConstructs = constructs.filter((c) => c.role === 'mediator');
  const dependentConstructs = constructs.filter((c) => c.role === 'dependent');

  if (
    independentConstructs.length === 0 ||
    mediatorConstructs.length === 0 ||
    dependentConstructs.length === 0
  ) {
    return {
      hasMediation: false,
      mediatorCount: 0,
      submodels: [],
      sobelResults: [],
      effectTable: [],
    };
  }

  const targetDep = dependentConstructs[0].name;
  const indepNames = independentConstructs.map((c) => c.name);
  const n = constructScores[targetDep]?.length || 0;

  if (n < 5) {
    return {
      hasMediation: false,
      mediatorCount: 0,
      submodels: [],
      sobelResults: [],
      effectTable: [],
    };
  }

  const submodels: PathSubmodelResult[] = [];
  const sobelResults: SobelMediationResult[] = [];
  const effectTable: MediationEffectItem[] = [];

  // Evaluasi untuk setiap variabel mediasi (Z)
  mediatorConstructs.forEach((medConstruct, mIdx) => {
    const medName = medConstruct.name;

    // -------------------------------------------------------------------------
    // SUB-STRUKTUR 1: Regresi X1, X2, ... -> Z
    // -------------------------------------------------------------------------
    const ySub1 = constructScores[medName];
    const xSub1Mat: number[][] = Array.from({ length: n }, (_, i) =>
      indepNames.map((xName) => constructScores[xName][i])
    );

    const fitSub1 = solveOLS(ySub1, xSub1Mat, indepNames);

    const submodel1Coeffs: PathCoefficient[] = fitSub1.coefficients.map((c) => ({
      path: `${c.name} → ${medName}`,
      fromVar: c.name,
      toVar: medName,
      unstandardizedB: c.b,
      se: c.se,
      standardizedBeta: c.beta,
      tStatistic: c.t,
      pValue: c.pValue,
      significant: c.pValue < alpha,
    }));

    submodels.push({
      equationName: `Sub-struktur 1.${mIdx + 1}: Pengaruh ${indepNames.join(', ')} terhadap ${medName}`,
      submodelIndex: 1,
      dependentVar: medName,
      independentVars: indepNames,
      constant: fitSub1.constant,
      coefficients: submodel1Coeffs,
      rSquare: fitSub1.rSquare,
      adjustedRSquare: fitSub1.adjustedRSquare,
      fStatistic: fitSub1.fStatistic,
      fPValue: fitSub1.fPValue,
      residualError: fitSub1.residualError,
    });

    // -------------------------------------------------------------------------
    // SUB-STRUKTUR 2: Regresi X1, X2, ..., Z -> Y
    // -------------------------------------------------------------------------
    const ySub2 = constructScores[targetDep];
    const sub2PredictorNames = [...indepNames, medName];
    const xSub2Mat: number[][] = Array.from({ length: n }, (_, i) => [
      ...indepNames.map((xName) => constructScores[xName][i]),
      constructScores[medName][i],
    ]);

    const fitSub2 = solveOLS(ySub2, xSub2Mat, sub2PredictorNames);

    const submodel2Coeffs: PathCoefficient[] = fitSub2.coefficients.map((c) => ({
      path: `${c.name} → ${targetDep}`,
      fromVar: c.name,
      toVar: targetDep,
      unstandardizedB: c.b,
      se: c.se,
      standardizedBeta: c.beta,
      tStatistic: c.t,
      pValue: c.pValue,
      significant: c.pValue < alpha,
    }));

    submodels.push({
      equationName: `Sub-struktur 2.${mIdx + 1}: Pengaruh ${sub2PredictorNames.join(', ')} terhadap ${targetDep}`,
      submodelIndex: 2,
      dependentVar: targetDep,
      independentVars: sub2PredictorNames,
      constant: fitSub2.constant,
      coefficients: submodel2Coeffs,
      rSquare: fitSub2.rSquare,
      adjustedRSquare: fitSub2.adjustedRSquare,
      fStatistic: fitSub2.fStatistic,
      fPValue: fitSub2.fPValue,
      residualError: fitSub2.residualError,
    });

    // -------------------------------------------------------------------------
    // HITUNG EFEK LANGSUNG, TIDAK LANGSUNG, TOTAL & UJI SOBEL PER JALUR (X_j -> Z -> Y)
    // -------------------------------------------------------------------------
    // Koefisien path b (Z -> Y pada Submodel 2)
    const coeffB = fitSub2.coefficients.find((c) => c.name === medName);
    const b = coeffB ? coeffB.b : 0.0;
    const s_b = coeffB ? coeffB.se : 1e-9;
    const beta_b = coeffB ? coeffB.beta : 0.0;
    const p_b = coeffB ? coeffB.pValue : 1.0;

    indepNames.forEach((xName) => {
      // Koefisien path a (X_j -> Z pada Submodel 1)
      const coeffA = fitSub1.coefficients.find((c) => c.name === xName);
      const a = coeffA ? coeffA.b : 0.0;
      const s_a = coeffA ? coeffA.se : 1e-9;
      const beta_a = coeffA ? coeffA.beta : 0.0;
      const p_a = coeffA ? coeffA.pValue : 1.0;

      // Koefisien path c' (X_j -> Y pada Submodel 2 / Direct Effect)
      const coeffCPrime = fitSub2.coefficients.find((c) => c.name === xName);
      const cPrime = coeffCPrime ? coeffCPrime.b : 0.0;
      const s_cPrime = coeffCPrime ? coeffCPrime.se : 1e-9;
      const beta_cPrime = coeffCPrime ? coeffCPrime.beta : 0.0;
      const p_cPrime = coeffCPrime ? coeffCPrime.pValue : 1.0;

      // Efek Terstandarisasi
      const directEffect = beta_cPrime;
      const indirectEffect = beta_a * beta_b;
      const totalEffect = directEffect + indirectEffect;

      // Efek Unstandardized
      const unstandardizedIndirectEffect = a * b;
      const unstandardizedTotalEffect = cPrime + unstandardizedIndirectEffect;

      // Rumus Sobel Baku: z = (a * b) / sqrt(b^2 * s_a^2 + a^2 * s_b^2)
      const varianceIndirect = (b * b) * (s_a * s_a) + (a * a) * (s_b * s_b);
      const sobelSE = Math.sqrt(Math.max(1e-12, varianceIndirect));
      const sobelZ = (a * b) / sobelSE;

      // Nilai p-value dua arah dari distribusi normal baku N(0, 1)
      const sobelPValue = 2.0 * (1.0 - standardNormalCdf(Math.abs(sobelZ)));
      const isSobelSignificant = sobelPValue < alpha;

      // Penentuan Kategori Mediasi (Baron & Kenny, 1986; Preacher & Hayes, 2004; Ghozali, 2018)
      let mediationType: 'Full Mediation' | 'Partial Mediation' | 'No Mediation';
      let conclusion: string;

      if (isSobelSignificant) {
        if (p_cPrime < alpha) {
          mediationType = 'Partial Mediation';
          conclusion = `Variabel ${medName} terbukti berperan sebagai Mediasi Parsial (Partial Mediation) antara ${xName} dan ${targetDep}. Pengaruh langsung tetap signifikan (p = ${formatNumber(p_cPrime, 3)}), dan pengaruh tidak langsung via ${medName} juga signifikan (Z = ${formatNumber(sobelZ, 3)}, p = ${formatNumber(sobelPValue, 4)}).`;
        } else {
          mediationType = 'Full Mediation';
          conclusion = `Variabel ${medName} terbukti berperan sebagai Mediasi Penuh (Full Mediation) antara ${xName} dan ${targetDep}. Pengaruh langsung ${xName} terhadap ${targetDep} menjadi tidak signifikan (p = ${formatNumber(p_cPrime, 3)}), membuktikan bahwa pengaruh ${xName} sepenuhnya disalurkan melalui ${medName} (Z = ${formatNumber(sobelZ, 3)}, p = ${formatNumber(sobelPValue, 4)}).`;
        }
      } else {
        mediationType = 'No Mediation';
        conclusion = `Variabel ${medName} tidak terbukti memediasi secara signifikan hubungan antara ${xName} dan ${targetDep} karena nilai Z-hitung Sobel (${formatNumber(sobelZ, 3)}) < 1,96 dan p-value (${formatNumber(sobelPValue, 4)}) ≥ 0,05.`;
      }

      // Rasio VAF (Variance Accounted For)
      const denomVaf = Math.abs(directEffect) + Math.abs(indirectEffect);
      const vafRatio = denomVaf > 1e-12 ? Math.min(1.0, Math.abs(indirectEffect) / denomVaf) : 0.0;

      const sobelItem: SobelMediationResult = {
        independentVar: xName,
        mediatorVar: medName,
        dependentVar: targetDep,
        pathA: {
          b: a,
          se: s_a,
          beta: beta_a,
          t: coeffA ? coeffA.t : 0.0,
          pValue: p_a,
          significant: p_a < alpha,
        },
        pathB: {
          b,
          se: s_b,
          beta: beta_b,
          t: coeffB ? coeffB.t : 0.0,
          pValue: p_b,
          significant: p_b < alpha,
        },
        pathCPrime: {
          b: cPrime,
          se: s_cPrime,
          beta: beta_cPrime,
          t: coeffCPrime ? coeffCPrime.t : 0.0,
          pValue: p_cPrime,
          significant: p_cPrime < alpha,
        },
        directEffect,
        indirectEffect,
        totalEffect,
        unstandardizedIndirectEffect,
        unstandardizedTotalEffect,
        sobelSE,
        sobelZ,
        sobelPValue,
        significant: isSobelSignificant,
        mediationType,
        vafRatio,
        conclusion,
      };

      sobelResults.push(sobelItem);

      effectTable.push({
        pathDescription: `${xName} → ${medName} → ${targetDep}`,
        independentVar: xName,
        mediatorVar: medName,
        dependentVar: targetDep,
        directEffect,
        indirectEffect,
        totalEffect,
        sobelZ,
        sobelP: sobelPValue,
        mediationType,
        conclusion,
      });
    });
  });

  return {
    hasMediation: true,
    mediatorCount: mediatorConstructs.length,
    submodels,
    sobelResults,
    effectTable,
  };
}

// =============================================================================
// MESIN MODERATED REGRESSION ANALYSIS / MRA (MODERASI)
// =============================================================================

/**
 * Menjalankan Moderated Regression Analysis (MRA) 2 model hierarkis
 * untuk menguji apakah variabel Z memoderasi pengaruh X terhadap Y.
 */
export function computeModeratedRegression(
  constructScores: Record<string, number[]>,
  constructs: Construct[],
  alpha: number = 0.05
): ModerationAnalysisSummary {
  const independentConstructs = constructs.filter((c) => c.role === 'independent');
  const moderatorConstructs = constructs.filter((c) => c.role === 'moderator');
  const dependentConstructs = constructs.filter((c) => c.role === 'dependent');

  if (
    independentConstructs.length === 0 ||
    moderatorConstructs.length === 0 ||
    dependentConstructs.length === 0
  ) {
    return {
      hasModeration: false,
      moderatorCount: 0,
      results: [],
    };
  }

  const targetDep = dependentConstructs[0].name;
  const n = constructScores[targetDep]?.length || 0;

  if (n < 6) {
    return {
      hasModeration: false,
      moderatorCount: 0,
      results: [],
    };
  }

  const results: ModerationResultItem[] = [];

  // Uji pasangan masing-masing X dan Moderator Z
  independentConstructs.forEach((indepConstruct) => {
    const xName = indepConstruct.name;
    const xVals = constructScores[xName];

    moderatorConstructs.forEach((modConstruct) => {
      const zName = modConstruct.name;
      const zVals = constructScores[zName];
      const yVals = constructScores[targetDep];

      // Bentuk variabel interaksi perkalian (X * Z)
      const interactionTermName = `${xName} × ${zName}`;
      const interactionVals: number[] = Array.from({ length: n }, (_, i) => xVals[i] * zVals[i]);

      // -----------------------------------------------------------------------
      // MODEL 1: Efek Utama (Y = beta0 + beta1*X + beta2*Z + e)
      // -----------------------------------------------------------------------
      const xMatModel1: number[][] = Array.from({ length: n }, (_, i) => [
        xVals[i],
        zVals[i],
      ]);
      const fitModel1 = solveOLS(yVals, xMatModel1, [xName, zName]);

      const model1Summary: MraModelSummary = {
        modelNumber: 1,
        modelName: `Model 1: Efek Utama (${xName}, ${zName})`,
        variables: [xName, zName],
        constant: fitModel1.constant,
        coefficients: fitModel1.coefficients.map((c) => ({
          variable: c.variable || c.name,
          b: c.b,
          se: c.se,
          beta: c.beta,
          t: c.t,
          pValue: c.pValue,
          significant: c.significant,
        })),
        rSquare: fitModel1.rSquare,
        adjustedRSquare: fitModel1.adjustedRSquare,
        fStatistic: fitModel1.fStatistic,
        fPValue: fitModel1.fPValue,
      };

      // -----------------------------------------------------------------------
      // MODEL 2: Efek Moderasi Interaksi (Y = beta0 + beta1*X + beta2*Z + beta3*(X*Z) + e)
      // -----------------------------------------------------------------------
      const xMatModel2: number[][] = Array.from({ length: n }, (_, i) => [
        xVals[i],
        zVals[i],
        interactionVals[i],
      ]);
      const fitModel2 = solveOLS(yVals, xMatModel2, [
        xName,
        zName,
        interactionTermName,
      ]);

      const model2Summary: MraModelSummary = {
        modelNumber: 2,
        modelName: `Model 2: Efek Interaksi MRA (${xName}, ${zName}, ${interactionTermName})`,
        variables: [xName, zName, interactionTermName],
        constant: fitModel2.constant,
        coefficients: fitModel2.coefficients.map((c) => ({
          variable: c.variable || c.name,
          b: c.b,
          se: c.se,
          beta: c.beta,
          t: c.t,
          pValue: c.pValue,
          significant: c.significant,
        })),
        rSquare: fitModel2.rSquare,
        adjustedRSquare: fitModel2.adjustedRSquare,
        fStatistic: fitModel2.fStatistic,
        fPValue: fitModel2.fPValue,
      };

      // -----------------------------------------------------------------------
      // UJI PERUBAHAN R2 (DELTA R^2) & F-CHANGE
      // -----------------------------------------------------------------------
      const rSquareChange = Math.max(0.0, fitModel2.rSquare - fitModel1.rSquare);
      const dfRes2 = fitModel2.dfRes;
      const fChange =
        dfRes2 > 0 && fitModel2.rSquare < 1.0
          ? (rSquareChange / 1.0) / ((1.0 - fitModel2.rSquare) / dfRes2)
          : 0.0;
      const fChangePValue = fisherFPValue(fChange, 1, dfRes2);

      // Koefisien interaksi pada Model 2
      const coeffInteraction = fitModel2.coefficients.find(
        (c) => c.name === interactionTermName
      )!;
      const interactionB = coeffInteraction.b;
      const interactionSE = coeffInteraction.se;
      const interactionBeta = coeffInteraction.beta;
      const interactionT = coeffInteraction.t;
      const interactionPValue = coeffInteraction.pValue;
      const interactionSignificant = interactionPValue < alpha;

      // Koefisien utama Z pada Model 2
      const coeffZ = fitModel2.coefficients.find((c) => c.name === zName)!;
      const mainModeratorSignificant = coeffZ.pValue < alpha;

      // -----------------------------------------------------------------------
      // KLASIFIKASI TIPE MODERASI (Sharma et al., 1981; Ghozali, 2018)
      // -----------------------------------------------------------------------
      let moderatorType:
        | 'Pure Moderator'
        | 'Quasi Moderator'
        | 'Predictor Moderator'
        | 'Homologiser (Bukan Moderasi)';
      let conclusion: string;

      if (!mainModeratorSignificant && interactionSignificant) {
        moderatorType = 'Pure Moderator';
        conclusion = `Variabel ${zName} terbukti berperan sebagai Pure Moderator (Moderasi Murni). Koefisien efek utama ${zName} tidak signifikan (p = ${formatNumber(coeffZ.pValue, 3)}), namun koefisien interaksi ${interactionTermName} terbukti signifikan (t = ${formatNumber(interactionT, 3)}, p = ${formatNumber(interactionPValue, 4)}). Artinya ${zName} murni memoderasi hubungan ${xName} terhadap ${targetDep} tanpa bertindak sebagai variabel independen penjelas langsung.`;
      } else if (mainModeratorSignificant && interactionSignificant) {
        moderatorType = 'Quasi Moderator';
        conclusion = `Variabel ${zName} terbukti berperan sebagai Quasi Moderator (Moderasi Semu). Baik efek utama ${zName} (p = ${formatNumber(coeffZ.pValue, 3)}) maupun efek interaksi ${interactionTermName} (t = ${formatNumber(interactionT, 3)}, p = ${formatNumber(interactionPValue, 4)}) terbukti signifikan. Artinya ${zName} berfungsi ganda: sebagai prediktor langsung sekaligus memoderasi hubungan ${xName} terhadap ${targetDep}.`;
      } else if (mainModeratorSignificant && !interactionSignificant) {
        moderatorType = 'Predictor Moderator';
        conclusion = `Variabel ${zName} bertindak sebagai Prediktor Moderasi (variabel independen biasa). Efek interaksi ${interactionTermName} tidak signifikan (t = ${formatNumber(interactionT, 3)}, p = ${formatNumber(interactionPValue, 4)} ≥ 0,05), sehingga ${zName} hanya berpengaruh langsung terhadap ${targetDep} dan tidak terbukti memoderasi pengaruh ${xName}.`;
      } else {
        moderatorType = 'Homologiser (Bukan Moderasi)';
        conclusion = `Variabel ${zName} bertindak sebagai Homologiser (Bukan Moderasi). Baik efek utama ${zName} maupun efek interaksi ${interactionTermName} tidak menunjukkan pengaruh signifikan terhadap ${targetDep} (p ≥ 0,05).`;
      }

      // Sifat Pengaruh Moderasi
      let moderationDirection: 'Memperkuat' | 'Memperlemah' | 'Tidak Berpengaruh';
      if (interactionSignificant) {
        moderationDirection = interactionB >= 0 ? 'Memperkuat' : 'Memperlemah';
      } else {
        moderationDirection = 'Tidak Berpengaruh';
      }

      results.push({
        independentVar: xName,
        moderatorVar: zName,
        dependentVar: targetDep,
        interactionTermName,
        model1: model1Summary,
        model2: model2Summary,
        rSquareChange,
        fChange,
        fChangePValue,
        interactionB,
        interactionSE,
        interactionBeta,
        interactionT,
        interactionPValue,
        interactionSignificant,
        mainModeratorSignificant,
        moderatorType,
        moderationDirection,
        conclusion,
      });
    });
  });

  return {
    hasModeration: true,
    moderatorCount: moderatorConstructs.length,
    results,
  };
}

// =============================================================================
// GENERATOR DRAF NARASI BAB 4 BAKU UNTUK MEDIASI & MODERASI
// =============================================================================

export function generatePathMediationNarration(
  summary: MediationAnalysisSummary
): string {
  if (!summary.hasMediation || summary.sobelResults.length === 0) {
    return 'Analisis mediasi tidak dijalankan karena model penelitian tidak menetapkan variabel mediasi/intervening.';
  }

  const paragraphs: string[] = [];

  summary.sobelResults.forEach((sobel) => {
    const x = sobel.independentVar;
    const z = sobel.mediatorVar;
    const y = sobel.dependentVar;

    const pathASig = sobel.pathA.significant ? 'signifikan' : 'tidak signifikan';
    const pathBSig = sobel.pathB.significant ? 'signifikan' : 'tidak signifikan';
    const pathCSig = sobel.pathCPrime.significant ? 'signifikan' : 'tidak signifikan';

    paragraphs.push(
      `Pengujian analisis jalur (Path Analysis) pada model mediasi ${x} → ${z} → ${y} dilakukan melalui dua sub-struktur regresi. Pada Sub-struktur 1, variabel ${x} berpengaruh ${pathASig} terhadap variabel mediasi ${z} dengan nilai koefisien jalur β = ${formatNumber(sobel.pathA.beta, 3)} (t = ${formatNumber(sobel.pathA.t, 3)}, p = ${sobel.pathA.pValue < 0.001 ? '< 0,001' : formatNumber(sobel.pathA.pValue, 3)}). Selanjutnya pada Sub-struktur 2, variabel mediasi ${z} berpengaruh ${pathBSig} terhadap variabel terikat ${y} setelah mengontrol ${x} dengan koefisien jalur β = ${formatNumber(sobel.pathB.beta, 3)} (t = ${formatNumber(sobel.pathB.t, 3)}, p = ${sobel.pathB.pValue < 0.001 ? '< 0,001' : formatNumber(sobel.pathB.pValue, 3)}). Pengaruh langsung ${x} terhadap ${y} diperoleh koefisien jalur β = ${formatNumber(sobel.directEffect, 3)} (t = ${formatNumber(sobel.pathCPrime.t, 3)}, p = ${sobel.pathCPrime.pValue < 0.001 ? '< 0,001' : formatNumber(sobel.pathCPrime.pValue, 3)}).`
    );

    paragraphs.push(
      `Berdasarkan hasil dekomposisi pengaruh, diperoleh nilai pengaruh langsung (Direct Effect) sebesar ${formatNumber(sobel.directEffect, 3)}, sedangkan pengaruh tidak langsung (Indirect Effect) ${x} terhadap ${y} melalui ${z} adalah sebesar ${formatNumber(sobel.indirectEffect, 3)} (hasil perkalian koefisien β = ${formatNumber(sobel.pathA.beta, 3)} × ${formatNumber(sobel.pathB.beta, 3)}). Dengan demikian, pengaruh total (Total Effect) yang diberikan adalah sebesar ${formatNumber(sobel.totalEffect, 3)}.`
    );

    paragraphs.push(
      `Untuk menguji signifikansi peran mediasi secara statistik, dilakukan Uji Sobel (Sobel Test) sesuai rekomendasi Baron & Kenny (1986) dan Prof. Dr. Imam Ghozali (2018). Hasil kalkulasi menghasilkan statistik Z-hitung sebesar ${formatNumber(sobel.sobelZ, 3)} dengan standard error ${formatNumber(sobel.sobelSE, 4)} dan signifikansi p-value sebesar ${sobel.sobelPValue < 0.001 ? '< 0,001' : formatNumber(sobel.sobelPValue, 4)}. ${
        sobel.significant
          ? `Karena nilai |Z| = ${formatNumber(Math.abs(sobel.sobelZ), 3)} > 1,96 dan p < 0,05, maka hipotesis yang menyatakan bahwa ${z} memediasi pengaruh ${x} terhadap ${y} diterima secara signifikan. Mengingat pengaruh langsung ${x} terhadap ${y} bernilai ${pathCSig}, maka sifat mediasi yang terbentuk dikategorikan sebagai ${sobel.mediationType === 'Partial Mediation' ? 'Mediasi Parsial (Partial Mediation)' : 'Mediasi Penuh (Full Mediation)'}.`
          : `Karena nilai |Z| = ${formatNumber(Math.abs(sobel.sobelZ), 3)} < 1,96 dan p ≥ 0,05, maka disimpulkan bahwa variabel ${z} tidak terbukti memediasi secara signifikan hubungan antara ${x} dan ${y}.`
      }`
    );
  });

  return paragraphs.join('\n\n');
}

export function generateModerationNarration(
  summary: ModerationAnalysisSummary
): string {
  if (!summary.hasModeration || summary.results.length === 0) {
    return 'Analisis regresi moderasi (MRA) tidak dijalankan karena model penelitian tidak menetapkan variabel moderasi.';
  }

  const paragraphs: string[] = [];

  summary.results.forEach((mra) => {
    const x = mra.independentVar;
    const z = mra.moderatorVar;
    const y = mra.dependentVar;
    const term = mra.interactionTermName;

    paragraphs.push(
      `Pengujian hipotesis moderasi dilakukan dengan metode Moderated Regression Analysis (MRA) hierarkis dua tahap (Sharma et al., 1981; Ghozali, 2018). Pada Model 1 (tanpa interaksi), variabel independen ${x} dan variabel moderator ${z} secara bersama-sama menghasilkan nilai R² sebesar ${formatNumber(mra.model1.rSquare, 3)} (F = ${formatNumber(mra.model1.fStatistic, 3)}, p = ${mra.model1.fPValue < 0.001 ? '< 0,001' : formatNumber(mra.model1.fPValue, 3)}).`
    );

    paragraphs.push(
      `Setelah variabel interaksi perkalian (${term}) dimasukkan pada Model 2, nilai R² meningkat menjadi ${formatNumber(mra.model2.rSquare, 3)}, yang menunjukkan adanya peningkatan koefisien determinasi (ΔR²) sebesar ${formatNumber(mra.rSquareChange, 3)} (${(mra.rSquareChange * 100).toFixed(2)}%) dengan nilai F-change sebesar ${formatNumber(mra.fChange, 3)} (p = ${mra.fChangePValue < 0.001 ? '< 0,001' : formatNumber(mra.fChangePValue, 3)}).`
    );

    paragraphs.push(
      `Pada Model 2, koefisien regresi variabel interaksi bernilai B = ${formatNumber(mra.interactionB, 3)} (β = ${formatNumber(mra.interactionBeta, 3)}, t = ${formatNumber(mra.interactionT, 3)}, p = ${mra.interactionPValue < 0.001 ? '< 0,001' : formatNumber(mra.interactionPValue, 4)}). ${
        mra.interactionSignificant
          ? `Karena nilai p < 0,05, efek moderasi dinyatakan signifikan secara statistik. Mengingat efek utama ${z} bernilai ${mra.mainModeratorSignificant ? 'signifikan' : 'tidak signifikan'}, maka variabel ${z} terbukti diklasifikasikan sebagai ${mra.moderatorType}. Arah koefisien interaksi bertanda ${mra.interactionB >= 0 ? 'positif' : 'negatif'}, yang menunjukkan bahwa keberadaan variabel ${z} terbukti ${mra.interactionB >= 0 ? 'memperkuat' : 'memperlemah'} pengaruh ${x} terhadap ${y}.`
          : `Karena nilai signifikansi p-value interaksi (p = ${formatNumber(mra.interactionPValue, 4)}) ≥ 0,05, maka hipotesis moderasi ditolak. Variabel ${z} diklasifikasikan sebagai ${mra.moderatorType} dan tidak terbukti memoderasi hubungan antara ${x} dan ${y}.`
      }`
    );
  });

  return paragraphs.join('\n\n');
}
