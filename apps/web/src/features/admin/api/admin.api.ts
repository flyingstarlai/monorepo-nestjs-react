import type { User } from '../../auth/types';
import { apiClient } from '@/lib/api-client';
import { AdminApiError as BaseAdminApiError } from '@/lib/api-errors';

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  isActive?: boolean;
}

export interface WorkspaceStats {
  totalMembers: number;
  activeMembers: number;
  owners: number;
  authors: number;
  members: number;
  recentlyActive: number;
}

export interface CreateUserPayload {
  username: string;
  name: string;
  password: string;
  roleName: 'Admin' | 'User';
  workspaceId?: string;
  workspaceRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

// Re-export AdminApiError for backward compatibility
export const AdminApiError = BaseAdminApiError;

export const adminApi = {
  async listUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/users');
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    }
  },

  async listRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<Role[]>('/users/roles');
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to fetch roles'
      );
    }
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users', payload);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    }
  },

  async createUserWithWorkspace(payload: CreateUserPayload): Promise<User> {
    try {
      const response = await apiClient.post<User>('/users', payload);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    }
  },

  async setUserActive(userId: string, isActive: boolean): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${userId}/status`, {
        isActive,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to update user status'
      );
    }
  },

  async setUserRole(userId: string, roleName: 'Admin' | 'User'): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`/users/${userId}/role`, {
        roleName,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to update user role'
      );
    }
  },

  // Workspace management methods
  async getAllWorkspaces(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    items: Workspace[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const endpoint = `/admin/workspaces${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiClient.get<{
        items: Workspace[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(endpoint);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError('Failed to fetch workspaces');
    }
  },

  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    try {
      const response = await apiClient.post<Workspace>(
        '/admin/workspaces',
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to create workspace'
      );
    }
  },

  async updateWorkspace(
    id: string,
    data: UpdateWorkspaceDto
  ): Promise<Workspace> {
    try {
      const response = await apiClient.patch<Workspace>(
        `/admin/workspaces/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to update workspace'
      );
    }
  },

  async deleteWorkspace(id: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/admin/workspaces/${id}`);
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to delete workspace'
      );
    }
  },

  async getWorkspaceStats(id: string): Promise<WorkspaceStats> {
    try {
      const response = await apiClient.get<WorkspaceStats>(
        `/admin/workspaces/${id}/stats`
      );
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError('Failed to fetch workspace stats');
    }
  },
};
