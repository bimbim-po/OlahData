import fs from 'fs';

const file = 'C:/Users/ThinkPad X1 Yoga/.gemini/antigravity/scratch/olahdata/apps/web/src/lib/api/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "export type VariableRole = 'independent' | 'dependent';",
  "export type VariableRole = 'independent' | 'dependent' | 'mediator' | 'moderator';"
);

content = content.replace(
  "  | 'odds-ratio';",
  "  | 'odds-ratio'\n  | 'mediation'\n  | 'moderation';"
);

content = content.replace(
  '  spearmanConstructMatrix?: SpearmanCorrelationItem[];',
  '  spearmanConstructMatrix?: SpearmanCorrelationItem[];\n  pathAnalysis?: MediationAnalysisSummary;\n  moderationAnalysis?: ModerationAnalysisSummary;'
);

const newTypes = `
// =============================================================================
// ANALISIS JALUR (PATH ANALYSIS) & UJI SOBEL (MEDIASI)
// =============================================================================

export interface PathCoefficient {
  path: string; // e.g. 'X1 -> Z'
  fromVar: string;
  toVar: string;
  unstandardizedB: number;
  se: number;
  standardizedBeta: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
}

export interface PathSubmodelResult {
  equationName: string; // e.g. 'Sub-struktur 1: Pengaruh X terhadap Z'
  submodelIndex: number;
  dependentVar: string;
  independentVars: string[];
  constant: {
    b: number;
    se: number;
    t: number;
    pValue: number;
  };
  coefficients: PathCoefficient[];
  rSquare: number;
  adjustedRSquare: number;
  fStatistic: number;
  fPValue: number;
  residualError: number; // e = sqrt(1 - R^2)
}

export interface SobelMediationResult {
  independentVar: string; // X
  mediatorVar: string; // Z
  dependentVar: string; // Y
  pathA: {
    b: number; // a
    se: number; // s_a
    beta: number;
    t: number;
    pValue: number;
    significant: boolean;
  };
  pathB: {
    b: number; // b
    se: number; // s_b
    beta: number;
    t: number;
    pValue: number;
    significant: boolean;
  };
  pathCPrime: {
    b: number; // c'
    se: number;
    beta: number;
    t: number;
    pValue: number;
    significant: boolean;
  };
  directEffect: number; // standardized beta X -> Y
  indirectEffect: number; // beta_a * beta_b
  totalEffect: number; // directEffect + indirectEffect
  unstandardizedIndirectEffect: number; // a * b
  unstandardizedTotalEffect: number; // c' + (a * b)
  sobelSE: number; // sqrt(b^2 * s_a^2 + a^2 * s_b^2)
  sobelZ: number; // (a * b) / sobelSE
  sobelPValue: number; // 2 * (1 - Phi(|z|))
  significant: boolean;
  mediationType: 'Full Mediation' | 'Partial Mediation' | 'No Mediation';
  vafRatio: number; // Variance Accounted For: Indirect / Total (0 to 1)
  conclusion: string;
}

export interface MediationEffectItem {
  pathDescription: string;
  independentVar: string;
  mediatorVar: string;
  dependentVar: string;
  directEffect: number;
  indirectEffect: number;
  totalEffect: number;
  sobelZ: number;
  sobelP: number;
  mediationType: 'Full Mediation' | 'Partial Mediation' | 'No Mediation';
  conclusion: string;
}

export interface MediationAnalysisSummary {
  hasMediation: boolean;
  mediatorCount: number;
  submodels: PathSubmodelResult[];
  sobelResults: SobelMediationResult[];
  effectTable: MediationEffectItem[];
}

// =============================================================================
// MODERATED REGRESSION ANALYSIS / MRA (MODERASI)
// =============================================================================

export interface MraModelSummary {
  modelNumber: number; // 1 or 2
  modelName: string;
  variables: string[];
  constant: {
    b: number;
    se: number;
    t: number;
    pValue: number;
  };
  coefficients: {
    variable: string;
    b: number;
    se: number;
    beta: number;
    t: number;
    pValue: number;
    significant: boolean;
  }[];
  rSquare: number;
  adjustedRSquare: number;
  fStatistic: number;
  fPValue: number;
}

export interface ModerationResultItem {
  independentVar: string; // X
  moderatorVar: string; // Z
  dependentVar: string; // Y
  interactionTermName: string; // e.g. 'X * Z'
  model1: MraModelSummary;
  model2: MraModelSummary;
  rSquareChange: number; // Delta R^2
  fChange: number; // Delta F
  fChangePValue: number; // p of Delta F
  interactionB: number; // b3
  interactionSE: number;
  interactionBeta: number;
  interactionT: number;
  interactionPValue: number;
  interactionSignificant: boolean;
  mainModeratorSignificant: boolean; // p < 0.05 of beta2 (Z)
  moderatorType: 'Pure Moderator' | 'Quasi Moderator' | 'Predictor Moderator' | 'Homologiser (Bukan Moderasi)';
  moderationDirection: 'Memperkuat' | 'Memperlemah' | 'Tidak Berpengaruh';
  conclusion: string;
}

export interface ModerationAnalysisSummary {
  hasModeration: boolean;
  moderatorCount: number;
  results: ModerationResultItem[];
}
`;

content += newTypes;
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated types.ts!');
