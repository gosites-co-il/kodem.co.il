import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { OAuthProfile } from '@kodem/contracts';
import { ApiAuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentContext } from './decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';
import {
  clearAccessCookie,
  clearRefreshCookie,
  readCookie,
  REFRESH_COOKIE,
  setAccessCookie,
  setRefreshCookie,
} from './auth-cookies';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: ApiAuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; name: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.name || !body.password) {
      throw new BadRequestException('email, name, and password are required');
    }
    try {
      const result = await this.authService.register(body);
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      return this.authService.stripRefresh(result);
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    try {
      const rateKey =
        req.ip ?? req.headers['x-forwarded-for']?.toString() ?? body.email;
      const result = await this.authService.login(body, rateKey);
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      return this.authService.stripRefresh(result);
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readCookie(req, REFRESH_COOKIE);
    if (!token) {
      throw new BadRequestException('Missing refresh token');
    }
    try {
      const result = await this.authService.refresh(token);
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      return this.authService.stripRefresh(result);
    } catch (error) {
      clearRefreshCookie(res);
      clearAccessCookie(res);
      this.authService.wrapError(error);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentContext() context: PlatformContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(context.user.id);
    clearRefreshCookie(res);
    clearAccessCookie(res);
    return { ok: true };
  }

  @Post('password-reset/request')
  async requestPasswordReset(
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    if (!body.email) {
      throw new BadRequestException('email is required');
    }
    const rateKey =
      req.ip ?? req.headers['x-forwarded-for']?.toString() ?? body.email;
    await this.authService.requestPasswordReset(body.email, rateKey);
    return { ok: true };
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(
    @Body() body: { token: string; password: string },
  ) {
    if (!body.token || !body.password) {
      throw new BadRequestException('token and password are required');
    }
    try {
      await this.authService.confirmPasswordReset(body.token, body.password);
      return { ok: true };
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    try {
      const user = await this.authService.verifyEmail(body.token);
      return { ok: true, emailVerified: Boolean(user.emailVerifiedAt) };
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Post('verify-email/resend')
  @UseGuards(JwtAuthGuard)
  async resendVerifyEmail(
    @CurrentContext() context: PlatformContext,
    @Req() req: Request,
  ) {
    try {
      const rateKey =
        req.ip ?? req.headers['x-forwarded-for']?.toString() ?? context.user.email;
      await this.authService.sendEmailVerification(context.user, rateKey);
      return { ok: true };
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentContext() context: PlatformContext) {
    return {
      user: context.user,
      workspace: context.workspace,
      role: context.role,
      membership: context.membership,
      emailVerified: Boolean(context.user.emailVerifiedAt),
    };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthRedirect(req, res);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Passport redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthRedirect(req, res);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() {
    // Passport redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthRedirect(req, res);
  }

  private async handleOAuthRedirect(req: Request, res: Response) {
    const profile = req.user as OAuthProfile | undefined;
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';

    if (!profile) {
      return res.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    try {
      const result = await this.authService.handleOAuth(profile);
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      const redirectUrl =
        process.env['AUTH_SUCCESS_URL'] ?? `${appUrl}/auth/callback`;
      return res.redirect(redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[oauth] handleOAuth failed:', message);
      return res.redirect(`${appUrl}/login?error=oauth_failed`);
    }
  }
}
