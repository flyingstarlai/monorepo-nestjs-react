import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Settings,
  Building2,
  Calendar,
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  const {} = useAuth();
  const { slug } = Route.useParams();

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

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="text-center py-8">Loading workspace overview...</div>
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
            variant="outline"
            onClick={() => (window.location.href = `/admin/c/${slug}/settings`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            onClick={() => (window.location.href = `/admin/c/${slug}/users`)}
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Members
          </Button>
        </div>
      </div>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>Basic workspace details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <div className="font-semibold">{workspace.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Slug
              </label>
              <div className="font-semibold">/{workspace.slug}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div>
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
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <div className="font-semibold">
                {new Date(workspace.createdAt).toLocaleDateString()}
              </div>
            </div>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              className="w-full justify-start"
              onClick={() => (window.location.href = `/admin/c/${slug}/users`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Members
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                (window.location.href = `/admin/c/${slug}/settings`)
              }
            >
              <Settings className="mr-2 h-4 w-4" />
              Workspace Settings
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
    </div>
  );
}
