import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { type ActivityDto, getActivities } from '../api/activities.api';
import { useWorkspace } from '@/features/workspaces';

export function useWorkspaceActivities({
  limit = 10,
}: { limit?: number } = {}) {
  const { currentWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['workspace-activities', currentWorkspace?.slug, { limit }],
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

export function useWorkspaceActivitiesInfinite({
  limit = 5,
}: { limit?: number } = {}) {
  const { currentWorkspace } = useWorkspace();

  return useInfiniteQuery({
    queryKey: [
      'workspace-activities-infinite',
      currentWorkspace?.slug,
      { limit },
    ],
    queryFn: ({ pageParam }: any) => {
      if (!currentWorkspace?.slug) {
        throw new Error('No workspace selected');
      }
      return getActivities(currentWorkspace.slug, {
        limit,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: !!currentWorkspace?.slug,
  });
}

export type { ActivityDto };
