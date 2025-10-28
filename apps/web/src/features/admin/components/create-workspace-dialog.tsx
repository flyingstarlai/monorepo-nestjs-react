import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { workspaceApi } from '@/features/admin/api/workspace.api';
import {
  useWorkspaceActions,
  useWorkspaceStore,
} from '@/features/workspaces/stores/workspace.store';

interface CreateWorkspaceDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: { name: string; slug: string }) => void;
  isLoading?: boolean;
}

export function CreateWorkspaceDialog({
  children,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const queryClient = useQueryClient();
  const { refetchWorkspaces, switchWorkspace } = useWorkspaceActions();
  const router = useRouter();

  const createWorkspaceMutation = useMutation({
    mutationFn: workspaceApi.createWorkspace,
    onSuccess: async (data) => {
      // Invalidate admin workspaces list
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      // Refresh the workspace store to update the switcher
      await refetchWorkspaces();

      // Switch to newly created workspace and navigate
      if (data?.slug) {
        const workspaces = useWorkspaceStore.getState().workspaces;
        const newWorkspace = workspaces.find((ws) => ws.slug === data.slug);
        if (newWorkspace) {
          await switchWorkspace(newWorkspace);
          router.navigate({
            to: '/c/$slug',
            params: { slug: data.slug },
          });
        }
      }

      // Reset form
      setName('');
      setSlug('');
      setDescription('');
      setIsSlugManuallyEdited(false);
      // Close dialog
      onOpenChange?.(false);
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      return;
    }

    if (onSubmit) {
      onSubmit({
        name: name.trim(),
        slug: slug.trim(),
      });
    } else {
      createWorkspaceMutation.mutate({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Only auto-generate slug if user hasn't manually edited it
    if (!isSlugManuallyEdited) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/\s+/g, '-') // Convert spaces to dashes
        .replace(/_/g, '-') // Convert underscores to dashes
        .replace(/[^a-z0-9-]+/g, '') // Remove special characters except dashes
        .replace(/-+/g, '-') // Convert multiple dashes to single dash
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
      setSlug(generatedSlug);
    }
  };

  // Handle manual slug editing
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsSlugManuallyEdited(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Workspace
            </DialogTitle>
            <DialogDescription>
              Create a new workspace for your organization. Workspaces help you
              organize projects and collaborate with team members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Workspace"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={createWorkspaceMutation.isPending}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="my-workspace"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={createWorkspaceMutation.isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for the workspace. Used in URLs.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createWorkspaceMutation.isPending}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={createWorkspaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createWorkspaceMutation.isPending ||
                !name.trim() ||
                !slug.trim()
              }
            >
              {createWorkspaceMutation.isPending || isLoading ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
