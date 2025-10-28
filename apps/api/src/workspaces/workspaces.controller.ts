import {
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import {
  WorkspaceMember,
  WorkspaceRole,
} from './entities/workspace-member.entity';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async listUserWorkspaces(@Request() req) {
    const memberships = await this.workspacesService.findMembershipsByUser(
      req.user.id as string
    );
    return {
      items: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        isActive: m.isActive,
      })),
    };
  }

  @Post()
  async createWorkspace(
    @Body() body: { name: string; slug: string },
    @Request() req
  ) {
    // TODO: enforce platform admin only in a future iteration
    return this.workspacesService.createWorkspace({
      ...body,
      creatorId: req.user.id as string,
    });
  }
}
