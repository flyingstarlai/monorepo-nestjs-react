import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Activity,
  ArrowRight,
  Clock,
  Lock,
  Settings,
  Shield,
  Star,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../features/auth';

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { user } = useAuth();

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
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-green-50 rounded-full flex-shrink-0">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Successfully logged in</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-blue-50 rounded-full flex-shrink-0">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Profile updated</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-full flex-shrink-0">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Account created</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
