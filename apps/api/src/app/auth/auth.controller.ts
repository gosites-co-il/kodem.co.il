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
import { CurrentContext } from './decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: ApiAuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; name: string; password: string },
  ) {
    if (!body.email || !body.name || !body.password) {
      throw new BadRequestException('email, name, and password are required');
    }
    try {
      return await this.authService.register(body);
    } catch (error) {
      this.authService.wrapError(error);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    try {
      return await this.authService.login(body);
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
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
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
    if (!profile) {
      return res.redirect(
        `${process.env['APP_URL'] ?? 'http://localhost:3000'}/login?error=oauth_failed`,
      );
    }

    try {
      const result = await this.authService.handleOAuth(profile);
      const redirectUrl = new URL(
        process.env['AUTH_SUCCESS_URL'] ??
          `${process.env['APP_URL'] ?? 'http://localhost:3000'}/auth/callback`,
      );
      redirectUrl.searchParams.set('token', result.token);
      return res.redirect(redirectUrl.toString());
    } catch {
      return res.redirect(
        `${process.env['APP_URL'] ?? 'http://localhost:3000'}/login?error=oauth_failed`,
      );
    }
  }
}
