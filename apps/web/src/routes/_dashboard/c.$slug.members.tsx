import { createFileRoute } from '@tanstack/react-router';
import { useWorkspace } from '@/features/workspaces';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { workspacesApi } from '@/features/workspaces';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MoreHorizontal, UserPlus, Shield, UserX } from 'lucide-react';
import { WorkspaceRole } from '@/features/workspaces/types';
import { AddMemberDialog } from '@/features/workspaces/components/add-member-dialog';

export const Route = createFileRoute('/_dashboard/c/$slug/members')({
  component: WorkspaceMembers,
});

function WorkspaceMembers() {
  const { currentWorkspace, canManageWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ['workspace-members', currentWorkspace?.slug],
    queryFn: () => workspacesApi.getWorkspaceMembers(currentWorkspace!.slug),
    enabled: !!currentWorkspace,
  });

  const { toast } = useToast();

  const toggleStatusMutation = useMutation({
    mutationFn: ({ memberId }: { memberId: string }) =>
      workspacesApi.updateMemberStatus(currentWorkspace!.slug, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', currentWorkspace?.slug],
      });
      toast({
        title: 'Success',
        description: 'Member status updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update member status',
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: WorkspaceRole;
    }) =>
      workspacesApi.updateMemberRole(currentWorkspace!.slug, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace-members', currentWorkspace?.slug],
      });
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update member role',
        variant: 'destructive',
      });
    },
  });

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
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
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRole.OWNER:
        return 'default';
      case WorkspaceRole.AUTHOR:
        return 'outline';
      case WorkspaceRole.MEMBER:
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage workspace members and their permissions
          </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>
            All members of {currentWorkspace.name} and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {canManageWorkspace && (
                  <TableHead className="w-[70px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{member.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                  {canManageWorkspace && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                memberId: member.id,
                              })
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          {member.role !== WorkspaceRole.OWNER && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateRoleMutation.mutate({
                                  memberId: member.id,
                                  role:
                                    member.role === WorkspaceRole.AUTHOR
                                      ? WorkspaceRole.MEMBER
                                      : WorkspaceRole.AUTHOR,
                                })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Change to{' '}
                              {member.role === WorkspaceRole.AUTHOR
                                ? 'Member'
                                : 'Author'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
