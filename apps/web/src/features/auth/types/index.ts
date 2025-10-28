export interface User {
  id: string;
  username: string;
  name: string;
  password?: string; // Only used during creation, not returned by API
  role: string;
  roleId: string;
  avatar?: string;
  email?: string;
  phone?: string;
  bio?: string;
  dateOfBirth?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
