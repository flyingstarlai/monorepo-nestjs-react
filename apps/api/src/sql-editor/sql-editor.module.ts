import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredProcedure } from './entities/stored-procedure.entity';
import { StoredProcedureVersion } from './entities/stored-procedure-version.entity';
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
import { SyntaxCompileValidatorService } from './validators/syntax-compile-validator.service';
import { BestPracticesValidatorService } from './validators/best-practices-validator.service';
import { MssqlErrorParserService } from './validators/mssql-error-parser.service';
import { ProcedureNameRewriterService } from './validators/procedure-name-rewriter.service';
import { MssqlClientService } from './clients/mssql-client.service';
import { PublisherService } from './publishers/publisher.service';
import { VersionService } from './services/version.service';

const FEATURE_SQL_EDITOR = process.env.FEATURE_SQL_EDITOR === 'true';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoredProcedure, StoredProcedureVersion, Workspace, WorkspaceMember]),
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
    VersionService,
    // New pipeline components
    SyntaxCompileValidatorService,
    BestPracticesValidatorService,
    MssqlErrorParserService,
    ProcedureNameRewriterService,
    MssqlClientService,
    PublisherService,
  ],
  exports: [
    SqlEditorService,
    PublishService,
    ExecutionService,
    ValidationService,
    MssqlConnectionRegistry,
    VersionService,
    // New pipeline components
    SyntaxCompileValidatorService,
    BestPracticesValidatorService,
    MssqlErrorParserService,
    ProcedureNameRewriterService,
    MssqlClientService,
    PublisherService,
  ],
})
export class SqlEditorModule {
  static isFeatureEnabled(): boolean {
    return FEATURE_SQL_EDITOR;
  }
}
