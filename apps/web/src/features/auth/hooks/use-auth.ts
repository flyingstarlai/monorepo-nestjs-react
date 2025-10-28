import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  return useAuthStore();
}

// Re-export individual selectors for optimized re-renders
export {
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthActions,
} from '../stores/auth.store';
