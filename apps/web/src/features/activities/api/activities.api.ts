import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-errors';

export type ActivityType =
  | 'login_success'
  | 'profile_updated'
  | 'password_changed'
  | 'avatar_updated'
  | 'user_created'
  | 'workspace_created'
  | 'workspace_updated'
  | 'workspace_deactivated'
  | 'workspace_activated'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'member_status_changed';

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

export async function getActivities(
  slug: string,
  params?: {
    limit?: number;
    cursor?: string;
  }
): Promise<ActivitiesResponseDto> {
  const searchParams = new URLSearchParams();
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  const queryString = searchParams.toString();
  const endpoint = `/c/${slug}/activities${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiClient.get<ActivitiesResponseDto>(endpoint);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch activities'
    );
  }
}

export async function getUserActivities(params?: {
  limit?: number;
  cursor?: string;
}): Promise<ActivitiesResponseDto> {
  const searchParams = new URLSearchParams();
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.cursor) {
    searchParams.set('cursor', params.cursor);
  }

  const queryString = searchParams.toString();
  const endpoint = `/activities${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiClient.get<ActivitiesResponseDto>(endpoint);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch user activities'
    );
  }
}
