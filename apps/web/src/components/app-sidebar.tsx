import { useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  Home,
  User,
  CreditCard,
  Shield,
} from 'lucide-react';
import type * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { WorkspaceSwitcher } from '@/features/workspaces';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/features/auth';
import { useWorkspaceStore } from '@/features/workspaces/stores/workspace.store';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  // Use individual selectors to prevent infinite loops
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const canManageWorkspace = useWorkspaceStore((state) =>
    state.canManageWorkspace()
  );
  const location = useLocation();

  // Workspace navigation items
  const workspaceNavItems = [
    {
      title: 'Dashboard',
      url: currentWorkspace
        ? `/c/${currentWorkspace.slug}/dashboard`
        : '/dashboard',
      icon: LayoutDashboard,
    },
  ];

  // Add workspace management for users with permissions
  if (currentWorkspace && canManageWorkspace) {
    workspaceNavItems.push({
      title: 'Members',
      url: `/c/${currentWorkspace.slug}/members`,
      icon: Users,
    });
  }

  // Add workspace settings for users with permissions
  if (currentWorkspace && canManageWorkspace) {
    workspaceNavItems.push({
      title: 'Settings',
      url: `/c/${currentWorkspace.slug}/settings`,
      icon: Settings,
    });
  }

  // User settings items (separate from workspace)
  const userSettingsItems = [
    {
      title: 'Profile',
      url: '/settings/profile',
      icon: User,
    },
    {
      title: 'Security',
      url: '/settings/security',
      icon: Shield,
    },
    {
      title: 'Billing',
      url: '/settings/billing',
      icon: CreditCard,
    },
  ];

  // Admin navigation items (only for Admin users)
  const adminNavItems = [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: Home,
    },
    {
      title: 'Workspaces',
      url: '/admin/workspaces',
      icon: Building2,
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: Users,
    },
  ];

  // Determine active state based on current pathname
  const isWorkspaceActive = workspaceNavItems.some(
    (item) => location.pathname === item.url
  );
  const isAdminActive = adminNavItems.some(
    (item) => location.pathname === item.url
  );

  const data = {
    user: {
      name: user?.name || 'User',
      username: user?.username || 'user',
      avatar: user?.avatar,
    },
    navMain: workspaceNavItems.map((item) => ({
      ...item,
      isActive: location.pathname === item.url,
    })),
    userSettingsItems: userSettingsItems.map((item) => ({
      ...item,
      isActive: location.pathname === item.url,
    })),
    hasAdminAccess: user?.role === 'Admin',
    adminNavItems: adminNavItems.map((item) => ({
      ...item,
      isActive: location.pathname === item.url,
    })),
    isWorkspaceActive,
    isAdminActive,
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Workspace Navigation */}
        <NavMain
          items={data.navMain}
          title={currentWorkspace ? currentWorkspace.name : 'Workspace'}
        />

        {/* Account Settings - Always visible */}
        <NavMain items={data.userSettingsItems} title="Account" />

        {/* Admin Navigation - Only for Admin users */}
        {data.hasAdminAccess && (
          <NavMain items={data.adminNavItems} title="Platform Admin" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
