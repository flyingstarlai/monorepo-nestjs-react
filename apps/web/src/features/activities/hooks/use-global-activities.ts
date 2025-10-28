import { useQuery } from '@tanstack/react-query';
import { tokenStorage } from '@/features/auth/api/auth.api';
import type { ActivityDto, ActivitiesResponseDto } from '../api/activities.api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function useGlobalActivities({ limit = 10 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['global-activities', { limit }],
    queryFn: async (): Promise<ActivitiesResponseDto> => {
      const token = tokenStorage.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/activities?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch global activities');
      }

      return response.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export type { ActivityDto };