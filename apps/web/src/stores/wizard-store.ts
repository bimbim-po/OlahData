import { create } from 'zustand';
import type { Construct, TestType, DatasetRow, DataIssue, AnalysisResults, DatasetSourceMeta } from '@/lib/api/types';
import { detectMetadataAndPiiColumns, recodeDatasetRows } from '@/lib/google-forms-recode';

export type WizardStep = 0 | 1 | 2 | 3 | 4;

interface WizardState {
  currentStep: WizardStep;
  projectId: string | null;
  datasetId: string | null;
  runId: string | null;

  // Step 1: Upload
  fileName: string | null;
  fileSize: number | null;
  fileData: DatasetRow[];
  columns: string[];
  usingSampleData: boolean;
  datasetMeta: DatasetSourceMeta | null;

  // Step 2: Validation
  issues: DataIssue[];
  removedRows: number[];
  dataVersion: number;
  reverseItems: string[];
  columnRoles: Record<string, 'id' | 'demographic' | 'item' | 'ignored'>;

  // Research Design
  researchDesign: 'survey' | 'comparative';
  preCol: string | null;
  postCol: string | null;
  groupCol: string | null;
  scoreCol: string | null;
  idealMaxScore: number;

  // Step 3: Variable mapping
  constructs: Construct[];
  calculationMethod: 'mean' | 'sum';

  // Step 4: Test selection
  selectedTests: TestType[];

  // Step 5: Running & Results
  isRunning: boolean;
  runProgress: { step: string; completed: boolean }[];
  currentResults: AnalysisResults | null;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setProjectId: (id: string) => void;
  setDatasetId: (id: string | null) => void;
  setRunId: (id: string | null) => void;
  setFileData: (
    fileName: string,
    data: DatasetRow[],
    columns: string[],
    isSample: boolean,
    fileSize?: number,
    meta?: DatasetSourceMeta
  ) => void;
  setDatasetMeta: (meta: DatasetSourceMeta) => void;
  setIssues: (issues: DataIssue[]) => void;
  removeRow: (rowIndex: number) => void;
  removeRowByNumber: (rowNumber: number) => void;
  setReverseItems: (items: string[]) => void;
  toggleReverseItem: (item: string) => void;
  setColumnRole: (col: string, role: 'id' | 'demographic' | 'item' | 'ignored') => void;
  setResearchDesign: (design: 'survey' | 'comparative') => void;
  setComparativeMapping: (mapping: {
    preCol?: string | null;
    postCol?: string | null;
    groupCol?: string | null;
    scoreCol?: string | null;
    idealMaxScore?: number;
  }) => void;
  eliminateInvalidItems: (invalidItemNames: string[]) => void;
  eliminateOutliers: (rowNumbers: number[]) => void;
  setConstructs: (constructs: Construct[]) => void;
  setCalculationMethod: (method: 'mean' | 'sum') => void;
  setSelectedTests: (tests: TestType[]) => void;
  toggleTest: (test: TestType) => void;
  setRunning: (running: boolean) => void;
  setRunProgress: (progress: { step: string; completed: boolean }[]) => void;
  setCurrentResults: (results: AnalysisResults) => void;
  applyLikertRecode: (columnsToRecode: string[]) => number;
  resetWizard: () => void;
}

