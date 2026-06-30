import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import { ApiAuthService } from '../auth/auth.service';
import type { PlatformContext, WorkspaceId } from '@kodem/contracts';

@Controller('workspace')
export class PlatformWorkspaceController {
  private readonly workspaceService = new WorkspaceService();

  constructor(private readonly authService: ApiAuthService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async current(@CurrentContext() context: PlatformContext) {
    return {
      workspace: context.workspace,
      role: context.role,
      membership: context.membership,
    };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async list(@CurrentContext() context: PlatformContext) {
    const workspaces = await this.workspaceService.listForUser(context.user.id);
    return { workspaces };
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard)
  async switch(
    @CurrentContext() context: PlatformContext,
    @Body() body: { workspaceId: string },
  ) {
    if (!body.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    try {
      const resolved = await this.workspaceService.switchTo(
        context.user.id,
        body.workspaceId as WorkspaceId,
      );
      return this.authService.authService.issueAuthResult(
        context.user,
        resolved,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to switch workspace',
      );
    }
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: { name: string; slug?: string; websiteUrl?: string },
  ) {
    if (!body.name) {
      throw new BadRequestException('name is required');
    }

    try {
      const resolved = await this.workspaceService.createForOwner(
        context.user.id,
        body,
      );
      return {
        workspace: resolved.workspace,
        role: resolved.role,
        membership: resolved.membership,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create workspace',
      );
    }
  }
}
