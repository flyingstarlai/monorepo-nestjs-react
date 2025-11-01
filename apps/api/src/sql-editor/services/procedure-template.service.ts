import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcedureTemplate, TemplateParamsSchema } from '../entities/procedure-template.entity';
import {
  CreateProcedureTemplateDto,
  UpdateProcedureTemplateDto,
  RenderTemplateDto,
  TemplateValidationDto,
} from '../dto/procedure-template.dto';

@Injectable()
export class ProcedureTemplateService {
  private readonly logger = new Logger(ProcedureTemplateService.name);

  constructor(
    @InjectRepository(ProcedureTemplate)
    private readonly templateRepository: Repository<ProcedureTemplate>,
  ) {
    console.log('ProcedureTemplateService instantiated');
    console.log('Template repository injected:', !!this.templateRepository);
  }

  async createTemplate(
    createDto: CreateProcedureTemplateDto,
    userId: string
  ): Promise<ProcedureTemplate> {
    this.logger.log(`Creating procedure template "${createDto.name}"`);

    // Validate template before saving
    const validation = this.validateTemplate(createDto.sqlTemplate, createDto.paramsSchema);
    if (!validation.valid) {
      throw new BadRequestException(`Template validation failed: ${validation.errors?.join(', ')}`);
    }

    // Check if template with same name already exists
    const existingTemplate = await this.templateRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingTemplate) {
      throw new ForbiddenException(
        `A procedure template named "${createDto.name}" already exists`
      );
    }

    const template = this.templateRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const savedTemplate = await this.templateRepository.save(template);

