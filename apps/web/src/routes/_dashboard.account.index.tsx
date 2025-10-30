import { createFileRoute, redirect } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Activity, Clock, User } from 'lucide-react';
import { useUserActivities } from '@/features/activities/hooks/use-user-activities';
import type { Activity as ActivityType } from '@/features/workspaces/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import React, { useState } from 'react';

export const Route = createFileRoute('/_dashboard/account/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AccountOverview,
});

function AccountOverview() {
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useUserActivities({ limit: 10 });
  const [search, setSearch] = useState('');

  const activityColumns = React.useMemo<ColumnDef<ActivityType>[]>(
    () => [
      {
        accessorKey: 'message',
        header: 'Activity',
        cell: ({ row }) => {
          const activity = row.original;
          return (
            <div className="flex items-center gap-3">
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
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Account Overview</h1>
          <p className="text-muted-foreground">
            Your activities across all workspaces
          </p>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activitiesData?.items?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Your recent activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Your account is in good standing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Recent Activities
          </CardTitle>
          <CardDescription>
            Your activities across all workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={activityColumns}
            data={activitiesData?.items || []}
            isLoading={activitiesLoading}
            error={activitiesError ? 'Failed to load activities' : undefined}
            searchPlaceholder="Search activities..."
            searchValue={search}
            onSearchChange={setSearch}
            emptyStateMessage="No recent activities"
          />
        </CardContent>
      </Card>
    </div>
  );
}
