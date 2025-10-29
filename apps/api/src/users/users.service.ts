import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { WorkspaceRole } from '../workspaces/entities/workspace-member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @Inject(forwardRef(() => WorkspacesService))
    private workspacesService: WorkspacesService
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.findOne(id);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username },
      relations: ['role'],
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, userData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async removeAllUsers(): Promise<void> {
    await this.usersRepository.clear();
  }

  async updateAvatar(id: string, avatarData: string): Promise<User> {
    await this.usersRepository.update(id, { avatar: avatarData });
    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async updateProfile(
    id: string,
    profileData: { name?: string; username?: string }
  ): Promise<User> {
    await this.usersRepository.update(id, profileData);
    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const role = this.rolesRepository.create(roleData);
    return await this.rolesRepository.save(role);
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({ where: { name } });
  }

  async findAllRoles(): Promise<Role[]> {
    return await this.rolesRepository.find();
  }

  async setActive(userId: string, isActive: boolean): Promise<User | null> {
    await this.usersRepository.update(userId, { isActive });
    return this.findOne(userId);
  }

  async setRole(userId: string, roleName: string): Promise<User | null> {
    const role = await this.findRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }
    await this.usersRepository.update(userId, { roleId: role.id });
    return this.findOne(userId);
  }

  async countActiveAdmins(): Promise<number> {
    const adminRole = await this.findRoleByName('Admin');
    if (!adminRole) {
      return 0;
    }

    return this.usersRepository.count({
      where: {
        role: { id: adminRole.id },
        isActive: true,
      },
    });
  }

  async createUserWithRole(userData: {
    username: string;
    name: string;
    password: string;
    roleName: string;
    workspaceId?: string;
    workspaceRole?: string;
  }): Promise<User> {
    const { username, name, password, roleName, workspaceId, workspaceRole } = userData;

    // Check if username already exists
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Find role
    const role = await this.findRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = this.usersRepository.create({
      username,
      name,
      password: hashedPassword,
      role,
      isActive: true,
    });

    const createdUser = await this.usersRepository.save(user);

    // Handle workspace assignment
    if (workspaceId && workspaceRole) {
      try {
        await this.workspacesService.addOrUpdateMember(
          workspaceId,
          createdUser.id,
          workspaceRole as WorkspaceRole
        );
      } catch (error) {
        // If workspace assignment fails, we don't want to roll back user creation
        // Log the error but continue with user creation
        console.error(`Failed to assign user to workspace: ${error}`);
      }
    } else if (!workspaceId && workspaceRole) {
      // Attempt default workspace assignment
      await this.assignDefaultWorkspace(createdUser.id, workspaceRole as WorkspaceRole);
    }

    return createdUser;
  }

  private async assignDefaultWorkspace(userId: string, role: WorkspaceRole): Promise<void> {
    const defaultWorkspaceSlug = process.env.DEFAULT_WORKSPACE_SLUG;
    if (!defaultWorkspaceSlug) {
      return; // No default workspace configured, skip assignment
    }

    try {
      const defaultWorkspace = await this.workspacesService.findBySlug(defaultWorkspaceSlug);
      if (defaultWorkspace && defaultWorkspace.isActive) {
        await this.workspacesService.addOrUpdateMember(
          defaultWorkspace.id,
          userId,
          role
        );
      }
    } catch (error) {
      // Default workspace assignment is optional, don't fail user creation
      console.error(`Failed to assign default workspace: ${error}`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return await bcrypt.hash(password, 10);
  }

  async seedRoles(): Promise<void> {
    const adminRole = await this.findRoleByName('Admin');
    if (!adminRole) {
      await this.createRole({
        name: 'Admin',
        description: 'Administrator with full access',
      });
    }

    const userRole = await this.findRoleByName('User');
    if (!userRole) {
      await this.createRole({
        name: 'User',
        description: 'Regular user with limited access',
      });
    }
  }

  async setLastActiveWorkspace(userId: string, workspaceId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastActiveWorkspaceId: workspaceId,
      lastActiveWorkspaceAt: new Date(),
    });
  }

  async clearLastActiveWorkspace(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastActiveWorkspaceId: null,
      lastActiveWorkspaceAt: null,
    });
  }

  async getActiveWorkspaceSlug(userId: string): Promise<string | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['lastActiveWorkspace'],
    });

    if (!user || !user.lastActiveWorkspaceId) {
      return null;
    }

    // Verify the workspace exists and is active
    if (!user.lastActiveWorkspace || !user.lastActiveWorkspace.isActive) {
      // Clear invalid last active workspace
      await this.clearLastActiveWorkspace(userId);
      return null;
    }

    // Verify user is still an active member of this workspace
    const membership = await this.workspacesService.getMember(
      user.lastActiveWorkspaceId,
      userId
    );

    if (!membership || !membership.isActive) {
      // Clear invalid membership
      await this.clearLastActiveWorkspace(userId);
      return null;
    }

    return user.lastActiveWorkspace.slug;
  }

  async getFallbackWorkspaceSlug(userId: string): Promise<string | null> {
    const memberships = await this.workspacesService.findMembershipsByUser(userId);
    const activeMemberships = memberships.filter(m => m.isActive && m.workspace.isActive);

    if (activeMemberships.length === 0) {
      return null;
    }

    // Prefer DEFAULT_WORKSPACE_SLUG if user is a member
    const defaultSlug = process.env.DEFAULT_WORKSPACE_SLUG;
    if (defaultSlug) {
      const defaultMembership = activeMemberships.find(m => m.workspace.slug === defaultSlug);
      if (defaultMembership) {
        return defaultMembership.workspace.slug;
      }
    }

    // Otherwise, select by earliest joinedAt
    const sortedMemberships = activeMemberships.sort((a, b) => 
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    );

    return sortedMemberships[0].workspace.slug;
  }
}
