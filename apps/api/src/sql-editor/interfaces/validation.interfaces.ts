export interface ValidationIssue {
  message: string;
  line?: number;
  column?: number;
  near?: string;
  code?: string;
  severity: 'error' | 'warning';
}

export interface ParsedError {
  message: string;
  line?: number;
  column?: number;
  near?: string;
  code?: string;
}

export interface RewriteResult {
  sql: string;
  originalName: string;
  newName: string;
  lineMapping?: Map<number, number>;
}

export interface ValidationContext {
  workspaceId: string;
  procedureId?: string;
  userId?: string;
}

export interface ISqlValidator {
  validate(sql: string, context: ValidationContext): Promise<ValidationIssue[]>;
}

export interface IErrorParser {
  parse(error: Error | string): ParsedError;
}

export interface IProcedureNameRewriter {
  rewrite(sql: string, newName: string): RewriteResult;
}

export interface IMssqlClient {
  query(sql: string, workspaceId: string): Promise<any>;
  executeBatch(sql: string[], workspaceId: string): Promise<any[]>;
}