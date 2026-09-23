import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceSetupService } from '@kodem/platform/workspace';
import { checkHostnameAvailable } from '@kodem/integrations';
import type {
  AdvanceSetupInput,
  PlatformContext,
  WorkspaceId,
} from '@kodem/contracts';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import { ApiAuthService } from '../auth/auth.service';
import {
  setAccessCookie,
  setRefreshCookie,
} from '../auth/auth-cookies';

@Controller('workspace/setup')
export class WorkspaceSetupController {
  private readonly setupService = new WorkspaceSetupService();

  constructor(private readonly authService: ApiAuthService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getState(@CurrentContext() context: PlatformContext) {
    return this.setupService.getState(context.workspace.id);
  }

  /**
   * Public guest bootstrap from marketing hero.
   * Creates ephemeral user + workspace and returns a session JWT.
   */
  @Post('guest')
  async createGuest(
    @Body() body: { websiteUrl?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.websiteUrl?.trim()) {
      throw new BadRequestException('websiteUrl is required');
    }

    try {
      const guest = await this.setupService.createGuestSession(body.websiteUrl);
      const session = await this.authService.authService.issueSession(
        guest.user,
        {
          workspace: guest.workspace,
          membership: guest.membership,
          role: 'owner',
        },
      );
      setRefreshCookie(res, session.refreshToken);
      setAccessCookie(res, session.accessToken);
      const auth = this.authService.stripRefresh(session);
      return {
        ...auth,
        claimSecret: guest.claimSecret,
        setup: guest.setup,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to start guest setup',
      );
    }
  }

  @Get('guest/claim-secret')
  @UseGuards(JwtAuthGuard)
  async guestClaimSecret(@CurrentContext() context: PlatformContext) {
    try {
      return await this.setupService.getGuestClaimSecret(context.workspace.id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Not a guest workspace',
      );
    }
  }

  /**
   * Attach guest workspace to the authenticated (real) user after register/login.
   */
  @Post('guest/claim')
  @UseGuards(JwtAuthGuard)
  async claimGuest(
    @CurrentContext() context: PlatformContext,
    @Body() body: { workspaceId?: string; claimSecret?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.workspaceId?.trim() || !body.claimSecret?.trim()) {
      throw new BadRequestException('workspaceId and claimSecret are required');
    }

    try {
      const { workspace, membership } =
        await this.setupService.claimGuestWorkspace(context.user.id, {
          workspaceId: body.workspaceId as WorkspaceId,
          claimSecret: body.claimSecret,
        });

      const session = await this.authService.authService.issueSession(
        context.user,
        {
          workspace,
          membership,
          role: membership.role,
        },
      );
      setRefreshCookie(res, session.refreshToken);
      setAccessCookie(res, session.accessToken);
      return this.authService.stripRefresh(session);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to claim guest workspace',
      );
    }
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

  @Get('identity-suggest')
  @UseGuards(JwtAuthGuard)
  async identitySuggest(@CurrentContext() context: PlatformContext) {
    return this.setupService.suggestIdentityFromEmail(
      context.workspace.id,
      context.user.email,
    );
  }

  @Post('identity')
  @UseGuards(JwtAuthGuard)
  async saveIdentity(
    @CurrentContext() context: PlatformContext,
    @Body()
    body: {
      businessName?: string;
      workspaceName?: string;
      slug?: string;
      websiteUrl?: string;
    },
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
        websiteUrl: body.websiteUrl,
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
