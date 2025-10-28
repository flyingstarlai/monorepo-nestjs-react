import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceRole } from '../workspaces/entities/workspace-member.entity';

@Injectable()
export class SeedsService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async onModuleInit() {
    // Ensure migrations have been applied before seeding
    await this.dataSource.runMigrations();
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
        const hashedPassword = await this.authService.hashPassword('admin');
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
        const hashedPassword = await this.authService.hashPassword('user');
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

    // Seed workspace memberships
    await this.seedWorkspaceMemberships();
    
    console.log('🎉 Database seeding completed!');
  }

  private async seedWorkspaceMemberships() {
    console.log('🏢 Seeding workspace memberships...');

    // Find default workspace 'twsbp'
    const defaultWorkspace = await this.workspacesService.findBySlug('twsbp');
    if (!defaultWorkspace) {
      console.log('❌ Default workspace "twsbp" not found');
      return;
    }

    // Find admin and regular users
    const adminUser = await this.usersService.findByUsername('admin');
    const regularUser = await this.usersService.findByUsername('user');

    // Add admin as Owner of default workspace
    if (adminUser) {
      const adminMembership = await this.workspacesService.getMember(
        defaultWorkspace.id,
        adminUser.id
      );
      
      if (!adminMembership) {
        await this.workspacesService.addOrUpdateMember(
          defaultWorkspace.id,
          adminUser.id,
          WorkspaceRole.OWNER
        );
        console.log('✅ Admin added as Owner to default workspace');
      } else {
        console.log('ℹ️ Admin already has membership in default workspace');
      }
    }

    // Add regular user as Member of default workspace
    if (regularUser) {
      const userMembership = await this.workspacesService.getMember(
        defaultWorkspace.id,
        regularUser.id
      );
      
      if (!userMembership) {
        await this.workspacesService.addOrUpdateMember(
          defaultWorkspace.id,
          regularUser.id,
          WorkspaceRole.MEMBER
        );
        console.log('✅ Regular user added as Member to default workspace');
      } else {
        console.log('ℹ️ Regular user already has membership in default workspace');
      }
    }

    console.log('✅ Workspace memberships seeded successfully');
  }
}
