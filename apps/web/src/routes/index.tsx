import { createFileRoute, redirect } from '@tanstack/react-router';
import { useWorkspaces } from '@/features/workspaces/hooks/use-workspaces';
import { useCurrentWorkspace } from '@/features/workspaces/stores/workspace.store';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Building2, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Building2 className="h-12 w-12 text-primary" />
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">
                Setting up your workspace
              </h1>
              <p className="text-muted-foreground">
                {currentWorkspace
                  ? `Redirecting to ${currentWorkspace.name}...`
                  : workspaces?.items?.length
                    ? 'Finding your workspace...'
                    : 'Preparing your dashboard...'}
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <span>Almost there</span>
              <ArrowRight className="h-4 w-4" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
