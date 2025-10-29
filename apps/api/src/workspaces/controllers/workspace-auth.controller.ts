import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

@Controller('c/:slug/auth')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceAuthController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: { user: User; membership: any; workspace: any }) {
    const { user, membership, workspace } = req;

    // Set last active workspace when profile is accessed successfully
    try {
      await this.usersService.setLastActiveWorkspace(user.id, workspace.id);
    } catch (error) {
      console.error('Failed to set last active workspace:', error);
      // Continue without failing the request
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      globalRole: typeof user.role === 'string' ? user.role : user.role.name,
      workspaceRole: membership.role,
      workspaceId: membership.workspaceId,
      joinedAt: membership.joinedAt,
    };
  }
}
