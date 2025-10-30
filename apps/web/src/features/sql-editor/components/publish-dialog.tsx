import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload, AlertTriangle, CheckCircle, Code } from 'lucide-react';
import { usePublishProcedure } from '../hooks/use-sql-editor';
import type { StoredProcedure } from '../types';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  procedure: StoredProcedure | null;
  onSuccess?: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  workspaceSlug,
  procedure,
  onSuccess,
}: PublishDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const publishMutation = usePublishProcedure(
    workspaceSlug,
    procedure?.id || ''
  );

  const isLoading = publishMutation.isPending;

  const handlePublish = async () => {
    if (!procedure || confirmText !== procedure.name) return;

    try {
      await publishMutation.mutateAsync({ sqlDraft: procedure.sqlDraft });
      onSuccess?.();
      onOpenChange(false);
      setConfirmText('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setConfirmText('');
    }
  };

  const canPublish = procedure && confirmText === procedure.name;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish Procedure
          </DialogTitle>
          <DialogDescription>
            Publish this stored procedure to make it available for execution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Procedure Info */}
          {procedure && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {procedure.name}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Draft</Badge>
                    <span>→</span>
                    <Badge variant="default">Published</Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(procedure.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last updated:</span>{' '}
                    {new Date(procedure.updatedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Publishing will overwrite the
              currently published version of this procedure. The published
              version will be immediately available for execution by all
              workspace members with appropriate permissions.
            </AlertDescription>
          </Alert>

          {/* SQL Preview */}
          {procedure && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SQL Code Preview</CardTitle>
                <CardDescription>
                  This is the SQL code that will be published:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-auto max-h-40 font-mono">
                  {procedure.sqlDraft}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Confirmation Required</CardTitle>
              <CardDescription>
                Type the procedure name to confirm publishing:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={procedure?.name || 'Procedure name'}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                  {canPublish && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Please double-check the
                  procedure name before proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublish || isLoading}
            className="bg-primary"
          >
            {isLoading ? 'Publishing...' : 'Publish Procedure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
