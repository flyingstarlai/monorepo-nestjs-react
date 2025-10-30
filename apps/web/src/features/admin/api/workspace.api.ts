import { apiClient } from '@/lib/api-client';
import { WorkspaceError as BaseWorkspaceApiError } from '@/lib/api-errors';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface WorkspaceMember {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  role: 'Owner' | 'Author' | 'Member';
  isActive: boolean;
  joinedAt: string;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  roleBreakdown: Record<string, number>;
  createdAt: string;
  lastActivity: string;
}

export interface CreateWorkspacePayload {
  name: string;
  slug: string;
  description?: string;
  ownerUsername?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  isActive?: boolean;
}

export interface AddWorkspaceMemberPayload {
  username: string;
  name?: string;
  role?: 'Owner' | 'Author' | 'Member';
}

export interface UpdateMemberRolePayload {
  role: 'Owner' | 'Author' | 'Member';
}

export interface ReplaceOwnerPayload {
  newOwnerId: string;
}

// Re-export WorkspaceApiError for backward compatibility
export const WorkspaceApiError = BaseWorkspaceApiError;

export const workspaceApi = {
  // Admin workspace listing
  async listWorkspaces(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    workspaces: Workspace[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isActive !== undefined)
      searchParams.set('isActive', params.isActive.toString());

    const queryString = searchParams.toString();
    const endpoint = `/admin/workspaces${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiClient.get<{
        workspaces: Workspace[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(endpoint);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError('Failed to fetch workspaces');
    }
  },

  // Create workspace
  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    try {
      const response = await apiClient.post<Workspace>(
        '/admin/workspaces',
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to create workspace'
      );
    }
  },

  // Get workspace details
  async getWorkspace(slug: string): Promise<Workspace> {
    try {
      const response = await apiClient.get<Workspace>(`/admin/c/${slug}`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError('Failed to fetch workspace');
    }
  },

  // Update workspace
  async updateWorkspace(
    slug: string,
    payload: UpdateWorkspacePayload
  ): Promise<Workspace> {
    try {
      const response = await apiClient.patch<Workspace>(
        `/admin/c/${slug}`,
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to update workspace'
      );
    }
  },

  // Delete workspace
  async deleteWorkspace(
    slug: string
  ): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `/admin/c/${slug}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to delete workspace'
      );
    }
  },

  // Get workspace stats
  async getWorkspaceStats(slug: string): Promise<WorkspaceStats> {
    try {
      const response = await apiClient.get<WorkspaceStats>(
        `/admin/c/${slug}/stats`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError('Failed to fetch workspace stats');
    }
  },

  // Get workspace members
  async getWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    try {
      const response = await apiClient.get<WorkspaceMember[]>(
        `/admin/c/${slug}/users`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError('Failed to fetch workspace members');
    }
  },

  // Add workspace member
  async addWorkspaceMember(
    slug: string,
    payload: AddWorkspaceMemberPayload
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.post<WorkspaceMember>(
        `/admin/c/${slug}/users`,
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error
          ? error.message
          : 'Failed to add workspace member'
      );
    }
  },

  // Update member role
  async updateMemberRole(
    slug: string,
    memberId: string,
    payload: UpdateMemberRolePayload
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.patch<WorkspaceMember>(
        `/admin/c/${slug}/users/${memberId}/role`,
        payload
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to update member role'
      );
    }
  },

  // Toggle member status
  async toggleMemberStatus(
    slug: string,
    memberId: string
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.patch<WorkspaceMember>(
        `/admin/c/${slug}/users/${memberId}/status`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error
          ? error.message
          : 'Failed to update member status'
      );
    }
  },

  // Remove member
  async removeMember(
    slug: string,
    memberId: string
  ): Promise<{ message: string; id: string }> {
    try {
      const response = await apiClient.delete<{ message: string; id: string }>(
        `/admin/c/${slug}/users/${memberId}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to remove member'
      );
    }
  },

  // Replace owner
  async replaceOwner(
    slug: string,
    payload: ReplaceOwnerPayload
  ): Promise<{
    message: string;
    newOwner: {
      id: string;
      username: string;
      role: string;
    };
  }> {
    try {
      const response = await apiClient.post<{
        message: string;
        newOwner: {
          id: string;
          username: string;
          role: string;
        };
      }>(`/admin/c/${slug}/users/replace-owner`, payload);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceApiError) {
        throw error;
      }
      throw new WorkspaceApiError(
        error instanceof Error ? error.message : 'Failed to replace owner'
      );
    }
  },
};
