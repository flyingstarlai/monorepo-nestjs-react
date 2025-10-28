import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import {
  adminApi,
  type CreateWorkspaceDto,
  type UpdateWorkspaceDto,
} from '@/features/admin/api/admin.api';

// Query keys
export const adminWorkspaceKeys = {
  all: ['admin', 'workspaces'] as const,
  lists: () => [...adminWorkspaceKeys.all, 'list'] as const,
  list: (filters?: string) =>
    [...adminWorkspaceKeys.lists(), { filters }] as const,
  details: () => [...adminWorkspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminWorkspaceKeys.details(), id] as const,
  stats: (id: string) => [...adminWorkspaceKeys.detail(id), 'stats'] as const,
};

// Hooks for admin workspaces
export function useAdminWorkspaces(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: adminWorkspaceKeys.list(JSON.stringify(filters)),
    queryFn: async () => {
      try {
        return await adminApi.getAllWorkspaces(filters);
      } catch (error) {
        throw new Error('Failed to fetch workspaces');
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useAdminWorkspaceStats(id: string) {
  return useQuery({
    queryKey: adminWorkspaceKeys.stats(id),
    queryFn: async () => {
      try {
        return await adminApi.getWorkspaceStats(id);
      } catch (error) {
        throw new Error('Failed to fetch workspace stats');
      }
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Mutations
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateWorkspaceDto) => {
      try {
        return await adminApi.createWorkspace(data);
      } catch (error) {
        throw new Error('Failed to create workspace');
      }
    },
    onSuccess: (workspace) => {
      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: adminWorkspaceKeys.lists() });
      
      // Navigate to newly created workspace
      if (workspace?.slug) {
        router.navigate({ 
          to: '/c/$slug', 
          params: { slug: workspace.slug } 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error);
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWorkspaceDto;
    }) => {
      try {
        return await adminApi.updateWorkspace(id, data);
      } catch (error) {
        throw new Error('Failed to update workspace');
      }
    },
    onSuccess: (_, { id }) => {
      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: adminWorkspaceKeys.lists() });

      // Invalidate specific workspace
      queryClient.invalidateQueries({
        queryKey: adminWorkspaceKeys.detail(id),
      });

      // Invalidate workspace stats
      queryClient.invalidateQueries({ queryKey: adminWorkspaceKeys.stats(id) });
    },
    onError: (error) => {
      console.error('Failed to update workspace:', error);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await adminApi.deleteWorkspace(id);
      } catch (error) {
        throw new Error('Failed to delete workspace');
      }
    },
    onSuccess: (_, id) => {
      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: adminWorkspaceKeys.lists() });

      // Remove specific workspace from cache
      queryClient.removeQueries({ queryKey: adminWorkspaceKeys.detail(id) });

      // Remove workspace stats from cache
      queryClient.removeQueries({ queryKey: adminWorkspaceKeys.stats(id) });
    },
    onError: (error) => {
      console.error('Failed to delete workspace:', error);
    },
  });
}
