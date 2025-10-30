import { Injectable } from '@nestjs/common';
import { IErrorParser, ParsedError } from '../interfaces/validation.interfaces';

@Injectable()
export class MssqlErrorParserService implements IErrorParser {
  parse(error: Error | string): ParsedError {
    const errorMessage = error instanceof Error ? error.message : error;
    
    // Extract line number
    const lineMatch = errorMessage.match(/line\s+(\d+):/i);
    const line = lineMatch ? parseInt(lineMatch[1]) : undefined;

    // Extract column number (less common in MSSQL errors)
    const columnMatch = errorMessage.match(/column\s+(\d+)/i);
    const column = columnMatch ? parseInt(columnMatch[1]) : undefined;

    // Extract "near" token
    const nearMatch = errorMessage.match(/near\s+'([^']+)'/i);
    const near = nearMatch ? nearMatch[1] : undefined;

    // Extract error code
    const codeMatch = errorMessage.match(/msg\s+(\d+)/i);
    const code = codeMatch ? codeMatch[1] : undefined;

    // Clean up the error message
    let cleanMessage = errorMessage;

    // Remove SQL Server specific prefixes
    cleanMessage = cleanMessage.replace(
      /^Msg\s+\d+,\s+Level\s+\d+,\s+State\s+\d+,\s+Line\s+\d+:\s*/i,
      ''
    );
    cleanMessage = cleanMessage.replace(
      /^Microsoft\s+SQL\s+Server\s+Error\s+\d+:\s*/i,
      ''
    );

    // Remove duplicate line information
    if (line && cleanMessage.includes(`Line ${line}:`)) {
      cleanMessage = cleanMessage.replace(/Line\s+\d+:\s*/i, '');
    }

    // Trim and clean up
    cleanMessage = cleanMessage.trim();

    return {
      message: cleanMessage,
      line,
      column,
      near,
      code,
    };
  }
}