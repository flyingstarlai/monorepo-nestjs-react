import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import { useWorkspace, useWorkspaceActions } from '@/features/workspaces';
import { useEffect } from 'react';

export const Route = createFileRoute('/_dashboard/c/$slug')({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug' });
  const { 
    currentWorkspace, 
    isLoading, 
    isSwitchingWorkspace,
    workspaces, 
    workspaceProfile
  } = useWorkspace();
  const { fetchWorkspaces, fetchWorkspaceProfile } = useWorkspaceActions();

  useEffect(() => {
    // Fetch workspaces if not loaded yet
    if (workspaces.length === 0 && !isLoading) {
      fetchWorkspaces();
    }
  }, [workspaces.length, isLoading]); // Remove fetchWorkspaces from deps since it's now stable

  useEffect(() => {
    // Fetch profile once per slug; avoid loops on loading state changes
    if (slug && (!workspaceProfile || currentWorkspace?.slug !== slug)) {
      fetchWorkspaceProfile(slug);
    }
  }, [slug, workspaceProfile, currentWorkspace?.slug]); // Remove fetchWorkspaceProfile from deps since it's now stable

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
                {isSwitchingWorkspace ? 'Switching workspace...' : 'Loading workspace...'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSwitchingWorkspace 
                  ? 'Please wait while we switch your workspace'
                  : 'Setting up your workspace environment'
                }
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
            The workspace "{slug}" does not exist or you don't have access to
            it. Please select a workspace from the sidebar or contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
