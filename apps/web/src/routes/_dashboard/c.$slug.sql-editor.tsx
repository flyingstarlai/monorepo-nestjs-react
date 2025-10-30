import { createFileRoute, useParams, useBlocker } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import React from 'react';
import {
  Database,
  Minimize2,
  Maximize2,
  PanelLeft,
  PanelRight,
  AlertTriangle,
  Download,
  FileText,
  Save,
  CheckCircle,
  Play,
  Rocket,
  Zap,
} from 'lucide-react';
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

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProcedureList } from '@/features/sql-editor/components/procedure-list';
import { ProcedureDialog } from '@/features/sql-editor/components/procedure-dialog';
import { ExecuteProcedureDialog } from '@/features/sql-editor/components/execute-dialog';
import { PublishDialog } from '@/features/sql-editor/components/publish-dialog';
import { SqlEditorComponent } from '@/features/sql-editor/components/sql-editor';
import {
  useProcedures,
  useDeleteProcedure,
  useUpdateProcedure,
} from '@/features/sql-editor/hooks/use-sql-editor';
import type { StoredProcedure } from '@/features/sql-editor/types';
import { useSqlEditorStore } from '@/features/sql-editor/stores/sql-editor.store';
import { toast } from 'sonner';

// Error boundary for results display
interface ResultsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ResultsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ResultsErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ResultsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Results display error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
          <h3 className="font-medium text-sm mb-2">Display Error</h3>
          <p className="text-xs text-muted-foreground mb-3 max-w-md">
            There was an error displaying the results. This might be due to
            unexpected data format.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const [executionMessages, setExecutionMessages] = useState<
    Array<{
      timestamp: Date;
      type: 'info' | 'success' | 'warning' | 'error';
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

  // Create procedure-specific validation messages
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

  // Helper to add validation messages without duplicates
  const addValidationMessage = useCallback(
    (type: 'error' | 'warning', message: string) => {
      const fullMessage = `Validation ${type}: ${message}`;
      setExecutionMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((msg) => msg.message === fullMessage);
        if (exists) return prev;

        return [
          ...prev,
          {
            timestamp: new Date(),
            type,
            message: fullMessage,
          },
        ];
      });
    },
    []
  );
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
    publishDialogOpen,
    editingProcedure,
    executingProcedure,
    publishingProcedure,
    setSelectedProcedureId,
    setEditorContent,
    setIsDirty,
    setCreateDialogOpen,
    setEditDialogOpen,
    setExecuteDialogOpen,
    setPublishDialogOpen,
    setExecutingProcedure,
    setPublishingProcedure,
  } = storeState;

  const { data: procedures, isLoading, error, refetch } = useProcedures(slug);
  const deleteProcedureMutation = useDeleteProcedure(slug);
  const updateProcedureMutation = useUpdateProcedure(
    slug,
    selectedProcedureId || ''
  );

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
      if (window.innerWidth < 1024 && !explorerCollapsed) {
        storeState.setExplorerCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [explorerCollapsed, storeState.setExplorerCollapsed]);

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

  // Sidebar focus mode - collapse on enter, restore on exit
  useEffect(() => {
    // Cache current sidebar state and collapse it
    if (previousSidebarState === null) {
      setPreviousSidebarState(open);
      setOpen(false);
    }

    // Restore sidebar state on cleanup
    return () => {
      if (previousSidebarState !== null) {
        setOpen(previousSidebarState);
      }
    };
  }, [open, setOpen]);

  // Sync validation errors to messages
  useEffect(() => {
    // Clear previous validation messages
    setExecutionMessages((prev) =>
      prev.filter(
        (msg) =>
          !msg.message.startsWith('Validation error:') &&
          !msg.message.startsWith('Validation warning:')
      )
    );

    // Add current validation errors
    currentValidationErrors.forEach((error) => {
      addValidationMessage('error', error);
    });

    // Add current validation warnings
    currentValidationWarnings.forEach((warning) => {
      addValidationMessage('warning', warning);
    });
  }, [
    currentValidationErrors,
    currentValidationWarnings,
    addValidationMessage,
  ]);

  // Auto-switch to messages tab when validation errors occur
  useEffect(() => {
    // Show bottom panel and switch to messages if there are validation errors
    if (
      (currentValidationErrors.length > 0 ||
        currentValidationWarnings.length > 0) &&
      !bottomPanelOpen
    ) {
      storeState.setBottomPanelOpen(true);
      storeState.setBottomPanelHeight(200);
      storeState.setActiveBottomTab('messages');
    }
  }, [
    currentValidationErrors.length,
    currentValidationWarnings.length,
    bottomPanelOpen,
    storeState,
  ]);

  // Clear validation messages when switching procedures
  useEffect(() => {
    // Clear validation messages when switching procedures
    setExecutionMessages((prev) =>
      prev.filter(
        (msg) =>
          !msg.message.startsWith('Validation error:') &&
          !msg.message.startsWith('Validation warning:')
      )
    );
  }, [selectedProcedureId]);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedProcedure,
    handleSaveProcedure,
    handleExecuteProcedure,
    readOnly,
  ]);

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
    setExecutionMessages((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type: 'info',
        message: 'Executing procedure...',
      },
    ]);
  };

  const handleExecuteSuccess = (result: {
    success: boolean;
    result?: Record<string, unknown>;
    data?: Record<string, unknown>[];
    columns?: Array<{ name: string; type: string }>;
    executionTime?: number;
    rowCount?: number;
    error?: string;
  }) => {
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
    setExecutionMessages((prev) => [
      ...prev,
      {
        timestamp: new Date(),
        type: result.success ? 'info' : 'error',
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

  const handlePublishProcedure = (id: string) => {
    const procedure = procedures?.find((p) => p.id === id);
    if (procedure) {
      setPublishingProcedure(procedure);
      setPublishDialogOpen(true);
    }
  };

  const exportToCSV = useCallback(() => {
    if (executionResults.length === 0) return;

    const headers =
      executionColumns.length > 0
        ? executionColumns.map((col) => col.name)
        : Object.keys(executionResults[0] || {});

    const csvContent = [
      headers.join(','),
      ...executionResults.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains comma or quote
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [executionResults, executionColumns]);

  const exportToJSON = useCallback(() => {
    if (executionResults.length === 0) return;

    const jsonContent = JSON.stringify(
      {
        data: executionResults,
        columns: executionColumns,
        metadata: executionMetadata,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [executionResults, executionColumns, executionMetadata]);

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">SQL Tools</h1>
            <p className="text-sm text-muted-foreground">
              Manage and execute stored procedures
            </p>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    storeState.setExplorerCollapsed(!explorerCollapsed)
                  }
                  aria-label={
                    explorerCollapsed
                      ? 'Show procedure explorer'
                      : 'Hide procedure explorer'
                  }
                >
                  {explorerCollapsed ? (
                    <PanelRight className="h-4 w-4" />
                  ) : (
                    <PanelLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Explorer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => storeState.setBottomPanelOpen(!bottomPanelOpen)}
                  aria-label={!bottomPanelOpen ? 'Show bottom panel' : 'Hide bottom panel'}
                >
                  {!bottomPanelOpen ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Panel</TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-border mx-1" />

          <TooltipProvider>
                <TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPublishDialog(true)}
                        disabled={!selectedProcedure || selectedProcedure.status === 'published'}
                        aria-label="Publish procedure"
                      >
                        <Rocket className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Publish procedure</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                </TooltipProvider>
          </TooltipProvider>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveProcedure}
                  disabled={!selectedProcedure || readOnly || !isDirty}
                  aria-label="Save (Cmd/Ctrl+S)"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {readOnly ? 'Published procedures are read-only' : 'Save (Cmd/Ctrl+S)'}
              </TooltipContent>
            </Tooltip>

            {selectedProcedure?.status === 'published' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExecuteProcedure(selectedProcedure.id)}
                      aria-label="Execute (Shift+Change)"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Execute (Shift+Enter)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {selectedProcedure?.status === 'draft' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePublishProcedure(selectedProcedure.id)}
                    disabled={!editorContent.trim()}
                    aria-label="Publish"
                  >
                    <Rocket className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Publish</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Feature Flag Notice */}
      <div className="px-4 py-2 bg-blue-50 border-b flex-shrink-0">
        <p className="text-sm text-blue-800">
          SQL Tools is currently in beta. Stored procedures are executed against
          your workspace&apos;s configured database.
        </p>
      </div>

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
            onPublishProcedure={handlePublishProcedure}
            onExecuteProcedure={handleExecuteProcedure}
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selectedProcedure ? (
            <div className="flex-1 min-h-0">
              <SqlEditorComponent
                procedure={selectedProcedure}
                value={editorContent}
                onChange={setEditorContent}
                onSave={handleSaveProcedure}
                height={
                  bottomPanelOpen && bottomPanelHeight > 0
                    ? `calc(100% - ${bottomPanelHeight}px)`
                    : '100%'
                }
                isDirty={isDirty}
                workspaceSlug={slug}
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
                      value as 'results' | 'messages'
                    )
                  }
                  aria-label="Bottom panel tabs"
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
                        value="messages"
                        className="text-xs"
                        role="tab"
                        aria-selected={activeBottomTab === 'messages'}
                        aria-controls="messages-panel"
                      >
                        Messages
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="results"
                    className="m-0 h-[calc(100%-2rem)] overflow-hidden"
                    role="tabpanel"
                    id="results-panel"
                    aria-labelledby="results-tab"
                  >
                    <div className="p-4">
                      <ResultsErrorBoundary>
                        {isExecuting ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              <span className="text-sm">
                                Executing procedure...
                              </span>
                            </div>
                          </div>
                        ) : executionResults.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">Results</p>
                                {executedProcedureId &&
                                  executedProcedureId !==
                                    selectedProcedureId && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                      <Database className="h-3 w-3" />
                                      From:{' '}
                                      {procedures?.find(
                                        (p) => p.id === executedProcedureId
                                      )?.name || 'Unknown'}
                                    </div>
                                  )}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToCSV}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    CSV
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToJSON}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    JSON
                                  </Button>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {executionMetadata.rowCount !== undefined && (
                                    <span>
                                      {executionMetadata.rowCount} row
                                      {executionMetadata.rowCount !== 1
                                        ? 's'
                                        : ''}
                                    </span>
                                  )}
                                  {executionMetadata.executionTime && (
                                    <span>
                                      {executionMetadata.executionTime}ms
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    {executionColumns.length > 0
                                      ? executionColumns.map((column) => (
                                          <th
                                            key={column.name}
                                            className="px-3 py-2 text-left font-medium border-b"
                                          >
                                            <div className="flex items-center gap-2">
                                              {column.name}
                                              <span className="text-xs text-muted-foreground font-normal">
                                                ({column.type})
                                              </span>
                                            </div>
                                          </th>
                                        ))
                                      : Object.keys(
                                          executionResults[0] || {}
                                        ).map((key) => (
                                          <th
                                            key={key}
                                            className="px-3 py-2 text-left font-medium border-b"
                                          >
                                            {key}
                                          </th>
                                        ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {executionResults.map((row, index) => (
                                    <tr key={index} className="border-b">
                                      {row != null &&
                                      typeof row === 'object' ? (
                                        executionColumns.length > 0 ? (
                                          executionColumns.map((column) => (
                                            <td
                                              key={column.name}
                                              className="px-3 py-2"
                                            >
                                              {row[column.name] === null ? (
                                                <span className="text-muted-foreground italic">
                                                  NULL
                                                </span>
                                              ) : column.type === 'integer' ||
                                                column.type === 'number' ? (
                                                <span className="text-right font-mono">
                                                  {String(row[column.name])}
                                                </span>
                                              ) : (
                                                String(row[column.name])
                                              )}
                                            </td>
                                          ))
                                        ) : (
                                          Object.values(row).map(
                                            (value, cellIndex) => (
                                              <td
                                                key={cellIndex}
                                                className="px-3 py-2"
                                              >
                                                {value === null ? (
                                                  <span className="text-muted-foreground italic">
                                                    NULL
                                                  </span>
                                                ) : (
                                                  String(value)
                                                )}
                                              </td>
                                            )
                                          )
                                        )
                                      ) : (
                                        <td
                                          colSpan={
                                            executionColumns.length ||
                                            Object.keys(
                                              executionResults[0] || {}
                                            ).length
                                          }
                                          className="px-3 py-2 text-center text-muted-foreground italic"
                                        >
                                          Invalid row data
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="font-medium text-sm text-muted-foreground mb-2">
                              No Results Yet
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-md mb-4">
                              Execute a stored procedure to see results here.
                              Results will include returned data, execution
                              time, and row counts.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Execution info</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Query results</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span>Performance metrics</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </ResultsErrorBoundary>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="messages"
                    className="m-0 h-[calc(100%-2rem)] overflow-hidden"
                    role="tabpanel"
                    id="messages-panel"
                    aria-labelledby="messages-tab"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium">Messages</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExecutionMessages([])}
                          disabled={executionMessages.length === 0}
                          aria-label="Clear all messages"
                        >
                          Clear
                        </Button>
                      </div>

                      {executionMessages.length > 0 ? (
                        <div className="space-y-2">
                          {executionMessages.map((msg, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-md border ${
                                msg.type === 'error'
                                  ? 'bg-destructive/10 border-destructive/20 text-destructive'
                                  : msg.type === 'warning'
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm flex-1">{msg.message}</p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {msg.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No messages. Validation errors and execution messages
                          will appear here.
                        </p>
                      )}
                    </div>
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

      {/* Publish Procedure Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        workspaceSlug={slug}
        procedure={publishingProcedure}
        onSuccess={handleDialogSuccess}
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
              You have unsaved changes in the current procedure. Would you like
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
    </div>
  );
}
