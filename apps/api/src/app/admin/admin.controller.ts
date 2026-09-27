import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminUpsertWorkspaceInput,
  PlatformContext,
  UserId,
  WorkspaceId,
} from '@kodem/contracts';
import {
  buildImpersonationContext,
} from '@kodem/platform/auth';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import { ApiAuthService } from '../auth/auth.service';
import {
  setAccessCookie,
  setRefreshCookie,
} from '../auth/auth-cookies';
import { AdminService } from './admin.service';
import { PlatformAdminGuard } from './platform-admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: ApiAuthService,
  ) {}

  @Get('workspaces')
  listWorkspaces() {
    return this.admin.listWorkspaces();
  }

  @Post('workspaces')
  createWorkspace(
    @Body()
    body: {
      name?: string;
      slug?: string;
      websiteUrl?: string;
      ownerEmail?: string;
      status?: AdminUpsertWorkspaceInput['status'];
      onboardingStatus?: AdminUpsertWorkspaceInput['onboardingStatus'];
    },
  ) {
    if (!body.name?.trim() || !body.ownerEmail?.trim()) {
      throw new BadRequestException('שם ואימייל בעלים הם שדות חובה');
    }
    return this.run(() =>
      this.admin.createWorkspace({
        name: body.name!,
        slug: body.slug,
        websiteUrl: body.websiteUrl,
        ownerEmail: body.ownerEmail!,
        status: body.status,
        onboardingStatus: body.onboardingStatus,
      }),
    );
  }

  @Patch('workspaces/:id')
  updateWorkspace(
    @Param('id') id: string,
    @Body() body: AdminUpsertWorkspaceInput,
  ) {
    return this.run(() =>
      this.admin.updateWorkspace(id as WorkspaceId, body),
    );
  }

  @Delete('workspaces/:id')
  deleteWorkspace(@Param('id') id: string) {
    return this.run(async () => {
      await this.admin.deleteWorkspace(id as WorkspaceId);
      return { ok: true };
    });
  }

  @Post('workspaces/:id/impersonate')
  async impersonate(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const workspace = await this.admin.beginImpersonation(
        context.user,
        id as WorkspaceId,
      );
      const result = await this.auth.authService.issueSession(
        context.user,
        buildImpersonationContext(context.user, workspace),
        { impersonating: true },
      );
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      return { ...this.auth.stripRefresh(result), impersonating: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'הכניסה לסביבה נכשלה',
      );
    }
  }

  @Post('impersonation/stop')
  async stopImpersonation(
    @CurrentContext() context: PlatformContext,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const resolved = await this.admin.stopImpersonation(context.user);
      const result = await this.auth.authService.issueSession(
        context.user,
        resolved,
      );
      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      return { ...this.auth.stripRefresh(result), impersonating: false };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'היציאה מהסביבה נכשלה',
      );
    }
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Post('users')
  createUser(@Body() body: AdminCreateUserInput) {
    return this.run(() => this.admin.createUser(body));
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserInput) {
    return this.run(() => this.admin.updateUser(id as UserId, body));
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    return this.run(async () => {
      await this.admin.deleteUser(context.user.id, id as UserId);
      return { ok: true };
    });
  }

  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'הפעולה נכשלה',
      );
    }
  }
}
