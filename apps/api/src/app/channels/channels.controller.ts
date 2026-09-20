import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  ChannelType,
  ConfigureChannelInput,
  EmailSendInput,
  MessagingSendInput,
  PlatformContext,
} from '@kodem/contracts';
import { ChannelService } from '@kodem/platform/channels';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('channels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChannelsController {
  private readonly channels = new ChannelService();

  @Get()
  @RequirePermissions('workspace.settings.read')
  async list(@CurrentContext() context: PlatformContext) {
    const catalog = await this.channels.listCatalog(context.workspace.id);
    return { catalog };
  }

  @Get('email/messages')
  @RequirePermissions('connections:use')
  async listEmailMessages(
    @CurrentContext() context: PlatformContext,
    @Query('maxResults') maxResults?: string,
  ) {
    const parsed = maxResults ? Number(maxResults) : undefined;
    return this.channels.listEmailMessages(context.workspace.id, {
      maxResults: Number.isFinite(parsed) ? parsed : undefined,
    });
  }

  @Post('email/send')
  @RequirePermissions('connections:use')
  async sendEmail(
    @CurrentContext() context: PlatformContext,
    @Body() body: EmailSendInput,
  ) {
    return this.channels.sendEmail(context.workspace.id, body ?? { to: '' });
  }

  @Get('whatsapp/messages')
  @RequirePermissions('connections:use')
  async listWhatsApp(
    @CurrentContext() context: PlatformContext,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.listMessaging(context, 'whatsapp', maxResults);
  }

  @Post('whatsapp/send')
  @RequirePermissions('connections:use')
  async sendWhatsApp(
    @CurrentContext() context: PlatformContext,
    @Body() body: MessagingSendInput,
  ) {
    return this.channels.sendMessaging(
      context.workspace.id,
      'whatsapp',
      body ?? { to: '', body: '' },
    );
  }

  @Get('instagram/messages')
  @RequirePermissions('connections:use')
  async listInstagram(
    @CurrentContext() context: PlatformContext,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.listMessaging(context, 'instagram', maxResults);
  }

  @Post('instagram/send')
  @RequirePermissions('connections:use')
  async sendInstagram(
    @CurrentContext() context: PlatformContext,
    @Body() body: MessagingSendInput,
  ) {
    return this.channels.sendMessaging(
      context.workspace.id,
      'instagram',
      body ?? { to: '', body: '' },
    );
  }

  @Get('facebook-messenger/messages')
  @RequirePermissions('connections:use')
  async listMessenger(
    @CurrentContext() context: PlatformContext,
    @Query('maxResults') maxResults?: string,
  ) {
    return this.listMessaging(context, 'facebook_messenger', maxResults);
  }

  @Post('facebook-messenger/send')
  @RequirePermissions('connections:use')
  async sendMessenger(
    @CurrentContext() context: PlatformContext,
    @Body() body: MessagingSendInput,
  ) {
    return this.channels.sendMessaging(
      context.workspace.id,
      'facebook_messenger',
      body ?? { to: '', body: '' },
    );
  }

  @Get(':type')
  @RequirePermissions('workspace.settings.read')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('type') type: ChannelType,
  ) {
    const channel = await this.channels.getByType(context.workspace.id, type);
    return { channel };
  }

  @Post(':type/configure')
  @RequirePermissions('connections:manage')
  async configure(
    @CurrentContext() context: PlatformContext,
    @Param('type') type: ChannelType,
    @Body() body: ConfigureChannelInput,
  ) {
    const channel = await this.channels.configure(
      context.workspace.id,
      type,
      body,
      context.user.id,
    );
    return { channel };
  }

  @Delete(':type')
  @RequirePermissions('connections:manage')
  async disconnect(
    @CurrentContext() context: PlatformContext,
    @Param('type') type: ChannelType,
  ) {
    await this.channels.disconnect(
      context.workspace.id,
      type,
      context.user.id,
    );
    return { ok: true };
  }

  private listMessaging(
    context: PlatformContext,
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
    maxResults?: string,
  ) {
    const parsed = maxResults ? Number(maxResults) : undefined;
    return this.channels.listMessaging(context.workspace.id, type, {
      maxResults: Number.isFinite(parsed) ? parsed : undefined,
    });
  }
}
