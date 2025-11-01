import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateParameter, TemplateParamsSchema } from '../entities/procedure-template.entity';

export class TemplateParameterDto implements TemplateParameter {
  @ApiProperty({ description: 'Parameter name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'Parameter name must contain only letters, numbers, and underscores',
  })
  name: string;

  @ApiProperty({
    description: 'Parameter type',
    enum: ['identifier', 'string', 'number'],
  })
  @IsEnum(['identifier', 'string', 'number'])
  type: 'identifier' | 'string' | 'number';

  @ApiProperty({ description: 'Whether parameter is required' })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Default value for parameter' })
  default?: any;

  @ApiPropertyOptional({
    description: 'Parameter constraints',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  constraints?: Record<string, any>;
}

export class CreateProcedureTemplateDto {
  @ApiProperty({ description: 'Template name (must be unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'SQL template with {{placeholder}} syntax' })
  @IsString()
  @IsNotEmpty()
  sqlTemplate: string;

  @ApiPropertyOptional({
    description: 'Parameter schema defining template parameters',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/TemplateParameterDto',
    },
  })
  @IsOptional()
  @IsObject()
  paramsSchema?: TemplateParamsSchema;
}

export class UpdateProcedureTemplateDto {
  @ApiPropertyOptional({ description: 'Template name (must be unique)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'SQL template with {{placeholder}} syntax' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sqlTemplate?: string;

  @ApiPropertyOptional({
    description: 'Parameter schema defining template parameters',
    type: 'object',
    additionalProperties: {
      $ref: '#/components/schemas/TemplateParameterDto',
    },
  })
  @IsOptional()
  @IsObject()
  paramsSchema?: TemplateParamsSchema;
}

export class RenderTemplateDto {
  @ApiProperty({ description: 'Procedure name to use in template' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'Procedure name must contain only letters, numbers, and underscores',
  })
  procedureName: string;

  @ApiPropertyOptional({
    description: 'Parameter values for template rendering',
    example: { paramName: 'value', anotherParam: 123 },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ProcedureTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({ description: 'SQL template' })
  sqlTemplate: string;

  @ApiPropertyOptional({ description: 'Parameter schema' })
  paramsSchema?: TemplateParamsSchema;

  @ApiProperty({ description: 'Creator user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

export class RenderTemplateResponseDto {
  @ApiProperty({ description: 'Rendered SQL' })
  renderedSql: string;

  @ApiPropertyOptional({ description: 'Validation errors if any' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Validation warnings if any' })
  warnings?: string[];
}

export class TemplateValidationDto {
  @ApiProperty({ description: 'Whether template is valid' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Validation errors' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Validation warnings' })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Undeclared placeholders found' })
  undeclaredPlaceholders?: string[];

  @ApiPropertyOptional({ description: 'Unused parameters found' })
  unusedParameters?: string[];
}