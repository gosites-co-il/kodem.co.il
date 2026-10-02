import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ChannelType, PlatformContext } from '@kodem/contracts';
import { CHANNEL_TYPES } from '@kodem/contracts';
import { ConversationService } from '@kodem/modules/conversations';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

function asChannel(value: string | undefined): ChannelType | undefined {
  if (!value) return undefined;
  return CHANNEL_TYPES.find((channel) => channel === value);
}

@Controller('conversations')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('conversations')
export class ConversationsController {
  private readonly conversations = new ConversationService();

  @Get()
  async list(
    @CurrentContext() context: PlatformContext,
    @Query('channel') channel?: string,
    @Query('unread') unread?: string,
    @Query('q') q?: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.conversations.list(context.workspace.id, {
      channel: asChannel(channel),
      unread: unread === '1' || unread === 'true',
      q,
      contactId,
    });
  }

  @Post('email/sync')
  async syncEmail(@CurrentContext() context: PlatformContext) {
    try {
      return await this.conversations.syncEmail(context.workspace.id);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'סנכרון האימייל נכשל',
      );
    }
  }

  @Get(':id')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversations.get(context.workspace.id, id);
    if (!conversation) throw new NotFoundException('השיחה לא נמצאה');
    return { conversation };
  }

  @Post(':id/read')
  async read(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversations.markRead(
      context.workspace.id,
      id,
    );
    if (!conversation) throw new NotFoundException('השיחה לא נמצאה');
    return { conversation };
  }

  @Post(':id/reply')
  async reply(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: { body?: string },
  ) {
    try {
      const result = await this.conversations.reply(
        context.workspace.id,
        id,
        body?.body ?? '',
      );
      const conversation = await this.conversations.get(
        context.workspace.id,
        result.conversationId,
      );
      return { result, conversation };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'השליחה נכשלה';
      if (message === 'השיחה לא נמצאה') throw new NotFoundException(message);
      throw new BadRequestException(message);
    }
  }
}
