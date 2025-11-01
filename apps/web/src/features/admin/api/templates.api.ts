import { apiClient } from '@/lib/api-client';
import { AdminApiError } from '@/lib/api-errors';

// Template types
export interface TemplateParameter {
  name: string;
  type: 'identifier' | 'string' | 'number';
  required: boolean;
  default?: any;
  constraints?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface TemplateParamsSchema {
  [key: string]: TemplateParameter;
}

export interface ProcedureTemplate {
  id: string;
  name: string;
  description?: string;
  sqlTemplate: string;
  paramsSchema?: TemplateParamsSchema;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface CreateProcedureTemplateDto {
  name: string;
  description?: string;
  sqlTemplate: string;
  paramsSchema?: TemplateParamsSchema;
}

export interface UpdateProcedureTemplateDto {
  name?: string;
  description?: string;
  sqlTemplate?: string;
  paramsSchema?: TemplateParamsSchema;
}

export interface RenderTemplateDto {
  procedureName: string;
  parameters?: Record<string, any>;
}

export interface RenderTemplateResponse {
  renderedSql: string;
  errors?: string[];
  warnings?: string[];
}

export interface TemplateValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  undeclaredPlaceholders?: string[];
  unusedParameters?: string[];
}

export const templatesApi = {
  async getTemplates(): Promise<ProcedureTemplate[]> {
    try {
      const response = await apiClient.get<ProcedureTemplate[]>('/admin/templates');
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to fetch templates'
      );
    }
  },

  async getTemplate(id: string): Promise<ProcedureTemplate> {
    try {
      const response = await apiClient.get<ProcedureTemplate>(`/admin/templates/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to fetch template'
      );
    }
  },

  async createTemplate(data: CreateProcedureTemplateDto): Promise<ProcedureTemplate> {
    try {
      const response = await apiClient.post<ProcedureTemplate>('/admin/templates', data);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to create template'
      );
    }
  },

  async updateTemplate(id: string, data: UpdateProcedureTemplateDto): Promise<ProcedureTemplate> {
    try {
      const response = await apiClient.patch<ProcedureTemplate>(`/admin/templates/${id}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to update template'
      );
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/templates/${id}`);
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to delete template'
      );
    }
  },

  async renderTemplate(id: string, data: RenderTemplateDto): Promise<RenderTemplateResponse> {
    try {
      const response = await apiClient.post<RenderTemplateResponse>(`/admin/templates/${id}/render`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to render template'
      );
    }
  },

  async validateTemplate(id: string): Promise<TemplateValidation> {
    try {
      const response = await apiClient.post<TemplateValidation>(`/admin/templates/${id}/validate`);
      return response.data;
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error;
      }
      throw new AdminApiError(
        error instanceof Error ? error.message : 'Failed to validate template'
      );
    }
  },
};