import { tokenStorage } from '../../auth/api';
import type { User } from '../../auth/types';

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

export class AdminApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export const adminApi = {
  async listUsers(): Promise<User[]> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new AdminApiError('Failed to fetch users');
    }

    return response.json();
  },

  async listRoles(): Promise<Role[]> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new AdminApiError('Failed to fetch roles');
    }

    return response.json();
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to create user');
    }

    return response.json();
  },

  async createUserWithWorkspace(payload: CreateUserPayload): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to create user');
    }

    return response.json();
  },

  async setUserActive(userId: string, isActive: boolean): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to update user status');
    }

    return response.json();
  },

  async setUserRole(userId: string, roleName: 'Admin' | 'User'): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roleName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to update user role');
    }

    return response.json();
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
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined)
      params.append('isActive', filters.isActive.toString());

    const response = await fetch(
      `${API_BASE_URL}/admin/workspaces?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new AdminApiError('Failed to fetch workspaces');
    }

    return response.json();
  },

  async createWorkspace(data: CreateWorkspaceDto): Promise<Workspace> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to create workspace');
    }

    return response.json();
  },

  async updateWorkspace(
    id: string,
    data: UpdateWorkspaceDto
  ): Promise<Workspace> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to update workspace');
    }

    return response.json();
  },

  async deleteWorkspace(id: string): Promise<void> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AdminApiError(error.message || 'Failed to delete workspace');
    }
  },

  async getWorkspaceStats(id: string): Promise<WorkspaceStats> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AdminApiError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/workspaces/${id}/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new AdminApiError('Failed to fetch workspace stats');
    }

    return response.json();
  },
};
