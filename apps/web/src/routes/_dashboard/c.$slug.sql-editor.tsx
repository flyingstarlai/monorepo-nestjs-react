import { createFileRoute, useParams, useBlocker } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import React from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ProcedureList } from '@/features/sql-editor/components/procedure-list';
import { ProcedureDialog } from '@/features/sql-editor/components/procedure-dialog';
import { ExecuteProcedureDialog } from '@/features/sql-editor/components/execute-dialog';
import { PublishDialog } from '@/features/sql-editor/components/publish-dialog';
import { SqlEditorComponent } from '@/features/sql-editor/components/sql-editor';
import { SQLEditorHeader } from '@/features/sql-editor/components/sql-editor-header';
import { ResultsPanel } from '@/features/sql-editor/components/results-panel';
import { ValidationPanel } from '@/features/sql-editor/components/validation-panel';
import { ConsolePanel } from '@/features/sql-editor/components/console-panel';
import {
  exportToCSV,
  exportToJSON,
} from '@/features/sql-editor/utils/export-utils';

import {
  useProcedures,
  useDeleteProcedure,
  useUpdateProcedure,
  useUnpublishProcedure,
  useValidateSql,
  usePublishProcedure,
} from '@/features/sql-editor/hooks/use-sql-editor';
import type {
  StoredProcedure,
  ExecutionResult,
} from '@/features/sql-editor/types';
import { useSqlEditorStore } from '@/features/sql-editor/stores/sql-editor.store';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/c/$slug/sql-editor')({
  component: SqlEditorPage,
});

