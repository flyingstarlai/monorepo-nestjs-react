import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '../entities/workspace-member.entity';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Get required roles from metadata
    const requiredRoles = this.reflector.get<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      context.getHandler()
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Membership should be resolved by WorkspaceMembershipGuard
    const membership = request.membership;
    if (!membership) {
      throw new ForbiddenException('Workspace membership not found');
    }

    // Check if user's role is in the required roles
    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Requires ${requiredRoles.join(' or ')} role in workspace`
      );
    }

    return true;
  }
}
