import { createFileRoute, useParams } from '@tanstack/react-router';
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
import { Settings, Calendar, Globe } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/c/$slug/settings')({
  component: WorkspaceSettings,
});

function WorkspaceSettings() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/settings' });
  const { 
    currentWorkspace, 
    isLoading, 
    workspaceProfile
  } = useWorkspace();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-muted-foreground">
            The workspace &quot;{slug}&quot; does not exist or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }

return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspace settings</h1>
          <p className="text-muted-foreground">{currentWorkspace.slug} configuration</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {workspaceProfile?.workspaceRole || 'Loading...'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic workspace information and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <div className="mt-1 p-2 border rounded-md bg-muted">
                {currentWorkspace.name}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Workspace Slug</label>
              <div className="mt-1 p-2 border rounded-md bg-muted">
                {currentWorkspace.slug}
              </div>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Workspace Details
            </CardTitle>
            <CardDescription>
              Additional workspace information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Created</label>
              <div className="mt-1 p-2 border rounded-md bg-muted">
                {currentWorkspace.createdAt 
                  ? new Date(currentWorkspace.createdAt).toLocaleDateString()
                  : 'Unknown'
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Last Updated</label>
              <div className="mt-1 p-2 border rounded-md bg-muted">
                {currentWorkspace.updatedAt 
                  ? new Date(currentWorkspace.updatedAt).toLocaleDateString()
                  : 'Unknown'
                }
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Role</label>
              <div className="mt-1 p-2 border rounded-md bg-muted">
                {workspaceProfile?.workspaceRole || 'Loading...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Additional workspace configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Advanced workspace settings are not yet available.</p>
            <p className="text-sm">This feature is coming in a future update.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}