import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StoredProcedure } from '../entities/stored-procedure.entity';
import { MssqlConnectionRegistry } from './mssql-connection-registry.service';

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

  constructor(
    @InjectRepository(StoredProcedure)
    private readonly storedProcedureRepository: Repository<StoredProcedure>,
    private readonly mssqlConnectionRegistry: MssqlConnectionRegistry,
  ) {}

  async validateDraft(
    procedureId: string,
    workspaceId: string
  ): Promise<ValidationResult> {
    this.logger.debug(`Validating draft for stored procedure ${procedureId} in workspace ${workspaceId}`);

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

    try {
      // Get MSSQL connection
      const connection = await this.mssqlConnectionRegistry.getConnectionForWorkspace(workspaceId);

      // Validate syntax using PARSEONLY/NOEXEC
      const validationResult = await this.validateSqlSyntax(connection, procedure.sqlDraft);

      this.logger.debug(`Validation result for procedure ${procedureId}: ${validationResult.valid ? 'valid' : 'invalid'}`);
      return validationResult;
    } catch (error) {
      this.logger.error(`Failed to validate procedure ${procedureId}:`, error);
      
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  async validateSqlContent(
    sqlContent: string,
    workspaceId: string
  ): Promise<ValidationResult> {
    this.logger.debug(`Validating SQL content for workspace ${workspaceId}`);

    if (!sqlContent || sqlContent.trim() === '') {
      return {
        valid: false,
        errors: ['SQL content cannot be empty'],
      };
    }

    try {
      // Get MSSQL connection
      const connection = await this.mssqlConnectionRegistry.getConnectionForWorkspace(workspaceId);

      // Validate syntax using PARSEONLY/NOEXEC
      const validationResult = await this.validateSqlSyntax(connection, sqlContent);

      this.logger.debug(`SQL validation result for workspace ${workspaceId}: ${validationResult.valid ? 'valid' : 'invalid'}`);
      return validationResult;
    } catch (error) {
      this.logger.error(`Failed to validate SQL content for workspace ${workspaceId}:`, error);
      
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async validateSqlSyntax(
    connection: DataSource,
    sqlContent: string
  ): Promise<ValidationResult> {
    try {
      // Check if it looks like a stored procedure
      if (!this.isStoredProcedure(sqlContent)) {
        return {
          valid: false,
          errors: ['SQL content must be a stored procedure (CREATE PROCEDURE or ALTER PROCEDURE)'],
        };
      }

      // Extract procedure name for validation
      const procedureName = this.extractProcedureName(sqlContent);
      if (!procedureName) {
        return {
          valid: false,
          errors: ['Could not extract procedure name from SQL content'],
        };
      }

      // Build validation SQL using SET PARSEONLY and SET NOEXEC
      const validationSql = this.buildValidationSql(sqlContent);

      // Execute validation
      await connection.query(validationSql);

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      // Parse MSSQL error message for better feedback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        valid: false,
        errors: [this.parseMssqlError(errorMessage)],
      };
    }
  }

  private buildValidationSql(sqlContent: string): string {
    // Wrap the SQL in a batch with PARSEONLY and NOEXEC for syntax validation
    return `
      SET PARSEONLY ON;
      SET NOEXEC ON;
      
      ${sqlContent}
      
      SET PARSEONLY OFF;
      SET NOEXEC OFF;
    `;
  }

  private isStoredProcedure(sqlContent: string): boolean {
    const normalizedSql = sqlContent.trim().toLowerCase();
    return (
      normalizedSql.startsWith('create procedure') ||
      normalizedSql.startsWith('create proc') ||
      normalizedSql.startsWith('alter procedure') ||
      normalizedSql.startsWith('alter proc')
    );
  }

  private extractProcedureName(sqlContent: string): string | null {
    // Extract procedure name from CREATE/ALTER PROCEDURE statement
    const normalizedSql = sqlContent.trim().toLowerCase();
    
    // Match CREATE PROCEDURE [schema.]procedure_name
    const createMatch = normalizedSql.match(/create\s+(?:procedure|proc)\s+(?:\w+\.)?(\w+)/i);
    if (createMatch) {
      return createMatch[1];
    }
    
    // Match ALTER PROCEDURE [schema.]procedure_name
    const alterMatch = normalizedSql.match(/alter\s+(?:procedure|proc)\s+(?:\w+\.)?(\w+)/i);
    if (alterMatch) {
      return alterMatch[1];
    }
    
    return null;
  }

  private parseMssqlError(errorMessage: string): string {
    // Try to extract line and column information from MSSQL error messages
    // Format: "Incorrect syntax near 'XYZ'." or "Line X: Incorrect syntax near 'XYZ'."
    
    const lineMatch = errorMessage.match(/line\s+(\d+):/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : undefined;
    
    const nearMatch = errorMessage.match(/near\s+'([^']+)'/i);
    const nearText = nearMatch ? nearMatch[1] : undefined;
    
    // Clean up common MSSQL error messages
    let cleanError = errorMessage;
    
    // Remove SQL Server specific prefixes
    cleanError = cleanError.replace(/^Msg\s+\d+,\s+Level\s+\d+,\s+State\s+\d+,\s+Line\s+\d+:\s*/i, '');
    cleanError = cleanError.replace(/^Microsoft\s+SQL\s+Server\s+Error\s+\d+:\s*/i, '');
    
    // Remove duplicate line information
    if (line && cleanError.includes(`Line ${line}:`)) {
      cleanError = cleanError.replace(/Line\s+\d+:\s*/i, '');
    }
    
    return cleanError.trim();
  }

  async canUserValidateProcedure(procedureId: string, workspaceId: string, userId: string): Promise<boolean> {
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

  // Additional validation helpers for common procedure issues
  async validateProcedureStructure(sqlContent: string): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const normalizedSql = sqlContent.toLowerCase();

    // Check for common issues
    if (!normalizedSql.includes('begin') && !normalizedSql.includes('as')) {
      warnings.push('Procedure should contain BEGIN...END block or AS keyword');
    }

    if (normalizedSql.includes('select *')) {
      warnings.push('Avoid using SELECT * in stored procedures - specify explicit columns');
    }

    if (!normalizedSql.includes('set nocount')) {
      warnings.push('Consider adding SET NOCOUNT ON for better performance');
    }

    // Check for required elements
    if (!this.isStoredProcedure(sqlContent)) {
      errors.push('SQL must be a CREATE or ALTER PROCEDURE statement');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}