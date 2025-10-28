import { Link, useNavigate } from '@tanstack/react-router';
import {
  Building2,
  Home,
  Settings,
  Shield,
  Users,
  UserPlus,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminNavigationProps {
  currentPath?: string;
  workspaceSlug?: string;
}

export function AdminNavigation({
  currentPath,
  workspaceSlug,
}: AdminNavigationProps) {
  const isWorkspaceAdmin = !!workspaceSlug;
  const navigate = useNavigate();

  const mainNavItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: Home,
      description: 'Platform admin dashboard',
    },
    {
      label: 'Workspaces',
      href: '/admin/workspaces',
      icon: Building2,
      description: 'Manage all workspaces',
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'Manage platform users',
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Platform settings',
    },
  ];

  const workspaceNavItems = workspaceSlug
    ? [
        {
          label: 'Overview',
          href: `/admin/c/${workspaceSlug}`,
          icon: BarChart3,
          description: 'Workspace overview and stats',
        },
        {
          label: 'Members',
          href: `/admin/c/${workspaceSlug}/users`,
          icon: Users,
          description: 'Manage workspace members',
        },
      ]
    : [];

  const quickActions = isWorkspaceAdmin
    ? [
        {
          label: 'Add Member',
          href: '#',
          icon: UserPlus,
          action: 'add-member',
          description: 'Add new member to workspace',
        },
      ]
    : [
        {
          label: 'Create Workspace',
          href: '#',
          icon: Building2,
          action: 'create-workspace',
          description: 'Create new workspace',
        },
        {
          label: 'Add User',
          href: '#',
          icon: UserPlus,
          action: 'add-user',
          description: 'Create new platform user',
        },
      ];

  const isActive = (href: string) => {
    if (!currentPath) return false;
    if (href === currentPath) return true;
    if (currentPath.startsWith(href + '/')) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(isWorkspaceAdmin ? workspaceNavItems : mainNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive(item.href) && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={item.action}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Handle navigation actions
                  if (item.action === 'create-workspace') {
                    navigate('/admin/workspaces?action=create');
                  } else if (item.action === 'add-user') {
                    navigate('/admin/users?action=add');
                  } else if (item.action === 'add-member' && workspaceSlug) {
                    navigate(`/admin/c/${workspaceSlug}/users?action=add`);
                  }
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Back Navigation */}
      {isWorkspaceAdmin && (
        <Card>
          <CardContent className="pt-6">
            <Link to="/admin/workspaces">
              <Button variant="outline" className="w-full">
                <Building2 className="mr-2 h-4 w-4" />
                Back to Workspaces
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
