import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import { User } from '../../users/entities/user.entity';

@Controller('c/:slug/auth')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceAuthController {
  @Get('profile')
  getProfile(@Request() req: { user: User; membership: any }) {
    const { user, membership } = req;

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
