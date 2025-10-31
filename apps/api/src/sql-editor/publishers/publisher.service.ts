import { Injectable, Logger } from '@nestjs/common';
import {
  IPublisher,
  PublishContext,
  PrecheckResult,
  DeployResult,
  VerifyResult,
} from '../interfaces/publishing.interfaces';
import {
  ISqlValidator,
  ValidationIssue,
} from '../interfaces/validation.interfaces';
import { MssqlClientService } from '../clients/mssql-client.service';
import { SyntaxCompileValidatorService } from '../validators/syntax-compile-validator.service';
import { MssqlErrorParserService } from '../validators/mssql-error-parser.service';

@Injectable()
export class PublisherService implements IPublisher {
  private readonly logger = new Logger(PublisherService.name);

  constructor(
    private readonly mssqlClient: MssqlClientService,
    private readonly syntaxValidator: SyntaxCompileValidatorService,
    private readonly errorParser: MssqlErrorParserService
  ) {}

  async precheck(
    context: PublishContext,
    sql: string
  ): Promise<PrecheckResult> {
    const startTime = Date.now();
    this.logger.debug(
      `Running precheck for procedure ${context.procedureId} in workspace ${context.workspaceId}`
    );

    try {
      // Use syntax validator for precheck (without temp rewrite)
      const issues = await this.syntaxValidator.validate(sql, {
        workspaceId: context.workspaceId,
        procedureId: context.procedureId,
        userId: context.userId,
      });

      const errors = issues.filter((issue) => issue.severity === 'error');
      const canProceed = errors.length === 0;

      const duration = Date.now() - startTime;

      this.logger.debug(
        `Precheck completed for procedure ${context.procedureId}: canProceed=${canProceed}, duration=${duration}ms`
      );

      return {
        success: canProceed,
        canProceed,
        issues: issues.length > 0 ? issues : undefined,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Precheck failed for procedure ${context.procedureId}:`,
        error
      );

      const parsedError = this.errorParser.parse(
        error instanceof Error ? error : String(error)
      );

      return {
        success: false,
        canProceed: false,
        issues: [
          {
            message: parsedError.message,
            line: parsedError.line,
            column: parsedError.column,
            near: parsedError.near,
            code: parsedError.code,
            severity: 'error',
          },
        ],
        duration,
      };
    }
  }

  async deploy(context: PublishContext, sql: string): Promise<DeployResult> {
    const startTime = Date.now();
    this.logger.debug(
      `Deploying procedure ${context.procedureId} in workspace ${context.workspaceId}`
    );

    try {
      // Sanitize and prepare SQL for deployment
      const deploySql = this.prepareDeploySql(sql);

      // Execute the deployment
      await this.mssqlClient.query(deploySql, context.workspaceId);

      const duration = Date.now() - startTime;
      const procedureName = this.extractProcedureName(sql);

      this.logger.debug(
        `Deployment completed for procedure ${context.procedureId}, name=${procedureName}, duration=${duration}ms`
      );

      return {
        success: true,
        deployedName: procedureName,
        sqlPreview:
          deploySql.substring(0, 200) + (deploySql.length > 200 ? '...' : ''),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Deployment failed for procedure ${context.procedureId}:`,
        error
      );

      const parsedError = this.errorParser.parse(
        error instanceof Error ? error : String(error)
      );

      return {
        success: false,
        issues: [
          {
            message: parsedError.message,
            line: parsedError.line,
            column: parsedError.column,
            near: parsedError.near,
            code: parsedError.code,
            severity: 'error',
          },
        ],
        sqlPreview: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        duration,
      };
    }
  }

