import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  PlatformContext,
  RoleName,
  UserId,
  WorkspaceId,
} from '@kodem/contracts';
import { MemberService } from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('workspace/members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkspaceMembersController {
  private readonly members = new MemberService();

  @Get()
  @RequirePermissions('workspace.members.read')
  async list(@CurrentContext() context: PlatformContext) {
    const [members, invites] = await Promise.all([
      this.members.listMembers(context.workspace.id),
      this.members.listPendingInvites(context.workspace.id),
    ]);
    return { members, invites };
  }

  @Post('invite')
  @RequirePermissions('workspace.members.invite')
  async invite(
    @CurrentContext() context: PlatformContext,
    @Body() body: { email: string; role: RoleName },
  ) {
    if (!body.email || !body.role) {
      throw new BadRequestException('email and role are required');
    }
    try {
      const { invite } = await this.members.inviteMember({
        workspaceId: context.workspace.id,
        email: body.email,
        role: body.role,
        invitedById: context.user.id,
      });
      return { invite };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invite failed',
      );
    }
  }

  @Post('invites/:inviteId/resend')
  @RequirePermissions('workspace.members.invite')
  async resend(
    @CurrentContext() context: PlatformContext,
    @Param('inviteId') inviteId: string,
  ) {
    try {
      const { invite } = await this.members.resendInvite(
        inviteId,
        context.user.id,
      );
      return { invite };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Resend failed',
      );
    }
  }

  @Patch(':userId/role')
  @RequirePermissions('workspace.members.update')
  async changeRole(
    @CurrentContext() context: PlatformContext,
    @Param('userId') userId: string,
    @Body() body: { role: RoleName },
  ) {
    if (!body.role) {
      throw new BadRequestException('role is required');
    }
    try {
      const member = await this.members.changeRole(
        context.workspace.id,
        userId as UserId,
        body.role,
        context.user.id,
      );
      return { member };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Role change failed',
      );
    }
  }

  @Delete(':userId')
  @RequirePermissions('workspace.members.remove')
  async remove(
    @CurrentContext() context: PlatformContext,
    @Param('userId') userId: string,
  ) {
    try {
      await this.members.removeMember(
        context.workspace.id,
        userId as UserId,
        context.user.id,
      );
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Remove failed',
      );
    }
  }

  @Post('leave')
  async leave(@CurrentContext() context: PlatformContext) {
    try {
      await this.members.leaveWorkspace(
        context.workspace.id,
        context.user.id,
      );
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Leave failed',
      );
    }
  }

  @Post('transfer')
  @RequirePermissions('workspace.lifecycle.manage')
  async transfer(
    @CurrentContext() context: PlatformContext,
    @Body() body: { toUserId: string },
  ) {
    if (!body.toUserId) {
      throw new BadRequestException('toUserId is required');
    }
    try {
      await this.members.transferOwnership(
        context.workspace.id,
        context.user.id,
        body.toUserId as UserId,
      );
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Transfer failed',
      );
    }
  }

  @Post('deactivate')
  @RequirePermissions('workspace.lifecycle.manage')
  async deactivate(@CurrentContext() context: PlatformContext) {
    try {
      await this.members.deactivateWorkspace(
        context.workspace.id as WorkspaceId,
        context.user.id,
      );
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Deactivate failed',
      );
    }
  }
}
