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
import type { PlatformContext } from '@kodem/contracts';

@Controller('workspace')
export class PlatformWorkspaceController {
  private readonly workspaceService = new WorkspaceService();

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async current(@CurrentContext() context: PlatformContext) {
    return {
      workspace: context.workspace,
      role: context.role,
      membership: context.membership,
    };
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
