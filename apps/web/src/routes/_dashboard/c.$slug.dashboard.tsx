import { createFileRoute } from '@tanstack/react-router';
import { useWorkspace } from '@/features/workspaces';
import { useRecentActivities } from '@/features/activities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Clock, Activity } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/c/$slug/dashboard')({
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { currentWorkspace, workspaceProfile } = useWorkspace();
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useRecentActivities({ limit: 5 });

  if (!currentWorkspace || !workspaceProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
          <p className="text-muted-foreground">{currentWorkspace.slug}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {workspaceProfile.workspaceRole}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceProfile.workspaceRole}
            </div>
            <p className="text-xs text-muted-foreground">
              Workspace permission level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(workspaceProfile.joinedAt).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Date you joined this workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Role</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceProfile.globalRole}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform-wide permissions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to {currentWorkspace.name}</CardTitle>
          <CardDescription>
            You are viewing this workspace as a{' '}
            {workspaceProfile.workspaceRole.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">View Members</h5>
                  <p className="text-sm text-muted-foreground">
                    Manage workspace members and their roles
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h5 className="font-medium">Settings</h5>
                  <p className="text-sm text-muted-foreground">
                    Configure workspace preferences
                  </p>
                </div>
              </div>
            </div>
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
          <CardDescription>Latest activities in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="text-center py-4">Loading activities...</div>
          ) : activitiesError ? (
            <div className="text-center py-4 text-destructive">
              Failed to load activities
            </div>
          ) : activitiesData?.items && activitiesData.items.length > 0 ? (
            <div className="space-y-4">
              {activitiesData.items.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 pb-3 border-b last:border-b-0"
                >
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent activities in this workspace
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
