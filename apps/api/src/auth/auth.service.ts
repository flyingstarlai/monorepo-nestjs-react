import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isActive) {
        throw new UnauthorizedException('User is disabled');
      }
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
    };

    // Compute active workspace slug
    let activeWorkspaceSlug: string | null = null;
    try {
      // Try to get last active workspace
      activeWorkspaceSlug = await this.usersService.getActiveWorkspaceSlug(user.id);
      
      // If no valid last active workspace, get fallback
      if (!activeWorkspaceSlug) {
        activeWorkspaceSlug = await this.usersService.getFallbackWorkspaceSlug(user.id);
      }
    } catch (error) {
      console.error('Error determining active workspace:', error);
      // Continue without active workspace slug on error
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role.name,
        avatar: user.avatar,
      },
      activeWorkspaceSlug,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
