import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { AuthService } from '../auth/auth.service';
import { RoleType } from '../users/entities/role.entity';
import type { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    await this.usersService.seedRoles();
  }

  private async seedAdminUser() {
    const adminUsername = 'admin';
    const existingAdmin = await this.usersService.findByUsername(adminUsername);

    if (!existingAdmin) {
      const adminRole = await this.usersService.findRoleByName(RoleType.ADMIN);
      if (adminRole) {
        const hashedPassword = await this.authService.hashPassword('nimda');
        await this.usersService.create({
          username: adminUsername,
          name: 'Admin User',
          password: hashedPassword,
          role: adminRole,
          roleId: adminRole.id,
        });
        console.log('Admin user created successfully');
      }
    }
  }
}
