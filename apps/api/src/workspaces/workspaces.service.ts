import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from './entities/workspace-member.entity';

// Simple in-memory cache for member counts
class MemberCountCache {
  private cache = new Map<string, { count: number; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(workspaceId: string): number | null {
    const entry = this.cache.get(workspaceId);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(workspaceId);
      return null;
    }
    
    return entry.count;
  }

  set(workspaceId: string, count: number): void {
    this.cache.set(workspaceId, {
      count,
      timestamp: Date.now(),
    });
  }

  invalidate(workspaceId: string): void {
    this.cache.delete(workspaceId);
  }

  clear(): void {
    this.cache.clear();
  }
}

@Injectable()
export class WorkspacesService {
  private readonly memberCountCache = new MemberCountCache();

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>
  ) {}

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({
      where: { slug, isActive: true },
    });
  }

  async findMembershipsByUser(userId: string): Promise<WorkspaceMember[]> {
    return this.memberRepository.find({
      where: { userId, isActive: true },
      relations: ['workspace'],
    });
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      throw new Error('User is already a member of this workspace');
    }
    const member = this.memberRepository.create({
      workspaceId,
      userId,
      role,
      isActive: true,
    });
    const savedMember = await this.memberRepository.save(member);
    
    // Update member count
    await this.updateMemberCount(workspaceId);
    
    return savedMember;
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember | null> {
    await this.memberRepository.update({ workspaceId, userId }, { role });
    
    // Note: Member count doesn't change on role update, so no cache invalidation needed
    
    return this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['workspace', 'user'],
    });
  }

  async setMemberActive(
    workspaceId: string,
    userId: string,
    isActive: boolean
  ): Promise<WorkspaceMember | null> {
    await this.memberRepository.update({ workspaceId, userId }, { isActive });
    
    // Update member count since active status changed
    await this.updateMemberCount(workspaceId);
    
    return this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['workspace', 'user'],
    });
  }

  async countActiveOwners(workspaceId: string): Promise<number> {
    return this.memberRepository.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
        isActive: true,
      },
    });
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.memberRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['user', 'workspace'],
      order: { joinedAt: 'ASC' },
    });
  }

  async getMember(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMember | null> {
    return this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['user', 'workspace'],
    });
  }

  async addOrUpdateMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> {
    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (existing) {
      // Update existing membership
      const wasInactive = !existing.isActive;
      existing.role = role;
      existing.isActive = true;
      const savedMember = await this.memberRepository.save(existing);
      
      // Update member count if member was previously inactive
      if (wasInactive) {
        await this.updateMemberCount(workspaceId);
      }
      
      return savedMember;
    } else {
      // Create new membership
      const member = this.memberRepository.create({
        workspaceId,
        userId,
        role,
        isActive: true,
      });
      const savedMember = await this.memberRepository.save(member);
      
      // Update member count
      await this.updateMemberCount(workspaceId);
      
      return savedMember;
    }
  }

  async toggleMemberStatus(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMember | null> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['user', 'workspace'],
    });

    if (!member) {
      return null;
    }

    member.isActive = !member.isActive;
    const savedMember = await this.memberRepository.save(member);
    
    // Update member count since active status changed
    await this.updateMemberCount(workspaceId);
    
    return savedMember;
  }

  async isLastOwner(workspaceId: string, userId: string): Promise<boolean> {
    const activeOwnersCount = await this.memberRepository.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
        isActive: true,
      },
    });

    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    // If user is not an owner, they can't be the last owner
    if (!member || member.role !== WorkspaceRole.OWNER) {
      return false;
    }

    // If there's only one active owner and it's this user, they're the last owner
    return activeOwnersCount === 1;
  }

  async getMemberCount(workspaceId: string): Promise<number> {
    // Try cache first
    const cachedCount = this.memberCountCache.get(workspaceId);
    if (cachedCount !== null) {
      return cachedCount;
    }

    // Query database
    const count = await this.memberRepository.count({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    // Cache the result
    this.memberCountCache.set(workspaceId, count);
    
    return count;
  }

  async updateMemberCount(workspaceId: string): Promise<void> {
    // Invalidate cache and recalculate
    this.memberCountCache.invalidate(workspaceId);
    
    const count = await this.memberRepository.count({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    // Update workspace member_count field
    await this.workspaceRepository.update(workspaceId, {
      memberCount: count,
    });

    // Cache the new count
    this.memberCountCache.set(workspaceId, count);
  }

  async createWorkspace(data: {
    name: string;
    slug: string;
    creatorId?: string;
  }): Promise<Workspace> {
    const workspace = this.workspaceRepository.create(data);
    const savedWorkspace = await this.workspaceRepository.save(workspace);
    
    // If creatorId is provided, add them as an owner
    if (data.creatorId) {
      await this.addOrUpdateMember(
        savedWorkspace.id,
        data.creatorId,
        WorkspaceRole.OWNER
      );
      
      // Update member count
      await this.updateMemberCount(savedWorkspace.id);
    }
    
    return savedWorkspace;
  }

  async updateWorkspace(
    workspaceId: string,
    data: {
      name?: string;
      slug?: string;
      isActive?: boolean;
      updatedBy?: string;
    }
  ): Promise<Workspace> {
    await this.workspaceRepository.update(workspaceId, {
      ...data,
      updatedAt: new Date(),
    });
    
    const updatedWorkspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    
    if (!updatedWorkspace) {
      throw new Error('Workspace not found');
    }
    
    return updatedWorkspace;
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    // Soft delete by setting isActive to false
    await this.workspaceRepository.update(workspaceId, {
      isActive: false,
      updatedAt: new Date(),
    });
    
    // Also deactivate all memberships
    await this.memberRepository.update(
      { workspaceId },
      { isActive: false }
    );
    
    // Clear cache
    this.memberCountCache.invalidate(workspaceId);
  }

  async listWorkspaces(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    workspaces: Workspace[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive = true,
    } = params;

    const queryBuilder = this.workspaceRepository
      .createQueryBuilder('workspace')
      .where('workspace.isActive = :isActive', { isActive });

    if (search) {
      queryBuilder.andWhere(
        '(workspace.name ILIKE :search OR workspace.slug ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [workspaces, total] = await queryBuilder
      .orderBy('workspace.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkspaceStats(workspaceId: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    owners: number;
    authors: number;
    members: number;
    recentlyActive: number;
  }> {
    // Use a single optimized query with GROUP BY and CASE statements
    const stats = await this.memberRepository
      .createQueryBuilder('member')
      .leftJoin('member.user', 'user')
      .select('COUNT(*)', 'totalMembers')
      .addSelect('COUNT(CASE WHEN member.isActive = true THEN 1 END)', 'activeMembers')
      .addSelect('COUNT(CASE WHEN member.role = :owner AND member.isActive = true THEN 1 END)', 'owners')
      .addSelect('COUNT(CASE WHEN member.role = :author AND member.isActive = true THEN 1 END)', 'authors')
      .addSelect('COUNT(CASE WHEN member.role = :member AND member.isActive = true THEN 1 END)', 'members')
      .addSelect('COUNT(CASE WHEN member.isActive = true AND user.lastLoginAt >= :date THEN 1 END)', 'recentlyActive')
      .where('member.workspaceId = :workspaceId', { 
        workspaceId,
        owner: WorkspaceRole.OWNER,
        author: WorkspaceRole.AUTHOR,
        member: WorkspaceRole.MEMBER,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      })
      .getRawOne();

    return {
      totalMembers: parseInt(stats.totalMembers) || 0,
      activeMembers: parseInt(stats.activeMembers) || 0,
      owners: parseInt(stats.owners) || 0,
      authors: parseInt(stats.authors) || 0,
      members: parseInt(stats.members) || 0,
      recentlyActive: parseInt(stats.recentlyActive) || 0,
    };
  }
}
