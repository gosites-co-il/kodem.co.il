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
  PlanId,
  PlatformContext,
  RoleName,
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

  @Post('workspaces/bulk')
  bulkWorkspaces(
    @Body()
    body: {
      action?: 'delete' | 'set_status';
      ids?: string[];
      status?: AdminUpsertWorkspaceInput['status'];
    },
  ) {
    if (body.action !== 'delete' && body.action !== 'set_status') {
      throw new BadRequestException('פעולה לא תקינה');
    }
    return this.run(() =>
      this.admin.bulkWorkspaces({
        action: body.action as 'delete' | 'set_status',
        ids: body.ids ?? [],
        status: body.status,
      }),
    );
  }

  @Get('workspaces/:id')
  workspaceDetail(@Param('id') id: string) {
    return this.run(() => this.admin.workspaceDetail(id as WorkspaceId));
  }

  @Post('workspaces/:id/transfer-owner')
  transferOwner(
    @Param('id') id: string,
    @Body() body: { userId?: string },
  ) {
    if (!body.userId?.trim()) {
      throw new BadRequestException('חסר משתמש');
    }
    return this.run(() =>
      this.admin.transferOwnership(id as WorkspaceId, body.userId as UserId),
    );
  }

  @Patch('workspaces/:id/plan')
  setPlan(@Param('id') id: string, @Body() body: { planId?: PlanId }) {
    if (!body.planId) {
      throw new BadRequestException('חסרה תוכנית');
    }
    return this.run(() => this.admin.setWorkspacePlan(id as WorkspaceId, body.planId!));
  }

  @Patch('workspaces/:id/members/:userId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role?: RoleName },
  ) {
    if (!body.role) {
      throw new BadRequestException('חסר תפקיד');
    }
    return this.run(() =>
      this.admin.updateMemberRole(id as WorkspaceId, userId as UserId, body.role!),
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

  @Post('users/bulk-delete')
  bulkDeleteUsers(
    @CurrentContext() context: PlatformContext,
    @Body() body: { ids?: string[] },
  ) {
    return this.run(() =>
      this.admin.bulkDeleteUsers(context.user.id, body.ids ?? []),
    );
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
