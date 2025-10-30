import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredProcedure } from './entities/stored-procedure.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import { SqlEditorController } from './controllers/sql-editor.controller';
import { SqlEditorService } from './services/sql-editor.service';
import { PublishService } from './services/publish.service';
import { ExecutionService } from './services/execution.service';
import { ValidationService } from './services/validation.service';
import { MssqlConnectionRegistry } from './services/mssql-connection-registry.service';
import { ActivitiesModule } from '../activities/activities.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

const FEATURE_SQL_EDITOR = process.env.FEATURE_SQL_EDITOR === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoredProcedure, Workspace, WorkspaceMember]),
    ActivitiesModule,
    WorkspacesModule,
  ],
  controllers: FEATURE_SQL_EDITOR ? [SqlEditorController] : [],
  providers: [
    SqlEditorService,
    PublishService,
    ExecutionService,
    ValidationService,
    MssqlConnectionRegistry,
  ],
  exports: [
    SqlEditorService,
    PublishService,
    ExecutionService,
    ValidationService,
    MssqlConnectionRegistry,
  ],
})
export class SqlEditorModule {
  static isFeatureEnabled(): boolean {
    return FEATURE_SQL_EDITOR;
  }
}