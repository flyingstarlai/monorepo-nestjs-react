import { createFileRoute, redirect } from '@tanstack/react-router';
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Lock, Shield, UserCheck, UserPlus, Users } from 'lucide-react';
import React, { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

// Debounced input component for search
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

function AdminUsers() {
  const { user } = useAuth();
  const { data: users = [], isLoading, error } = useUsersQuery();
  const setUserActiveMutation = useSetUserActiveMutation();
  const setUserRoleMutation = useSetUserRoleMutation();

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');

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
        filterFn: (row, _id, value) => {
          const user = row.original;
          const searchValue = value.toLowerCase();
          return (
            user.role.toLowerCase().includes(searchValue) ||
            (user.isActive ? 'active' : 'disabled').includes(searchValue)
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

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

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
          {/* Search Input */}
          <div className="mb-4">
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={(value) => setGlobalFilter(String(value))}
              placeholder="Search users by name, username, role, or status..."
              className="w-full"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-destructive"
                    >
                      Failed to load users
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Page Size Selector and Page Info */}
          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Items per page
              </span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
