import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import { ActivitiesService } from '../../activities/activities.service';
import { ActivityScope } from '../../activities/entities/activity.entity';

@Controller('c/:slug/activities')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(
    @Request() req: { workspace: any; user: any },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string
  ) {
    return this.activitiesService.findByWorkspace(req.workspace.id, {
      limit,
      cursor,
    });
  }

  @Get('user')
  async getUserActivitiesInWorkspace(
    @Request() req: { workspace: any; user: any },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.activitiesService.findByWorkspaceAndOwner(
      req.workspace.id,
      req.user.id,
      ActivityScope.USER,
      pageNum,
      limitNum
    );
  }
}
