import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { AuthService } from '../auth/auth.service';
import type { UsersService } from '../users/users.service';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  async onModuleInit() {
    // Add a delay to ensure database is fully synchronized
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.seed();
  }

  async seed() {
    console.log('🌱 Starting database seeding...');

    // Seed roles
    await this.usersService.seedRoles();
    console.log('✅ Roles seeded successfully');

    // Create admin user
    const adminExists = await this.usersService.findByUsername('admin');
    if (!adminExists) {
      const adminRole = await this.usersService.findRoleByName('Admin');
      if (adminRole) {
        const hashedPassword = await this.authService.hashPassword('nimda');
        await this.usersService.create({
          username: 'admin',
          name: 'Admin User',
          password: hashedPassword,
          role: adminRole,
          isActive: true,
        });
        console.log('✅ Admin user created successfully');
      }
    }

    // Create regular user
    const userExists = await this.usersService.findByUsername('user');
    if (!userExists) {
      const userRole = await this.usersService.findRoleByName('User');
      if (userRole) {
        const hashedPassword = await this.authService.hashPassword('user123');
        await this.usersService.create({
          username: 'user',
          name: 'Regular User',
          password: hashedPassword,
          role: userRole,
          isActive: true,
        });
        console.log('✅ Regular user created successfully');
      }
    }

    console.log('🎉 Database seeding completed!');
  }
}
