import { createFileRoute, redirect } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Lock, Shield, UserCheck, UserPlus, Users } from 'lucide-react';
import React, { useCallback, useState } from 'react';
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

import { AddUserDialog } from '@/features/admin/components/add-user-dialog';
import {
  useSetUserActiveMutation,
  useSetUserRoleMutation,
  useUsersQuery,
} from '@/features/admin/hooks';
import { useAuth } from '@/features/auth';
import type { User } from '@/features/auth/types';

export const Route = createFileRoute('/_dashboard/admin/users')({
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
  component: AdminUsers,
});



function AdminUsers() {
  const { user } = useAuth();
  const { data: users = [], isLoading, error } = useUsersQuery();
  const setUserActiveMutation = useSetUserActiveMutation();
  const setUserRoleMutation = useSetUserRoleMutation();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const handleToggleActive = useCallback(
    (userId: string, isActive: boolean) => {
      setUserActiveMutation.mutate({ userId, isActive });
    },
    [setUserActiveMutation]
  );

  const handleRoleChange = useCallback(
    (userId: string, roleName: 'Admin' | 'User') => {
      setUserRoleMutation.mutate({ userId, roleName });
    },
    [setUserRoleMutation]
  );

  const columns = React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => {
          const userData = row.original;
          return (
            <div>
              <div className="font-medium">{userData.name}</div>
              <div className="text-sm text-muted-foreground">
                @{userData.username}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const userData = row.original;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  userData.role === 'Admin'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
                    : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                }
              >
                {userData.role}
              </Badge>
              <Badge
                variant={userData.isActive ? 'default' : 'secondary'}
                className={
                  userData.isActive
                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                    : ''
                }
              >
                {userData.isActive ? 'Active' : 'Disabled'}
              </Badge>
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
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const userData = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Select
                value={userData.role}
                onValueChange={(value: 'Admin' | 'User') =>
                  handleRoleChange(userData.id, value)
                }
                disabled={userData.id === user?.id}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleActive(userData.id, !userData.isActive)
                }
                disabled={userData.id === user?.id}
              >
                {userData.isActive ? 'Disable' : 'Enable'}
              </Button>
            </div>
          );
        },
      },
    ],
    [user, handleToggleActive, handleRoleChange]
  );



  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage users and their permissions
          </p>
        </div>
        <AddUserDialog>
          <Button id="add-user-button">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </AddUserDialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'Admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active users
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Users
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            error={error ? "Failed to load users" : undefined}
            pagination={{
              page,
              totalPages: Math.ceil(users.length / pageSize),
              onPageChange: setPage,
              pageSize,
              onPageSizeChange: setPageSize,
            }}
            searchPlaceholder="Search users by name, username, role, or status..."
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
