import type { AuthResponse, LoginCredentials, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new AuthError('Invalid credentials');
    }

    return response.json();
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new AuthError('Failed to fetch profile');
    }

    return response.json();
  },

  async uploadAvatar(file: File): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AuthError('No authentication token');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || 'Failed to upload avatar');
    }

    return response.json();
  },

  async updateProfile(profileData: { name?: string; username?: string }): Promise<User> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AuthError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    console.log('Profile update response status:', response.status);
    console.log('Profile update response headers:', response.headers);

    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || 'Failed to update profile');
    }

    const text = await response.text();
    console.log('Profile update response text:', text);

    if (!text) {
      throw new AuthError('Empty response from server');
    }

    return JSON.parse(text);
  },

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    const token = tokenStorage.getToken();
    if (!token) {
      throw new AuthError('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AuthError(error.message || 'Failed to change password');
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

  parseToken(token: string): { sub: number; username: string; role: string; exp?: number } | null {
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
