import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoredProcedure } from '../types';

interface WorkspaceLayoutState {
  explorerWidth: number;
  bottomPanelHeight: number;
  bottomPanelOpen: boolean;
  activeBottomTab: 'results' | 'validation' | 'console';
  explorerCollapsed: boolean;
  lastProcedureId: string | null;
}

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
  validationErrors: Record<string, string[]>; // procedureId -> errors
  validationWarnings: Record<string, string[]>; // procedureId -> warnings

  // Workspace-scoped layout state (persisted)
  workspaceLayouts: Record<string, WorkspaceLayoutState>;
  currentWorkspaceId: string | null;

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
  clearValidationForProcedure: (procedureId: string) => void;

  // Workspace layout actions
  setCurrentWorkspace: (workspaceId: string) => void;
  setExplorerWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setActiveBottomTab: (tab: 'results' | 'validation' | 'console') => void;
  setExplorerCollapsed: (collapsed: boolean) => void;
  setLastProcedureId: (procedureId: string | null) => void;

  // Workspace layout helpers
  getCurrentWorkspaceLayout: () => WorkspaceLayoutState;
  updateCurrentWorkspaceLayout: (
    updates: Partial<WorkspaceLayoutState>
  ) => void;

  // Reset functions
  resetEditor: () => void;
  resetValidation: () => void;
  closeAllDialogs: () => void;
}

const createWorkspaceLayout = (): WorkspaceLayoutState => ({
  explorerWidth: 320,
  bottomPanelHeight: 0,
  bottomPanelOpen: false,
  activeBottomTab: 'results',
  explorerCollapsed: false,
  lastProcedureId: null,
});

export const useSqlEditorStore = create<SqlEditorState>()(
  persist(
    (set, get) => ({
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
      validationErrors: {},
      validationWarnings: {},

      // Workspace layout state
      workspaceLayouts: {},
      currentWorkspaceId: null,

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
      setExecutingProcedure: (procedure) =>
        set({ executingProcedure: procedure }),
      setPublishingProcedure: (procedure) =>
        set({ publishingProcedure: procedure }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setValidationErrors: (errors) => {
        const { selectedProcedureId } = get();
        if (!selectedProcedureId) return;
        set({
          validationErrors: {
            ...get().validationErrors,
            [selectedProcedureId]: errors,
          },
        });
      },
      setValidationWarnings: (warnings) => {
        const { selectedProcedureId } = get();
        if (!selectedProcedureId) return;
        set({
          validationWarnings: {
            ...get().validationWarnings,
            [selectedProcedureId]: warnings,
          },
        });
      },

      clearValidationForProcedure: (procedureId) => {
        set((state) => ({
          validationErrors: { ...state.validationErrors, [procedureId]: [] },
          validationWarnings: {
            ...state.validationWarnings,
            [procedureId]: [],
          },
        }));
      },

      // Workspace layout actions
      setCurrentWorkspace: (workspaceId) =>
        set({ currentWorkspaceId: workspaceId }),

      setExplorerWidth: (width) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();
        const newLayout = { ...currentLayout, explorerWidth: width };

        // Prevent unnecessary updates
        if (currentLayout.explorerWidth === width) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: newLayout,
          },
        });
      },

      setBottomPanelHeight: (height) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();
        const newLayout = {
          ...currentLayout,
          bottomPanelHeight: height,
          bottomPanelOpen: height > 0,
        };

        // Prevent unnecessary updates
        if (JSON.stringify(currentLayout) === JSON.stringify(newLayout)) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: newLayout,
          },
        });
      },

      setBottomPanelOpen: (open) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();
        const newLayout = {
          ...currentLayout,
          bottomPanelOpen: open,
          bottomPanelHeight: open ? currentLayout.bottomPanelHeight || 200 : 0,
        };

        // Prevent unnecessary updates
        if (JSON.stringify(currentLayout) === JSON.stringify(newLayout)) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: newLayout,
          },
        });
      },

      setActiveBottomTab: (tab) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();

        // Prevent unnecessary updates
        if (currentLayout.activeBottomTab === tab) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: { ...currentLayout, activeBottomTab: tab },
          },
        });
      },

      setExplorerCollapsed: (collapsed) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();

        // Prevent unnecessary updates
        if (currentLayout.explorerCollapsed === collapsed) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: {
              ...currentLayout,
              explorerCollapsed: collapsed,
            },
          },
        });
      },

      setLastProcedureId: (procedureId) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();

        // Prevent unnecessary updates
        if (currentLayout.lastProcedureId === procedureId) return;

        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: {
              ...currentLayout,
              lastProcedureId: procedureId,
            },
          },
        });
      },

      // Reset functions
      resetEditor: () =>
        set({
          selectedProcedureId: null,
          editorContent: '',
          isDirty: false,
          validationErrors: {},
          validationWarnings: {},
        }),

      resetValidation: () =>
        set({
          validationErrors: {},
          validationWarnings: {},
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

      // Workspace layout helpers
      getCurrentWorkspaceLayout: () => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return createWorkspaceLayout();
        return workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();
      },

      updateCurrentWorkspaceLayout: (updates) => {
        const { currentWorkspaceId, workspaceLayouts } = get();
        if (!currentWorkspaceId) return;

        const currentLayout =
          workspaceLayouts[currentWorkspaceId] || createWorkspaceLayout();
        set({
          workspaceLayouts: {
            ...workspaceLayouts,
            [currentWorkspaceId]: { ...currentLayout, ...updates },
          },
        });
      },
    }),
    {
      name: 'sql-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaceLayouts: state.workspaceLayouts,
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);

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
    useSqlEditorStore((state) => {
      const currentErrors = state.selectedProcedureId
        ? state.validationErrors[state.selectedProcedureId] || []
        : [];
      const currentWarnings = state.selectedProcedureId
        ? state.validationWarnings[state.selectedProcedureId] || []
        : [];

      return {
        validationErrors: currentErrors,
        validationWarnings: currentWarnings,
        hasValidationErrors: currentErrors.length > 0,
        hasValidationWarnings: currentWarnings.length > 0,
      };
    }),

  // UI state
  useUIState: () =>
    useSqlEditorStore((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
    })),

  // Workspace layout state - optimized to prevent infinite loops
  useWorkspaceLayout: () =>
    useSqlEditorStore((state) => {
      // Use a stable reference to prevent re-renders
      const workspaceId = state.currentWorkspaceId;
      const layout =
        workspaceId && state.workspaceLayouts[workspaceId]
          ? state.workspaceLayouts[workspaceId]
          : createWorkspaceLayout();

      // Return a stable object reference to prevent infinite loops
      return Object.freeze({
        explorerWidth: layout.explorerWidth,
        bottomPanelHeight: layout.bottomPanelHeight,
        bottomPanelOpen: layout.bottomPanelOpen,
        activeBottomTab: layout.activeBottomTab,
        explorerCollapsed: layout.explorerCollapsed,
        lastProcedureId: layout.lastProcedureId,
      });
    }),

  useWorkspaceLayoutActions: () =>
    useSqlEditorStore((state) =>
      Object.freeze({
        setCurrentWorkspace: state.setCurrentWorkspace,
        setExplorerWidth: state.setExplorerWidth,
        setBottomPanelHeight: state.setBottomPanelHeight,
        setBottomPanelOpen: state.setBottomPanelOpen,
        setActiveBottomTab: state.setActiveBottomTab,
        setExplorerCollapsed: state.setExplorerCollapsed,
        setLastProcedureId: state.setLastProcedureId,
        updateCurrentWorkspaceLayout: state.updateCurrentWorkspaceLayout,
      })
    ),
};
