import { useQuery } from '@tanstack/react-query';
import { type ActivityDto, getUserActivities } from '../api/activities.api';

export function useUserActivities({ limit = 10 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['user-activities', { limit }],
    queryFn: () => getUserActivities({ limit }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export type { ActivityDto };
