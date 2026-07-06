import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceSetupService } from '@kodem/platform/workspace';
import type { AdvanceSetupInput } from '@kodem/contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';

@Controller('workspace/setup')
export class WorkspaceSetupController {
  private readonly setupService = new WorkspaceSetupService();

  @Get()
  @UseGuards(JwtAuthGuard)
  async getState(@CurrentContext() context: PlatformContext) {
    return this.setupService.getState(context.workspace.id);
  }

  @Post('step')
  @UseGuards(JwtAuthGuard)
  async advanceStep(
    @CurrentContext() context: PlatformContext,
    @Body() body: AdvanceSetupInput,
  ) {
    if (!body.step) {
      throw new BadRequestException('step is required');
    }

    try {
      return await this.setupService.advanceStep(context.workspace.id, body);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to save step',
      );
    }
  }

  @Post('discover')
  @UseGuards(JwtAuthGuard)
  async discover(
    @CurrentContext() context: PlatformContext,
    @Body() body: { websiteUrl: string },
  ) {
    if (!body.websiteUrl?.trim()) {
      throw new BadRequestException('websiteUrl is required');
    }

    try {
      return await this.setupService.discoverWebsite(
        context.workspace.id,
        body.websiteUrl,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Discovery failed',
      );
    }
  }

  @Post('prepare')
  @UseGuards(JwtAuthGuard)
  async prepare(@CurrentContext() context: PlatformContext) {
    try {
      return await this.setupService.runPreparation(context.workspace.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Preparation failed',
      );
    }
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  async complete(@CurrentContext() context: PlatformContext) {
    try {
      return await this.setupService.complete(context.workspace.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to complete setup',
      );
    }
  }
}
