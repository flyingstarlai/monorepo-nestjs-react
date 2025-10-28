import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../../auth/guards/platform-admin.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspacesService } from '../workspaces.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../entities/workspace-member.entity';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspacesDto,
  ReplaceWorkspaceOwnerDto,
} from '../dto/workspace.dto';

@Controller('admin/c/:slug')
@UseGuards(JwtAuthGuard, PlatformAdminGuard, WorkspaceResolverGuard)
export class AdminWorkspaceController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async getWorkspace(@Request() req: { workspace: any }) {
    const workspace = req.workspace;
    
    // Get member count
    const members = await this.workspacesService.getWorkspaceMembers(workspace.id);
    const activeMembers = members.filter(m => m.isActive);
    
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      isActive: workspace.isActive,
      memberCount: activeMembers.length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      createdBy: workspace.createdBy,
      updatedBy: workspace.updatedBy,
    };
  }

  @Patch()
  async updateWorkspace(
    @Request() req: { workspace: any; user: User },
    @Body() data: UpdateWorkspaceDto
  ) {
    const { name, isActive } = data;
    const workspaceId = req.workspace.id;
    const userId = req.user.id;

    // Validate that if deactivating, there are no active members
    if (isActive === false) {
      const activeMembers = await this.workspacesService.getWorkspaceMembers(workspaceId)
        .then(members => members.filter(m => m.isActive));
      
      if (activeMembers.length > 0) {
        throw new BadRequestException(
          'Cannot deactivate workspace with active members. Remove all members first.'
        );
      }
    }

    // Update workspace using service method
    return this.workspacesService.updateWorkspace(workspaceId, {
      name,
      isActive,
      updatedBy: userId,
    });
  }

  @Delete()
  async deleteWorkspace(@Request() req: { workspace: any; user: User }) {
    const workspaceId = req.workspace.id;

    // Check if there are any active members
    const activeMembers = await this.workspacesService.getWorkspaceMembers(workspaceId)
      .then(members => members.filter(m => m.isActive));
    
    if (activeMembers.length > 0) {
      throw new BadRequestException(
        'Cannot delete workspace with active members. Remove all members first.'
      );
    }

    // Soft delete using service method
    await this.workspacesService.deleteWorkspace(workspaceId);
    
    return {
      message: 'Workspace deleted successfully',
      id: workspaceId,
    };
  }

  @Get('stats')
  async getWorkspaceStats(@Request() req: { workspace: any }) {
    const workspaceId = req.workspace.id;
    
    // Use service method for stats
    return this.workspacesService.getWorkspaceStats(workspaceId);
  }
}

@Controller('admin/workspaces')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminWorkspacesListController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async listWorkspaces(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;

    return this.workspacesService.listWorkspaces({
      page: pageNum,
      limit: limitNum,
      search,
      isActive: isActiveBool,
    });
  }

  @Post()
  async createWorkspace(
    @Request() req: { user: User },
    @Body() data: CreateWorkspaceDto
  ) {
    const { name, slug } = data;
    const creatorId = req.user.id;

    // Check if workspace slug already exists
    const existingWorkspace = await this.workspacesService.findBySlug(slug);
    if (existingWorkspace) {
      throw new BadRequestException('Workspace slug already exists');
    }

    // Create workspace with creator as owner
    const workspace = await this.workspacesService.createWorkspace({
      name,
      slug,
      creatorId,
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      isActive: workspace.isActive,
      createdAt: workspace.createdAt,
      message: 'Workspace created successfully',
    };
  }
}