import { createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useSqlEditorStore } from '@/features/sql-editor/stores/sql-editor.store';
import { toast } from 'sonner';

export const Route = createFileRoute('/_dashboard/c/$slug/sql-editor')({
  component: SqlEditorPage,
});

function SqlEditorPage() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/sql-editor' });

  // Zustand store state
  const {
    selectedProcedureId,
    editorContent,
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
    setEditingProcedure,
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

  const handleCreateProcedure = () => {
    setCreateDialogOpen(true);
  };

  const handleEditProcedure = (id: string) => {
    const procedure = procedures?.find((p) => p.id === id);
    if (procedure) {
      setEditingProcedure(procedure);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteProcedure = async (id: string) => {
    try {
      await deleteProcedureMutation.mutateAsync(id);
      toast.success('Procedure deleted successfully');
      if (selectedProcedureId === id) {
        setSelectedProcedureId(null);
      }
    } catch (error) {
      toast.error('Failed to delete procedure');
    }
  };

  const handleExecuteProcedure = (id: string) => {
    const procedure = procedures?.find((p) => p.id === id);
    if (procedure && procedure.status === 'published') {
      setExecutingProcedure(procedure);
      setExecuteDialogOpen(true);
    }
  };

  const handleSaveProcedure = async () => {
    if (!selectedProcedure) return;

    try {
      await updateProcedureMutation.mutateAsync({
        sqlDraft: editorContent,
      });
      toast.success('Procedure saved successfully');
      setIsDirty(false);
      refetch();
    } catch (error) {
      toast.error('Failed to save procedure');
    }
  };

  const handleDialogSuccess = () => {
    refetch();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        <Button onClick={handleCreateProcedure}>Create Procedure</Button>
      </div>

      {/* Feature Flag Notice */}
      <Alert>
        <AlertDescription>
          SQL Tools is currently in beta. Stored procedures are executed against
          your workspace's configured database.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Procedures List */}
        <div className="lg:col-span-1">
          <ProcedureList
            procedures={procedures}
            isLoading={isLoading}
            selectedProcedureId={selectedProcedureId}
            onSelectProcedure={setSelectedProcedureId}
            onCreateProcedure={handleCreateProcedure}
            onEditProcedure={handleEditProcedure}
            onDeleteProcedure={handleDeleteProcedure}
            onPublishProcedure={handlePublishProcedure}
            onExecuteProcedure={handleExecuteProcedure}
          />
        </div>

        {/* Editor/Details Panel */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Procedure Editor</CardTitle>
                  <CardDescription>
                    {selectedProcedure
                      ? `Edit ${selectedProcedure.name}`
                      : 'Select a procedure or create a new one'}
                  </CardDescription>
                </div>
                {selectedProcedure && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedProcedure.status === 'published'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {selectedProcedure.status}
                    </Badge>
                    {selectedProcedure.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePublishProcedure(selectedProcedure.id)
                        }
                        disabled={false}
                      >
                        Publish
                      </Button>
                    )}
                    {selectedProcedure.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleExecuteProcedure(selectedProcedure.id)
                        }
                      >
                        Execute
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedProcedure ? (
                <SqlEditorComponent
                  procedure={selectedProcedure}
                  value={editorContent}
                  onChange={setEditorContent}
                  onSave={handleSaveProcedure}
                  height="550px"
                />
              ) : (
                <div className="h-full border rounded-md bg-muted/20 flex items-center justify-center m-6">
                  <div className="text-center text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">SQL Editor</p>
                    <p className="text-sm">
                      Select a procedure to edit or create a new one
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
