import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivitiesResponseDto, ActivityDto } from './dto/activity.dto';
import {
  Activity,
  ActivityScope,
  ActivityType,
} from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>
  ) {}

  async record(
    ownerId: string,
    type: ActivityType,
    message: string,
    workspaceId?: string,
    metadata?: Record<string, any>,
    scope?: ActivityScope
  ): Promise<Activity> {
    // Infer scope from activity type if not provided
    const inferredScope = scope || this.inferScopeFromActivityType(type);

    const activity = this.activityRepository.create({
      ownerId,
      type,
      message,
      workspaceId,
      metadata,
      scope: inferredScope,
    });
    return await this.activityRepository.save(activity);
  }

  async findByOwner(
    ownerId: string,
    options: { limit?: number; cursor?: string } = {}
  ): Promise<ActivitiesResponseDto> {
    const limit = Math.min(options.limit ?? 20, 100);
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.ownerId = :ownerId', { ownerId })
      .andWhere('activity.scope = :scope', { scope: ActivityScope.USER })
      .orderBy('activity.createdAt', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .limit(limit + 1);

    if (options.cursor) {
      queryBuilder.andWhere(
        '(activity.createdAt < :cursor OR (activity.createdAt = :cursor AND activity.id < :cursorId))',
        { cursor: options.cursor, cursorId: options.cursor }
      );
    }

    const activities = await queryBuilder.getMany();

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, -1) : activities;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : undefined;

    return {
      items: items.map(this.toDto),
      nextCursor,
    };
  }

  async findByWorkspace(
    workspaceId: string,
    options: { limit?: number; cursor?: string } = {}
  ): Promise<ActivitiesResponseDto> {
    const limit = Math.min(options.limit ?? 20, 100);
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.workspaceId = :workspaceId', { workspaceId })
      .andWhere('activity.scope = :scope', { scope: ActivityScope.WORKSPACE })
      .orderBy('activity.createdAt', 'DESC')
      .addOrderBy('activity.id', 'DESC')
      .limit(limit + 1);

    if (options.cursor) {
      queryBuilder.andWhere(
        '(activity.createdAt < :cursor OR (activity.createdAt = :cursor AND activity.id < :cursorId))',
        { cursor: options.cursor, cursorId: options.cursor }
      );
    }

    const activities = await queryBuilder.getMany();

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, -1) : activities;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : undefined;

    return {
      items: items.map(this.toDto),
      nextCursor,
    };
  }

  async findByWorkspaceAndOwner(
    workspaceId: string,
    ownerId: string,
    scope: ActivityScope = ActivityScope.WORKSPACE,
    page: number = 1,
    limit: number = 20
  ): Promise<ActivitiesResponseDto> {
    const skip = (page - 1) * limit;

    const [activities, total] = await this.activityRepository.findAndCount({
      where: { workspaceId, ownerId, scope },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: activities.map(this.toDto),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private inferScopeFromActivityType(type: ActivityType): ActivityScope {
    const workspaceActivityTypes = [
      ActivityType.MEMBER_ADDED,
      ActivityType.MEMBER_REMOVED,
      ActivityType.MEMBER_ROLE_CHANGED,
      ActivityType.MEMBER_STATUS_CHANGED,
      ActivityType.WORKSPACE_CREATED,
      ActivityType.WORKSPACE_UPDATED,
      ActivityType.WORKSPACE_DEACTIVATED,
      ActivityType.WORKSPACE_ACTIVATED,
    ];

    return workspaceActivityTypes.includes(type)
      ? ActivityScope.WORKSPACE
      : ActivityScope.USER;
  }

  private toDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      type: activity.type,
      message: activity.message,
      createdAt: activity.createdAt.toISOString(),
    };
  }
}
