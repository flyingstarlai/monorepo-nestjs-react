import * as React from 'react';
import { GalleryVerticalEnd, LayoutDashboard, Shield } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/features/auth';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const navMain = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: true,
    },
  ];

  // Add admin route only for admin users
  if (user?.role === 'Admin') {
    navMain.push({
      title: 'Admin Panel',
      url: '/admin',
      icon: Shield,
      isActive: false,
    });
  }

  const data = {
    user: {
      name: user?.name || 'User',
      username: user?.username || 'user',
      avatar: user?.avatar,
    },
    teams: [
      {
        name: 'My App',
        logo: GalleryVerticalEnd,
        plan: 'Free',
      },
    ],
    navMain,
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
