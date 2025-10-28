import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceAuthController } from './controllers/workspace-auth.controller';
import { WorkspaceUsersController } from './controllers/workspace-users.controller';
import { WorkspaceActivitiesController } from './controllers/workspace-activities.controller';
import { AdminWorkspaceUsersController } from './controllers/admin-workspace-users.controller';
import { AdminWorkspaceController, AdminWorkspacesListController } from './controllers/admin-workspace.controller';
import { WorkspaceResolverGuard } from './guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from './guards/workspace-membership.guard';
import { WorkspaceRolesGuard } from './guards/workspace-roles.guard';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember]), forwardRef(() => UsersModule), ActivitiesModule],
  controllers: [
    WorkspacesController,
    WorkspaceAuthController,
    WorkspaceUsersController,
    WorkspaceActivitiesController,
    AdminWorkspaceUsersController,
    AdminWorkspaceController,
    AdminWorkspacesListController,
  ],
  providers: [
    WorkspacesService,
    WorkspaceResolverGuard,
    WorkspaceMembershipGuard,
    WorkspaceRolesGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceResolverGuard,
    WorkspaceMembershipGuard,
    WorkspaceRolesGuard,
  ],
})
export class WorkspacesModule {}
