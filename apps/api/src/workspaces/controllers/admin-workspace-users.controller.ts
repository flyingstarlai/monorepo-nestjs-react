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
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../../auth/guards/platform-admin.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspacesService } from '../workspaces.service';
import { UsersService } from '../../users/users.service';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityType } from '../../activities/entities/activity.entity';
import { User } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../entities/workspace-member.entity';
import {
  AddWorkspaceMemberDto,
  UpdateWorkspaceMemberRoleDto,
  ReplaceWorkspaceOwnerDto,
} from '../dto/workspace.dto';

interface CreateUserData {
  username: string;
  name?: string;
  role?: WorkspaceRole;
}

interface UpdateRoleData {
  role: WorkspaceRole;
}



@Controller('admin/c/:slug/users')
@UseGuards(JwtAuthGuard, PlatformAdminGuard, WorkspaceResolverGuard)
export class AdminWorkspaceUsersController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService
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
  async addMember(
    @Request() req: { workspace: any; user: User },
    @Body() data: AddWorkspaceMemberDto
  ) {
    const { username, name, role = 'MEMBER' } = data;

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
      role as WorkspaceRole
    );

    // Record member addition activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.MEMBER_ADDED,
      `Added ${user.username} to workspace as ${membership.role}`,
      req.workspace.id,
      {
        workspaceId: req.workspace.id,
        workspaceName: req.workspace.name,
        memberId: user.id,
        memberUsername: user.username,
        memberName: user.name,
        role: membership.role,
        actorId: req.user.id,
      }
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
  async toggleMemberStatus(
    @Request() req: { workspace: any; user: User },
    @Param('id') memberId: string
  ) {
    // Platform admins can deactivate any member, including the last owner
    // But if deactivating the last owner, they must provide a replacement
    const membership = await this.workspacesService.getMember(
      req.workspace.id,
      memberId
    );

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    const isLastOwner = await this.workspacesService.isLastOwner(
      req.workspace.id,
      memberId
    );

    if (isLastOwner && membership.isActive) {
      throw new BadRequestException(
        'Cannot deactivate the last owner. Use PUT /admin/c/:slug/users/replace-owner to replace the owner first.'
      );
    }

    const updatedMembership = await this.workspacesService.toggleMemberStatus(
      req.workspace.id,
      memberId
    );

    // Record member status change activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.MEMBER_STATUS_CHANGED,
      `${updatedMembership.isActive ? 'Activated' : 'Deactivated'} ${updatedMembership.user.username} in workspace`,
      req.workspace.id,
      {
        workspaceId: req.workspace.id,
        workspaceName: req.workspace.name,
        memberId: updatedMembership.user.id,
        memberUsername: updatedMembership.user.username,
        memberName: updatedMembership.user.name,
        oldStatus: !updatedMembership.isActive,
        newStatus: updatedMembership.isActive,
        actorId: req.user.id,
      }
    );

    return {
      id: updatedMembership.user.id,
      username: updatedMembership.user.username,
      isActive: updatedMembership.isActive,
    };
  }

  @Patch(':id/role')
  async updateMemberRole(
    @Request() req: { workspace: any; user: User },
    @Param('id') memberId: string,
    @Body() data: UpdateWorkspaceMemberRoleDto
  ) {
    const { role } = data;

    const currentMembership = await this.workspacesService.getMember(
      req.workspace.id,
      memberId
    );

    if (!currentMembership) {
      throw new NotFoundException('Member not found');
    }

    // Platform admins can change any role, including removing the last owner
    // But if changing the last owner away from Owner, they must provide a replacement
    const isLastOwner = await this.workspacesService.isLastOwner(
      req.workspace.id,
      memberId
    );

    if (isLastOwner && role !== 'OWNER') {
      throw new BadRequestException(
        'Cannot change role of the last owner. Use PUT /admin/c/:slug/users/replace-owner to replace the owner first.'
      );
    }

    const updatedMembership = await this.workspacesService.updateMemberRole(
      req.workspace.id,
      memberId,
      role as WorkspaceRole
    );

    // Record member role change activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.MEMBER_ROLE_CHANGED,
      `Changed ${updatedMembership.user.username}'s role from ${currentMembership.role} to ${updatedMembership.role}`,
      req.workspace.id,
      {
        workspaceId: req.workspace.id,
        workspaceName: req.workspace.name,
        memberId: updatedMembership.user.id,
        memberUsername: updatedMembership.user.username,
        memberName: updatedMembership.user.name,
        oldRole: currentMembership.role,
        newRole: updatedMembership.role,
        actorId: req.user.id,
      }
    );

    return {
      id: updatedMembership.user.id,
      username: updatedMembership.user.username,
      role: updatedMembership.role,
    };
  }

  @Post('replace-owner')
  async replaceOwner(
    @Request() req: { workspace: any; user: User },
    @Body() data: ReplaceWorkspaceOwnerDto
  ) {
    const { newOwnerId } = data;

    // Verify the new owner exists and is an active member
    const newOwnerMembership = await this.workspacesService.getMember(
      req.workspace.id,
      newOwnerId
    );

    if (!newOwnerMembership) {
      throw new NotFoundException('New owner is not a member of this workspace');
    }

    if (!newOwnerMembership.isActive) {
      throw new BadRequestException('New owner must be an active member');
    }

    // Find current owners
    const currentOwners = await this.workspacesService.getWorkspaceMembers(
      req.workspace.id
    ).then(members => members.filter(m => m.role === WorkspaceRole.OWNER && m.isActive));

    if (currentOwners.length === 0) {
      throw new BadRequestException('No active owners found in this workspace');
    }

    // Promote new owner
    await this.workspacesService.updateMemberRole(
      req.workspace.id,
      newOwnerId,
      WorkspaceRole.OWNER
    );

    // Demote all other owners to Author (if there are multiple)
    for (const owner of currentOwners) {
      if (owner.user.id !== newOwnerId) {
        await this.workspacesService.updateMemberRole(
          req.workspace.id,
          owner.user.id,
          WorkspaceRole.AUTHOR
        );
      }
    }

    // Record owner replacement activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.MEMBER_ROLE_CHANGED,
      `Replaced workspace owner: ${newOwnerMembership.user.username} is now the owner`,
      req.workspace.id,
      {
        workspaceId: req.workspace.id,
        workspaceName: req.workspace.name,
        newOwnerId: newOwnerMembership.user.id,
        newOwnerUsername: newOwnerMembership.user.username,
        newOwnerName: newOwnerMembership.user.name,
        previousOwners: currentOwners.map(owner => ({
          id: owner.user.id,
          username: owner.user.username,
          name: owner.user.name,
        })),
        actorId: req.user.id,
      }
    );

    return {
      message: 'Owner replacement completed successfully',
      newOwner: {
        id: newOwnerMembership.user.id,
        username: newOwnerMembership.user.username,
        role: WorkspaceRole.OWNER,
      },
    };
  }

  @Delete(':id')
  async removeMember(
    @Request() req: { workspace: any; user: User },
    @Param('id') memberId: string
  ) {
    const membership = await this.workspacesService.getMember(
      req.workspace.id,
      memberId
    );

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    const isLastOwner = await this.workspacesService.isLastOwner(
      req.workspace.id,
      memberId
    );

    if (isLastOwner) {
      throw new BadRequestException(
        'Cannot remove the last owner. Use PUT /admin/c/:slug/users/replace-owner to replace the owner first.'
      );
    }

    // Deactivate the member (soft delete)
    await this.workspacesService.setMemberActive(
      req.workspace.id,
      memberId,
      false
    );

    // Record member removal activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.MEMBER_REMOVED,
      `Removed ${membership.user.username} from workspace`,
      req.workspace.id,
      {
        workspaceId: req.workspace.id,
        workspaceName: req.workspace.name,
        memberId: membership.user.id,
        memberUsername: membership.user.username,
        memberName: membership.user.name,
        memberRole: membership.role,
        actorId: req.user.id,
      }
    );

    return {
      message: 'Member removed successfully',
      id: membership.user.id,
      username: membership.user.username,
    };
  }
}