import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

import { AppMetricsModule } from './modules/metrics/metrics.module';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import { WorkspaceLoggingInterceptor } from './interceptors/workspace-logging.interceptor';
import { databaseConfig } from './config/database.config';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { SeedsModule } from './seeds/seeds.module';
import { SqlEditorModule } from './sql-editor/sql-editor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig,
    }),
    AppMetricsModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    WorkspacesModule,
    SeedsModule,
    SqlEditorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: WorkspaceLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}
