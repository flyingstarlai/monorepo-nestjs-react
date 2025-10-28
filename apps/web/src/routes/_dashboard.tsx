import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppSidebar } from '@/components/app-sidebar';
import { AppBreadcrumb } from '@/components/layout/app-breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useWorkspaceActions, useWorkspaces } from '@/features/workspaces/stores/workspace.store';
import { useEffect } from 'react';

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

  useEffect(() => {
    // Initialize workspace store on app load
    if (workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [workspaces.length]); // Remove fetchWorkspaces from deps since it's now stable

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
            <AppBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full max-w-7xl overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
