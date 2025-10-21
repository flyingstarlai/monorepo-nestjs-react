import { tokenStorage } from '../../auth/api/auth.api';

export type ActivityType = 'login_success' | 'profile_updated' | 'password_changed' | 'avatar_updated';

export interface ActivityDto {
  id: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}

export interface ActivitiesResponseDto {
  items: ActivityDto[];
  nextCursor?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function getActivities(params?: { limit?: number; cursor?: string }) {
  const token = tokenStorage.getToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.cursor) searchParams.set('cursor', params.cursor);

  const response = await fetch(`${API_BASE_URL}/activities?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  return response.json() as Promise<ActivitiesResponseDto>;
}