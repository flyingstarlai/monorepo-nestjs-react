import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoredProcedure } from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';
import { ISqlValidator, ValidationIssue, ValidationContext } from '../interfaces/validation.interfaces';
import { SyntaxCompileValidatorService } from '../validators/syntax-compile-validator.service';
import { BestPracticesValidatorService } from '../validators/best-practices-validator.service';
import { MssqlClientService } from '../clients/mssql-client.service';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  line?: number;
  column?: number;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly validators: ISqlValidator[];

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly mssqlConnectionRegistry: MssqlConnectionRegistry,
    private readonly syntaxValidator: SyntaxCompileValidatorService,
    private readonly bestPracticesValidator: BestPracticesValidatorService
  ) {
    this.validators = [
      this.syntaxValidator,
      this.bestPracticesValidator,
    ];
  }

  async validateDraft(
    procedureId: string,
    workspaceId: string
  ): Promise<ValidationResult> {
    this.logger.debug(
      `Validating draft for stored procedure ${procedureId} in workspace ${workspaceId}`
    );

    // Get procedure
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
    });

    if (!procedure) {
      throw new NotFoundException('Stored procedure not found');
    }

    if (!procedure.sqlDraft || procedure.sqlDraft.trim() === '') {
      return {
        valid: false,
        errors: ['Procedure draft cannot be empty'],
      };
    }

    return this.validateSqlContent(procedure.sqlDraft, workspaceId, {
      workspaceId,
      procedureId,
    });
  }

  async validateSqlContent(
    sqlContent: string,
    workspaceId: string,
    context?: Partial<ValidationContext>
  ): Promise<ValidationResult> {
    this.logger.debug(`Validating SQL content for workspace ${workspaceId}`);

    if (!sqlContent || sqlContent.trim() === '') {
      return {
        valid: false,
        errors: ['SQL content cannot be empty'],
      };
    }

    const validationContext: ValidationContext = {
      workspaceId,
      ...context,
    };

    try {
      // Run validation pipeline
      const allIssues: ValidationIssue[] = [];
      
      for (const validator of this.validators) {
        const issues = await validator.validate(sqlContent, validationContext);
        allIssues.push(...issues);
      }

      // Separate errors and warnings
      const errors = allIssues.filter(issue => issue.severity === 'error');
      const warnings = allIssues.filter(issue => issue.severity === 'warning');

      const result: ValidationResult = {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors.map(e => this.formatIssue(e)) : undefined,
        warnings: warnings.length > 0 ? warnings.map(w => this.formatIssue(w)) : undefined,
      };

      this.logger.debug(
        `SQL validation result for workspace ${workspaceId}: ${result.valid ? 'valid' : 'invalid'} (${errors.length} errors, ${warnings.length} warnings)`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to validate SQL content for workspace ${workspaceId}:`,
        error
      );

      return {
        valid: false,
        errors: [
          `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  private formatIssue(issue: ValidationIssue): string {
    let formatted = issue.message;
    
    if (issue.line) {
      formatted = `Line ${issue.line}: ${formatted}`;
    }
    
    if (issue.near) {
      formatted += ` (near '${issue.near}')`;
    }
    
    return formatted;
  }

  async canUserValidateProcedure(
    procedureId: string,
    workspaceId: string,
    _userId: string
  ): Promise<boolean> {
    const procedure = await this.storedProcedureRepository.findOne({
      where: { id: procedureId, workspaceId },
    });

    if (!procedure) {
      return false;
    }

    // For now, allow validation if user can access the procedure
    // In a full implementation, you'd check workspace membership roles
    return true;
  }

  // Additional validation helpers for common procedure issues (deprecated - use pipeline)
  async validateProcedureStructure(
    sqlContent: string
  ): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const normalizedSql = sqlContent.toLowerCase();

    // Check for common issues
    if (!normalizedSql.includes('begin') && !normalizedSql.includes('as')) {
      warnings.push('Procedure should contain BEGIN...END block or AS keyword');
    }

    if (normalizedSql.includes('select *')) {
      warnings.push(
        'Avoid using SELECT * in stored procedures - specify explicit columns'
      );
    }

    if (!normalizedSql.includes('set nocount')) {
      warnings.push('Consider adding SET NOCOUNT ON for better performance');
    }

    // Check for required elements
    if (!this.isStoredProcedure(sqlContent)) {
      errors.push('SQL must be a CREATE, ALTER, or CREATE OR ALTER PROCEDURE statement');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
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
}
