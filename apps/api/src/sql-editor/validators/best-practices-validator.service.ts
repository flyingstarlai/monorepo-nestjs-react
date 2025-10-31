import { Injectable } from '@nestjs/common';
import {
  ISqlValidator,
  ValidationIssue,
  ValidationContext,
} from '../interfaces/validation.interfaces';

@Injectable()
export class BestPracticesValidatorService implements ISqlValidator {
  validate(
    sql: string,
    context: ValidationContext
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const normalizedSql = sql.toLowerCase();

    // Check for SELECT *
    if (normalizedSql.includes('select *')) {
      issues.push({
        message:
          'Avoid using SELECT * in stored procedures - specify explicit columns',
        severity: 'warning',
      });
    }

    // Check for missing SET NOCOUNT ON
    if (!normalizedSql.includes('set nocount')) {
      issues.push({
        message: 'Consider adding SET NOCOUNT ON for better performance',
        severity: 'warning',
      });
    }

    // Check for missing BEGIN/END or AS keyword
    if (!normalizedSql.includes('begin') && !normalizedSql.includes('as')) {
      issues.push({
        message: 'Procedure should contain BEGIN...END block or AS keyword',
        severity: 'warning',
      });
    }

    // Check for potential SQL injection patterns
    if (normalizedSql.includes('exec(') || normalizedSql.includes('execute(')) {
      issues.push({
        message:
          'Dynamic SQL execution detected - ensure proper parameterization to prevent SQL injection',
        severity: 'warning',
      });
    }

    // Check for missing error handling
    if (!normalizedSql.includes('try') && !normalizedSql.includes('catch')) {
      issues.push({
        message: 'Consider adding TRY...CATCH block for proper error handling',
        severity: 'warning',
      });
    }

    // Check for hardcoded values that should be parameters
    const hardcodedValuePattern = /'(?:[^']|'')*'/g;
    const matches = sql.match(hardcodedValuePattern);
    if (matches && matches.length > 2) {
      issues.push({
        message:
          'Multiple hardcoded string literals found - consider using parameters instead',
        severity: 'warning',
      });
    }

    return Promise.resolve(issues);
  }
}
