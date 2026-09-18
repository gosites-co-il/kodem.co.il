import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { IntegrationId, PlatformContext } from '@kodem/contracts';
import { ConnectionService } from '@kodem/platform/connections';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('connections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConnectionsController {
  private readonly connections = new ConnectionService();

  @Get()
  @RequirePermissions('workspace.settings.read')
  async list(@CurrentContext() context: PlatformContext) {
    const catalog = await this.connections.listCatalog(context.workspace.id);
    return { catalog };
  }

  @Get(':id')
  @RequirePermissions('workspace.settings.read')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const connection = await this.connections.get(context.workspace.id, id);
    return { connection };
  }

  @Post(':integrationId/connect')
  @RequirePermissions('connections:manage')
  async connect(
    @CurrentContext() context: PlatformContext,
    @Param('integrationId') integrationId: IntegrationId,
  ) {
    return this.connections.connect(
      context.workspace.id,
      integrationId,
      context.user.id,
    );
  }

  @Post(':id/reconnect')
  @RequirePermissions('connections:manage')
  async reconnect(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    return this.connections.reconnect(
      context.workspace.id,
      id,
      context.user.id,
    );
  }

  @Post(':id/test')
  @RequirePermissions('connections:manage')
  async test(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    return this.connections.test(context.workspace.id, id);
  }

  @Post(':id/sync')
  @RequirePermissions('connections:manage')
  async sync(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    return this.connections.sync(context.workspace.id, id);
  }

  @Delete(':id')
  @RequirePermissions('connections:manage')
  async disconnect(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    return this.connections.disconnect(
      context.workspace.id,
      id,
      context.user.id,
    );
  }
}
