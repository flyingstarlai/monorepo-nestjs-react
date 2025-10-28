import { createFileRoute } from '@tanstack/react-router';
import { useWorkspace } from '@/features/workspaces';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, Calendar, Shield } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/c/$slug/settings')({
  component: WorkspaceSettings,
});

function WorkspaceSettings() {
  const { currentWorkspace, workspaceProfile } = useWorkspace();

  if (!currentWorkspace || !workspaceProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage workspace settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Information</CardTitle>
            <CardDescription>
              Basic information about this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Workspace Name</div>
              <div className="text-sm">{currentWorkspace.name}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Workspace Slug</div>
              <div className="text-sm font-mono">{currentWorkspace.slug}</div>
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Your Role</div>
              <Badge variant="outline">{workspaceProfile.workspaceRole}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Access</CardTitle>
            <CardDescription>
              Your permissions and access level in this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Workspace Role</div>
                <div className="text-sm text-muted-foreground">
                  {workspaceProfile.workspaceRole}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Global Role</div>
                <div className="text-sm text-muted-foreground">
                  {workspaceProfile.globalRole}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Member Since</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(workspaceProfile.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Management</CardTitle>
          <CardDescription>
            Actions you can perform based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">View Members</h4>
              <p className="text-sm text-muted-foreground">
                Browse all workspace members and their roles
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">View Activities</h4>
              <p className="text-sm text-muted-foreground">
                See recent activities within this workspace
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
