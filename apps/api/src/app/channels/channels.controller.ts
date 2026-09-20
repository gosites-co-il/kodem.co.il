import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  ChannelType,
  ConfigureChannelInput,
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
  async stubEmailMessages(@CurrentContext() context: PlatformContext) {
    return this.channels.stubEmailMessages(context.workspace.id);
  }

  @Post('email/send')
  @RequirePermissions('connections:use')
  async stubEmailSend(
    @CurrentContext() context: PlatformContext,
    @Body() body: { to?: string; subject?: string; body?: string },
  ) {
    return this.channels.stubEmailSend(context.workspace.id, body ?? {});
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
}
