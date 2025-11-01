import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi, type CreateProcedureTemplateDto, type UpdateProcedureTemplateDto, type RenderTemplateDto } from '../api/templates.api';

// Query keys
export const templatesKeys = {
  all: ['templates'] as const,
  lists: () => [...templatesKeys.all, 'list'] as const,
  list: () => [...templatesKeys.lists()] as const,
  details: () => [...templatesKeys.all, 'detail'] as const,
  detail: (id: string) => [...templatesKeys.details(), id] as const,
};

// Hooks
export function useTemplatesQuery() {
  return useQuery({
    queryKey: templatesKeys.list(),
    queryFn: () => templatesApi.getTemplates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTemplateQuery(id: string) {
  return useQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.getTemplate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProcedureTemplateDto) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
    },
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcedureTemplateDto }) =>
      templatesApi.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templatesKeys.detail(id) });
    },
  });
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templatesKeys.lists() });
    },
  });
}

export function useRenderTemplateMutation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenderTemplateDto }) =>
      templatesApi.renderTemplate(id, data),
  });
}

export function useValidateTemplateMutation() {
  return useMutation({
    mutationFn: (id: string) => templatesApi.validateTemplate(id),
  });
}