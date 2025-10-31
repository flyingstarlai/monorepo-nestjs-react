import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { AppBreadcrumb } from '@/components/layout/app-breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import {
  useWorkspaceActions,
  useWorkspaces,
} from '@/features/workspaces/stores/workspace.store';
import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { fetchWorkspaces } = useWorkspaceActions();
  const workspaces = useWorkspaces();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const location = useLocation();

  // Check if current page is SQL editor to hide sidebar trigger
  const isSqlEditorPage = location.pathname.endsWith('/sql-editor');

  useEffect(() => {
    // Initialize workspace store on app load
    if (workspaces.length === 0) {
      fetchWorkspaces().finally(() => {
        setIsInitialLoading(false);
      });
    } else {
      setIsInitialLoading(false);
    }
  }, [workspaces.length, fetchWorkspaces]);

  if (isInitialLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
              </div>
            </div>
          </header>
          <div className="flex flex-1 items-center justify-center">
            <LoadingScreen
              message="Loading workspace"
              submessage="Please wait while we prepare your dashboard"
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {!isSqlEditorPage && (
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <AppBreadcrumb />
            </div>
          </header>
        )}
        <div
          className={`flex flex-1 flex-col gap-4 p-4 w-full overflow-hidden ${isSqlEditorPage ? 'pt-4' : 'pt-0'}`}
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
