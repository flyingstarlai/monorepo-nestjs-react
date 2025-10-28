import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useWorkspace } from '@/features/workspaces';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/dashboard')({
  component: DashboardRedirect,
});

export function DashboardRedirect() {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentWorkspace) {
      navigate({
        to: '/c/$slug/dashboard',
        params: { slug: currentWorkspace.slug },
      });
    } else {
      navigate({
        to: '/c/$slug/dashboard',
        params: { slug: 'twsbp' },
      });
    }
  }, [currentWorkspace, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">Redirecting to workspace...</div>
    </div>
  );
}
