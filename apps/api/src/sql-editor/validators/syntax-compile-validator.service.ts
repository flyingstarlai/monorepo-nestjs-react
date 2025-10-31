import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ISqlValidator,
  ValidationIssue,
  ValidationContext,
} from '../interfaces/validation.interfaces';
import { MssqlClientService } from '../clients/mssql-client.service';
import { ProcedureNameRewriterService } from './procedure-name-rewriter.service';
import { MssqlErrorParserService } from './mssql-error-parser.service';

@Injectable()
export class SyntaxCompileValidatorService implements ISqlValidator {
  private readonly logger = new Logger(SyntaxCompileValidatorService.name);

  constructor(
    private readonly mssqlClient: MssqlClientService,
    private readonly nameRewriter: ProcedureNameRewriterService,
    private readonly errorParser: MssqlErrorParserService
  ) {}

  async validate(
    sql: string,
    context: ValidationContext
  ): Promise<ValidationIssue[]> {
    this.logger.debug(
      `Validating SQL syntax for workspace ${context.workspaceId}`
    );

    const issues: ValidationIssue[] = [];

    // Check if it's a stored procedure
    if (!this.isStoredProcedure(sql)) {
      issues.push({
        message:
          'SQL content must be a stored procedure (CREATE PROCEDURE or ALTER PROCEDURE)',
        severity: 'error',
      });
      return issues;
    }

    // Generate temporary name
    const tempName = `__tc_tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Rewrite procedure name to temporary name
      const rewriteResult = this.nameRewriter.rewrite(sql, tempName);

      // Execute temporary compilation
      await this.executeTemporaryCompile(
        rewriteResult.sql,
        context.workspaceId
      );

      this.logger.debug(
        `Syntax validation passed for workspace ${context.workspaceId}`
      );
      return [];
    } catch (error) {
      this.logger.debug(
        `Syntax validation failed for workspace ${context.workspaceId}:`,
        error
      );

      // Parse the error and map it back to original SQL
      const parsedError = this.errorParser.parse(
        error instanceof Error ? error : String(error)
      );

      // Map error line numbers back to original SQL if needed
      const adjustedLine = this.mapErrorLineToOriginal(
        parsedError.line,
        sql,
        tempName
      );

      return [
        {
          message: parsedError.message,
          line: adjustedLine,
          column: parsedError.column,
          near: parsedError.near,
          code: parsedError.code,
          severity: 'error',
        },
      ];
    }
  }

  private async executeTemporaryCompile(
    sql: string,
    workspaceId: string
  ): Promise<void> {
    // Create a batch that creates the temp procedure, then drops it
    const batch = [
      sql,
      `DROP PROCEDURE IF EXISTS [${this.extractTempName(sql)}]`,
    ];

    try {
      await this.mssqlClient.executeBatch(batch, workspaceId);
    } catch (error) {
      // Ensure cleanup even if creation fails
      const tempName = this.extractTempName(sql);
      if (tempName) {
        try {
          await this.mssqlClient.query(
            `DROP PROCEDURE IF EXISTS [${tempName}]`,
            workspaceId
          );
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }

  private extractTempName(sql: string): string | null {
    // Extract the temporary procedure name from the rewritten SQL
    const match = sql.match(
      /CREATE\s+(?:OR\s+ALTER\s+)?(?:PROCEDURE|PROC)\s+\[([^\]]+)\]/i
    );
    return match ? match[1] : null;
  }

  private isStoredProcedure(sqlContent: string): boolean {
    const normalizedSql = sqlContent.trim().toLowerCase();
    return (
      normalizedSql.startsWith('create procedure') ||
      normalizedSql.startsWith('create proc') ||
      normalizedSql.startsWith('alter procedure') ||
      normalizedSql.startsWith('alter proc') ||
      normalizedSql.startsWith('create or alter procedure') ||
      normalizedSql.startsWith('create or alter proc')
    );
  }

  private mapErrorLineToOriginal(
    errorLine: number | undefined,
    originalSql: string,
    tempName: string
  ): number | undefined {
    if (!errorLine) return undefined;

    // For now, return the same line number since we're only changing the procedure name
    // In a more sophisticated implementation, we could track line mappings
    return errorLine;
  }
}
