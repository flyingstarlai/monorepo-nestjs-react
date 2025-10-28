import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import type { Workspace } from '../api/admin.api';

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  onSubmit: (data: { name?: string; isActive?: boolean }) => void;
  isLoading: boolean;
}

export function EditWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onSubmit,
  isLoading,
}: EditWorkspaceDialogProps) {
  const [name, setName] = useState(workspace.name);
  const [isActive, setIsActive] = useState(workspace.isActive);

  useEffect(() => {
    setName(workspace.name);
    setIsActive(workspace.isActive);
  }, [workspace]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const changes: { name?: string; isActive?: boolean } = {};

    if (name !== workspace.name) {
      changes.name = name;
    }

    if (isActive !== workspace.isActive) {
      changes.isActive = isActive;
    }

    if (Object.keys(changes).length > 0) {
      onSubmit(changes);
    } else {
      onOpenChange(false);
    }
  };

  const hasChanges = name !== workspace.name || isActive !== workspace.isActive;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Make changes to {workspace.name} here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive workspaces are inaccessible to users
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!hasChanges || isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
