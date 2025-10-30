import type { AuthResponse, LoginCredentials, User } from '../types';
import { apiClient } from '@/lib/api-client';
import { AuthError as BaseAuthError } from '@/lib/api-errors';

// Re-export AuthError for backward compatibility
export const AuthError = BaseAuthError;

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials,
        {
          skipAuth: true, // Login doesn't require authentication
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  },

  async getProfile(token: string): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile', {
        skipAuth: true, // We'll handle auth manually for this method
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to fetch profile');
    }
  },

  async getWorkspaceProfile(slug: string): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AuthError('No authentication token');
    }

    try {
      const response = await apiClient.get<User>(`/c/${slug}/auth/profile`, {
        skipAuth: true, // We'll handle auth manually for this method
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to fetch workspace profile');
    }
  },

  async uploadAvatar(file: File): Promise<User> {
    try {
      const response = await apiClient.upload<User>('/users/avatar', file, {
        method: 'PUT',
        // The API client will automatically add the auth header
      });
      return response.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    }
  },

  async updateProfile(profileData: {
    name?: string;
    username?: string;
  }): Promise<User> {
    try {
      const response = await apiClient.put<User>('/users/profile', profileData);

      // Keep the console logs for debugging (can be removed later)
      console.log('Profile update response status:', response.status);
      console.log('Profile update response headers:', response.headers);
      console.log('Profile update response data:', response.data);

      return response.data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    }
  },

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    try {
      await apiClient.post<void>('/auth/change-password', passwordData);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    }
  },
};

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('access_token');
  },

  parseToken(
    token: string
  ): { sub: number; username: string; role: string; exp?: number } | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  },

  isTokenExpired(token: string): boolean {
    const parsed = this.parseToken(token);
    if (!parsed || !parsed.exp) {
      return true;
    }

    return Date.now() >= parsed.exp * 1000;
  },
};
