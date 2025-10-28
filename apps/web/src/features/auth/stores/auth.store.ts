import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, tokenStorage, AuthError } from '../api';
import type { User, LoginCredentials } from '../types';

export interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  initializeAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          const response = await authApi.login(credentials);
          tokenStorage.setToken(response.access_token);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          throw new AuthError(
            error instanceof Error ? error.message : 'Login failed'
          );
        }
      },

      logout: () => {
        tokenStorage.removeToken();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (updatedUser: User) => {
        set({ user: updatedUser });
      },

      initializeAuth: async () => {
        const token = tokenStorage.getToken();

        if (!token) {
          set({ isLoading: false });
          return;
        }

        if (tokenStorage.isTokenExpired(token)) {
          tokenStorage.removeToken();
          set({ isLoading: false });
          return;
        }

        try {
          const userData = await authApi.getProfile(token);
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          tokenStorage.removeToken();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth state after rehydration
        if (state) {
          state.initializeAuth();
        }
      },
    }
  )
);

// Selectors for optimized re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// Action selectors for stable references
export const useAuthActions = () => ({
  login: useAuthStore((state) => state.login),
  logout: useAuthStore((state) => state.logout),
  updateUser: useAuthStore((state) => state.updateUser),
  initializeAuth: useAuthStore((state) => state.initializeAuth),
  setLoading: useAuthStore((state) => state.setLoading),
});