const initialState = {
  currentStep: 0 as WizardStep,
  projectId: null,
  datasetId: null,
  runId: null,
  fileName: null,
  fileSize: null,
  fileData: [],
  columns: [],
  usingSampleData: false,
  datasetMeta: null,
  issues: [],
  removedRows: [],
  dataVersion: 1,
  reverseItems: [] as string[],
  columnRoles: {} as Record<string, 'id' | 'demographic' | 'item' | 'ignored'>,
  researchDesign: 'survey' as const,
  preCol: null,
  postCol: null,
  groupCol: null,
  scoreCol: null,
  idealMaxScore: 100,
  constructs: [],
  calculationMethod: 'mean' as const,
  selectedTests: [] as TestType[],
  isRunning: false,
  runProgress: [],
  currentResults: null,
};

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(4, state.currentStep + 1) as WizardStep,
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1) as WizardStep,
    })),

  setProjectId: (id) => set({ projectId: id }),
  setDatasetId: (id) => set({ datasetId: id }),
  setRunId: (id) => set({ runId: id }),

  setFileData: (fileName, data, columns, isSample, fileSize, meta) => {
    const dsId = `ds-${Date.now()}`;
    const runId = `run-${Date.now()}`;

    const defaultRoles: Record<string, 'id' | 'demographic' | 'item' | 'ignored'> = {};
    if (meta?.columns) {
      meta.columns.forEach((c) => {
        defaultRoles[c.name] = c.role;
      });
    } else {
      // Auto-detect metadata & PII
      const piiDetections = detectMetadataAndPiiColumns(columns);
      const piiMap = new Map<string, 'id' | 'ignored'>();
      piiDetections.forEach((d) => piiMap.set(d.column, d.role));

      columns.forEach((c) => {
        if (piiMap.has(c)) {
          defaultRoles[c] = piiMap.get(c)!;
        } else if (/^(jenis[\s_]?kelamin|gender|usia|umur|pendidikan|pekerjaan|penghasilan|jurusan|semester|angkatan)$/i.test(c.trim())) {
          defaultRoles[c] = 'demographic';
        } else if (c.toLowerCase() === 'no' || c.toLowerCase() === 'id') {
          defaultRoles[c] = 'id';
        } else {
          defaultRoles[c] = 'item';
        }
      });
    }

    set({
      fileName,
      fileSize: fileSize ?? null,
      fileData: data,
      columns,
      usingSampleData: isSample,
      datasetId: dsId,
      runId,
      datasetMeta: meta || null,
      columnRoles: defaultRoles,
      issues: [],
      removedRows: [],
      dataVersion: 1,
      reverseItems: [],
      currentResults: null,
    });
  },

  setDatasetMeta: (meta) => set({ datasetMeta: meta }),

  setIssues: (issues) => set({ issues }),

  removeRow: (rowIndex) =>
    set((state) => {
      const targetRow = state.fileData[rowIndex];
      const rowNo = targetRow && typeof targetRow.No === 'number' ? targetRow.No : rowIndex + 1;
      const updatedRemoved = [...state.removedRows, rowNo];
      const updatedMeta = state.datasetMeta
        ? {
            ...state.datasetMeta,
            kind: 'derived' as const,
            version: state.dataVersion + 1,
            rowCount: state.fileData.length - 1,
            excludedRows: updatedRemoved,
          }
        : null;

      return {
        removedRows: updatedRemoved,
        dataVersion: state.dataVersion + 1,
        fileData: state.fileData.filter((_, i) => i !== rowIndex),
        issues: state.issues.filter((issue) => issue.row !== rowNo && issue.row !== rowIndex + 1),
        datasetMeta: updatedMeta,
      };
    }),

  removeRowByNumber: (rowNumber) =>
    set((state) => {
      const index = state.fileData.findIndex(
        (r, idx) => (typeof r.No === 'number' ? r.No === rowNumber : idx + 1 === rowNumber)
      );
      if (index === -1) {
        return {
          issues: state.issues.filter((issue) => issue.row !== rowNumber),
        };
      }
      const updatedRemoved = [...state.removedRows, rowNumber];
      const updatedMeta = state.datasetMeta
        ? {
            ...state.datasetMeta,
            kind: 'derived' as const,
            version: state.dataVersion + 1,
            rowCount: state.fileData.length - 1,
            excludedRows: updatedRemoved,
          }
        : null;

      return {
        removedRows: updatedRemoved,
        dataVersion: state.dataVersion + 1,
        fileData: state.fileData.filter((_, i) => i !== index),
        issues: state.issues.filter((issue) => issue.row !== rowNumber),
        datasetMeta: updatedMeta,
      };
    }),

  setReverseItems: (items) => set({ reverseItems: items }),

  toggleReverseItem: (item) =>
    set((state) => ({
      reverseItems: state.reverseItems.includes(item)
        ? state.reverseItems.filter((i) => i !== item)
        : [...state.reverseItems, item],
    })),

  setColumnRole: (col, role) =>
    set((state) => ({
      columnRoles: { ...state.columnRoles, [col]: role },
    })),

  setResearchDesign: (design) => set({ researchDesign: design }),

  setComparativeMapping: (mapping) =>
    set((state) => ({
      preCol: mapping.preCol !== undefined ? mapping.preCol : state.preCol,
      postCol: mapping.postCol !== undefined ? mapping.postCol : state.postCol,
      groupCol: mapping.groupCol !== undefined ? mapping.groupCol : state.groupCol,
      scoreCol: mapping.scoreCol !== undefined ? mapping.scoreCol : state.scoreCol,
      idealMaxScore:
        mapping.idealMaxScore !== undefined ? mapping.idealMaxScore : state.idealMaxScore,
    })),

  eliminateInvalidItems: (invalidItemNames: string[]) => {
    const invalidSet = new Set(invalidItemNames);
    set((state) => {
      const updatedConstructs = state.constructs
        .map((c) => ({
          ...c,
          items: c.items.filter((item) => !invalidSet.has(item)),
        }))
        .filter((c) => c.items.length > 0);

      const existingNotes = state.datasetMeta?.ignoredInfo?.notes || [];
      const updatedMeta = state.datasetMeta
        ? {
            ...state.datasetMeta,
            kind: 'derived' as const,
            version: state.dataVersion + 1,
            ignoredInfo: {
              emptyRowsSkipped: state.datasetMeta.ignoredInfo?.emptyRowsSkipped ?? 0,
              mergedCellsDetected: state.datasetMeta.ignoredInfo?.mergedCellsDetected ?? 0,
              notes: [
                ...existingNotes,
                `Eliminasi ${invalidItemNames.length} butir gugur: ${invalidItemNames.join(', ')}`,
              ],
            },
          }
        : null;

      return {
        constructs: updatedConstructs,
        dataVersion: state.dataVersion + 1,
        datasetMeta: updatedMeta,
      };
    });
  },

  eliminateOutliers: (rowNumbers: number[]) => {
    const rowSet = new Set(rowNumbers);
    set((state) => {
      const updatedRemoved = [...new Set([...state.removedRows, ...rowNumbers])];
      const updatedFileData = state.fileData.filter((r, idx) => {
        const no = typeof r.No === 'number' ? r.No : idx + 1;
        return !rowSet.has(no);
      });
      const existingNotes = state.datasetMeta?.ignoredInfo?.notes || [];
      const updatedMeta = state.datasetMeta
        ? {
            ...state.datasetMeta,
            kind: 'derived' as const,
            version: state.dataVersion + 1,
            rowCount: updatedFileData.length,
            excludedRows: updatedRemoved,
            ignoredInfo: {
              emptyRowsSkipped: state.datasetMeta.ignoredInfo?.emptyRowsSkipped ?? 0,
              mergedCellsDetected: state.datasetMeta.ignoredInfo?.mergedCellsDetected ?? 0,
              notes: [
                ...existingNotes,
                `Eksklusi ${rowNumbers.length} responden outlier residual (|Z| > 2.5): ${rowNumbers.join(', ')}`,
              ],
            },
          }
        : null;

      return {
        removedRows: updatedRemoved,
        fileData: updatedFileData,
        dataVersion: state.dataVersion + 1,
        datasetMeta: updatedMeta,
      };
    });
  },

  setConstructs: (constructs) => set({ constructs }),

  setCalculationMethod: (method) => set({ calculationMethod: method }),

  setSelectedTests: (tests) => set({ selectedTests: tests }),

  toggleTest: (test) =>
    set((state) => ({
      selectedTests: state.selectedTests.includes(test)
        ? state.selectedTests.filter((t) => t !== test)
        : [...state.selectedTests, test],
    })),

  setRunning: (running) => set({ isRunning: running }),

  setRunProgress: (progress) => set({ runProgress: progress }),

  setCurrentResults: (results) => {
    set({ currentResults: results });
    // Also save to localStorage keyed by projectId
    if (typeof window !== 'undefined' && results.projectId) {
      try {
        localStorage.setItem(`olahdata_results_${results.projectId}`, JSON.stringify(results));
        // Also keep a record by runId
        if (results.id) {
          localStorage.setItem(`olahdata_run_${results.id}`, JSON.stringify(results));
        }
      } catch {
        // ignore localStorage quota
      }
    }
  },

  applyLikertRecode: (columnsToRecode: string[]) => {
    const state = get();
    const { recodedRows, totalCellsConverted } = recodeDatasetRows(state.fileData, columnsToRecode);
    const updatedMeta = state.datasetMeta
      ? {
          ...state.datasetMeta,
          kind: 'derived' as const,
          version: state.dataVersion + 1,
        }
      : null;

    // Filter out text/string value error issues on recoded columns
    const colSet = new Set(columnsToRecode);
    const updatedIssues = state.issues.filter(
      (issue) => !(issue.column && colSet.has(issue.column) && issue.severity === 'error')
    );

    set({
      fileData: recodedRows,
      dataVersion: state.dataVersion + 1,
      datasetMeta: updatedMeta,
      issues: updatedIssues,
    });

    return totalCellsConverted;
  },

  resetWizard: () => set(initialState),
}));
