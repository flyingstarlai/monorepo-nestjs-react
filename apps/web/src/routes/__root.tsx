import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import type { AuthStore } from '../features/auth/stores/auth.store';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

interface MyRouterContext {
  queryClient: QueryClient;
  auth: AuthStore;
}

const enableDevtools = import.meta.env.VITE_ENABLE_DEVTOOLS !== false;

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
      {enableDevtools && (
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
      )}
    </>
  ),
});
