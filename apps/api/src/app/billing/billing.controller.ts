import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { PlanId, PlatformContext } from '@kodem/contracts';
import { BillingService } from '@kodem/platform/billing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  private readonly billing = new BillingService();

  @Get()
  @RequirePermissions('workspace.billing.read')
  async snapshot(@CurrentContext() context: PlatformContext) {
    return this.billing.getSnapshot(context.workspace.id);
  }

  @Get('subscription')
  @RequirePermissions('workspace.billing.read')
  async subscription(@CurrentContext() context: PlatformContext) {
    const snapshot = await this.billing.getSnapshot(context.workspace.id);
    return { subscription: snapshot.subscription };
  }

  @Get('plans')
  @RequirePermissions('workspace.billing.read')
  plans() {
    return { plans: this.billing.getPlans() };
  }

  @Post('upgrade-intent')
  @RequirePermissions('workspace.billing.manage')
  async upgradeIntent(
    @CurrentContext() context: PlatformContext,
    @Body() body: { planId: PlanId },
  ) {
    if (!body.planId) {
      throw new BadRequestException('planId is required');
    }
    return this.billing.upgradeIntent(context.workspace.id, body.planId);
  }
}
