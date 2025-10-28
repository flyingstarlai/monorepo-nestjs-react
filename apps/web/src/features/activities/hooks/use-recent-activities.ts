import { useQuery } from '@tanstack/react-query';
import { type ActivityDto, getActivities } from '../api/activities.api';
// Temporarily disable useWorkspace to debug
// import { useWorkspace } from '@/features/workspaces';

export function useRecentActivities({ limit = 10 }: { limit?: number } = {}) {
  // const { currentWorkspace } = useWorkspace();

  // Mock data for debugging
  const currentWorkspace = { slug: 'twsbp' };

  return useQuery({
    queryKey: ['activities', currentWorkspace?.slug, { limit }],
    queryFn: () => {
      if (!currentWorkspace?.slug) {
        throw new Error('No workspace selected');
      }
      return getActivities(currentWorkspace.slug, { limit });
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: !!currentWorkspace?.slug,
  });
}

export type { ActivityDto };
