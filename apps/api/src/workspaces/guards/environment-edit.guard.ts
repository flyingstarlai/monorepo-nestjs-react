import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export const ENVIRONMENT_EDIT_KEY = 'environment_edit';
export const RequireEnvironmentEdit = () => SetMetadata(ENVIRONMENT_EDIT_KEY, true);

@Injectable()
export class EnvironmentEditGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isEnvironmentEditRequired = this.reflector.get<boolean>(
      ENVIRONMENT_EDIT_KEY,
      context.getHandler()
    );

    // If no environment edit requirement is set, allow access
    if (!isEnvironmentEditRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const membership = request.membership;

    if (!membership) {
      throw new ForbiddenException('Workspace membership not found');
    }

    // Check if user has required role (Owner or Author)
    const hasEditPermission = [
      WorkspaceRole.OWNER,
      WorkspaceRole.AUTHOR,
    ].includes(membership.role);

    if (!hasEditPermission) {
      throw new ForbiddenException('Only workspace owners and authors can edit environment configurations');
    }

    return true;
  }
}