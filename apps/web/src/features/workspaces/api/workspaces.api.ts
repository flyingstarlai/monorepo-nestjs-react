import type {
  WorkspaceMember,
  WorkspacesResponse,
  WorkspaceProfile,
  WorkspaceRole,
} from '../types';
import { tokenStorage } from '@/features/auth/api/auth.api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceError';
  }
}

export const workspacesApi = {
  async getWorkspaces(): Promise<WorkspacesResponse> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch workspaces:', response.status, errorText);
      throw new WorkspaceError(
        `Failed to fetch workspaces: ${response.status} ${errorText}`
      );
    }

    return response.json();
  },

  async getWorkspaceProfile(slug: string): Promise<WorkspaceProfile> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/c/${slug}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceError('Failed to fetch workspace profile');
    }

    return response.json();
  },

  async getWorkspaceMembers(slug: string): Promise<WorkspaceMember[]> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/c/${slug}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceError('Failed to fetch workspace members');
    }

    return response.json();
  },

  async addWorkspaceMember(
    slug: string,
    memberData: { username: string; name?: string; role?: WorkspaceRole }
  ): Promise<WorkspaceMember> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/c/${slug}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceError(
        error.message || 'Failed to add workspace member'
      );
    }

    return response.json();
  },

  async updateMemberStatus(
    slug: string,
    memberId: string
  ): Promise<{ id: string; username: string; isActive: boolean }> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/c/${slug}/users/${memberId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceError(
        error.message || 'Failed to update member status'
      );
    }

    return response.json();
  },

  async updateMemberRole(
    slug: string,
    memberId: string,
    role: WorkspaceRole
  ): Promise<{ id: string; username: string; role: WorkspaceRole }> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(
      `${API_BASE_URL}/c/${slug}/users/${memberId}/role`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new WorkspaceError(error.message || 'Failed to update member role');
    }

    return response.json();
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
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/c/${slug}/activities`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceError('Failed to fetch workspace activities');
    }

    return response.json();
  },

  async getWorkspaceStats(): Promise<{
    totalWorkspaces: number;
    activeWorkspaces: number;
    totalMembers: number;
    activeMembers: number;
    totalActivities: number;
  }> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new WorkspaceError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/workspaces/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new WorkspaceError('Failed to fetch workspace stats');
    }

    return response.json();
  },
};
