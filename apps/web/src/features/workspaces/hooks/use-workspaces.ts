import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, WorkspaceError } from '../api/workspaces.api';
import type { WorkspaceRole } from '../types';

// Query keys
export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: string) => [...workspaceKeys.lists(), { filters }] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (slug: string) => [...workspaceKeys.details(), slug] as const,
  profile: (slug: string) =>
    [...workspaceKeys.detail(slug), 'profile'] as const,
  members: (slug: string) =>
    [...workspaceKeys.detail(slug), 'members'] as const,
  activities: (slug: string) =>
    [...workspaceKeys.detail(slug), 'activities'] as const,
};

// Hooks for workspaces
export function useWorkspaces(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: async () => {
      try {
        return await workspacesApi.getWorkspaces();
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to fetch workspaces');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    ...options,
  });
}

export function useWorkspaceProfile(
  slug: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: workspaceKeys.profile(slug),
    queryFn: async () => {
      try {
        return await workspacesApi.getWorkspaceProfile(slug);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to fetch workspace profile');
      }
    },
    enabled: !!slug && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

export function useWorkspaceMembers(
  slug: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: workspaceKeys.members(slug),
    queryFn: async () => {
      try {
        return await workspacesApi.getWorkspaceMembers(slug);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to fetch workspace members');
      }
    },
    enabled: !!slug && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useWorkspaceActivities(
  slug: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: workspaceKeys.activities(slug),
    queryFn: async () => {
      try {
        return await workspacesApi.getWorkspaceActivities(slug);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to fetch workspace activities');
      }
    },
    enabled: !!slug && options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Mutations
export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      memberData,
    }: {
      slug: string;
      memberData: { username: string; name?: string; role?: WorkspaceRole };
    }) => {
      try {
        return await workspacesApi.addWorkspaceMember(slug, memberData);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to add workspace member');
      }
    },
    onSuccess: (_, { slug }) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(slug) });

      // Invalidate workspace profile to update member counts
      queryClient.invalidateQueries({ queryKey: workspaceKeys.profile(slug) });

      // Invalidate activities to show new member addition
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.activities(slug),
      });
    },
    onError: (error) => {
      console.error('Failed to add workspace member:', error);
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      memberId,
    }: {
      slug: string;
      memberId: string;
    }) => {
      try {
        return await workspacesApi.updateMemberStatus(slug, memberId);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to update member status');
      }
    },
    onSuccess: (_, { slug }) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(slug) });

      // Invalidate workspace profile to update member counts
      queryClient.invalidateQueries({ queryKey: workspaceKeys.profile(slug) });

      // Invalidate activities to show status change
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.activities(slug),
      });
    },
    onError: (error) => {
      console.error('Failed to update member status:', error);
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      memberId,
      role,
    }: {
      slug: string;
      memberId: string;
      role: WorkspaceRole;
    }) => {
      try {
        return await workspacesApi.updateMemberRole(slug, memberId, role);
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to update member role');
      }
    },
    onSuccess: (_, { slug }) => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(slug) });

      // Invalidate workspace profile to update member counts
      queryClient.invalidateQueries({ queryKey: workspaceKeys.profile(slug) });

      // Invalidate activities to show role change
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.activities(slug),
      });
    },
    onError: (error) => {
      console.error('Failed to update member role:', error);
    },
  });
}

export function useWorkspaceStats() {
  return useQuery({
    queryKey: ['workspace-stats'],
    queryFn: async () => {
      try {
        return await workspacesApi.getWorkspaceStats();
      } catch (error) {
        if (error instanceof WorkspaceError) {
          throw error;
        }
        throw new WorkspaceError('Failed to fetch workspace stats');
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
