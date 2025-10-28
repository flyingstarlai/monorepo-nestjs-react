import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/api/admin.api';
import { workspaceApi } from '@/features/admin/api/workspace.api';
import { UserPlus, Building2 } from 'lucide-react';

interface CreateUserDialogProps {
  children: React.ReactNode;
  workspaceSlug?: string; // If provided, add user to this workspace
}

interface CreateUserData {
  username: string;
  name: string;
  password: string;
  roleName: 'Admin' | 'User';
  assignToWorkspace?: boolean;
  workspaceId?: string;
  workspaceRole?: 'OWNER' | 'AUTHOR' | 'MEMBER';
}

export function CreateUserDialog({
  children,
  workspaceSlug,
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    name: '',
    password: '',
    roleName: 'User',
    assignToWorkspace: false,
    workspaceRole: 'MEMBER',
  });

  const queryClient = useQueryClient();

  // Fetch roles for platform user creation
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminApi.listRoles(),
  });

  // Fetch workspaces for workspace assignment
  const { data: workspaces = [], isLoading: workspacesLoading } = useQuery({
    queryKey: ['admin-workspaces-list'],
    queryFn: () => workspaceApi.listWorkspaces({ limit: 100 }),
    select: (data) => data.workspaces.filter((w) => w.isActive),
  });

  // Get current workspace ID if in workspace context
  const { data: currentWorkspace } = useQuery({
    queryKey: ['workspace', workspaceSlug],
    queryFn: () => workspaceApi.getWorkspace(workspaceSlug!),
    enabled: !!workspaceSlug,
  });

  // Create user mutation (with optional workspace assignment)
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => {
      const payload: any = {
        username: data.username,
        name: data.name,
        password: data.password,
        roleName: data.roleName,
      };

      // Handle workspace context (auto-assign to current workspace)
      if (isWorkspaceContext && currentWorkspace && data.workspaceRole) {
        payload.workspaceId = currentWorkspace.id;
        payload.workspaceRole = data.workspaceRole;
      }
      // Handle explicit workspace assignment
      else if (
        data.assignToWorkspace &&
        data.workspaceId &&
        data.workspaceRole
      ) {
        payload.workspaceId = data.workspaceId;
        payload.workspaceRole = data.workspaceRole;
      }

      return adminApi.createUser(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });

      // Determine workspace ID for cache invalidation
      const workspaceId = isWorkspaceContext
        ? currentWorkspace?.id
        : variables.workspaceId;

      // Also invalidate workspace members if workspace assignment was made
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-workspace-members', workspaceId],
        });
      }

      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });

  const handleInputChange = (
    field: keyof CreateUserData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      password: '',
      roleName: 'User',
      assignToWorkspace: false,
      workspaceRole: 'MEMBER',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.name || !formData.password) {
      return;
    }

    // Validate workspace assignment
    if (
      !isWorkspaceContext &&
      formData.assignToWorkspace &&
      (!formData.workspaceId || !formData.workspaceRole)
    ) {
      return;
    }

    // Validate workspace context assignment
    if (isWorkspaceContext && !formData.workspaceRole) {
      return;
    }

    try {
      await createUserMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const isLoading = createUserMutation.isPending;
  const isWorkspaceContext = !!workspaceSlug;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            {isWorkspaceContext
              ? `Create a new user and add them to workspace "${workspaceSlug}"`
              : 'Create a new platform user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Platform Role *</Label>
              <Select
                value={formData.roleName}
                onValueChange={(value: 'Admin' | 'User') =>
                  handleInputChange('roleName', value)
                }
                disabled={isLoading || rolesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workspace Assignment */}
          {!isWorkspaceContext && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assignToWorkspace"
                  checked={formData.assignToWorkspace}
                  onCheckedChange={(checked) =>
                    handleInputChange('assignToWorkspace', checked)
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="assignToWorkspace">Add user to workspace</Label>
              </div>

              {formData.assignToWorkspace && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="workspaceId">Workspace *</Label>
                    <Select
                      value={formData.workspaceId}
                      onValueChange={(value) =>
                        handleInputChange('workspaceId', value)
                      }
                      disabled={isLoading || workspacesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {workspace.name} ({workspace.slug})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workspaceRole">Workspace Role *</Label>
                    <Select
                      value={formData.workspaceRole}
                      onValueChange={(value: 'OWNER' | 'AUTHOR' | 'MEMBER') =>
                        handleInputChange('workspaceRole', value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="AUTHOR">Author</SelectItem>
                        <SelectItem value="OWNER">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Workspace Context - Auto-add to current workspace */}
          {isWorkspaceContext && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="workspaceRole">Workspace Role *</Label>
                <Select
                  value={formData.workspaceRole}
                  onValueChange={(value: 'Owner' | 'Author' | 'Member') =>
                    handleInputChange('workspaceRole', value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="AUTHOR">Author</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                User will be automatically added to workspace "{workspaceSlug}"
                with the selected role.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.username ||
                !formData.name ||
                !formData.password ||
                (!isWorkspaceContext &&
                  formData.assignToWorkspace &&
                  (!formData.workspaceId || !formData.workspaceRole)) ||
                (isWorkspaceContext && !formData.workspaceRole)
              }
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
