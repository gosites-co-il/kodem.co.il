import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { PlatformContext } from '@kodem/contracts';
import { MemberService } from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('invites')
export class InvitesController {
  private readonly members = new MemberService();

  @Get(':token')
  async getPublic(@Param('token') token: string) {
    try {
      return await this.members.getInvitePublic(token);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invite not found',
      );
    }
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param('token') token: string,
    @CurrentContext() context: PlatformContext,
  ) {
    try {
      const member = await this.members.acceptInvite(token, context.user.id, {
        switchActive: true,
      });
      return { member };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Accept failed',
      );
    }
  }
}
