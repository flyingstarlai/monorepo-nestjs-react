import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sqlEditorApi } from '../api/sql-editor.api';
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
  });
}

export function usePublishProcedure(workspaceSlug: string, id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { sqlDraft: string }) =>
      sqlEditorApi.publishProcedure(workspaceSlug, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['sql-editor', 'procedures', workspaceSlug, id],
      });
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
        sqlPublished: string;
        parameters?: Record<string, any>;
        timeout?: number;
      };
    }) => sqlEditorApi.executeProcedure(workspaceSlug, id, data),
  });
}

export function useValidateSql(workspaceSlug: string) {
  return useMutation({
    mutationFn: (data: { sql: string }) =>
      sqlEditorApi.validateSql(workspaceSlug, data),
  });
}
