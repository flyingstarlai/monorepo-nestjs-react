import { createFileRoute, useParams } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useWorkspace, useWorkspaceMembers } from '@/features/workspaces';
import { useWorkspaceOptimized } from '@/features/workspaces/stores/workspace.store';
import { AddMemberDialog } from '@/features/workspaces/components/add-member-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Users, Mail, Shield, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

export const Route = createFileRoute('/_dashboard/c/$slug/members')({
  component: WorkspaceMembers,
});

function WorkspaceMembers() {
  const { slug } = useParams({ from: '/_dashboard/c/$slug/members' });
  const { currentWorkspace, isLoading } = useWorkspace();
  const { canManageWorkspace } = useWorkspaceOptimized();
  const [search, setSearch] = useState('');

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useWorkspaceMembers(slug);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Member',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{member.name}</h3>
                  <Badge
                    variant={member.isActive ? 'default' : 'secondary'}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {member.username}
                </div>
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
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{member.role}</Badge>
            </div>
          );
        },
      },
    ],
    []
  );

  if (isLoading || membersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={[]}
              isLoading={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Workspace Not Found</h2>
          <p className="text-muted-foreground">
            The workspace &quot;{slug}&quot; does not exist or you don&apos;t
            have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Workspace Members
              </CardTitle>
              <CardDescription>
                Manage members and their roles in {currentWorkspace.name}
              </CardDescription>
            </div>
              {canManageWorkspace && (
              <AddMemberDialog>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </AddMemberDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={members || []}
            isLoading={false}
            error={membersError ? `Failed to load members: ${membersError.message}` : undefined}
            searchPlaceholder="Search members..."
            searchValue={search}
            onSearchChange={setSearch}
            emptyState={
              !members || members.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-4">
                    No members found in this workspace
                  </div>
                  {canManageWorkspace && (
                    <AddMemberDialog>
                      <Button variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add First Member
                      </Button>
                    </AddMemberDialog>
                  )}
                </div>
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
