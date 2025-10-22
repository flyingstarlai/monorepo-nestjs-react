import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SeedsService } from './seeds.service';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [SeedsService],
})
export class SeedsModule {}
