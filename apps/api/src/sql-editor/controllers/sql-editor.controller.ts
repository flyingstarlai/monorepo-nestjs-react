import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../../workspaces/guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../../workspaces/guards/workspace-membership.guard';
import { User } from '../../users/entities/user.entity';
import { SqlEditorService } from '../services/sql-editor.service';
import { 
  CreateStoredProcedureDto, 
  UpdateStoredProcedureDto, 
  StoredProcedureResponseDto,
  ProcedureExecutionResponseDto,
  ValidationResultDto,
  PublishProcedureResponseDto
} from '../dto/stored-procedure.dto';
import { PublishService } from '../services/publish.service';
import { ExecutionService, ExecuteProcedureDto } from '../services/execution.service';
import { ValidationService } from '../services/validation.service';

@ApiTags('SQL Editor')
@Controller('c/:slug/sql-editor')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class SqlEditorController {
  constructor(
    private readonly sqlEditorService: SqlEditorService,
    private readonly publishService: PublishService,
    private readonly executionService: ExecutionService,
    private readonly validationService: ValidationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all stored procedures for workspace' })
  @ApiResponse({ status: 200, description: 'List of stored procedures', type: [StoredProcedureResponseDto] })
  async getProcedures(
    @Param('slug') slug: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { workspace } = req;
    const procedures = await this.sqlEditorService.getProceduresForWorkspace(workspace.id);
    return procedures;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get procedure statistics for workspace' })
  @ApiResponse({ status: 200, description: 'Procedure statistics' })
  async getStats(
    @Param('slug') slug: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { workspace } = req;
    return await this.sqlEditorService.getProcedureStats(workspace.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new stored procedure' })
  @ApiResponse({ status: 201, description: 'Procedure created successfully', type: StoredProcedureResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - procedure name already exists' })
  async createProcedure(
    @Param('slug') slug: string,
    @Body() createDto: CreateStoredProcedureDto,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    return await this.sqlEditorService.createProcedure(workspace.id, createDto, user.id);
  }

  @Get(':procedureId')
  @ApiOperation({ summary: 'Get a specific stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Procedure details', type: StoredProcedureResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  async getProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { workspace } = req;
    return await this.sqlEditorService.getProcedureById(procedureId, workspace.id);
  }

  @Put(':procedureId')
  @ApiOperation({ summary: 'Update a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Procedure updated successfully', type: StoredProcedureResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this procedure' })
  async updateProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Body() updateDto: UpdateStoredProcedureDto,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    return await this.sqlEditorService.updateProcedure(procedureId, workspace.id, updateDto, user.id);
  }

  @Delete(':procedureId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 204, description: 'Procedure deleted successfully' })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete this procedure' })
  async deleteProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    await this.sqlEditorService.deleteProcedure(procedureId, workspace.id, user.id);
  }

  @Post(':procedureId/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID to duplicate' })
  @ApiResponse({ status: 201, description: 'Procedure duplicated successfully', type: StoredProcedureResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - new name required' })
  async duplicateProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Body() body: { name: string },
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    
    if (!body.name || body.name.trim() === '') {
      throw new Error('New procedure name is required');
    }

    return await this.sqlEditorService.duplicateProcedure(
      procedureId, 
      workspace.id, 
      body.name.trim(), 
      user.id
    );
  }

  @Post(':procedureId/publish')
  @ApiOperation({ summary: 'Publish a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Procedure published successfully', type: PublishProcedureResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot publish draft' })
  async publishProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    
    try {
      const updatedProcedure = await this.publishService.publishProcedure(
        procedureId, 
        workspace.id, 
        user.id
      );
      
      return {
        success: true,
        procedure: updatedProcedure,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post(':procedureId/unpublish')
  @ApiOperation({ summary: 'Unpublish a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Procedure unpublished successfully', type: StoredProcedureResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - procedure is not published' })
  async unpublishProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    return await this.publishService.unpublishProcedure(procedureId, workspace.id, user.id);
  }

  @Post(':procedureId/execute')
  @ApiOperation({ summary: 'Execute a stored procedure' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Procedure executed successfully', type: ProcedureExecutionResponseDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot execute draft' })
  async executeProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Body() executeDto: ExecuteProcedureDto,
    @Request() req: { user: User; workspace: any }
  ) {
    const { user, workspace } = req;
    return await this.executionService.executeProcedure(
      procedureId, 
      workspace.id, 
      user.id, 
      executeDto
    );
  }

  @Post(':procedureId/validate')
  @ApiOperation({ summary: 'Validate a stored procedure draft' })
  @ApiParam({ name: 'procedureId', description: 'Procedure ID' })
  @ApiResponse({ status: 200, description: 'Validation result', type: ValidationResultDto })
  @ApiResponse({ status: 404, description: 'Procedure not found' })
  async validateProcedure(
    @Param('slug') slug: string,
    @Param('procedureId') procedureId: string,
    @Request() req: { user: User; workspace: any }
  ) {
    const { workspace } = req;
    return await this.validationService.validateDraft(procedureId, workspace.id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate SQL content without saving' })
  @ApiResponse({ status: 200, description: 'Validation result', type: ValidationResultDto })
  async validateSql(
    @Param('slug') slug: string,
    @Body() body: { sqlContent: string },
    @Request() req: { user: User; workspace: any }
  ) {
    const { workspace } = req;
    return await this.validationService.validateSqlContent(body.sqlContent, workspace.id);
  }
}