  async verify(
    context: PublishContext,
    procedureName: string
  ): Promise<VerifyResult> {
    const startTime = Date.now();
    this.logger.debug(
      `Verifying procedure ${procedureName} in workspace ${context.workspaceId}`
    );

    try {
      // Check if procedure exists in INFORMATION_SCHEMA
      const existenceQuery = `
        SELECT ROUTINE_NAME, ROUTINE_SCHEMA 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_TYPE = 'PROCEDURE' 
        AND ROUTINE_NAME = '${procedureName.replace(/'/g, "''")}'
      `;

      const existenceResult = await this.mssqlClient.query(
        existenceQuery,
        context.workspaceId
      );

      if (!existenceResult || existenceResult.length === 0) {
        const duration = Date.now() - startTime;
        return {
          success: false,
          verified: false,
          issues: [
            {
              message: `Procedure ${procedureName} not found after deployment`,
              severity: 'error',
            },
          ],
          duration,
        };
      }

      // Get the object definition for comparison
      const definitionQuery = `
        SELECT OBJECT_DEFINITION(OBJECT_ID('${procedureName.replace(/'/g, "''")}')) as definition
      `;

      const definitionResult = await this.mssqlClient.query(
        definitionQuery,
        context.workspaceId
      );
      const objectDefinition = definitionResult?.[0]?.definition;

      const duration = Date.now() - startTime;

      this.logger.debug(
        `Verification completed for procedure ${procedureName}: verified=true, duration=${duration}ms`
      );

      return {
        success: true,
        verified: true,
        objectDefinition,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Verification failed for procedure ${procedureName}:`,
        error
      );

      const parsedError = this.errorParser.parse(
        error instanceof Error ? error : String(error)
      );

      return {
        success: false,
        verified: false,
        issues: [
          {
            message: parsedError.message,
            line: parsedError.line,
            column: parsedError.column,
            near: parsedError.near,
            code: parsedError.code,
            severity: 'error',
          },
        ],
        duration,
      };
    }
  }

  private prepareDeploySql(sql: string): string {
    const trimmedSql = sql.trim();

    // If SQL already has a full header, sanitize and return as-is
    if (this.hasFullHeader(trimmedSql)) {
      return this.sanitizeSql(trimmedSql);
    }

    // If body only, construct minimal CREATE OR ALTER header
    const procedureName =
      this.extractProcedureName(trimmedSql) || 'UnknownProcedure';
    const header = `CREATE OR ALTER PROCEDURE [${procedureName}]`;

    return this.sanitizeSql(`${header}\nAS\n${trimmedSql}`);
  }

  private hasFullHeader(sql: string): boolean {
    const normalizedSql = sql.trim().toLowerCase();
    return (
      normalizedSql.startsWith('create procedure') ||
      normalizedSql.startsWith('create proc') ||
      normalizedSql.startsWith('alter procedure') ||
      normalizedSql.startsWith('alter proc') ||
      normalizedSql.startsWith('create or alter procedure') ||
      normalizedSql.startsWith('create or alter proc')
    );
  }

  private extractProcedureName(sql: string): string | null {
    const normalizedSql = sql.trim().toLowerCase();

    // Match CREATE OR ALTER PROCEDURE [schema.]procedure_name
    const createOrAlterMatch = normalizedSql.match(
      /create\s+or\s+alter\s+(?:procedure|proc)\s+(?:\w+\.)?(\w+)/i
    );
    if (createOrAlterMatch) {
      return createOrAlterMatch[1];
    }

    // Match CREATE PROCEDURE [schema.]procedure_name
    const createMatch = normalizedSql.match(
      /create\s+(?:procedure|proc)\s+(?:\w+\.)?(\w+)/i
    );
    if (createMatch) {
      return createMatch[1];
    }

    // Match ALTER PROCEDURE [schema.]procedure_name
    const alterMatch = normalizedSql.match(
      /alter\s+(?:procedure|proc)\s+(?:\w+\.)?(\w+)/i
    );
    if (alterMatch) {
      return alterMatch[1];
    }

    return null;
  }

  private sanitizeSql(sql: string): string {
    // Basic sanitization - remove potentially harmful patterns
    return sql
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .trim();
  }
}
