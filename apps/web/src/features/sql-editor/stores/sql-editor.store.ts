import { create } from 'zustand';
import type { StoredProcedure } from '../types';

interface SqlEditorState {
  // Current editing state
  selectedProcedureId: string | null;
  editorContent: string;
  isDirty: boolean;

  // Dialog states
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  executeDialogOpen: boolean;
  publishDialogOpen: boolean;

  // Procedure references for dialogs
  editingProcedure: StoredProcedure | null;
  executingProcedure: StoredProcedure | null;
  publishingProcedure: StoredProcedure | null;

  // UI state
  sidebarCollapsed: boolean;
  validationErrors: string[];
  validationWarnings: string[];

  // Actions
  setSelectedProcedureId: (id: string | null) => void;
  setEditorContent: (content: string) => void;
  setIsDirty: (dirty: boolean) => void;

  setCreateDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setExecuteDialogOpen: (open: boolean) => void;
  setPublishDialogOpen: (open: boolean) => void;

  setEditingProcedure: (procedure: StoredProcedure | null) => void;
  setExecutingProcedure: (procedure: StoredProcedure | null) => void;
  setPublishingProcedure: (procedure: StoredProcedure | null) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
  setValidationWarnings: (warnings: string[]) => void;

  // Reset functions
  resetEditor: () => void;
  resetValidation: () => void;
  closeAllDialogs: () => void;
}

export const useSqlEditorStore = create<SqlEditorState>((set, get) => ({
  // Initial state
  selectedProcedureId: null,
  editorContent: '',
  isDirty: false,

  createDialogOpen: false,
  editDialogOpen: false,
  executeDialogOpen: false,
  publishDialogOpen: false,

  editingProcedure: null,
  executingProcedure: null,
  publishingProcedure: null,

  sidebarCollapsed: false,
  validationErrors: [],
  validationWarnings: [],

  // Actions
  setSelectedProcedureId: (id) => set({ selectedProcedureId: id }),

  setEditorContent: (content) => {
    const currentContent = get().editorContent;
    const isDirty = content !== currentContent;
    set({
      editorContent: content,
      isDirty,
    });
  },

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditDialogOpen: (open) => set({ editDialogOpen: open }),
  setExecuteDialogOpen: (open) => set({ executeDialogOpen: open }),
  setPublishDialogOpen: (open) => set({ publishDialogOpen: open }),

  setEditingProcedure: (procedure) => set({ editingProcedure: procedure }),
  setExecutingProcedure: (procedure) => set({ executingProcedure: procedure }),
  setPublishingProcedure: (procedure) =>
    set({ publishingProcedure: procedure }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setValidationWarnings: (warnings) => set({ validationWarnings: warnings }),

  // Reset functions
  resetEditor: () =>
    set({
      selectedProcedureId: null,
      editorContent: '',
      isDirty: false,
      validationErrors: [],
      validationWarnings: [],
    }),

  resetValidation: () =>
    set({
      validationErrors: [],
      validationWarnings: [],
    }),

  closeAllDialogs: () =>
    set({
      createDialogOpen: false,
      editDialogOpen: false,
      executeDialogOpen: false,
      publishDialogOpen: false,
      editingProcedure: null,
      executingProcedure: null,
      publishingProcedure: null,
    }),
}));

// Selectors for common combinations
export const useSqlEditorSelectors = {
  // Current editing state
  useCurrentEditingState: () =>
    useSqlEditorStore((state) => ({
      selectedProcedureId: state.selectedProcedureId,
      editorContent: state.editorContent,
      isDirty: state.isDirty,
    })),

  // Dialog states
  useDialogStates: () =>
    useSqlEditorStore((state) => ({
      createDialogOpen: state.createDialogOpen,
      editDialogOpen: state.editDialogOpen,
      executeDialogOpen: state.executeDialogOpen,
      publishDialogOpen: state.publishDialogOpen,
      editingProcedure: state.editingProcedure,
      executingProcedure: state.executingProcedure,
      publishingProcedure: state.publishingProcedure,
    })),

  // Validation state
  useValidationState: () =>
    useSqlEditorStore((state) => ({
      validationErrors: state.validationErrors,
      validationWarnings: state.validationWarnings,
      hasValidationErrors: state.validationErrors.length > 0,
      hasValidationWarnings: state.validationWarnings.length > 0,
    })),

  // UI state
  useUIState: () =>
    useSqlEditorStore((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
    })),
};
