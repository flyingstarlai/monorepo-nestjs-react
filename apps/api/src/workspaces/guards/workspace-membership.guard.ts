import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Workspace should already be resolved by WorkspaceResolverGuard
    const workspace = request.workspace;
    if (!workspace) {
      throw new ForbiddenException('Workspace not resolved');
    }

    // User should be authenticated by JwtAuthGuard
    const user: User = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is a platform admin (global role Admin)
    // Handle both string role and object role formats
    const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
    if (userRole === 'Admin') {
      // Platform admins can access any workspace
      // Still attach a membership record for consistency
      const membership = await this.workspaceMemberRepository.findOne({
        where: {
          workspaceId: workspace.id,
          userId: user.id,
          isActive: true,
        },
        relations: ['user', 'workspace'],
      });

      // If no explicit membership, create a virtual one for platform admin
      request.membership = membership || {
        id: 'virtual',
        workspaceId: workspace.id,
        userId: user.id,
        role: 'Admin' as any,
        isActive: true,
        joinedAt: new Date(),
        user,
        workspace,
      };

      return true;
    }

    // Find active membership for the user in this workspace
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId: workspace.id,
        userId: user.id,
        isActive: true,
      },
      relations: ['user', 'workspace'],
    });

    if (!membership) {
      throw new ForbiddenException(
        `You don't have access to workspace '${workspace.slug}'`
      );
    }

    // Attach membership to request for downstream use
    request.membership = membership;

    return true;
  }
}
