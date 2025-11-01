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
  data?: Record<string, never>;
}

export interface ExecuteStoredProcedureDto {
  // No sqlPublished needed - server loads from database
  parameters?: Record<string, unknown>;
  timeout?: number;
}

export interface ValidateSqlDto {
  sql: string;
}

export interface ValidationIssue {
  message: string;
  line?: number;
  column?: number;
  near?: string;
  code?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  issues?: ValidationIssue[];
}

export interface ExecutionResult {
  success: boolean;
  result: unknown;
  data?: unknown;
  columns?: Array<{ name: string; type: string }>;
  error?: string;
  executionTime: number;
  rowCount?: number;
  consoleMessages?: string[];
  procedureName?: string;
}

export interface StoredProcedureVersion {
  id: string;
  procedureId: string;
  workspaceId: string;
  version: number;
  source: 'draft' | 'published';
  name: string;
  sqlText: string;
  createdBy: string;
  createdAt: string;
  creator?: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}
