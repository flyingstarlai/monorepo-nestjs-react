import { tokenStorage } from '../../auth/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

export class WorkspaceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceApiError';
  }
}

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
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isActive !== undefined)
      searchParams.set('isActive', params.isActive.toString());

    const response = await fetch(
      `${API_BASE_URL}/admin/workspaces?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new WorkspaceApiError('Failed to fetch workspaces');
    }

    return response.json();
  },

  // Create workspace
  async createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to create workspace'
      );
    }

    return response.json();
  },

  // Get workspace details
  async getWorkspace(slug: string): Promise<Workspace> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceApiError('Failed to fetch workspace');
    }

    return response.json();
  },

  // Update workspace
  async updateWorkspace(
    slug: string,
    payload: UpdateWorkspacePayload
  ): Promise<Workspace> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to update workspace'
      );
    }

    return response.json();
  },

  // Delete workspace
  async deleteWorkspace(
    slug: string
  ): Promise<{ message: string; id: string }> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to delete workspace'
      );
    }

    return response.json();
  },

  // Get workspace stats
  async getWorkspaceStats(slug: string): Promise<WorkspaceStats> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceApiError('Failed to fetch workspace stats');
    }

    return response.json();
  },

  // Get workspace members
  async getWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceApiError('Failed to fetch workspace members');
    }

    return response.json();
  },

  // Add workspace member
  async addWorkspaceMember(
    slug: string,
    payload: AddWorkspaceMemberPayload
  ): Promise<WorkspaceMember> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/admin/c/${slug}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to add workspace member'
      );
    }

    return response.json();
  },

  // Update member role
  async updateMemberRole(
    slug: string,
    memberId: string,
    payload: UpdateMemberRolePayload
  ): Promise<WorkspaceMember> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/c/${slug}/users/${memberId}/role`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to update member role'
      );
    }

    return response.json();
  },

  // Toggle member status
  async toggleMemberStatus(
    slug: string,
    memberId: string
  ): Promise<WorkspaceMember> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/c/${slug}/users/${memberId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(
        error.message || 'Failed to update member status'
      );
    }

    return response.json();
  },

  // Remove member
  async removeMember(
    slug: string,
    memberId: string
  ): Promise<{ message: string; id: string }> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/c/${slug}/users/${memberId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(error.message || 'Failed to remove member');
    }

    return response.json();
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
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceApiError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/admin/c/${slug}/users/replace-owner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceApiError(error.message || 'Failed to replace owner');
    }

    return response.json();
  },
};
