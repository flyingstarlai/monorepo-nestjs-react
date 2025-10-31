import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sqlEditorApi } from '../api/sql-editor.api';
import { toast } from 'sonner';
import type {
  CreateStoredProcedureDto,
  UpdateStoredProcedureDto,
} from '../types';

export function useProcedures(workspaceSlug: string) {
  return useQuery({
    queryKey: ['sql-editor', 'procedures', workspaceSlug],
    queryFn: () => sqlEditorApi.getProcedures(workspaceSlug),
    enabled: !!workspaceSlug,
  });
}

export function useProcedure(workspaceSlug: string, id: string) {
  return useQuery({
    queryKey: ['sql-editor', 'procedures', workspaceSlug, id],
    queryFn: () => sqlEditorApi.getProcedure(workspaceSlug, id),
    enabled: !!workspaceSlug && !!id,
  });
}

export function useCreateProcedure(workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoredProcedureDto) =>
      sqlEditorApi.createProcedure(workspaceSlug, data),
    onSuccess: (createdProcedure) => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.setQueryData(
        ['sql-editor', 'procedures', workspaceSlug, createdProcedure.id],
        createdProcedure
      );
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create procedure';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateProcedure(workspaceSlug: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoredProcedureDto) =>
      sqlEditorApi.updateProcedure(workspaceSlug, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug, id],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update procedure';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteProcedure(workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sqlEditorApi.deleteProcedure(workspaceSlug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete procedure';
      toast.error(errorMessage);
    },
  });
}

export function usePublishProcedure(workspaceSlug: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sqlEditorApi.publishProcedure(workspaceSlug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug, id],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to publish procedure';
      toast.error(errorMessage);
    },
  });
}

export function useUnpublishProcedure(workspaceSlug: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sqlEditorApi.unpublishProcedure(workspaceSlug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug, id],
      });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to unpublish procedure';
      toast.error(errorMessage);
    },
  });
}

export function useExecuteProcedure() {
  return useMutation({
    mutationFn: ({
      workspaceSlug,
      id,
      data,
    }: {
      workspaceSlug: string;
      id: string;
      data: {
        parameters?: Record<string, unknown>;
        timeout?: number;
      };
    }) => sqlEditorApi.executeProcedure(workspaceSlug, id, data),
  });
}

export function useValidateSql(workspaceSlug: string) {
  return useMutation({
    mutationFn: (data: { sql: string }) =>
      sqlEditorApi.validateSql(workspaceSlug, data),
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Validation failed';
      toast.error(errorMessage);
    },
  });
}

export function useVersions(workspaceSlug: string, procedureId: string) {
  return useQuery({
    queryKey: ['sql-editor', 'procedures', workspaceSlug, procedureId, 'versions'],
    queryFn: () => sqlEditorApi.getVersions(workspaceSlug, procedureId),
    enabled: !!workspaceSlug && !!procedureId,
    staleTime: 0, // Disable cache temporarily for debugging
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVersion(workspaceSlug: string, procedureId: string, version: number) {
  return useQuery({
    queryKey: ['sql-editor', 'procedures', workspaceSlug, procedureId, 'version', version],
    queryFn: () => sqlEditorApi.getVersion(workspaceSlug, procedureId, version),
    enabled: !!workspaceSlug && !!procedureId && !!version,
  });
}

export function useRollbackToVersion(workspaceSlug: string, procedureId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (version: number) =>
      sqlEditorApi.rollbackToVersion(workspaceSlug, procedureId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug, procedureId],
      });
      toast.success('Procedure rolled back successfully');
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to rollback procedure';
      toast.error(errorMessage);
    },
  });
}
