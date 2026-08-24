import {
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

/** Google OAuth guard — redirects to login on failure instead of raw 401. */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  getAuthenticateOptions() {
    return { session: false };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const activated = (await super.canActivate(context)) as boolean;
      return activated;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[oauth] Google AuthGuard failed: ${message}`);

      const res = context.switchToHttp().getResponse<Response>();
      if (!res.headersSent) {
        const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
        res.redirect(`${appUrl}/login?error=oauth_failed`);
      }
      return false;
    }
  }
}
