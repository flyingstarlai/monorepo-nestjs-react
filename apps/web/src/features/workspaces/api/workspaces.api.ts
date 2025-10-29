import type {
  WorkspaceMember,
  WorkspacesResponse,
  WorkspaceProfile,
  WorkspaceRole,
} from '../types';
import { tokenStorage } from '@/features/auth/api/auth.api';
import { apiClient } from '@/lib/api-client';
import { WorkspaceError as BaseWorkspaceError } from '@/lib/api-errors';

// Re-export WorkspaceError for backward compatibility
export const WorkspaceError = BaseWorkspaceError;

export const workspacesApi = {
  async getWorkspaces(): Promise<WorkspacesResponse> {
    try {
      const response = await apiClient.get<WorkspacesResponse>('/workspaces');
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      console.error('Failed to fetch workspaces:', error);
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to fetch workspaces'
      );
    }
  },

  async getWorkspaceProfile(slug: string): Promise<WorkspaceProfile> {
    try {
      const response = await apiClient.get<WorkspaceProfile>(`/c/${slug}/auth/profile`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to fetch workspace profile');
    }
  },

  async getWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    try {
      const response = await apiClient.get<WorkspaceMember[]>(`/c/${slug}/users`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to fetch workspace members');
    }
  },

  async addWorkspaceMember(
    slug: string,
    memberData: { username: string; name?: string; role?: WorkspaceRole }
  ): Promise<WorkspaceMember> {
    try {
      const response = await apiClient.post<WorkspaceMember>(
        `/c/${slug}/users`,
        memberData
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to add workspace member'
      );
    }
  },

  async updateMemberStatus(
    slug: string,
    memberId: string
  ): Promise<{ id: string; username: string; isActive: boolean }> {
    try {
      const response = await apiClient.patch<{ id: string; username: string; isActive: boolean }>(
        `/c/${slug}/users/${memberId}/status`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to update member status'
      );
    }
  },

  async updateMemberRole(
    slug: string,
    memberId: string,
    role: WorkspaceRole
  ): Promise<{ id: string; username: string; role: WorkspaceRole }> {
    try {
      const response = await apiClient.patch<{ id: string; username: string; role: WorkspaceRole }>(
        `/c/${slug}/users/${memberId}/role`,
        { role }
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError(
        error instanceof Error ? error.message : 'Failed to update member role'
      );
    }
  },

  async getWorkspaceActivities(slug: string): Promise<{
    items: Array<{
      id: string;
      type: string;
      actor: string;
      description?: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        items: Array<{
          id: string;
          type: string;
          actor: string;
          description?: string;
          createdAt: string;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/c/${slug}/activities`);
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to fetch workspace activities');
    }
  },

  async getWorkspaceStats(): Promise<{
    totalWorkspaces: number;
    activeWorkspaces: number;
    totalMembers: number;
    activeMembers: number;
    totalActivities: number;
  }> {
    try {
      const response = await apiClient.get<{
        totalWorkspaces: number;
        activeWorkspaces: number;
        totalMembers: number;
        activeMembers: number;
        totalActivities: number;
      }>('/workspaces/stats');
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError) {
        throw error;
      }
      throw new WorkspaceError('Failed to fetch workspace stats');
    }
  },
};
