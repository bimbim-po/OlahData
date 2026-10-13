export type ProjectStatus = 'draft' | 'analyzing' | 'completed';
export type IssueSeverity = 'error' | 'warning' | 'info';
export type VariableRole = 'independent' | 'dependent';
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
  | 'anova';

export type SubscriptionPlan = 'free' | 'monthly' | 'thesis';
export type ExportFormat = 'word' | 'pdf';
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
}

export interface ValidityResult {
  item: string;
  construct: string;
  rHitung: number;
  rTabel: number;
  valid: boolean;
}

export interface ReliabilityResult {
  construct: string;
  cronbachAlpha: number;
  itemCount: number;
  reliable: boolean;
  alphaIfDeleted: { item: string; alpha: number }[];
}

export interface NormalityResult {
  test: string;
  statistic: number;
  pValue: number;
  normal: boolean;
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
}

export interface RegressionResult {
  variable: string;
  coefficient: number;
  stdError: number;
  tHitung: number;
  pValue: number;
  significant: boolean;
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
  dataVersionId: string;
  respondentCount: number;
  timestamp: string;
  engineVersion: string;
  significanceLevel: number;
  descriptive?: DescriptiveResult[];
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
  explanations: Record<string, string>;
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
}

export interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}
