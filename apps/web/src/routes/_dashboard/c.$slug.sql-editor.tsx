import { createFileRoute, useParams, useBlocker } from '@tanstack/react-router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Database, Minimize2, Maximize2, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSidebar } from '@/components/ui/sidebar';

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
import { useSqlEditorStore, useSqlEditorSelectors } from '@/features/sql-editor/stores/sql-editor.store';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/c/$slug/sql-editor')({
  component: SqlEditorPage,
});

function SqlEditorPage() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/sql-editor' });
  const [isResizing, setIsResizing] = useState(false);
  const [isBottomResizing, setIsBottomResizing] = useState(false);

  // Workspace layout state from Zustand
  const {
    explorerWidth,
    bottomPanelHeight,
    bottomPanelOpen,
    activeBottomTab,
    explorerCollapsed,
    lastProcedureId,
  } = useSqlEditorSelectors.useWorkspaceLayout();
  
  const {
    setCurrentWorkspace,
    setExplorerWidth,
    setBottomPanelHeight,
    setBottomPanelOpen,
    setActiveBottomTab,
    setExplorerCollapsed,
    setLastProcedureId,
  } = useSqlEditorSelectors.useWorkspaceLayoutActions();
  const [executionResults, setExecutionResults] = useState<
    Record<string, unknown>[]
  >([]);
  const [executionMessages, setExecutionMessages] = useState<
    Array<{
      timestamp: Date;
      type: 'error' | 'warning' | 'info';
      message: string;
    }>
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useSidebar();
  const [previousSidebarState, setPreviousSidebarState] = useState<
    boolean | null
  >(null);

  // Zustand store state
  const {
    selectedProcedureId,
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
  } = useSqlEditorStore();

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

  // Initialize workspace and restore last procedure
  useEffect(() => {
    setCurrentWorkspace(slug);
    
    // Restore last selected procedure if available
    if (lastProcedureId && procedures?.some(p => p.id === lastProcedureId)) {
      setSelectedProcedureId(lastProcedureId);
    }
  }, [slug, setCurrentWorkspace, lastProcedureId, procedures, setSelectedProcedureId]);

  // Responsive behavior: collapse explorer on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && !explorerCollapsed) {
        setExplorerCollapsed(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [explorerCollapsed, setExplorerCollapsed]);

  // Update last procedure when selection changes
  useEffect(() => {
    if (selectedProcedureId) {
      setLastProcedureId(selectedProcedureId);
    }
  }, [selectedProcedureId, setLastProcedureId]);

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
        setExecutingProcedure(procedure);
        setExecuteDialogOpen(true);
      }
    },
    [procedures]
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

  const handleExecuteSuccess = (result: {
    success: boolean;
    result: Record<string, unknown>;
    executionTime?: number;
    rowCount?: number;
    error?: string;
  }) => {
    // Show bottom panel if hidden
    if (!bottomPanelOpen) {
      setBottomPanelOpen(true);
      setBottomPanelHeight(200);
    }

    // Set active tab to results
    setActiveBottomTab('results');

    // Store execution results
    setExecutionResults(
      Array.isArray(result.result) ? result.result : [result.result]
    );

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

  const handleValidationError = (errors: string[], warnings: string[]) => {
    // Show bottom panel if hidden and there are errors
    if (!bottomPanelOpen && (errors.length > 0 || warnings.length > 0)) {
      setBottomPanelOpen(true);
      setBottomPanelHeight(200);
    }

    // Switch to messages tab
    setActiveBottomTab('messages');

    // Add validation messages
    const timestamp = new Date();
    errors.forEach((error) => {
      setExecutionMessages((prev) => [
        ...prev,
        {
          timestamp,
          type: 'error',
          message: `Validation error: ${error}`,
        },
      ]);
    });

    warnings.forEach((warning) => {
      setExecutionMessages((prev) => [
        ...prev,
        {
          timestamp,
          type: 'warning',
          message: `Validation warning: ${warning}`,
        },
      ]);
    });
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.max(280, Math.min(500, newWidth)); // Min 280px, Max 500px
      setExplorerWidth(clampedWidth);
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
      setBottomPanelHeight(clampedHeight);
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
    <div className="h-screen flex flex-col -m-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExplorerCollapsed(!explorerCollapsed)}
          >
            {explorerCollapsed ? (
              <PanelRight className="h-4 w-4 mr-2" />
            ) : (
              <PanelLeft className="h-4 w-4 mr-2" />
            )}
            {explorerCollapsed ? 'Show Explorer' : 'Hide Explorer'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setBottomPanelOpen(!bottomPanelOpen)
            }
          >
            {!bottomPanelOpen ? (
              <Maximize2 className="h-4 w-4 mr-2" />
            ) : (
              <Minimize2 className="h-4 w-4 mr-2" />
            )}
            {!bottomPanelOpen ? 'Show Panel' : 'Hide Panel'}
          </Button>
          <Button onClick={handleCreateProcedure}>Create Procedure</Button>
        </div>
      </div>

      {/* Feature Flag Notice */}
      <div className="px-4 py-2 bg-blue-50 border-b">
        <p className="text-sm text-blue-800">
          SQL Tools is currently in beta. Stored procedures are executed against
          your workspace&apos;s configured database.
        </p>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Procedures List */}
        <div
          style={{ 
            width: explorerCollapsed ? 0 : `${explorerWidth}px`,
            display: explorerCollapsed ? 'none' : 'block'
          }}
          className="border-r bg-muted/20 overflow-y-auto flex-shrink-0 transition-all duration-200"
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
          className={`w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors ${
            isResizing ? 'bg-primary/50' : ''
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Editor/Details Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedProcedure ? (
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
              onValidationError={handleValidationError}
              isDirty={isDirty}
            />
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
                className={`h-1 bg-border cursor-row-resize hover:bg-primary/50 transition-colors ${
                  isBottomResizing ? 'bg-primary/50' : ''
                }`}
                onMouseDown={handleBottomMouseDown}
              />

              {/* Bottom Panel Content */}
              <div
                style={{ height: `${bottomPanelHeight}px` }}
                className="border-t bg-background"
              >
                <Tabs
                  value={activeBottomTab}
                  onValueChange={(value) =>
                    setActiveBottomTab(value as 'results' | 'messages')
                  }
                >
                  <div className="border-b">
                    <TabsList className="h-8 px-2">
                      <TabsTrigger value="results" className="text-xs">
                        Results
                      </TabsTrigger>
                      <TabsTrigger value="messages" className="text-xs">
                        Messages
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="results"
                    className="m-0 h-[calc(100%-2rem)] overflow-auto"
                  >
                    <div className="p-4">
                      {executionResults.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Results</p>
                            <p className="text-xs text-muted-foreground">
                              {executionResults.length} row
                              {executionResults.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  {Object.keys(executionResults[0] || {}).map(
                                    (key) => (
                                      <th
                                        key={key}
                                        className="px-3 py-2 text-left font-medium border-b"
                                      >
                                        {key}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {executionResults.map((row, index) => (
                                  <tr key={index} className="border-b">
                                    {Object.values(row).map(
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
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No results to display. Execute a procedure to see
                          results here.
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="messages"
                    className="m-0 h-[calc(100%-2rem)] overflow-auto"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium">Messages</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExecutionMessages([])}
                          disabled={executionMessages.length === 0}
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
    </div>
  );
}
