import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { SeedsService } from './seeds.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuthModule],
  providers: [SeedsService, UsersService],
})
export class SeedsModule {}
