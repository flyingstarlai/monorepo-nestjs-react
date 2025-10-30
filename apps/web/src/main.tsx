import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { useAuth } from './features/auth';
import { LoadingScreen } from './components/ui/loading-spinner';
import { LoadingBarProvider } from './components/providers/loading-bar-provider';
import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx';

// Import generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
import reportWebVitals from './report-web-vitals.ts';

// Create a new router instance with authentication context
const TanStackQueryProviderContext = TanStackQueryProvider.getContext();

// Create a router that will get its auth context from Zustand store
function useRouterWithAuth() {
  const auth = useAuth();

  return createRouter({
    routeTree,
    context: {
      ...TanStackQueryProviderContext,
      auth,
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
  });
}

// Register router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof useRouterWithAuth>;
  }
}

// Router component that uses auth context
function RouterWithAuth() {
  const router = useRouterWithAuth();
  return (
    <>
      <LoadingBarProvider router={router} />
      <RouterProvider router={router} />
    </>
  );
}

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth, isLoading, handleLogoutEvent } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Global auth:logout event listener
  useEffect(() => {
    const handleLogout = () => {
      // Update auth state using dedicated method
      handleLogoutEvent();

      // Redirect to login page with current URL as redirect parameter
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = loginUrl;
    };

    // Add event listener
    window.addEventListener('auth:logout', handleLogout);

    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [handleLogoutEvent]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <LoadingScreen
        message="Authenticating..."
        submessage="Verifying your credentials and preparing your workspace"
      />
    );
  }

  return <>{children}</>;
}

// Wrapper component to provide query context and initialize auth
function AppWithProviders() {
  return (
    <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
      <AuthInitializer>
        <RouterWithAuth />
        <Toaster />
      </AuthInitializer>
    </TanStackQueryProvider.Provider>
  );
}

// Render app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <AppWithProviders />
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
