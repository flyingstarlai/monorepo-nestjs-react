import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../../auth/guards/platform-admin.guard';
import { ProcedureTemplateService } from '../services/procedure-template.service';
import {
  CreateProcedureTemplateDto,
  UpdateProcedureTemplateDto,
  RenderTemplateDto,
  ProcedureTemplateResponseDto,
  RenderTemplateResponseDto,
  TemplateValidationDto,
} from '../dto/procedure-template.dto';
import { ProcedureTemplate } from '../entities/procedure-template.entity';

@ApiTags('admin/templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Temporarily remove PlatformAdminGuard for debugging
@Controller('admin/templates')
export class ProcedureTemplateController {
  constructor(private readonly templateService: ProcedureTemplateService) {
    console.log('ProcedureTemplateController instantiated');
    console.log('TemplateService injected:', !!this.templateService);
  }

  @Get()
  @ApiOperation({ summary: 'Get all procedure templates' })
  @ApiResponse({
    status: 200,
    description: 'List of all procedure templates',
    type: [ProcedureTemplateResponseDto],
  })
  async getTemplates(): Promise<ProcedureTemplate[]> {
    try {
      return await this.templateService.getTemplates();
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific procedure template' })
  @ApiResponse({
    status: 200,
    description: 'Procedure template details',
    type: ProcedureTemplateResponseDto,
  })
  async getTemplate(@Param('id') id: string): Promise<ProcedureTemplate> {
    return this.templateService.getTemplateById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new procedure template' })
  @ApiResponse({
    status: 201,
    description: 'Procedure template created successfully',
    type: ProcedureTemplateResponseDto,
  })
  async createTemplate(
    @Body() createDto: CreateProcedureTemplateDto,
    @Request() req: any
  ): Promise<ProcedureTemplate> {
    return this.templateService.createTemplate(createDto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a procedure template' })
  @ApiResponse({
    status: 200,
    description: 'Procedure template updated successfully',
    type: ProcedureTemplateResponseDto,
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateProcedureTemplateDto,
    @Request() req: any
  ): Promise<ProcedureTemplate> {
    return this.templateService.updateTemplate(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a procedure template' })
  @ApiResponse({
    status: 204,
    description: 'Procedure template deleted successfully',
  })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    return this.templateService.deleteTemplate(id);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Render a template with parameters' })
  @ApiResponse({
    status: 200,
    description: 'Template rendered successfully',
    type: RenderTemplateResponseDto,
  })
  async renderTemplate(
    @Param('id') id: string,
    @Body() renderDto: RenderTemplateDto
  ): Promise<RenderTemplateResponseDto> {
    const result = await this.templateService.renderTemplate(id, renderDto);
    
    return {
      renderedSql: result.renderedSql,
      errors: result.validation.errors,
      warnings: result.validation.warnings,
    };
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate a template without saving' })
  @ApiResponse({
    status: 200,
    description: 'Template validation result',
    type: TemplateValidationDto,
  })
  async validateTemplate(
    @Param('id') id: string
  ): Promise<TemplateValidationDto> {
    const template = await this.templateService.getTemplateById(id);
    return this.templateService.validateTemplate(template.sqlTemplate, template.paramsSchema);
  }
}