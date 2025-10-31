import type {
  StoredProcedure,
  CreateStoredProcedureDto,
  UpdateStoredProcedureDto,
  ExecuteStoredProcedureDto,
  ValidateSqlDto,
  ValidationResult,
  ExecutionResult,
  StoredProcedureVersion,
} from '../types';
import { apiClient } from '@/lib/api-client';
import { WorkspaceError } from '@/lib/api-errors';

export class SqlEditorError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SqlEditorError';
  }
}

export const sqlEditorApi = {
  async getProcedures(workspaceSlug: string): Promise<StoredProcedure[]> {
    try {
      const response = await apiClient.get<StoredProcedure[]>(
        `/c/${workspaceSlug}/sql-editor`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      console.error('Failed to fetch stored procedures:', error);
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch stored procedures'
      );
    }
  },

  async getProcedure(
    workspaceSlug: string,
    id: string
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.get<StoredProcedure>(
        `/c/${workspaceSlug}/sql-editor/${id}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError('Failed to fetch stored procedure');
    }
  },

  async createProcedure(
    workspaceSlug: string,
    data: CreateStoredProcedureDto
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.post<StoredProcedure>(
        `/c/${workspaceSlug}/sql-editor`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to create stored procedure'
      );
    }
  },

  async updateProcedure(
    workspaceSlug: string,
    id: string,
    data: UpdateStoredProcedureDto
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.put<StoredProcedure>(
        `/c/${workspaceSlug}/sql-editor/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to update stored procedure'
      );
    }
  },

  async deleteProcedure(workspaceSlug: string, id: string): Promise<void> {
    try {
      await apiClient.delete(`/c/${workspaceSlug}/sql-editor/${id}`);
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError('Failed to delete stored procedure');
    }
  },

  async publishProcedure(
    workspaceSlug: string,
    id: string
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        procedure?: StoredProcedure;
        error?: string;
      }>(`/c/${workspaceSlug}/sql-editor/${id}/publish`, {});

      if (!response.data.success) {
        throw new SqlEditorError(
          response.data.error || 'Failed to publish stored procedure'
        );
      }

      return response.data.procedure!;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to publish stored procedure'
      );
    }
  },

  async unpublishProcedure(
    workspaceSlug: string,
    id: string
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.post<StoredProcedure>(
        `/c/${workspaceSlug}/sql-editor/${id}/unpublish`,
        {}
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to unpublish stored procedure'
      );
    }
  },

  async executeProcedure(
    workspaceSlug: string,
    id: string,
    data: Omit<ExecuteStoredProcedureDto, 'sqlPublished'>
  ): Promise<ExecutionResult> {
    try {
      const response = await apiClient.post<ExecutionResult>(
        `/c/${workspaceSlug}/sql-editor/${id}/execute`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      throw new SqlEditorError(
        error instanceof Error
          ? error.message
          : 'Failed to execute stored procedure'
      );
    }
  },

  async validateSql(
    workspaceSlug: string,
    data: ValidateSqlDto
  ): Promise<ValidationResult> {
    try {
      const response = await apiClient.post<ValidationResult>(
        `/c/${workspaceSlug}/sql-editor/validate`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      console.error('Failed to validate SQL:', error);
      throw new SqlEditorError('Failed to validate SQL');
    }
  },

  async getVersions(
    workspaceSlug: string,
    procedureId: string
  ): Promise<StoredProcedureVersion[]> {
    const response = await apiClient.get<StoredProcedureVersion[]>(
      `/c/${workspaceSlug}/sql-editor/${procedureId}/versions`
    );
    
    return response.data;
  },

  async getVersion(
    workspaceSlug: string,
    procedureId: string,
    version: number
  ): Promise<StoredProcedureVersion> {
    try {
      const response = await apiClient.get<StoredProcedureVersion>(
        `/c/${workspaceSlug}/sql-editor/${procedureId}/versions/${version}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      console.error('Failed to fetch version:', error);
      throw new SqlEditorError('Failed to fetch procedure version');
    }
  },

  async rollbackToVersion(
    workspaceSlug: string,
    procedureId: string,
    version: number
  ): Promise<StoredProcedure> {
    try {
      const response = await apiClient.post<StoredProcedure>(
        `/c/${workspaceSlug}/sql-editor/${procedureId}/rollback`,
        { version }
      );
      return response.data;
    } catch (error) {
      if (error instanceof WorkspaceError || error instanceof SqlEditorError) {
        throw error;
      }
      console.error('Failed to rollback procedure:', error);
      throw new SqlEditorError('Failed to rollback procedure');
    }
  },
};
