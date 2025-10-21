import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Clock,
  Lock,
  RefreshCw,
  Settings,
  Shield,
  Star,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentActivities } from '../../features/activities';
import { useAuth } from '../../features/auth';

function DashboardComponent() {
  const { user } = useAuth();
  const { data: activitiesData, isLoading, error, refetch } = useRecentActivities({ limit: 5 });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return UserCheck;
      case 'profile_updated':
        return Settings;
      case 'password_changed':
        return Lock;
      case 'avatar_updated':
        return Activity;
      default:
        return Activity;
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'login_success':
        return 'text-green-600 bg-green-50';
      case 'profile_updated':
        return 'text-blue-600 bg-blue-50';
      case 'password_changed':
        return 'text-yellow-600 bg-yellow-50';
      case 'avatar_updated':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const quickActions = [
    {
      title: 'Profile Settings',
      description: 'Manage your account settings and preferences',
      icon: Settings,
      href: '/profile',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Security',
      description: 'Update password and security settings',
      icon: Lock,
      href: '/settings/security',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Billing',
      description: 'View subscription and billing information',
      icon: Star,
      href: '/settings/billing',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  if (user?.role === 'Admin') {
    quickActions.push({
      title: 'Admin Panel',
      description: 'Manage users and system administration',
      icon: Shield,
      href: '/admin',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-muted-foreground">
            Here's what's happening with your account today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {user?.role}
          </Badge>
          <Badge
            variant="secondary"
            className="text-sm bg-green-100 text-green-800 border-green-200"
          >
            Active
          </Badge>
        </div>
      </div>

      {/* User Info Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-lg font-semibold bg-blue-600 text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">@{user?.username}</p>
            </div>
            <div className="text-right sm:text-left flex-shrink-0">
              <div className="text-sm text-muted-foreground">User ID</div>
              <div className="font-mono text-sm">{user?.id}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Account is in good standing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.role}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'Admin' ? 'Full access' : 'Standard access'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">Account created recently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-muted-foreground">Recent login activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently accessed features and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group block p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
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
          <CardDescription>Your latest account activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {['skeleton-one', 'skeleton-two', 'skeleton-three'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">
                Failed to load recent activities
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : activitiesData?.items && activitiesData.items.length > 0 ? (
            <div className="space-y-4">
              {activitiesData.items.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const iconColor = getActivityIconColor(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 pb-3 border-b last:border-b-0"
                  >
                    <div className={`p-2 rounded-full flex-shrink-0 ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">No recent activities</p>
              <p className="text-xs text-muted-foreground text-center">
                Your activities will appear here as you use the app
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardComponent,
});

export { DashboardComponent };
