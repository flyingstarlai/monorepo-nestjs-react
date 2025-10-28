import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  Settings,
  Building2,
  Save,
  Trash2,
  AlertTriangle,
  Edit,
  Users,
  BarChart3,
} from 'lucide-react';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminNavigation } from '@/features/admin/components/admin-navigation';
import { workspaceApi } from '@/features/admin/api/workspace.api';
import { useAuth } from '@/features/auth';

export const Route = createFileRoute('/_dashboard/admin/c/$slug/settings')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }

    // Check if user has admin role
    if (context.auth.user?.role !== 'Admin') {
      throw redirect({
        to: '/',
      });
    }
  },
  component: AdminWorkspaceSettings,
});

function AdminWorkspaceSettings() {
  const {} = useAuth();
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch workspace details
  const {
    data: workspace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-workspace', slug],
    queryFn: () => workspaceApi.getWorkspace(slug),
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when workspace data loads
  React.useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        isActive: workspace.isActive,
      });
    }
  }, [workspace]);

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: (data: { name?: string; isActive?: boolean }) =>
      workspaceApi.updateWorkspace(slug, data),
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData(['admin-workspace', slug], updatedWorkspace);
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Failed to update workspace:', error);
      setIsSubmitting(false);
    },
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => workspaceApi.deleteWorkspace(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      window.location.href = '/admin/workspaces';
    },
    onError: (error) => {
      console.error('Failed to delete workspace:', error);
      setIsDeleting(false);
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!workspace) return;

    setIsSubmitting(true);

    const updateData: any = {};
    if (formData.name !== workspace.name) {
      updateData.name = formData.name;
    }
    if (formData.isActive !== workspace.isActive) {
      updateData.isActive = formData.isActive;
    }

    if (Object.keys(updateData).length > 0) {
      updateWorkspaceMutation.mutate(updateData);
    } else {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;

    const confirmMessage = `Are you sure you want to delete the workspace "${workspace.name}"? This action cannot be undone and will remove all workspace data.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    deleteWorkspaceMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <AdminNavigation
            currentPath={`/admin/c/${slug}/settings`}
            workspaceSlug={slug}
          />
        </div>
        <div className="flex-1">
          <div className="text-center py-8">Loading workspace settings...</div>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <AdminNavigation
            currentPath={`/admin/c/${slug}/settings`}
            workspaceSlug={slug}
          />
        </div>
        <div className="flex-1">
          <div className="text-center py-8 text-destructive">
            {error ? 'Failed to load workspace' : 'Workspace not found'}
          </div>
        </div>
      </div>
    );
  }

  const hasChanges =
    formData.name !== workspace.name ||
    formData.isActive !== workspace.isActive;

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <AdminNavigation
          currentPath={`/admin/c/${slug}/settings`}
          workspaceSlug={slug}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              {workspace.name} - Settings
            </h1>
            <p className="mt-2 text-muted-foreground">
              Configure workspace settings and preferences
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = `/admin/c/${slug}`)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button
              onClick={() => (window.location.href = `/admin/c/${slug}/users`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
          </div>
        </div>

        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Basic Settings
            </CardTitle>
            <CardDescription>
              Configure basic workspace information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Workspace Slug</Label>
                <Input
                  id="slug"
                  value={workspace.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Slug cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Workspace Status</Label>
                <p className="text-sm text-muted-foreground">
                  Active workspaces are accessible to all members
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange('isActive', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Workspace Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Workspace Information
            </CardTitle>
            <CardDescription>Read-only workspace details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Workspace ID</Label>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {workspace.id}
                </div>
              </div>
              <div>
                <Label>Member Count</Label>
                <div className="font-semibold">
                  {workspace.memberCount} members
                </div>
              </div>
              <div>
                <Label>Created</Label>
                <div className="font-semibold">
                  {new Date(workspace.createdAt).toLocaleDateString()} at{' '}
                  {new Date(workspace.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <Label>Last Updated</Label>
                <div className="font-semibold">
                  {new Date(workspace.updatedAt).toLocaleDateString()} at{' '}
                  {new Date(workspace.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={workspace.isActive ? 'default' : 'secondary'}
                  className={
                    workspace.isActive
                      ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                      : ''
                  }
                >
                  {workspace.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Workspace is{' '}
                  {workspace.isActive
                    ? 'active and accessible'
                    : 'inactive and not accessible'}
                </span>
              </div>

              {workspace.memberCount === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Members</AlertTitle>
                  <AlertDescription>
                    This workspace has no members. Consider adding members or
                    deleting the workspace if it's no longer needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Administrative actions for this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  setFormData({
                    name: workspace.name,
                    isActive: workspace.isActive,
                  })
                }
                disabled={!hasChanges}
              >
                Reset
              </Button>
            </div>

            {hasChanges && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Unsaved Changes</AlertTitle>
                <AlertDescription>
                  You have unsaved changes. Click "Save Changes" to apply them.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Delete Workspace</AlertTitle>
              <AlertDescription>
                Deleting this workspace will permanently remove all data,
                including members, activities, and settings. This action cannot
                be undone.
              </AlertDescription>
            </Alert>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || workspace.memberCount > 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Workspace'}
            </Button>

            {workspace.memberCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Cannot delete workspace with active members. Remove all members
                first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
