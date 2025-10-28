import { useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  Home,
  User,
  Shield,
  Activity,
} from 'lucide-react';
import React from 'react';

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
import { useCurrentWorkspace } from '@/features/workspaces/stores/workspace.store';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  // Use individual selectors to prevent infinite loops
  const currentWorkspace = useCurrentWorkspace();
  const location = useLocation();

  // Workspace navigation items
  const workspaceNavItems = [
    {
      title: 'Overview',
      url: currentWorkspace ? `/c/${currentWorkspace.slug}` : '/account',
      icon: LayoutDashboard,
    },
    {
      title: 'Members',
      url: currentWorkspace
        ? `/c/${currentWorkspace.slug}/members`
        : '/account',
      icon: Users,
    },
    {
      title: 'Settings',
      url: currentWorkspace
        ? `/c/${currentWorkspace.slug}/settings`
        : '/account',
      icon: Settings,
    },
  ];

  // User settings items (separate from workspace)
  const userSettingsItems = [
    {
      title: 'Overview',
      url: '/account',
      icon: Activity,
    },
    {
      title: 'Profile',
      url: '/account/profile',
      icon: User,
    },
    {
      title: 'Security',
      url: '/account/security',
      icon: Shield,
    },
  ];

  // Admin navigation items (only for Admin users)
  const adminNavItems = [
    {
      title: 'Overviews',
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
          title={'Workspace'}
          isLoading={!currentWorkspace && location.pathname.startsWith('/c/')}
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
