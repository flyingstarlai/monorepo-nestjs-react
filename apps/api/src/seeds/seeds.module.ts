import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SeedsService } from './seeds.service';

@Module({
  imports: [UsersModule, AuthModule, WorkspacesModule],
  providers: [SeedsService],
})
export class SeedsModule {}
