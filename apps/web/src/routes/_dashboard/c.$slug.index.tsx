import { createFileRoute, useParams } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useWorkspace, useWorkspaceActions } from '@/features/workspaces';
import { useWorkspaceActivities } from '@/features/activities/hooks/use-workspace-activities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Users, Calendar, Clock, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';

export const Route = createFileRoute('/_dashboard/c/$slug/')({
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/' });
  const {
    currentWorkspace,
    isLoading,
    isSwitchingWorkspace,
    workspaces,
    workspaceProfile,
  } = useWorkspace();
  const { fetchWorkspaces, fetchWorkspaceProfile } = useWorkspaceActions();
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useWorkspaceActivities({ limit: 5 });
  const [search, setSearch] = useState('');

  const activityColumns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'message',
        header: 'Activity',
        cell: ({ row }) => {
          const activity = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  useEffect(() => {
    // Fetch workspaces if not loaded yet
    if (workspaces.length === 0 && !isLoading) {
      fetchWorkspaces();
    }
  }, [workspaces.length, isLoading, fetchWorkspaces]);

  useEffect(() => {
    // Fetch profile once per slug; avoid loops on loading state changes
    if (slug && (!workspaceProfile || currentWorkspace?.slug !== slug)) {
      fetchWorkspaceProfile(slug);
    }
  }, [slug, workspaceProfile, currentWorkspace?.slug, fetchWorkspaceProfile]);

  // Check if current workspace matches the slug
  const isCorrectWorkspace = currentWorkspace?.slug === slug;

  // Show loading state during initial load or workspace switching
  if (isLoading || isSwitchingWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-background">
        <div className="flex flex-col items-center space-y-6 max-w-md w-full">
          {/* Loading spinner with status */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {isSwitchingWorkspace
                  ? 'Switching workspace...'
                  : 'Loading workspace...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSwitchingWorkspace
                  ? 'Please wait while we switch your workspace'
                  : 'Setting up your workspace environment'}
              </p>
            </div>
          </div>

          {/* Progress skeleton */}
          <div className="w-full space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "Not Found" if we're not in a switching state and have finished loading
  if (!currentWorkspace || !isCorrectWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-muted-foreground">
            The workspace &quot;{slug}&quot; does not exist or you don&apos;t
            have access to it. Please select a workspace from the sidebar or
            contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceProfile?.workspaceRole || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Workspace permission level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceProfile?.joinedAt
                ? new Date(workspaceProfile.joinedAt).toLocaleDateString()
                : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Date you joined this workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceProfile?.globalRole || 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform-wide permissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to {currentWorkspace.name}</CardTitle>
          <CardDescription>
            You are viewing this workspace as a{' '}
            {workspaceProfile?.workspaceRole?.toLowerCase() || 'member'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">View Members</h5>
                  <p className="text-sm text-muted-foreground">
                    Manage workspace members and their roles
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Settings</h5>
                  <p className="text-sm text-muted-foreground">
                    Configure workspace preferences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Recent activities in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={activityColumns}
            data={activitiesData?.items || []}
            isLoading={activitiesLoading}
            error={activitiesError ? "Failed to load activities" : undefined}
            searchPlaceholder="Search activities..."
            searchValue={search}
            onSearchChange={setSearch}
            emptyStateMessage="No recent activities"
          />
        </CardContent>
      </Card>
    </div>
  );
}
