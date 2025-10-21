import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SeedsService } from './seeds.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuthModule],
  providers: [SeedsService, UsersService],
})
export class SeedsModule {}
