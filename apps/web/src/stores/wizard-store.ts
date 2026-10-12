import { create } from 'zustand';
import type { Construct, TestType, DatasetRow, DataIssue } from '@/lib/api/types';

export type WizardStep = 0 | 1 | 2 | 3 | 4;

interface WizardState {
  currentStep: WizardStep;
  projectId: string | null;
  
  // Step 1: Upload
  fileName: string | null;
  fileSize: number | null;
  fileData: DatasetRow[];
  columns: string[];
  usingSampleData: boolean;
  
  // Step 2: Validation
  issues: DataIssue[];
  removedRows: number[];
  dataVersion: number;
  
  // Step 3: Variable mapping
  constructs: Construct[];
  
  // Step 4: Test selection
  selectedTests: TestType[];
  
  // Step 5: Running
  isRunning: boolean;
  runProgress: { step: string; completed: boolean }[];

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setProjectId: (id: string) => void;
  setFileData: (fileName: string, data: DatasetRow[], columns: string[], isSample: boolean, fileSize?: number) => void;
  setIssues: (issues: DataIssue[]) => void;
  removeRow: (rowIndex: number) => void;
  removeRowByNumber: (rowNumber: number) => void;
  setConstructs: (constructs: Construct[]) => void;
  setSelectedTests: (tests: TestType[]) => void;
  toggleTest: (test: TestType) => void;
  setRunning: (running: boolean) => void;
  setRunProgress: (progress: { step: string; completed: boolean }[]) => void;
  resetWizard: () => void;
}

const initialState = {
  currentStep: 0 as WizardStep,
  projectId: null,
  fileName: null,
  fileSize: null,
  fileData: [],
  columns: [],
  usingSampleData: false,
  issues: [],
  removedRows: [],
  dataVersion: 1,
  constructs: [],
  selectedTests: [] as TestType[],
  isRunning: false,
  runProgress: [],
};

export const useWizardStore = create<WizardState>((set) => ({
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
  
  setFileData: (fileName, data, columns, isSample, fileSize) =>
    set({
      fileName,
      fileSize: fileSize ?? null,
      fileData: data,
      columns,
      usingSampleData: isSample,
      issues: [],
      removedRows: [],
      dataVersion: 1,
    }),
  
  setIssues: (issues) => set({ issues }),
  
  removeRow: (rowIndex) =>
    set((state) => {
      const targetRow = state.fileData[rowIndex];
      const rowNo = targetRow && typeof targetRow.No === 'number' ? targetRow.No : rowIndex + 1;
      return {
        removedRows: [...state.removedRows, rowNo],
        dataVersion: state.dataVersion + 1,
        fileData: state.fileData.filter((_, i) => i !== rowIndex),
        issues: state.issues.filter((issue) => issue.row !== rowNo && issue.row !== (rowIndex + 1)),
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
      return {
        removedRows: [...state.removedRows, rowNumber],
        dataVersion: state.dataVersion + 1,
        fileData: state.fileData.filter((_, i) => i !== index),
        issues: state.issues.filter((issue) => issue.row !== rowNumber),
      };
    }),
  
  setConstructs: (constructs) => set({ constructs }),
  
  setSelectedTests: (tests) => set({ selectedTests: tests }),
  
  toggleTest: (test) =>
    set((state) => ({
      selectedTests: state.selectedTests.includes(test)
        ? state.selectedTests.filter((t) => t !== test)
        : [...state.selectedTests, test],
    })),
  
  setRunning: (running) => set({ isRunning: running }),
  
  setRunProgress: (progress) => set({ runProgress: progress }),
  
  resetWizard: () => set(initialState),
}));
