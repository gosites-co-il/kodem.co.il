import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from '@kodem/platform/feature-flags';
import { EntitlementsService } from '@kodem/platform/subscription';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';

@Controller('feature-flags')
export class FeatureFlagsController {
  private readonly flags = new FeatureFlagsService();
  private readonly entitlements = new EntitlementsService();

  @Get('check')
  @UseGuards(JwtAuthGuard)
  async check(
    @CurrentContext() context: PlatformContext,
    @Query('key') key: string,
  ) {
    const entitlements = await this.entitlements.resolve(
      context.workspace.id,
    );
    const enabled = await this.flags.isEnabled(key ?? '', {
      workspaceId: context.workspace.id,
      planId: entitlements.planId,
      environment: process.env['FEATURE_FLAG_ENV'] ?? 'development',
    });
    return { key, enabled };
  }
}
