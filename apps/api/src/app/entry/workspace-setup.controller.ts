import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceSetupService } from '@kodem/platform/workspace';
import { checkHostnameAvailable } from '@kodem/integrations';
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

  @Get('slug-availability')
  @UseGuards(JwtAuthGuard)
  async slugAvailability(
    @CurrentContext() context: PlatformContext,
    @Query('slug') slug?: string,
  ) {
    if (!slug?.trim()) {
      throw new BadRequestException('slug is required');
    }

    const db = await this.setupService.checkSlugAvailability(
      context.workspace.id,
      slug,
    );

    if (!db.available) {
      return { ...db, dnsChecked: false };
    }

    const dns = await checkHostnameAvailable(db.slug);
    if (dns.checked && !dns.available) {
      return {
        ...db,
        available: false,
        reason: 'taken_dns' as const,
        dnsChecked: true,
      };
    }

    return {
      ...db,
      dnsChecked: dns.checked,
    };
  }

  @Post('identity')
  @UseGuards(JwtAuthGuard)
  async saveIdentity(
    @CurrentContext() context: PlatformContext,
    @Body()
    body: { businessName?: string; workspaceName?: string; slug?: string },
  ) {
    if (
      !body.businessName?.trim() ||
      !body.workspaceName?.trim() ||
      !body.slug?.trim()
    ) {
      throw new BadRequestException(
        'businessName, workspaceName, and slug are required',
      );
    }

    const availability = await this.slugAvailability(context, body.slug);
    if (!availability.available) {
      throw new BadRequestException(
        availability.reason === 'invalid'
          ? 'Invalid subdomain'
          : `Subdomain unavailable: ${availability.hostname}`,
      );
    }

    try {
      return await this.setupService.saveIdentity(context.workspace.id, {
        businessName: body.businessName,
        workspaceName: body.workspaceName,
        slug: body.slug,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to save identity',
      );
    }
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

  @Post('restart-discovery')
  @UseGuards(JwtAuthGuard)
  async restartDiscovery(@CurrentContext() context: PlatformContext) {
    try {
      return await this.setupService.restartDiscovery(context.workspace.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to restart discovery',
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
