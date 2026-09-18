import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { IntegrationId, UserId, WorkspaceId } from '@kodem/contracts';
import { ConnectionService } from '@kodem/platform/connections';
import { verifyGoogleOAuthState } from '@kodem/integrations';

@Controller('connections/oauth')
export class ConnectionsOAuthController {
  private readonly connections = new ConnectionService();

  @Get('google/:integrationId/callback')
  async googleIntegrationCallback(
    @Param('integrationId') integrationIdParam: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    return this.handleGoogleCallback({
      code,
      state,
      error,
      res,
      expectedIntegrationId: integrationIdParam as IntegrationId,
    });
  }

  /** @deprecated Prefer /google/:integrationId/callback per OAuth client. */
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    return this.handleGoogleCallback({ code, state, error, res });
  }

  private async handleGoogleCallback(input: {
    code: string | undefined;
    state: string | undefined;
    error: string | undefined;
    res: Response;
    expectedIntegrationId?: IntegrationId;
  }) {
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    const successRedirect = `${appUrl}/workspace/integrations/connections`;

    if (input.error) {
      return input.res.redirect(
        `${successRedirect}?error=${encodeURIComponent(input.error)}`,
      );
    }
    if (!input.code || !input.state) {
      throw new BadRequestException('Missing code or state');
    }

    const parsed = verifyGoogleOAuthState(input.state);
    if (!parsed) {
      return input.res.redirect(
        `${successRedirect}?error=${encodeURIComponent('invalid_state')}`,
      );
    }

    if (
      input.expectedIntegrationId &&
      parsed.integrationId !== input.expectedIntegrationId
    ) {
      return input.res.redirect(
        `${successRedirect}?error=${encodeURIComponent('integration_mismatch')}`,
      );
    }

    try {
      const result = await this.connections.completeOAuth(
        parsed.workspaceId as WorkspaceId,
        parsed.integrationId,
        parsed.userId as UserId,
        input.code,
      );
      if (!result.success) {
        return input.res.redirect(
          `${successRedirect}?error=${encodeURIComponent(result.message ?? 'connect_failed')}`,
        );
      }
      return input.res.redirect(
        `${successRedirect}?connected=${encodeURIComponent(parsed.integrationId)}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'connect_failed';
      return input.res.redirect(
        `${successRedirect}?error=${encodeURIComponent(message)}`,
      );
    }
  }
}
