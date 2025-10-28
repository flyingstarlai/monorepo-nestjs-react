import { useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { workspacesApi } from '@/features/workspaces/api/workspaces.api';
import { WorkspaceRole, workspaceKeys } from '@/features/workspaces';
import { useWorkspaceOptimized } from '@/features/workspaces/stores/workspace.store';
import { adminApi } from '@/features/admin/api';
import { toast } from '@/hooks/use-toast';

const addMemberSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  role: z.nativeEnum(WorkspaceRole),
});

interface AddMemberDialogProps {
  children: React.ReactNode;
}

export function AddMemberDialog({ children }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState<WorkspaceRole>(WorkspaceRole.MEMBER);
  const { currentWorkspace } = useWorkspaceOptimized();
  const queryClient = useQueryClient();

  // Fetch all available users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.listUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current workspace members to exclude them
  const { data: currentMembers = [] } = useQuery({
    queryKey: workspaceKeys.members(currentWorkspace?.slug || ''),
    queryFn: () =>
      currentWorkspace
        ? workspacesApi.getWorkspaceMembers(currentWorkspace.slug)
        : [],
    enabled: !!currentWorkspace,
  });

  // Filter out users who are already members
  const availableUsers = filteredUsers.filter(
    (user) =>
      !currentMembers.some((member) => member.username === user.username)
  );

  const addMemberMutation = useMutation({
    mutationFn: (memberData: { userId: string; role: WorkspaceRole }) => {
      const selectedUser = users.find((user) => user.id === memberData.userId);
      if (!selectedUser) {
        throw new Error('User not found');
      }
      return workspacesApi.addWorkspaceMember(currentWorkspace!.slug, {
        username: selectedUser.username,
        role: memberData.role,
      });
    },
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.members(currentWorkspace?.slug || ''),
      });
      
      // Invalidate workspace profile to update member counts
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.profile(currentWorkspace?.slug || ''),
      });
      
      // Invalidate activities to show new member addition
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.activities(currentWorkspace?.slug || ''),
      });
      
      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
      // Reset form
      setSelectedUserId('');
      setSearchQuery('');
      setRole(WorkspaceRole.MEMBER);
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const result = addMemberSchema.safeParse({ userId: selectedUserId, role });
    if (!result.success) {
      toast({
        title: 'Validation Error',
        description: result.error.issues[0]?.message || 'Invalid input',
        variant: 'destructive',
      });
      return;
    }

    addMemberMutation.mutate({ userId: selectedUserId, role });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Member
            </DialogTitle>
            <DialogDescription>
              Add a new member to {currentWorkspace?.name}. They will receive
              access based on the role you assign.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={addMemberMutation.isPending || usersLoading}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search for users to add to this workspace.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user">Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={addMemberMutation.isPending || usersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {searchQuery
                        ? 'No users found matching your search'
                        : 'No available users to add'}
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {availableUsers.length > 0 &&
                  `${availableUsers.length} user${availableUsers.length === 1 ? '' : 's'} available to add`}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as WorkspaceRole)}
                disabled={addMemberMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WorkspaceRole.MEMBER}>
                    Member - Can view and participate
                  </SelectItem>
                  <SelectItem value={WorkspaceRole.AUTHOR}>
                    Author - Can create and manage content
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the appropriate role for this user. Owners can only be
                assigned by transferring ownership.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={addMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMemberMutation.isPending || !selectedUserId.trim()}
            >
              {addMemberMutation.isPending ? (
                <>Adding...</>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
