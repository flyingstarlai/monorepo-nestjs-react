import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
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
      const adminPassword = await this.authService.hashPassword('admin');
      const adminUser = await this.usersService.create({
        username: 'admin',
        name: 'Admin User',
        password: adminPassword,
        role: adminRole,
        isActive: true,
      });

      // Create regular user
      const userPassword = await this.authService.hashPassword('user');
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
