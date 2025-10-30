import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoredProcedureDto {
  @ApiProperty({ description: 'Name of the stored procedure' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'SQL content for the procedure draft' })
  @IsString()
  sqlDraft: string;
}

export class UpdateStoredProcedureDto {
  @ApiPropertyOptional({ description: 'Name of the stored procedure' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'SQL content for the procedure draft' })
  @IsOptional()
  @IsString()
  sqlDraft?: string;
}

export class ExecuteProcedureDto {
  @ApiPropertyOptional({
    description: 'Parameters to pass to the stored procedure',
    example: { param1: 'value1', param2: 123 },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Execution timeout in seconds (max 60)',
    example: 30,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  timeout?: number;
}

export class ValidateStoredProcedureDto {
  @ApiProperty({ description: 'SQL content to validate' })
  @IsString()
  sqlContent: string;
}

export class StoredProcedureResponseDto {
  @ApiProperty({ description: 'Procedure ID' })
  id: string;

  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiProperty({ description: 'Procedure name' })
  name: string;

  @ApiProperty({ description: 'Procedure status' })
  status: string;

  @ApiProperty({ description: 'Draft SQL content' })
  sqlDraft: string;

  @ApiPropertyOptional({ description: 'Published SQL content' })
  sqlPublished?: string;

  @ApiPropertyOptional({ description: 'When the procedure was published' })
  publishedAt?: string;

  @ApiProperty({ description: 'Creator user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

export class ProcedureExecutionResponseDto {
  @ApiProperty({ description: 'Whether execution was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Result data rows' })
  data?: any[];

  @ApiPropertyOptional({ description: 'Column information' })
  columns?: Array<{ name: string; type: string }>;

  @ApiPropertyOptional({ description: 'Error message if execution failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Execution time in milliseconds' })
  executionTime?: number;

  @ApiPropertyOptional({ description: 'Number of rows returned' })
  rowCount?: number;
}

export class ValidationResultDto {
  @ApiProperty({ description: 'Whether validation passed' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Validation errors' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Validation warnings' })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Error line number' })
  line?: number;

  @ApiPropertyOptional({ description: 'Error column number' })
  column?: number;
}

export class PublishProcedureDto {
  // No data needed - server loads SQL from database
}

export class PublishProcedureResponseDto {
  @ApiProperty({ description: 'Whether publish was successful' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if publish failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Updated procedure information' })
  procedure?: StoredProcedureResponseDto;
}
