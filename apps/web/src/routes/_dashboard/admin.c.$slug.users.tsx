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
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import React, { useCallback } from 'react';
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
import { AdminNavigation } from '@/features/admin/components/admin-navigation';
import { CreateUserDialog } from '@/features/admin/components/create-user-dialog';
import {
  workspaceApi,
  type WorkspaceMember,
} from '@/features/admin/api/workspace.api';
import { useAuth } from '@/features/auth';

export const Route = createFileRoute('/_dashboard/admin/c/$slug/users')({
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
  component: AdminWorkspaceMembers,
});

// Debounced input component
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

function AdminWorkspaceMembers() {
  const {} = useAuth();
  const { slug } = Route.useParams();
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Fetch workspace details and members
  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['admin-workspace', slug],
    queryFn: () => workspaceApi.getWorkspace(slug),
  });

  const {
    data: members = [],
    isLoading: membersLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-workspace-members', slug],
    queryFn: () => workspaceApi.getWorkspaceMembers(slug),
  });

  const isLoading = workspaceLoading || membersLoading;

  const handleToggleMemberStatus = useCallback(
    async (member: WorkspaceMember) => {
      try {
        await workspaceApi.toggleMemberStatus(slug, member.id);
        refetch();
      } catch (error) {
        console.error('Failed to toggle member status:', error);
      }
    },
    [slug, refetch]
  );

  const handleUpdateMemberRole = useCallback(
    async (member: WorkspaceMember, newRole: string) => {
      try {
        await workspaceApi.updateMemberRole(slug, member.id, {
          role: newRole as any,
        });
        refetch();
      } catch (error) {
        console.error('Failed to update member role:', error);
      }
    },
    [slug, refetch]
  );

  const handleRemoveMember = useCallback(
    async (member: WorkspaceMember) => {
      if (
        !confirm(
          `Are you sure you want to remove "${member.name}" from this workspace?`
        )
      ) {
        return;
      }

      try {
        await workspaceApi.removeMember(slug, member.id);
        refetch();
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    },
    [slug, refetch]
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Crown className="h-4 w-4" />;
      case 'Author':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500';
      case 'Author':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
    }
  };

  const columns = React.useMemo<ColumnDef<WorkspaceMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Member',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div>
              <div className="font-medium">{member.name}</div>
              <div className="text-sm text-muted-foreground">
                @{member.username}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-2">
              <Badge className={getRoleColor(member.role)}>
                <div className="flex items-center gap-1">
                  {getRoleIcon(member.role)}
                  {member.role}
                </div>
              </Badge>
            </div>
          );
        },
        filterFn: (row, _id, value) => {
          const member = row.original;
          const searchValue = value.toLowerCase();
          return member.role.toLowerCase().includes(searchValue);
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <Badge
              variant={member.isActive ? 'default' : 'secondary'}
              className={
                member.isActive
                  ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                  : ''
              }
            >
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        filterFn: (row, _id, value) => {
          const member = row.original;
          const searchValue = value.toLowerCase();
          return (member.isActive ? 'active' : 'inactive').includes(
            searchValue
          );
        },
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => {
          const date = row.getValue('joinedAt') as string;
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Select
                value={member.role}
                onValueChange={(value) => handleUpdateMemberRole(member, value)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Author">Author</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleMemberStatus(member)}
              >
                {member.isActive ? (
                  <ToggleLeft className="h-4 w-4" />
                ) : (
                  <ToggleRight className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMember(member)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleToggleMemberStatus, handleUpdateMemberRole, handleRemoveMember]
  );

  const table = useReactTable({
    data: members,
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
        pageSize: 20,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <AdminNavigation
            currentPath={`/admin/c/${slug}/users`}
            workspaceSlug={slug}
          />
        </div>
        <div className="flex-1">
          <div className="text-center py-8">Loading workspace members...</div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <AdminNavigation
            currentPath={`/admin/c/${slug}/users`}
            workspaceSlug={slug}
          />
        </div>
        <div className="flex-1">
          <div className="text-center py-8 text-destructive">
            Workspace not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <AdminNavigation
          currentPath={`/admin/c/${slug}/users`}
          workspaceSlug={slug}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              {workspace.name} - Members
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage members of workspace "{workspace.name}" ({workspace.slug})
            </p>
          </div>
          <CreateUserDialog workspaceSlug={slug}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </CreateUserDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">All members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Members
              </CardTitle>
              <ToggleRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === 'Owner').length}
              </div>
              <p className="text-xs text-muted-foreground">Workspace owners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authors</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter((m) => m.role === 'Author').length}
              </div>
              <p className="text-xs text-muted-foreground">Workspace authors</p>
            </CardContent>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage workspace members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="mb-4">
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={(value) => setGlobalFilter(String(value))}
                placeholder="Search members by name, username, role, or status..."
                className="w-full"
              />
            </div>

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
                  {error ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center text-destructive"
                      >
                        Failed to load members
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center text-muted-foreground"
                      >
                        No members found
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

            {/* Pagination */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
