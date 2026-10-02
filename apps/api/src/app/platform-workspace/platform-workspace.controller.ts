import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SystemRole, type PlatformContext, type WorkspaceId } from '@kodem/contracts';
import { AdminRepository, UserRepository } from '@kodem/database';
import { buildImpersonationContext } from '@kodem/platform/auth';
import { WorkspaceService } from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import { ApiAuthService } from '../auth/auth.service';

@Controller('workspace')
export class PlatformWorkspaceController {
  private readonly workspaceService = new WorkspaceService();

  constructor(private readonly authService: ApiAuthService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async current(@CurrentContext() context: PlatformContext) {
    return {
      workspace: context.workspace,
      role: context.role,
      membership: context.membership,
    };
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async list(@CurrentContext() context: PlatformContext) {
    const mine = await this.workspaceService.listForUser(context.user.id);
    if (context.user.platformRole !== SystemRole.SuperAdmin) {
      return { workspaces: mine };
    }

    const all = await new AdminRepository().listWorkspaces();
    const mineById = new Map(mine.map((item) => [item.workspace.id, item]));
    const workspaces = all.map((row) => {
      const existing = mineById.get(row.workspace.id);
      if (existing) return { ...existing, platformView: false as const };
      const view = buildImpersonationContext(context.user, row.workspace);
      return {
        workspace: row.workspace,
        role: view.role,
        membership: view.membership,
        platformView: true as const,
      };
    });
    const listed = new Set(workspaces.map((item) => item.workspace.id));
    for (const item of mine) {
      if (!listed.has(item.workspace.id)) {
        workspaces.push({ ...item, platformView: false as const });
      }
    }
    return { workspaces };
  }

  @Post('switch')
  @UseGuards(JwtAuthGuard)
  async switch(
    @CurrentContext() context: PlatformContext,
    @Body() body: { workspaceId: string },
  ) {
    if (!body.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    try {
      if (context.user.platformRole === SystemRole.SuperAdmin) {
        return await this.switchAsSuperAdmin(
          context,
          body.workspaceId as WorkspaceId,
        );
      }
      await this.authService.authService.clearImpersonation(context.user.id);
      const resolved = await this.workspaceService.switchTo(
        context.user.id,
        body.workspaceId as WorkspaceId,
      );
      return this.authService.authService.issueAuthResult(
        context.user,
        resolved,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to switch workspace',
      );
    }
  }

  private async switchAsSuperAdmin(
    context: PlatformContext,
    workspaceId: WorkspaceId,
  ) {
    const workspace = await this.workspaceService.findById(workspaceId);
    if (!workspace) throw new Error('הסביבה לא נמצאה');
    if (workspace.status === 'deactivated') {
      throw new Error('הסביבה מושבתת. הפעילו אותה לפני כניסה.');
    }

    const mine = await this.workspaceService.listForUser(context.user.id);
    const membership = mine.find((item) => item.workspace.id === workspaceId);
    if (membership) {
      await this.authService.authService.clearImpersonation(context.user.id);
      const resolved = await this.workspaceService.switchTo(
        context.user.id,
        workspaceId,
      );
      return this.authService.authService.issueAuthResult(
        context.user,
        resolved,
      );
    }

    await new UserRepository().setImpersonatingWorkspace(
      context.user.id,
      workspace.id,
    );
    const result = this.authService.authService.issueAuthResult(
      context.user,
      buildImpersonationContext(context.user, workspace),
      { impersonating: true },
    );
    return { ...result, impersonating: true };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: { name?: string; slug?: string; websiteUrl?: string },
  ) {
    const name = body.name?.trim() || 'לקוח חדש';

    try {
      await this.authService.authService.clearImpersonation(context.user.id);
      const resolved = await this.workspaceService.createForOwner(
        context.user.id,
        { name, slug: body.slug, websiteUrl: body.websiteUrl },
      );
      return this.authService.authService.issueAuthResult(
        context.user,
        resolved,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create workspace',
      );
    }
  }
}
