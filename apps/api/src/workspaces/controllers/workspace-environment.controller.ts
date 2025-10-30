import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { WorkspaceResolverGuard } from '../guards/workspace-resolver.guard';
import { WorkspaceMembershipGuard } from '../guards/workspace-membership.guard';
import {
  EnvironmentEditGuard,
  RequireEnvironmentEdit,
} from '../guards/environment-edit.guard';
import {
  EnvironmentService,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  TestConnectionDto,
} from '../environment.service';

@Controller('c/:slug/environment')
@UseGuards(JwtAuthGuard, WorkspaceResolverGuard, WorkspaceMembershipGuard)
export class WorkspaceEnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get()
  async getEnvironment(@Request() req: { workspace: any; user: any }) {
    try {
      console.log('Finding environment for workspace:', req.workspace.id);
      const environment = await this.environmentService.findByWorkspace(
        req.workspace.id
      );
      console.log('Found environment:', environment);

      if (!environment) {
        return { environment: null };
      }

      // Don't expose password in response
      const { password, ...environmentWithoutPassword } = environment;

      return { environment: environmentWithoutPassword };
    } catch (error) {
      console.error('Error in getEnvironment:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(EnvironmentEditGuard)
  @RequireEnvironmentEdit()
  async createEnvironment(
    @Request() req: { workspace: any; user: any },
    @Body() createEnvironmentDto: CreateEnvironmentDto
  ) {
    const environment = await this.environmentService.createEnvironment(
      req.workspace.id,
      createEnvironmentDto,
      req.user.id as string
    );

    // Don't expose password in response
    const { password, ...environmentWithoutPassword } = environment;

    return { environment: environmentWithoutPassword };
  }

  @Put()
  @UseGuards(EnvironmentEditGuard)
  @RequireEnvironmentEdit()
  async updateEnvironment(
    @Request() req: { workspace: any; user: any },
    @Body() updateEnvironmentDto: UpdateEnvironmentDto
  ) {
    const environment = await this.environmentService.updateEnvironment(
      req.workspace.id,
      updateEnvironmentDto,
      req.user.id as string
    );

    // Don't expose password in response
    const { password, ...environmentWithoutPassword } = environment;

    return { environment: environmentWithoutPassword };
  }

  @Delete()
  @UseGuards(EnvironmentEditGuard)
  @RequireEnvironmentEdit()
  async deleteEnvironment(@Request() req: { workspace: any; user: any }) {
    await this.environmentService.deleteEnvironment(
      req.workspace.id,
      req.user.id as string
    );

    return { message: 'Environment configuration deleted successfully' };
  }

  @Post('test')
  @UseGuards(EnvironmentEditGuard)
  @RequireEnvironmentEdit()
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Request() req: { workspace: any; user: any },
    @Body() testConnectionDto: TestConnectionDto
  ) {
    const result = await this.environmentService.testConnection(
      req.workspace.id,
      testConnectionDto,
      req.user.id as string
    );

    return result;
  }
}
