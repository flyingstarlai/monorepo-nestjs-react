import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/entities/activity.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { CreateUserDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto';
import type { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.createUserWithRole(createUserDto);
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        throw new ConflictException('Username already exists');
      }
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => this.sanitizeUser(user));
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard)
  async getRoles() {
    const roles = await this.usersService.findAllRoles();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 2MB');
    }

    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Convert file to base64
    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const avatarData = `data:${mimeType};base64,${base64}`;

    const updatedUser = await this.usersService.updateAvatar(req.user.id, avatarData);

    // Record avatar update activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.AVATAR_UPDATED,
      'Avatar updated successfully'
    );

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role.name,
      avatar: updatedUser.avatar,
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: { name?: string; username?: string }
  ) {
    const updatedUser = await this.usersService.updateProfile(req.user.id, updateProfileDto);

    // Record profile update activity
    await this.activitiesService.record(
      req.user.id,
      ActivityType.PROFILE_UPDATED,
      'Profile updated successfully'
    );

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role.name,
      avatar: updatedUser.avatar,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @Request() req
  ) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Self-protection: cannot disable self
    if (req.user.id === id && !updateStatusDto.isActive) {
      throw new ForbiddenException('Cannot disable your own account');
    }

    // Last-admin protection
    if (user.role.name === 'Admin' && !updateStatusDto.isActive) {
      const activeAdminCount = await this.usersService.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new ForbiddenException('Cannot disable the last active admin');
      }
    }

    const updatedUser = await this.usersService.setActive(id, updateStatusDto.isActive);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(updatedUser);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req
  ) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Self-protection: cannot demote self from Admin
    if (req.user.id === id && user.role.name === 'Admin' && updateRoleDto.roleName !== 'Admin') {
      throw new ForbiddenException('Cannot demote your own admin role');
    }

    // Last-admin protection
    if (user.role.name === 'Admin' && updateRoleDto.roleName !== 'Admin') {
      const activeAdminCount = await this.usersService.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new ForbiddenException('Cannot remove the last active admin');
      }
    }

    const updatedUser = await this.usersService.setRole(id, updateRoleDto.roleName);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(updatedUser);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  private sanitizeUser(user: User) {
    const { password: _password, ...sanitized } = user;
    return {
      ...sanitized,
      role: user.role.name,
    };
  }
}
