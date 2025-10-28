import { createFileRoute } from '@tanstack/react-router';
import { useWorkspace } from '@/features/workspaces';
import { workspacesApi } from '@/features/workspaces';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, User, Settings } from 'lucide-react';

export const Route = createFileRoute('/_dashboard/c/$slug/activities')({
  component: WorkspaceActivities,
});

function WorkspaceActivities() {
  const { currentWorkspace } = useWorkspace();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['workspace-activities', currentWorkspace?.slug],
    queryFn: () => workspacesApi.getWorkspaceActivities(currentWorkspace!.slug),
    enabled: !!currentWorkspace,
  });

  if (!currentWorkspace) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 pb-3 border-b">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 pb-3 border-b">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_joined':
        return <User className="h-4 w-4" />;
      case 'workspace_created':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: any) => {
    switch (activity.type) {
      case 'user_joined':
        return `${activity.actor} joined the workspace`;
      case 'workspace_created':
        return `Workspace was created`;
      default:
        return activity.description || 'Unknown activity';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-muted-foreground">
            Recent activities in {currentWorkspace.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest activities in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {activities?.items && activities.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.items.map((activity: any) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <span>{getActivityDescription(activity)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.actor}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No activities yet</h3>
              <p className="text-muted-foreground">
                Activities will appear here as team members interact with the
                workspace.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
