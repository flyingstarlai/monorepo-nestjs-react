import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Building2,
  Calendar,
  Save,
  Trash2,
  AlertTriangle,
  Edit,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { workspaceApi } from '@/features/admin/api/workspace.api';
import { useAuth } from '@/features/auth';

export const Route = createFileRoute('/_dashboard/admin/c/$slug')({
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
  component: AdminWorkspaceOverview,
});

function AdminWorkspaceOverview() {
  useAuth();
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch workspace details and stats
  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['admin-workspace', slug],
    queryFn: () => workspaceApi.getWorkspace(slug),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-workspace-stats', slug],
    queryFn: () => workspaceApi.getWorkspaceStats(slug),
  });

  const isLoading = workspaceLoading || statsLoading;

  // Form state for workspace settings
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
      navigate({ to: '/admin/workspaces' });
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

  const hasChanges = workspace
    ? formData.name !== workspace.name ||
      formData.isActive !== workspace.isActive
    : false;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace || !stats) {
    return (
      <div className="flex-1">
        <div className="text-center py-8 text-destructive">
          Workspace not found
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Crown className="h-4 w-4" />;
      case 'Admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500';
      case 'Admin':
        return 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500';
      case 'Author':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {workspace.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
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
            <span className="text-muted-foreground">/{workspace.slug}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate({ to: '/admin/c/$slug/users', params: { slug } })}
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Members
          </Button>
        </div>
      </div>

      {/* Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Workspace Settings
          </CardTitle>
          <CardDescription>
            Configure workspace information and settings
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

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={!hasChanges || isSubmitting}>
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

      {/* Member Statistics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">All members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Members
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveMembers}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMembers > 0
                ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Role Breakdown</CardTitle>
          <CardDescription>
            Distribution of member roles in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.roleBreakdown).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(role)}
                      {role}
                    </div>
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>
            Workspace activity and important dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Workspace Created</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(stats.createdAt).toLocaleDateString()} at{' '}
                  {new Date(stats.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Last Activity</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(stats.lastActivity).toLocaleDateString()} at{' '}
                  {new Date(stats.lastActivity).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <Button
              className="w-full justify-start"
              onClick={() => navigate({ to: '/admin/c/$slug/users', params: { slug } })}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => alert('Export functionality to be implemented')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
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
              including members, activities, and settings. This action cannot be
              undone.
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
  );
}
