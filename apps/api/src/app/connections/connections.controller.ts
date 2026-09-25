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
  BindConnectionResourceInput,
  ConnectionActionResult,
  ImportContactsFromSheetsInput,
  IntegrationId,
  PlatformContext,
  WhatsAppEmbeddedSignupCompleteInput,
} from '@kodem/contracts';
import { ConnectionService } from '@kodem/platform/connections';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

function isActionResult(
  value: unknown,
): value is ConnectionActionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ConnectionActionResult).success === 'boolean'
  );
}

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

  @Get('whatsapp/embedded-signup/config')
  @RequirePermissions('workspace.settings.read')
  embeddedSignupConfig() {
    return this.connections.whatsAppEmbeddedSignupConfig();
  }

  @Post('whatsapp/embedded-signup/complete')
  @RequirePermissions('connections:manage')
  async completeEmbeddedSignup(
    @CurrentContext() context: PlatformContext,
    @Body() body: WhatsAppEmbeddedSignupCompleteInput,
  ) {
    return this.connections.completeWhatsAppEmbeddedSignup(
      context.workspace.id,
      context.user.id,
      body ?? { code: '' },
    );
  }

  @Get(':id/sheets')
  @RequirePermissions('connections:use')
  async listSheets(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listSheets(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/analytics/properties')
  @RequirePermissions('connections:use')
  async listAnalyticsProperties(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listAnalyticsProperties(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/business/locations')
  @RequirePermissions('connections:use')
  async listBusinessLocations(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listBusinessLocations(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/facebook/pages')
  @RequirePermissions('connections:use')
  async listFacebookPages(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listFacebookPages(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/instagram/accounts')
  @RequirePermissions('connections:use')
  async listInstagramAccounts(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listInstagramAccounts(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/whatsapp/phone-numbers')
  @RequirePermissions('connections:use')
  async listWhatsAppPhoneNumbers(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const result = await this.connections.listWhatsAppPhoneNumbers(
      context.workspace.id,
      id,
    );
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Get(':id/preview')
  @RequirePermissions('connections:use')
  async preview(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Query('sheet') sheet?: string,
    @Query('range') range?: string,
  ) {
    const result = await this.connections.preview(context.workspace.id, id, {
      sheet,
      range,
    });
    if (isActionResult(result) && !result.success) {
      return result;
    }
    return result;
  }

  @Post(':id/import/contacts')
  @UseGuards(ModuleGuard)
  @RequireModule('crm')
  @RequirePermissions('connections:use')
  async importContacts(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: ImportContactsFromSheetsInput,
  ) {
    return this.connections.importContactsFromSheets(
      context.workspace.id,
      id,
      body ?? { sheet: '', mapping: {} },
    );
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
    @Body()
    body?: {
      capabilities?: import('@kodem/contracts').ConnectionCapability[];
      accessMode?: 'full' | 'readonly';
    },
  ) {
    return this.connections.connect(
      context.workspace.id,
      integrationId,
      context.user.id,
      body?.capabilities,
      { accessMode: body?.accessMode },
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

  @Post(':id/resource')
  @RequirePermissions('connections:manage')
  async bindResource(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: BindConnectionResourceInput,
  ) {
    return this.connections.bindResource(
      context.workspace.id,
      id,
      context.user.id,
      body ?? {},
    );
  }

  @Post(':id/active')
  @RequirePermissions('connections:manage')
  async setActive(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.connections.setActive(
      context.workspace.id,
      id,
      context.user.id,
      Boolean(body?.active),
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
