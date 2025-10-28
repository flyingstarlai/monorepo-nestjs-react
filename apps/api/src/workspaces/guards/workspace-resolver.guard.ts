import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class WorkspaceResolverGuard implements CanActivate {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract slug from route parameters
    const slug = request.params.slug;
    if (!slug) {
      throw new BadRequestException('Workspace slug is required');
    }

    // Find workspace by slug
    const workspace = await this.workspaceRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug '${slug}' not found`);
    }

    // Attach workspace to request for downstream use
    request.workspace = workspace;

    return true;
  }
}
