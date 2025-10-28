import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import { ActivitiesService } from '../../activities/activities.service';

@Controller('c/:slug/activities')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(
    @Request() req: { workspace: any; user: any },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.activitiesService.findByWorkspaceAndOwner(
      req.workspace.id,
      req.user.id,
      pageNum,
      limitNum
    );
  }
}