    this.logger.log(`Successfully created procedure template ${savedTemplate.id}`);
    return savedTemplate;
  }

  async getTemplates(): Promise<ProcedureTemplate[]> {
    this.logger.debug('Getting all procedure templates');
    
    try {
      console.log('Template repository:', this.templateRepository);
      
      // Safely access metadata with error handling
      let metadata;
      try {
        metadata = this.templateRepository.metadata;
        console.log('Template repository metadata:', metadata);
      } catch (metadataError: any) {
        console.error('Error accessing repository metadata:', metadataError);
        console.error('Metadata error stack:', metadataError.stack);
      }
      
      const result = await this.templateRepository.find({
        order: { updatedAt: 'DESC' },
      });
      
      console.log('Query result:', result);
      return result;
    } catch (error: any) {
      console.error('Error in getTemplates:', error);
      console.error('Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      this.logger.error('Error getting templates:', error);
      throw error;
    }
  }

  async getTemplateById(templateId: string): Promise<ProcedureTemplate> {
    this.logger.debug(`Getting procedure template ${templateId}`);

    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Procedure template not found');
    }

    return template;
  }

  async updateTemplate(
    templateId: string,
    updateDto: UpdateProcedureTemplateDto,
    userId: string
  ): Promise<ProcedureTemplate> {
    this.logger.log(`Updating procedure template ${templateId}`);

    const template = await this.getTemplateById(templateId);

    // If updating name, check for uniqueness
    if (updateDto.name && updateDto.name !== template.name) {
      const existingTemplate = await this.templateRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingTemplate) {
        throw new ForbiddenException(
          `A procedure template named "${updateDto.name}" already exists`
        );
      }
    }

    // Validate updated template if provided
    if (updateDto.sqlTemplate || updateDto.paramsSchema) {
      const sqlTemplate = updateDto.sqlTemplate || template.sqlTemplate;
      const paramsSchema = updateDto.paramsSchema || template.paramsSchema;
      
      const validation = this.validateTemplate(sqlTemplate, paramsSchema);
      if (!validation.valid) {
        throw new BadRequestException(`Template validation failed: ${validation.errors?.join(', ')}`);
      }
    }

    await this.templateRepository.update(templateId, updateDto);

    const updatedTemplate = await this.getTemplateById(templateId);

    this.logger.log(`Successfully updated procedure template ${templateId}`);
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.logger.log(`Deleting procedure template ${templateId}`);

    const template = await this.getTemplateById(templateId);

    await this.templateRepository.delete(templateId);

    this.logger.log(`Successfully deleted procedure template ${templateId}`);
  }

  async renderTemplate(
    templateId: string,
    renderDto: RenderTemplateDto
  ): Promise<{ renderedSql: string; validation: TemplateValidationDto }> {
    this.logger.debug(`Rendering procedure template ${templateId}`);

    const template = await this.getTemplateById(templateId);

    // Validate parameters against schema
    const validation = this.validateRenderParameters(
      template.paramsSchema,
      renderDto.parameters || {}
    );

    if (!validation.valid) {
      return {
        renderedSql: '',
        validation,
      };
    }

    // Render the template
    const renderedSql = this.performTemplateRender(
      template.sqlTemplate,
      renderDto.procedureName,
      renderDto.parameters || {}
    );

    return {
      renderedSql,
      validation,
    };
  }

  validateTemplate(
    sqlTemplate: string,
    paramsSchema?: TemplateParamsSchema | null
  ): TemplateValidationDto {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if template is empty
    if (!sqlTemplate || sqlTemplate.trim().length === 0) {
      errors.push('SQL template cannot be empty');
      return { valid: false, errors, warnings };
    }

    // Extract placeholders from template
    const placeholders = this.extractPlaceholders(sqlTemplate);

    // Check for required procedureName placeholder in header
    if (!placeholders.includes('procedureName')) {
      errors.push('Template must contain {{procedureName}} placeholder in the procedure header');
    }

    // Validate procedure header format
    const headerMatch = sqlTemplate.match(/CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+{{procedureName}}/i);
    if (!headerMatch) {
      errors.push('Template must contain a valid CREATE [OR ALTER] PROCEDURE {{procedureName}} header');
    }

    // Validate parameter schema if provided
    if (paramsSchema) {
      const declaredParams = Object.keys(paramsSchema);
      
      // Check for undeclared placeholders
      const undeclaredPlaceholders = placeholders.filter(
        placeholder => !declaredParams.includes(placeholder) && placeholder !== 'procedureName'
      );
      
      if (undeclaredPlaceholders.length > 0) {
        errors.push(`Undeclared placeholders found: ${undeclaredPlaceholders.join(', ')}`);
      }

      // Check for unused parameters
      const unusedParameters = declaredParams.filter(
        param => !placeholders.includes(param)
      );
      
      if (unusedParameters.length > 0) {
        warnings.push(`Unused parameters found: ${unusedParameters.join(', ')}`);
      }

      // Validate parameter definitions
      for (const [paramName, paramDef] of Object.entries(paramsSchema)) {
        if (!paramDef.name || paramDef.name !== paramName) {
          errors.push(`Parameter definition key "${paramName}" must match its name property`);
        }

        // Identifier is often optional with a sensible default
        if (paramDef.type === 'identifier' && paramDef.required !== false) {
          warnings.push(`Identifier parameter "${paramName}" should typically be optional with a default value`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      undeclaredPlaceholders: errors.length > 0 ? undefined : [],
      unusedParameters: warnings.length > 0 ? undefined : [],
    };
  }

  private validateRenderParameters(
    paramsSchema: TemplateParamsSchema | null,
    providedParams: Record<string, any>
  ): TemplateValidationDto {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!paramsSchema) {
      return { valid: true };
    }

    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(paramsSchema)) {
      if (paramDef.required && !(paramName in providedParams)) {
        errors.push(`Required parameter "${paramName}" is missing`);
      }

      if (paramName in providedParams) {
        const value = providedParams[paramName];
        
        // Type validation
        if (!this.validateParameterType(value, paramDef)) {
          errors.push(`Parameter "${paramName}" has invalid type. Expected ${paramDef.type}`);
        }

        // Constraint validation
        if (paramDef.constraints) {
          const constraintErrors = this.validateParameterConstraints(value, paramDef);
          errors.push(...constraintErrors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private validateParameterType(value: any, paramDef: any): boolean {
    switch (paramDef.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'identifier':
        return typeof value === 'string' && /^[A-Za-z0-9_]+$/.test(value);
      default:
        return false;
    }
  }

  private validateParameterConstraints(value: any, paramDef: any): string[] {
    const errors: string[] = [];
    const constraints = paramDef.constraints || {};

    if (paramDef.type === 'number') {
      if (constraints.min !== undefined && value < constraints.min) {
        errors.push(`Parameter "${paramDef.name}" must be at least ${constraints.min}`);
      }
      if (constraints.max !== undefined && value > constraints.max) {
        errors.push(`Parameter "${paramDef.name}" must be at most ${constraints.max}`);
      }
    }

    if (paramDef.type === 'string' && constraints.pattern) {
      const regex = new RegExp(constraints.pattern);
      if (!regex.test(value)) {
        errors.push(`Parameter "${paramDef.name}" does not match required pattern`);
      }
    }

    return errors;
  }

  private extractPlaceholders(sqlTemplate: string): string[] {
    const placeholderRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(sqlTemplate)) !== null) {
      placeholders.push(match[1]);
    }

    return [...new Set(placeholders)];
  }

  private performTemplateRender(
    sqlTemplate: string,
    procedureName: string,
    parameters: Record<string, any>
  ): string {
    let rendered = sqlTemplate;

    // Replace procedureName
    rendered = rendered.replace(/\{\{procedureName\}\}/g, procedureName);

    // Replace other parameters
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    }

    return rendered;
  }
}