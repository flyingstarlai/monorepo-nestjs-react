import { createFileRoute, redirect } from '@tanstack/react-router';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { useCurrentWorkspace } from '@/features/workspaces/stores/workspace.store';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RootRedirect,
});

function RootRedirect() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const currentWorkspace = useCurrentWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const targetWorkspace = currentWorkspace || workspaces?.items?.[0];
      if (targetWorkspace) {
        router.navigate({
          to: '/c/$slug',
          params: { slug: targetWorkspace.slug },
        });
      } else {
        // Fallback if no workspaces - go to account overview
        router.navigate({ to: '/account' });
      }
    }
  }, [isLoading, currentWorkspace, workspaces, router]);

  return <div>Redirecting to workspace...</div>;
}
