import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { AuthError, authApi, tokenStorage } from '../api';
import type { AuthContextType, LoginCredentials, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      tokenStorage.setToken(response.access_token);
      setUser(response.user);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      throw new AuthError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const logout = () => {
    tokenStorage.removeToken();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      if (tokenStorage.isTokenExpired(token)) {
        tokenStorage.removeToken();
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getProfile(token);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (_error) {
        tokenStorage.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
