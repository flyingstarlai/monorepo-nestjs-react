import { createFileRoute, redirect } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2, Users, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';

import {
  workspaceApi,
  type Workspace,
} from '@/features/admin/api/workspace.api';
import { CreateWorkspaceDialog } from '@/features/admin/components/create-workspace-dialog';

export const Route = createFileRoute('/_dashboard/admin/workspaces')({
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
  component: AdminWorkspaces,
});

function AdminWorkspaces() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  // Check for create action in URL
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('action') === 'create';
    }
    return false;
  });

  // Fetch workspaces
  const {
    data: workspacesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-workspaces', page, limit, search, isActiveFilter],
    queryFn: () =>
      workspaceApi.listWorkspaces({
        page,
        limit,
        search,
        isActive: isActiveFilter,
      }),
  });

  const workspaces = workspacesData?.workspaces || [];
  const pagination = workspacesData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  const columns = React.useMemo<ColumnDef<Workspace>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Workspace',
        cell: ({ row }) => {
          const workspace = row.original;
          return (
            <div>
              <div className="font-medium">{workspace.name}</div>
              <div className="text-sm text-muted-foreground">
                /{workspace.slug}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const workspace = row.original;
          return (
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
          );
        },
      },
      {
        accessorKey: 'memberCount',
        header: 'Members',
        cell: ({ row }) => {
          const count = row.getValue('memberCount') as number;
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{count}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string;
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => {
          const date = row.getValue('updatedAt') as string;
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
      },
    ],
    []
  );

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Workspace Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage all workspaces in the platform
          </p>
        </div>
        <CreateWorkspaceDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </Button>
        </CreateWorkspaceDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Workspaces
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">All workspaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workspaces
            </CardTitle>
            <ToggleRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.filter((w) => w.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Workspaces
            </CardTitle>
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.filter((w) => !w.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaces.reduce((sum, w) => sum + w.memberCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all workspaces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-40">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={
                  isActiveFilter === undefined
                    ? 'all'
                    : isActiveFilter
                      ? 'active'
                      : 'inactive'
                }
                onValueChange={(value) => {
                  const newFilter =
                    value === 'all' ? undefined : value === 'active';
                  setIsActiveFilter(newFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>
            Showing {workspaces.length} of {pagination.total} workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={workspaces}
            isLoading={isLoading}
            error={error ? 'Failed to load workspaces' : undefined}
            pagination={{
              page,
              totalPages: pagination.totalPages,
              onPageChange: setPage,
            }}
            searchPlaceholder="Search workspaces..."
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <div style={{ display: 'none' }} />
      </CreateWorkspaceDialog>
    </div>
  );
}
