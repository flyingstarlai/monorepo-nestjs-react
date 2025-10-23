import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export class LoginDto {
  username: string;
  password: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Record login success activity
    await this.activitiesService.record(
      user.id,
      ActivityType.LOGIN_SUCCESS,
      'Successfully logged in'
    );

    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  getAdminOnly() {
    return { message: 'Admin content' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    try {
      const user = await this.usersService.findById(req.user.id as string);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.authService.comparePasswords(
        changePasswordDto.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Check if new password is different from current
      const isSamePassword = await this.authService.comparePasswords(
        changePasswordDto.newPassword,
        user.password
      );

      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from current password'
        );
      }

      // Hash new password and update user
      const hashedNewPassword = await this.authService.hashPassword(
        changePasswordDto.newPassword
      );

      await this.usersService.update(user.id, {
        password: hashedNewPassword,
      });

      // Record password change activity
      await this.activitiesService.record(
        user.id,
        ActivityType.PASSWORD_CHANGED,
        'Password changed successfully'
      );

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to change password');
    }
  }

  @Post('reset')
  async resetUsers() {
    try {
      // Clear all existing users
      await this.usersService.removeAllUsers();
      console.log('🗑️ All existing users cleared');

      // Seed roles (handle existing roles)
      let adminRole = await this.usersService.findRoleByName('Admin');
      if (!adminRole) {
        adminRole = await this.usersService.createRole({
          name: 'Admin',
          description: 'Administrator with full access',
        });
      }

      let userRole = await this.usersService.findRoleByName('User');
      if (!userRole) {
        userRole = await this.usersService.createRole({
          name: 'User',
          description: 'Regular user with limited access',
        });
      }

      // Create admin user with new password
      const adminPassword = await this.authService.hashPassword('nimda');
      await this.usersService.create({
        username: 'admin',
        name: 'Admin User',
        password: adminPassword,
        role: adminRole,
        isActive: true,
      });

      // Create regular user with new password
      const userPassword = await this.authService.hashPassword('user123');
      await this.usersService.create({
        username: 'user',
        name: 'Regular User',
        password: userPassword,
        role: userRole,
        isActive: true,
      });

      return {
        message: 'Users reset successfully with new credentials',
        credentials: [
          { username: 'admin', password: 'nimda', role: 'Admin' },
          { username: 'user', password: 'user123', role: 'User' },
        ],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('seed')
  async seedUsers() {
    try {
      // Create roles
      const adminRole = await this.usersService.createRole({
        name: 'Admin',
        description: 'Administrator with full access',
      });

      const userRole = await this.usersService.createRole({
        name: 'User',
        description: 'Regular user with limited access',
      });

      // Create admin user
      const adminPassword = await this.authService.hashPassword('nimda');
      const adminUser = await this.usersService.create({
        username: 'admin',
        name: 'Admin User',
        password: adminPassword,
        role: adminRole,
        isActive: true,
      });

      // Create regular user
      const userPassword = await this.authService.hashPassword('user123');
      const regularUser = await this.usersService.create({
        username: 'user',
        name: 'Regular User',
        password: userPassword,
        role: userRole,
        isActive: true,
      });

      return {
        message: 'Users seeded successfully',
        users: [
          { username: adminUser.username, role: adminUser.role.name },
          { username: regularUser.username, role: regularUser.role.name },
        ],
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
