import type {
  PairedTTestResult,
  NGainSummary,
  IndependentTTestResult,
  OneWayAnovaResult,
  NonParametricResult,
  OutlierTroubleshooterResult,
} from '../comparative-stats';

import type {
  CrosstabMatrix,
  ChiSquareResult,
  RiskEstimateResult,
  SymmetricMeasuresResult,
} from '../categorical-stats';

import type {
  ShapiroWilkResult,
  LillieforsResult,
  SkewnessKurtosisResult,
  CasewiseDiagnosticItem,
  CasewiseDiagnosticsSummary,
  WhiteHeteroscedasticityResult,
  TransformationRecommendation,
  TransformedVariableResult,
  SpearmanCorrelationItem,
} from '../assumption-remedies';

export type {
  ShapiroWilkResult,
  LillieforsResult,
  SkewnessKurtosisResult,
  CasewiseDiagnosticItem,
  CasewiseDiagnosticsSummary,
  WhiteHeteroscedasticityResult,
  TransformationRecommendation,
  TransformedVariableResult,
  SpearmanCorrelationItem,
  PairedTTestResult,
  NGainSummary,
  IndependentTTestResult,
  OneWayAnovaResult,
  NonParametricResult,
  OutlierTroubleshooterResult,
  CrosstabMatrix,
  ChiSquareResult,
  RiskEstimateResult,
  SymmetricMeasuresResult,
};

export type ProjectStatus = 'draft' | 'analyzing' | 'completed';
export type IssueSeverity = 'error' | 'warning' | 'info';
export type VariableRole = 'independent' | 'dependent' | 'mediator' | 'moderator';
export type ResearchDesign = 'survey' | 'comparative' | 'categorical';
export type TestType =
  | 'descriptive'
  | 'validity'
  | 'reliability'
  | 'normality'
  | 'multicollinearity'
  | 'heteroscedasticity'
  | 'regression'
  | 't-test'
  | 'f-test'
  | 'determination'
  | 'correlation'
  | 'anova'
  | 'paired-ttest'
  | 'independent-ttest'
  | 'oneway-anova'
  | 'ngain'
  | 'nonparametric'
  | 'crosstab'
  | 'chisquare'
  | 'odds-ratio'
  | 'mediation'
  | 'moderation';

export type SubscriptionPlan = 'free' | 'monthly' | 'thesis';
export type ExportFormat = 'word' | 'pdf' | 'spss-word';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  department?: string;
  plan: SubscriptionPlan;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  department: string;
  researchType: string;
  respondentCount: number;
  itemCount: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  dataVersions: DataVersion[];
  currentDataVersion: string;
}

export interface DataVersion {
  id: string;
  label: string;
  rowCount: number;
  columnCount: number;
  removedRows: number[];
  createdAt: string;
}

export interface DatasetUploadResult {
  datasetId: string;
  storagePath: string;
  rowCount: number;
  columnCount: number;
}

export interface DatasetRow {
  [key: string]: string | number | null;
}

export interface DataIssue {
  id: string;
  severity: IssueSeverity;
  message: string;
  row?: number;
  column?: string;
  value?: string | number | null;
  type?: string;
  duplicateOfRow?: number;
  action?: string;
}

export interface Construct {
  id: string;
  name: string;
  items: string[];
  role: VariableRole;
}

export interface TestOption {
  id: TestType;
  name: string;
  description: string;
  prerequisites: string[];
  recommended: boolean;
  recommendReason?: string;
}

export interface AnalysisConfig {
  projectId: string;
  dataVersionId: string;
  constructs: Construct[];
  selectedTests: TestType[];
  significanceLevel: number;
}

export interface DescriptiveResult {
  variable: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  n: number;
  tcr?: number;
  tcrCategory?: string;
  freq1?: number;
  freq2?: number;
  freq3?: number;
  freq4?: number;
  freq5?: number;
}

export interface ValidityResult {
  item: string;
  construct: string;
  rHitung: number;
  rTabel: number;
  valid: boolean;
}

export interface ItemTotalStatistic {
  item: string;
  scaleMean: number;
  scaleVariance: number;
  correctedItemTotalCorrelation: number;
  cronbachAlphaIfDeleted: number;
}

export interface CaseProcessingSummary {
  validN: number;
  validPercent: number;
  excludedN: number;
  excludedPercent: number;
  totalN: number;
  totalPercent: number;
}

export interface ReliabilityResult {
  construct: string;
  cronbachAlpha: number;
  itemCount: number;
  reliable: boolean;
  alphaIfDeleted: { item: string; alpha: number }[];
  caseProcessing?: CaseProcessingSummary;
  itemTotalStats?: ItemTotalStatistic[];
}

export interface NormalityResult {
  test: string;
  statistic: number;
  pValue: number;
  normal: boolean;
  mean?: number;
  stdDev?: number;
  absoluteDiff?: number;
  positiveDiff?: number;
  negativeDiff?: number;
}

