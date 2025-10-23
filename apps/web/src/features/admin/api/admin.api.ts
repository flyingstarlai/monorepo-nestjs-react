import { tokenStorage } from '../../auth/api';
import type { User } from '../../auth/types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface CreateUserPayload {
  username: string;
  name: string;
  password: string;
  roleName: 'Admin' | 'User';
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
};
