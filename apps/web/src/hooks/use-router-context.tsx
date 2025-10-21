import { useAuth } from '../features/auth';

export function useRouterContext() {
  const auth = useAuth();

  return {
    auth,
  };
}
