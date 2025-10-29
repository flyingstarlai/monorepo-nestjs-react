import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { Environment } from './entities/environment.entity';
import { WorkspacesService } from './workspaces.service';
import { EnvironmentService } from './environment.service';
import { WorkspaceConnectionManager } from './connection-manager.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceAuthController } from './controllers/workspace-auth.controller';
import { WorkspaceUsersController } from './controllers/workspace-users.controller';
import { WorkspaceActivitiesController } from './controllers/workspace-activities.controller';
import { AdminWorkspaceUsersController } from './controllers/admin-workspace-users.controller';
import { AdminWorkspaceController, AdminWorkspacesListController } from './controllers/admin-workspace.controller';
import { WorkspaceEnvironmentController } from './controllers/workspace-environment.controller';
import { WorkspaceResolverGuard } from './guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from './guards/workspace-membership.guard';
import { WorkspaceRolesGuard } from './guards/workspace-roles.guard';
import { EnvironmentEditGuard } from './guards/environment-edit.guard';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, Environment]), forwardRef(() => UsersModule), ActivitiesModule],
  controllers: [
    WorkspacesController,
    WorkspaceAuthController,
    WorkspaceUsersController,
    WorkspaceActivitiesController,
    AdminWorkspaceUsersController,
    AdminWorkspaceController,
    AdminWorkspacesListController,
    WorkspaceEnvironmentController,
  ],
  providers: [
    WorkspacesService,
    EnvironmentService,
    WorkspaceConnectionManager,
    WorkspaceResolverGuard,
    WorkspaceMembershipGuard,
    WorkspaceRolesGuard,
    EnvironmentEditGuard,
  ],
  exports: [
    WorkspacesService,
    EnvironmentService,
    WorkspaceConnectionManager,
    WorkspaceResolverGuard,
    WorkspaceMembershipGuard,
    WorkspaceRolesGuard,
    EnvironmentEditGuard,
  ],
})
export class WorkspacesModule {}