function SqlEditorPage() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/sql-editor' });
  const [isResizing, setIsResizing] = useState(false);
  const [isBottomResizing, setIsBottomResizing] = useState(false);

  // Zustand store state - use direct store access to avoid selector issues
  const storeState = useSqlEditorStore();

  // Extract validation state from store
  const { validationErrors, validationWarnings, selectedProcedureId } =
    storeState;

  // Memoize layout state to prevent re-renders
  const layoutState = useMemo(() => {
    const workspaceId = storeState.currentWorkspaceId;
    const layout =
      workspaceId && storeState.workspaceLayouts[workspaceId]
        ? storeState.workspaceLayouts[workspaceId]
        : {
            explorerWidth: 320,
            bottomPanelHeight: 0,
            bottomPanelOpen: false,
            activeBottomTab: 'results' as const,
            explorerCollapsed: false,
            lastProcedureId: null,
          };

    return layout;
  }, [storeState.currentWorkspaceId, storeState.workspaceLayouts]);

  const {
    explorerWidth,
    bottomPanelHeight,
    bottomPanelOpen,
    activeBottomTab,
    explorerCollapsed,
    lastProcedureId,
  } = layoutState;
  const [executionResults, setExecutionResults] = useState<
    Record<string, unknown>[]
  >([]);
  const [executionColumns, setExecutionColumns] = useState<
    Array<{ name: string; type: string }>
  >([]);
  const [executionMetadata, setExecutionMetadata] = useState<{
    executionTime?: number;
    rowCount?: number;
  }>({});

  const [consoleMessages, setConsoleMessages] = useState<
    Array<{
      timestamp: Date;
      type: 'info' | 'success' | 'error';
      message: string;
    }>
  >([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedProcedureId, setExecutedProcedureId] = useState<string | null>(
    null
  );
  const [contextSwitchDialog, setContextSwitchDialog] = useState<{
    open: boolean;
    targetProcedureId: string;
    targetProcedureName: string;
  }>({ open: false, targetProcedureId: '', targetProcedureName: '' });

  const [publishDialog, setPublishDialog] = useState(false);
  const [moveToDraftDialog, setMoveToDraftDialog] = useState(false);

  // Create procedure-specific validation messages from store
  const currentValidationErrors = useMemo(
    () =>
      selectedProcedureId ? validationErrors[selectedProcedureId] || [] : [],
    [selectedProcedureId, validationErrors]
  );
  const currentValidationWarnings = useMemo(
    () =>
      selectedProcedureId ? validationWarnings[selectedProcedureId] || [] : [],
    [selectedProcedureId, validationWarnings]
  );

  // Convert store validation to local validation messages format for display
  const validationMessages = useMemo(() => {
    const messages: Array<{
      timestamp: Date;
      type: 'error' | 'warning';
      message: string;
    }> = [];

    // Add errors
    currentValidationErrors.forEach((error) => {
      messages.push({
        timestamp: new Date(),
        type: 'error',
        message: error,
      });
    });

    // Add warnings
    currentValidationWarnings.forEach((warning) => {
      messages.push({
        timestamp: new Date(),
        type: 'warning',
        message: warning,
      });
    });

    return messages;
  }, [currentValidationErrors, currentValidationWarnings]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useSidebar();
  const [previousSidebarState, setPreviousSidebarState] = useState<
    boolean | null
  >(null);

  // Extract individual state values from store
  const {
    editorContent,
    isDirty,
    createDialogOpen,
    editDialogOpen,
    executeDialogOpen,
    editingProcedure,
    executingProcedure,
    setSelectedProcedureId,
    setEditorContent,
    setIsDirty,
    setCreateDialogOpen,
    setEditDialogOpen,
    setExecuteDialogOpen,
    setExecutingProcedure,
  } = storeState;

  const { data: procedures, isLoading, error, refetch } = useProcedures(slug);
  const deleteProcedureMutation = useDeleteProcedure(slug);
  const updateProcedureMutation = useUpdateProcedure(
    slug,
    selectedProcedureId || ''
  );
  const unpublishProcedureMutation = useUnpublishProcedure(
    slug,
    selectedProcedureId || ''
  );
  const publishProcedureMutation = usePublishProcedure(
    slug,
    selectedProcedureId || ''
  );
  const validateMutation = useValidateSql(slug);

  const selectedProcedure = procedures?.find(
    (p) => p.id === selectedProcedureId
  );
  const readOnly = selectedProcedure?.status === 'published';

  // Initialize workspace
  useEffect(() => {
    if (storeState.currentWorkspaceId !== slug) {
      storeState.setCurrentWorkspace(slug);
    }
  }, [slug, storeState.currentWorkspaceId, storeState.setCurrentWorkspace]);

  // Restore last selected procedure when procedures are loaded
  useEffect(() => {
    if (lastProcedureId && procedures?.some((p) => p.id === lastProcedureId)) {
      storeState.setSelectedProcedureId(lastProcedureId);
    }
  }, [lastProcedureId, procedures, storeState.setSelectedProcedureId]);

  // Responsive behavior: collapse explorer on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        storeState.setExplorerCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [storeState.setExplorerCollapsed]);

  // Default open bottom panel at ~30% height if not set
  useEffect(() => {
    if (containerRef.current && !bottomPanelOpen && bottomPanelHeight === 0) {
      const h = Math.round(containerRef.current.clientHeight * 0.3);
      storeState.setBottomPanelHeight(h);
      storeState.setBottomPanelOpen(true);
    }
  }, [bottomPanelOpen, bottomPanelHeight, storeState]);

  // Update last procedure when selection changes
  useEffect(() => {
    if (selectedProcedureId) {
      storeState.setLastProcedureId(selectedProcedureId);
    }
  }, [selectedProcedureId, storeState.setLastProcedureId]);

  // Update editor content when selected procedure changes
  useEffect(() => {
    if (selectedProcedure) {
      setEditorContent(selectedProcedure.sqlDraft);
      setIsDirty(false);
    } else {
      setEditorContent('');
      setIsDirty(false);
    }
  }, [selectedProcedure, setEditorContent, setIsDirty]);

  // Sidebar focus mode - only collapse on initial mount, allow manual toggle
  useEffect(() => {
    // Only collapse sidebar on initial mount, then allow manual control
    if (previousSidebarState === null) {
      setPreviousSidebarState(open);
      setOpen(false);
    }
  }, []); // Remove dependencies to prevent re-running on toggle

  // Auto-switch to validation tab when validation errors occur
  useEffect(() => {
    // Show bottom panel and switch to validation if there are validation errors
    if (
      (currentValidationErrors.length > 0 ||
        currentValidationWarnings.length > 0) &&
      !bottomPanelOpen
    ) {
      storeState.setBottomPanelOpen(true);
      storeState.setBottomPanelHeight(200);
      storeState.setActiveBottomTab('validation');
    }
  }, [
    currentValidationErrors.length,
    currentValidationWarnings.length,
    bottomPanelOpen,
    storeState,
  ]);

  const handleCreateProcedure = () => {
    setCreateDialogOpen(true);
  };

  const handleSaveProcedure = useCallback(async () => {
    if (!selectedProcedure) return;

    try {
      await updateProcedureMutation.mutateAsync({
        sqlDraft: editorContent,
      });
      toast.success('Procedure saved successfully');
      setIsDirty(false);
      refetch();
    } catch {
      toast.error('Failed to save procedure');
    }
  }, [selectedProcedure, editorContent, updateProcedureMutation, refetch]);

  const handleMoveToDraft = useCallback(async () => {
    if (!selectedProcedure) return;

    try {
      await unpublishProcedureMutation.mutateAsync();
      toast.success('Procedure moved to draft successfully');
      setMoveToDraftDialog(false);
      refetch();
    } catch {
      toast.error('Failed to move procedure to draft');
    }
  }, [selectedProcedure, unpublishProcedureMutation, refetch]);

  const handleValidate = useCallback(async () => {
    if (!selectedProcedure) return;

    try {
      await validateMutation.mutateAsync({
        sql: editorContent,
      });
      toast.success('Validation completed');
    } catch {
      // Error is already handled by the hook's onError
    }
  }, [selectedProcedure, editorContent, validateMutation]);

  const handlePublish = useCallback(() => {
    setPublishDialog(true);
  }, []);

  const handlePublishConfirm = useCallback(async () => {
    try {
      await publishProcedureMutation.mutateAsync();
      toast.success('Procedure published successfully');
      setPublishDialog(false);
      refetch();
    } catch {
      // Error is handled by the mutation
    }
  }, [publishProcedureMutation, refetch]);

  const handleExecuteProcedure = useCallback(
    (id: string) => {
      const procedure = procedures?.find((p) => p.id === id);
      if (procedure && procedure.status === 'published') {
        // Check if we need to switch context and if there are unsaved changes
        if (selectedProcedureId !== id && isDirty) {
          // Show confirmation dialog for context switching
          setContextSwitchDialog({
            open: true,
            targetProcedureId: id,
            targetProcedureName: procedure.name,
          });
        } else {
          // Auto-switch context if no unsaved changes or same procedure
          if (selectedProcedureId !== id) {
            setSelectedProcedureId(id);
          }
          setExecutingProcedure(procedure);
          setExecuteDialogOpen(true);
        }
      }
    },
    [procedures, selectedProcedureId, isDirty, setSelectedProcedureId]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Cmd/Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (selectedProcedure && !readOnly) {
          handleSaveProcedure();
        }
      }

      // Validate: Cmd/Ctrl+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('validate-sql'));
      }

      // Execute: Shift+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (selectedProcedure && selectedProcedure.status === 'published') {
          handleExecuteProcedure(selectedProcedure.id);
        }
      }

      // Publish: Cmd/Ctrl+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.key === 'p' && e.shiftKey) {
        e.preventDefault();
        if (
          selectedProcedure &&
          selectedProcedure.status === 'draft' &&
          currentValidationErrors.length === 0
        ) {
          handlePublish();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedProcedure,
    handleSaveProcedure,
    handleExecuteProcedure,
    handlePublish,
    readOnly,
  ]);

  // Listen for validation tab switch event
  useEffect(() => {
    const handleSwitchToValidationTab = () => {
      // Show bottom panel and switch to validation tab
      if (!bottomPanelOpen) {
        storeState.setBottomPanelOpen(true);
        storeState.setBottomPanelHeight(200);
      }
      storeState.setActiveBottomTab('validation');
    };

    window.addEventListener(
      'switch-to-validation-tab',
      handleSwitchToValidationTab
    );
    return () =>
      window.removeEventListener(
        'switch-to-validation-tab',
        handleSwitchToValidationTab
      );
  }, [bottomPanelOpen, storeState]);

  // Route change guard for dirty editor state
  useBlocker(
    () => isDirty,
    'You have unsaved changes. Are you sure you want to leave?'
  );

  const handleDeleteProcedure = async (id: string) => {
    try {
      await deleteProcedureMutation.mutateAsync(id);
      toast.success('Procedure deleted successfully');
      if (selectedProcedureId === id) {
        setSelectedProcedureId(null);
      }
    } catch {
      toast.error('Failed to delete procedure');
    }
  };

  const handleExecuteStart = () => {
    setIsExecuting(true);
    setExecutionResults([]);
    setExecutionColumns([]);
    setExecutionMetadata({});

    // Show bottom panel and switch to results tab
    if (!bottomPanelOpen) {
      storeState.setBottomPanelOpen(true);
      storeState.setBottomPanelHeight(200);
    }
    storeState.setActiveBottomTab('results');

    // Add execution start message
    setConsoleMessages((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type: 'info',
        message: 'Executing procedure...',
      },
    ]);
  };

  const handleExecuteSuccess = (result: ExecutionResult) => {
    setIsExecuting(false);

    // Track which procedure was executed
    if (executingProcedure) {
      setExecutedProcedureId(executingProcedure.id);
    }

    // Set active tab to results
    storeState.setActiveBottomTab('results');

    // Store execution results and columns
    const results = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.result)
        ? result.result
        : [result.data || result.result].filter(Boolean);
    setExecutionResults(
      results.filter((row: any) => row != null && typeof row === 'object')
    );

    // Store execution metadata
    setExecutionMetadata({
      executionTime: result.executionTime,
      rowCount: result.rowCount || results.length,
    });

    // Store column information if available
    if (result.columns && Array.isArray(result.columns)) {
      setExecutionColumns(result.columns);
    } else {
      // Fallback: derive columns from first result row
      const firstRow = results[0];
      if (firstRow && typeof firstRow === 'object') {
        const derivedColumns = Object.keys(firstRow).map((key: string) => ({
          name: key,
          type:
            typeof (firstRow as any)[key] === 'number' ? 'number' : 'string',
        }));
        setExecutionColumns(derivedColumns);
      } else {
        setExecutionColumns([]);
      }
    }

    // Add execution message
    setConsoleMessages((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type: result.success ? 'success' : 'error',
        message: result.success
          ? `Procedure executed successfully${result.executionTime ? ` in ${result.executionTime}ms` : ''}${result.rowCount !== undefined ? ` (${result.rowCount} rows)` : ''}`
          : result.error || 'Procedure execution failed',
      },
    ]);
  };

  const handleDialogSuccess = (createdProcedure?: StoredProcedure) => {
    refetch();

    // If a new procedure was created, set it as the selected procedure
    if (createdProcedure) {
      setSelectedProcedureId(createdProcedure.id);
      storeState.setLastProcedureId(createdProcedure.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.max(280, Math.min(500, newWidth)); // Min 280px, Max 500px
      storeState.setExplorerWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleBottomMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsBottomResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      const clampedHeight = Math.max(0, Math.min(400, newHeight)); // Min 0px, Max 400px
      storeState.setBottomPanelHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsBottomResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleContextSwitchConfirm = useCallback(
    async (saveChanges: boolean) => {
      const { targetProcedureId } = contextSwitchDialog;

      if (saveChanges && selectedProcedure) {
        try {
          await handleSaveProcedure();
        } catch {
          // If save fails, don't proceed with context switch
          return;
        }
      }

      // Switch context and open execute dialog
      setSelectedProcedureId(targetProcedureId);
      const targetProcedure = procedures?.find(
        (p) => p.id === targetProcedureId
      );
      if (targetProcedure) {
        setExecutingProcedure(targetProcedure);
        setExecuteDialogOpen(true);
      }

      // Close dialog
      setContextSwitchDialog({
        open: false,
        targetProcedureId: '',
        targetProcedureName: '',
      });
    },
    [
      contextSwitchDialog,
      selectedProcedure,
      handleSaveProcedure,
      setSelectedProcedureId,
      procedures,
    ]
  );

  const handleContextSwitchCancel = useCallback(() => {
    setContextSwitchDialog({
      open: false,
      targetProcedureId: '',
      targetProcedureName: '',
    });
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Failed to load stored procedures. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-svh min-h-0">
      {/* Header */}
      <SQLEditorHeader
        open={open}
        setOpen={setOpen}
        explorerCollapsed={explorerCollapsed}
        onToggleExplorer={() =>
          storeState.setExplorerCollapsed(!explorerCollapsed)
        }
        bottomPanelOpen={bottomPanelOpen}
        onToggleBottomPanel={() => {
          if (!bottomPanelOpen) {
            const containerEl = containerRef.current;
            const h = containerEl
              ? Math.round(containerEl.clientHeight * 0.3)
              : 200;
            storeState.setBottomPanelHeight(h);
            storeState.setBottomPanelOpen(true);
          } else {
            storeState.setBottomPanelOpen(false);
          }
        }}
      />

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
        {/* Procedures List */}
        <div
          style={{
            width: explorerCollapsed ? 0 : `${explorerWidth}px`,
            display: explorerCollapsed ? 'none' : 'block',
          }}
          className="border-r bg-muted/20 overflow-hidden flex-shrink-0 transition-all duration-200"
        >
          <ProcedureList
            procedures={procedures}
            isLoading={isLoading}
            selectedProcedureId={selectedProcedureId}
            onSelectProcedure={setSelectedProcedureId}
            onCreateProcedure={handleCreateProcedure}
            onDeleteProcedure={handleDeleteProcedure}
          />
        </div>

        {/* Resizer */}
        <div
          className={`w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            isResizing ? 'bg-primary/50' : ''
          }`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize procedure explorer"
          tabIndex={0}
        />

        {/* Editor/Details Panel */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {selectedProcedure ? (
            <div className="flex-1 min-h-0">
              <SqlEditorComponent
                procedure={selectedProcedure}
                value={editorContent}
                onChange={setEditorContent}
                onSave={handleSaveProcedure}
                onExecute={() => handleExecuteProcedure(selectedProcedure.id)}
                onMoveToDraft={() => setMoveToDraftDialog(true)}
                onValidate={handleValidate}
                onPublish={handlePublish}
                height="100%"
                isDirty={isDirty}
                readOnly={selectedProcedure?.status === 'published'}
                workspaceSlug={slug}
                isPublishing={publishProcedureMutation.isPending}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">SQL Editor</p>
                <p className="text-sm">
                  Select a procedure to edit or create a new one
                </p>
              </div>
            </div>
          )}

          {/* Bottom Panel */}
          {bottomPanelOpen && bottomPanelHeight > 0 && (
            <>
              {/* Resizer */}
              <div
                className={`h-1 bg-border cursor-row-resize hover:bg-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0 ${
                  isBottomResizing ? 'bg-primary/50' : ''
                }`}
                onMouseDown={handleBottomMouseDown}
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize bottom panel"
                tabIndex={0}
              />

              {/* Bottom Panel Content */}
              <div
                style={{ height: `${bottomPanelHeight}px` }}
                className="border-t bg-background flex-shrink-0 overflow-hidden"
              >
                <Tabs
                  value={activeBottomTab}
                  onValueChange={(value) =>
                    storeState.setActiveBottomTab(
                      value as 'results' | 'validation' | 'console'
                    )
                  }
                  aria-label="Bottom panel tabs"
                  className="h-full grid grid-rows-[auto,1fr]"
                >
                  <div className="border-b">
                    <TabsList className="h-8 px-2" role="tablist">
                      <TabsTrigger
                        value="results"
                        className="text-xs"
                        role="tab"
                        aria-selected={activeBottomTab === 'results'}
                        aria-controls="results-panel"
                      >
                        Results
                      </TabsTrigger>
                      <TabsTrigger
                        value="validation"
                        className="text-xs"
                        role="tab"
                        aria-selected={activeBottomTab === 'validation'}
                        aria-controls="validation-panel"
                      >
                        Validation
                        {validationMessages.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                            {validationMessages.length}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="console"
                        className="text-xs"
                        role="tab"
                        aria-selected={activeBottomTab === 'console'}
                        aria-controls="console-panel"
                      >
                        Console
                        {consoleMessages.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {consoleMessages.length}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="results"
                    className="m-0 h-full overflow-hidden"
                    role="tabpanel"
                    id="results-panel"
                    aria-labelledby="results-tab"
                    tabIndex={0}
                  >
                    <ResultsPanel
                      isExecuting={isExecuting}
                      executionResults={executionResults}
                      executionColumns={executionColumns}
                      executionMetadata={executionMetadata}
                      executedProcedureId={executedProcedureId}
                      selectedProcedureId={selectedProcedureId}
                      procedures={procedures}
                      exportToCSV={() =>
                        exportToCSV(executionResults, executionColumns)
                      }
                      exportToJSON={() =>
                        exportToJSON(
                          executionResults,
                          executionColumns,
                          executionMetadata
                        )
                      }
                    />
                  </TabsContent>

                  <TabsContent
                    value="validation"
                    className="m-0 h-full overflow-hidden"
                    role="tabpanel"
                    id="validation-panel"
                    aria-labelledby="validation-tab"
                    tabIndex={0}
                  >
                    <ValidationPanel validationMessages={validationMessages} />
                  </TabsContent>

                  <TabsContent
                    value="console"
                    className="m-0 h-full overflow-hidden"
                    role="tabpanel"
                    id="console-panel"
                    aria-labelledby="console-tab"
                    tabIndex={0}
                  >
                    <ConsolePanel
                      consoleMessages={consoleMessages}
                      setConsoleMessages={setConsoleMessages}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Procedure Dialog */}
      <ProcedureDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceSlug={slug}
        onSuccess={handleDialogSuccess}
      />

      {/* Edit Procedure Dialog */}
      <ProcedureDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        workspaceSlug={slug}
        procedure={editingProcedure}
        onSuccess={handleDialogSuccess}
      />

      {/* Execute Procedure Dialog */}
      <ExecuteProcedureDialog
        open={executeDialogOpen}
        onOpenChange={setExecuteDialogOpen}
        workspaceSlug={slug}
        procedure={executingProcedure}
        onExecuteStart={handleExecuteStart}
        onSuccess={handleExecuteSuccess}
      />

      {/* Context Switch Confirmation Dialog */}
      <Dialog
        open={contextSwitchDialog.open}
        onOpenChange={(open) => !open && handleContextSwitchCancel()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Procedure Context</DialogTitle>
            <DialogDescription>
              You have unsaved changes in of current procedure. Would you like
              to save them before switching to execute &quot;
              {contextSwitchDialog.targetProcedureName}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleContextSwitchCancel}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleContextSwitchConfirm(false)}
            >
              Don&apos;t Save
            </Button>
            <Button onClick={() => handleContextSwitchConfirm(true)}>
              Save & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialog}
        onOpenChange={setPublishDialog}
        workspaceSlug={slug}
        procedure={selectedProcedure || null}
        onSuccess={handlePublishConfirm}
      />

      {/* Move to Draft Confirmation Dialog */}
      <Dialog open={moveToDraftDialog} onOpenChange={setMoveToDraftDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Draft</DialogTitle>
            <DialogDescription>
              Are you sure you want to move &quot;{selectedProcedure?.name}
              &quot; to draft? This will make the procedure editable but
              unavailable for execution until published again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveToDraftDialog(false)}
              disabled={unpublishProcedureMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleMoveToDraft}
              disabled={unpublishProcedureMutation.isPending}
            >
              {unpublishProcedureMutation.isPending
                ? 'Moving...'
                : 'Move to Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
