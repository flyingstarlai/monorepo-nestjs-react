import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import { WorkspaceRoles } from '../decorators/workspace-roles.decorator';
import { WorkspaceRolesGuard } from '../guards/workspace-roles.guard';
import { WorkspaceRole } from '../entities/workspace-member.entity';
import { WorkspacesService } from '../workspaces.service';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

interface CreateUserData {
  username: string;
  name?: string;
  role?: WorkspaceRole;
}

interface UpdateRoleData {
  role: WorkspaceRole;
}

@Controller('c/:slug/users')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceUsersController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async listMembers(@Request() req: { workspace: any }) {
    const members = await this.workspacesService.getWorkspaceMembers(
      req.workspace.id
    );

    return members.map((member) => ({
      id: member.user.id,
      username: member.user.username,
      name: member.user.name,
      avatar: member.user.avatar,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.joinedAt,
    }));
  }

  @Post()
  @WorkspaceRoles(WorkspaceRole.OWNER)
  async addMember(
    @Request() req: { workspace: any; user: User },
    @Body() data: CreateUserData
  ) {
    const { username, name, role = WorkspaceRole.MEMBER } = data;

    // Check if user exists
    let user = await this.usersService.findByUsername(username);

    if (!user) {
      // Create new user (admin-only user creation)
      const userRole = await this.usersService.findRoleByName('User');
      user = await this.usersService.create({
        username,
        name: name || username,
        role: userRole,
      });
    }

    // Add or update membership
    const membership = await this.workspacesService.addOrUpdateMember(
      req.workspace.id,
      user.id,
      role
    );

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      role: membership.role,
      isActive: membership.isActive,
      joinedAt: membership.joinedAt,
    };
  }

  @Patch(':id/status')
  @WorkspaceRoles(WorkspaceRole.OWNER)
  async toggleMemberStatus(
    @Request() req: { workspace: any; user: User },
    @Param('id') memberId: string
  ) {
    // Check if this is the last owner
    const isLastOwner = await this.workspacesService.isLastOwner(
      req.workspace.id,
      memberId
    );

    if (isLastOwner) {
      throw new ForbiddenException(
        'Cannot deactivate the last owner of the workspace'
      );
    }

    const membership = await this.workspacesService.toggleMemberStatus(
      req.workspace.id,
      memberId
    );

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    return {
      id: membership.user.id,
      username: membership.user.username,
      isActive: membership.isActive,
    };
  }

  @Patch(':id/role')
  @WorkspaceRoles(WorkspaceRole.OWNER)
  async updateMemberRole(
    @Request() req: { workspace: any; user: User },
    @Param('id') memberId: string,
    @Body() data: UpdateRoleData
  ) {
    const { role } = data;

    // Check if this would remove the last owner
    const currentMembership = await this.workspacesService.getMember(
      req.workspace.id,
      memberId
    );

    if (!currentMembership) {
      throw new NotFoundException('Member not found');
    }

    const isLastOwner = await this.workspacesService.isLastOwner(
      req.workspace.id,
      memberId
    );

    if (isLastOwner && role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change role of the last owner');
    }

    const updatedMembership = await this.workspacesService.updateMemberRole(
      req.workspace.id,
      memberId,
      role
    );

    return {
      id: updatedMembership.user.id,
      username: updatedMembership.user.username,
      role: updatedMembership.role,
    };
  }
}
