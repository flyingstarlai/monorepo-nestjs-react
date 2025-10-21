import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({ relations: ['role'] });
  }

  async findOne(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id }, relations: ['role'] });
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
  }): Promise<User> {
    const { username, name, password, roleName } = userData;

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

    return this.usersRepository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
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
}
