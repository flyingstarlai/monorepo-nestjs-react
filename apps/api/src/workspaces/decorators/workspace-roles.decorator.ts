import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

/**
 * Decorator to specify required workspace roles for a route
 * @param roles Array of workspace roles that are allowed to access the route
 */
export const WorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
