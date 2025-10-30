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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SqlEditorComponent } from './sql-editor';
import {
  useCreateProcedure,
  useUpdateProcedure,
} from '../hooks/use-sql-editor';
import type { StoredProcedure } from '../types';

interface ProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  procedure?: StoredProcedure | null;
  onSuccess?: (createdProcedure?: StoredProcedure) => void;
}

export function ProcedureDialog({
  open,
  onOpenChange,
  workspaceSlug,
  procedure,
  onSuccess,
}: ProcedureDialogProps) {
  const isEditing = !!procedure;
  const createMutation = useCreateProcedure(workspaceSlug);
  const updateMutation = useUpdateProcedure(workspaceSlug, procedure?.id || '');

  const [formData, setFormData] = useState({
    name: procedure?.name || '',
    sqlDraft: procedure?.sqlDraft || '',
  });

  const [errors, setErrors] = useState<{
    name?: string;
    sqlDraft?: string;
  }>({});

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Procedure name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.sqlDraft.trim()) {
      newErrors.sqlDraft = 'SQL code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let result: StoredProcedure | undefined;

      if (isEditing && procedure) {
        result = await updateMutation.mutateAsync(formData);
      } else {
        result = await createMutation.mutateAsync(formData);
      }

      onSuccess?.(result);
      onOpenChange(false);
      setFormData({ name: '', sqlDraft: '' });
      setErrors({});
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setFormData({ name: '', sqlDraft: '' });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-generate template when name is entered for new procedures
      // Update template if user changes the name and sqlDraft is empty or only contains the previous template
      if (field === 'name' && !procedure && value.trim()) {
        const procedureName = value.trim();
        const isSqlDraftEmptyOrTemplate =
          !prev.sqlDraft.trim() ||
          (prev.sqlDraft.includes('CREATE OR ALTER PROCEDURE') &&
            prev.sqlDraft.includes('-- TODO: Add logic for'));

        if (isSqlDraftEmptyOrTemplate) {
          newData.sqlDraft = `CREATE OR ALTER PROCEDURE ${procedureName} AS
BEGIN
    -- TODO: Add logic for ${procedureName}
END`;

          // Clear any existing sqlDraft error since we're providing valid content
          if (errors.sqlDraft) {
            setErrors((prev) => ({ ...prev, sqlDraft: undefined }));
          }
        }
      }

      return newData;
    });

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Procedure' : 'Create New Procedure'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the stored procedure name and SQL code.'
              : 'Create a new stored procedure for your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
          <div className="space-y-4">
            {/* Procedure Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Procedure Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter procedure name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>

          {/* SQL Editor */}
          <div className="flex-1 min-h-0">
            <SqlEditorComponent
              procedure={procedure || null}
              value={formData.sqlDraft}
              onChange={(value) => handleInputChange('sqlDraft', value)}
              readOnly={isLoading}
              height="400px"
              workspaceSlug={workspaceSlug}
            />
            {errors.sqlDraft && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.sqlDraft}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : isEditing
                  ? 'Update Procedure'
                  : 'Create Procedure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