export interface MulticollinearityResult {
  variable: string;
  tolerance: number;
  vif: number;
  problematic: boolean;
}

export interface HeteroscedasticityResult {
  test: string;
  variable: string;
  tHitung: number;
  pValue: number;
  significant: boolean;
  beta?: number;
}

export interface RegressionResult {
  variable: string;
  coefficient: number;
  stdError: number;
  tHitung: number;
  tTabel?: number;
  pValue: number;
  significant: boolean;
  standardizedBeta?: number;
  sePercent?: number; // Sumbangan Efektif (%)
  srPercent?: number; // Sumbangan Relatif (%)
}

export interface DurbinWatsonResult {
  dwStatistic: number;
  dL: number;
  dU: number;
  status: 'bebas' | 'ragu' | 'terdapat';
  conclusion: string;
}

export interface LinearityResult {
  independentVar: string;
  dependentVar: string;
  ssLinearity: number;
  dfLinearity: number;
  msLinearity: number;
  fLinearity: number;
  sigLinearity: number;
  ssDeviation: number;
  dfDeviation: number;
  msDeviation: number;
  fDeviation: number;
  sigDeviation: number;
  ssWithin: number;
  dfWithin: number;
  msWithin: number;
  isLinear: boolean;
}

export interface DemographicCategory {
  category: string;
  frequency: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface DemographicVariableResult {
  variable: string;
  totalN: number;
  categories: DemographicCategory[];
  majorityCategory: string;
  majorityPercent: number;
}

export interface FTestResult {
  fHitung: number;
  fTabel: number;
  pValue: number;
  significant: boolean;
}

export interface DeterminationResult {
  rSquare: number;
  adjustedRSquare: number;
  stdError: number;
}

export interface CorrelationResult {
  variable1: string;
  variable2: string;
  coefficient: number;
  pValue: number;
  significant: boolean;
  strength: string;
}

export interface AnovaResult {
  source: string;
  sumOfSquares: number;
  df: number;
  meanSquare: number;
  fValue: number;
  pValue: number;
}

export interface AnalysisResults {
  id: string;
  projectId: string;
  projectTitle?: string;
  department?: string;
  dataVersionId: string;
  hypotheses?: string[];
  respondentCount: number;
  timestamp: string;
  engineVersion: string;
  significanceLevel: number;
  descriptive?: DescriptiveResult[];
  itemDescriptive?: DescriptiveResult[];
  validity?: ValidityResult[];
  reliability?: ReliabilityResult[];
  normality?: NormalityResult[];
  multicollinearity?: MulticollinearityResult[];
  heteroscedasticity?: HeteroscedasticityResult[];
  regression?: RegressionResult[];
  fTest?: FTestResult;
  determination?: DeterminationResult;
  correlation?: CorrelationResult[];
  anova?: AnovaResult[];
  durbinWatson?: DurbinWatsonResult;
  linearity?: LinearityResult[];
  demographics?: DemographicVariableResult[];
  tTabel?: number;
  fTabel?: number;
  researchDesign?: ResearchDesign;
  pairedTTest?: PairedTTestResult;
  nGain?: NGainSummary;
  independentTTest?: IndependentTTestResult;
  oneWayAnova?: OneWayAnovaResult;
  nonParametric?: NonParametricResult;
  residualOutliers?: OutlierTroubleshooterResult;
  spearmanHetero?: HeteroscedasticityResult[];
  parkHetero?: HeteroscedasticityResult[];
  crosstab?: CrosstabMatrix;
  chiSquare?: ChiSquareResult;
  riskEstimate?: RiskEstimateResult;
  symmetricMeasures?: SymmetricMeasuresResult;
  shapiroWilk?: ShapiroWilkResult;
  lillieforsNormality?: LillieforsResult;
  skewnessKurtosis?: SkewnessKurtosisResult;
  casewiseDiagnostics?: CasewiseDiagnosticsSummary;
  whiteHetero?: WhiteHeteroscedasticityResult;
  transformationRecommendations?: TransformationRecommendation[];
  spearmanConstructMatrix?: SpearmanCorrelationItem[];
  pathAnalysis?: MediationAnalysisSummary;
  moderationAnalysis?: ModerationAnalysisSummary;
  unstandardizedResiduals?: number[];
  standardizedResiduals?: number[];
  explanations: Record<string, string>;
  sourceMeta?: DatasetSourceMeta;
}

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
  ignoredInfo?: {
    emptyRowsSkipped: number;
    mergedCellsDetected: number;
    notes: string[];
  };
}

export interface TraceInfo {
  testName: string;
  dataVersionId: string;
  dataVersionLabel: string;
  respondentCount: number;
  parameters: Record<string, string | number>;
  timestamp: string;
  engineVersion: string;
}

export interface ExportOptions {
  format: ExportFormat;
  sections: TestType[];
  includeStatement: boolean;
  narrativeTone?: 'standard' | 'concise' | 'formal';
  projectTitle?: string;
}

export interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

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
