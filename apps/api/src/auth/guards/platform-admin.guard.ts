import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '../../users/entities/role.entity';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has Admin role type
    // Handle both string role and object role formats
    const userRole =
      typeof user.role === 'string' ? user.role : user.role?.name;
    if (userRole !== RoleType.ADMIN) {
      throw new ForbiddenException('Platform admin access required');
    }

    return true;
  }
}
