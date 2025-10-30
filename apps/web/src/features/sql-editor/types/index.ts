export interface StoredProcedure {
  id: string;
  workspaceId: string;
  name: string;
  status: 'draft' | 'published';
  sqlDraft: string;
  sqlPublished: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoredProcedureDto {
  name: string;
  sqlDraft: string;
}

export interface UpdateStoredProcedureDto {
  name?: string;
  sqlDraft?: string;
}

export interface PublishStoredProcedureDto {
  sqlDraft: string;
}

export interface ExecuteStoredProcedureDto {
  sqlPublished: string;
  parameters?: Record<string, any>;
  timeout?: number;
}

export interface ValidateSqlDto {
  sql: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutionResult {
  success: boolean;
  result: any;
  error?: string;
  executionTime: number;
  rowCount?: number;
}
