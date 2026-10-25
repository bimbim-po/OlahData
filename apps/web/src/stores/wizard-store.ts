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
  columnRoles: Record<string, 'id' | 'demographic' | 'item' | 'open_question' | 'ignored'>;

  // Research Design
  researchDesign: 'survey' | 'comparative' | 'categorical';
  preCol: string | null;
  postCol: string | null;
  groupCol: string | null;
  scoreCol: string | null;
  idealMaxScore: number;
  rowCol: string | null;
  colCol: string | null;

  // Step 3: Variable mapping & Research Question
  constructs: Construct[];
  calculationMethod: 'mean' | 'sum';
  researchTitle: string;
  hypotheses: string[];

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
  removeRowsByNumbers: (rowNumbers: number[]) => void;
  setReverseItems: (items: string[]) => void;
  toggleReverseItem: (item: string) => void;
  setColumnRole: (col: string, role: 'id' | 'demographic' | 'item' | 'open_question' | 'ignored') => void;
  setResearchDesign: (design: 'survey' | 'comparative' | 'categorical') => void;
  setComparativeMapping: (mapping: {
    preCol?: string | null;
    postCol?: string | null;
    groupCol?: string | null;
    scoreCol?: string | null;
    idealMaxScore?: number;
  }) => void;
  setCategoricalMapping: (mapping: {
    rowCol?: string | null;
    colCol?: string | null;
  }) => void;
  eliminateInvalidItems: (invalidItemNames: string[]) => void;
  eliminateOutliers: (rowNumbers: number[]) => void;
  setConstructs: (constructs: Construct[]) => void;
  setCalculationMethod: (method: 'mean' | 'sum') => void;
  setResearchTitle: (title: string) => void;
  setHypotheses: (hypotheses: string[]) => void;
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
  columnRoles: {} as Record<string, 'id' | 'demographic' | 'item' | 'open_question' | 'ignored'>,
  researchDesign: 'survey' as const,
  preCol: null,
  postCol: null,
  groupCol: null,
  scoreCol: null,
  idealMaxScore: 100,
  rowCol: null,
  colCol: null,
  constructs: [],
  calculationMethod: 'mean' as const,
  researchTitle: '',
  hypotheses: [] as string[],
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

    const defaultRoles: Record<string, 'id' | 'demographic' | 'item' | 'open_question' | 'ignored'> = {};
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
        const clean = c.trim().toLowerCase();
        if (piiMap.has(c)) {
          defaultRoles[c] = piiMap.get(c)!;
        } else if (/^(jenis[\s_]?kelamin|gender|jk|usia|umur|pendidikan|pekerjaan|profesi|penghasilan|gaji|jurusan|prodi|program[\s_]?studi|fakultas|semester|angkatan|kelas|ipk|status|domisili)$/i.test(clean)) {
          defaultRoles[c] = 'demographic';
        } else if (/^(no|id|nomor|nim|npm|nik|nisn)$/i.test(clean)) {
          defaultRoles[c] = 'id';
        } else if (/^(saran|kritik|masukan|pendapat|alasan|komentar|uraian|ceritakan|catatan|feedback|tanggapan|opini)$/i.test(clean) || clean.endsWith('?')) {
          defaultRoles[c] = 'open_question';
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
        currentResults: null,
      };
    }),

  removeRowsByNumbers: (rowNumbers) =>
    set((state) => {
      const rowNumbersSet = new Set(rowNumbers);
      const updatedRemoved = Array.from(new Set([...state.removedRows, ...rowNumbers])).sort((a, b) => a - b);
      const newRows = state.fileData.filter((r, idx) => {
        const rowNo = typeof r.No === 'number' ? r.No : idx + 1;
        return !rowNumbersSet.has(rowNo);
      });
      const updatedMeta = state.datasetMeta
        ? {
            ...state.datasetMeta,
            kind: 'derived' as const,
            version: state.dataVersion + 1,
            rowCount: newRows.length,
            excludedRows: updatedRemoved,
          }
        : null;

      return {
        removedRows: updatedRemoved,
        dataVersion: state.dataVersion + 1,
        fileData: newRows,
        issues: state.issues.filter((issue) => !issue.row || !rowNumbersSet.has(issue.row)),
        datasetMeta: updatedMeta,
        currentResults: null,
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

  setCategoricalMapping: (mapping) =>
    set((state) => ({
      rowCol: mapping.rowCol !== undefined ? mapping.rowCol : state.rowCol,
      colCol: mapping.colCol !== undefined ? mapping.colCol : state.colCol,
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
        currentResults: null,
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
        currentResults: null,
      };
    });
  },

  setConstructs: (constructs) => set({ constructs, currentResults: null }),

  setCalculationMethod: (method) => set({ calculationMethod: method, currentResults: null }),

  setResearchTitle: (researchTitle) => set({ researchTitle }),

  setHypotheses: (hypotheses) => set({ hypotheses }),

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
