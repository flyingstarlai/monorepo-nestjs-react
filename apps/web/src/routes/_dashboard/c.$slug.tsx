import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useWorkspace } from '@/features/workspaces';

export const Route = createFileRoute('/_dashboard/c/$slug')({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { currentWorkspace, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">
            Please select a workspace from the sidebar or contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
