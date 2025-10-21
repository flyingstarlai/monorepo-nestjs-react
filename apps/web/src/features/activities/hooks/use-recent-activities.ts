import { useQuery } from '@tanstack/react-query';
import { type ActivityDto, getActivities } from '../api/activities.api';

export function useRecentActivities({ limit = 10 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['activities', { limit }],
    queryFn: () => getActivities({ limit }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export type { ActivityDto };
