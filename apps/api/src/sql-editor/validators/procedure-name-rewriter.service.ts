import { Injectable } from '@nestjs/common';
import {
  IProcedureNameRewriter,
  RewriteResult,
} from '../interfaces/validation.interfaces';

@Injectable()
export class ProcedureNameRewriterService implements IProcedureNameRewriter {
  rewrite(sql: string, newName: string): RewriteResult {
    const originalName = this.extractProcedureName(sql);
    if (!originalName) {
      throw new Error('Could not extract procedure name from SQL');
    }

    // Create regex to match procedure name in CREATE/ALTER statements
    // This handles both [schema.name] and [name] formats
    const procedureRegex = new RegExp(
      `(CREATE\\s+(?:OR\\s+ALTER\\s+)?(?:PROCEDURE|PROC)\\s+)(?:\\[?\\w+\\]?\\.\\[?\\w+\\]?|\\[?\\w+\\]?)`,
      'gi'
    );

    const rewrittenSql = sql.replace(procedureRegex, `$1[${newName}]`);

    return {
      sql: rewrittenSql,
      originalName,
      newName,
    };
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
}
