import type {
  ConnectionActionResult,
  ConnectionCatalogItem,
  IntegrationId,
  UserId,
  WorkspaceConnection,
  WorkspaceId,
} from '@kodem/contracts';
import {
  ConnectionCredentialRepository,
  PrismaEventStore,
  WorkspaceConnectionRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import { getConnectionAdapter } from '@kodem/integrations';
import {
  PLATFORM_INTEGRATIONS,
  getIntegrationDefinition,
} from '@kodem/platform/catalog';
import { AuditService } from '@kodem/platform/audit';
import { ConnectionCredentialsStore } from './credentials-store';

export class ConnectionService {
  private readonly connections = new WorkspaceConnectionRepository();
  private readonly credentials = new ConnectionCredentialRepository();
  private readonly store = new ConnectionCredentialsStore();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());
  private readonly audit = new AuditService();

  async listCatalog(
    workspaceId: WorkspaceId,
  ): Promise<ConnectionCatalogItem[]> {
    const existing = await this.connections.findByWorkspace(workspaceId);
    const byIntegration = new Map(
      existing.map((c) => [c.integrationId, c] as const),
    );

    return PLATFORM_INTEGRATIONS.map((def) => ({
      integrationId: def.id,
      provider: def.provider,
      name: def.name,
      description: def.description ?? '',
      category: def.category,
      status: def.status,
      capabilities: def.capabilities,
      connection: byIntegration.get(def.id) ?? null,
    }));
  }

  list(workspaceId: WorkspaceId): Promise<WorkspaceConnection[]> {
    return this.connections.findByWorkspace(workspaceId);
  }

  get(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<WorkspaceConnection | null> {
    return this.connections.findById(workspaceId, id);
  }

  async connect(
    workspaceId: WorkspaceId,
    integrationId: IntegrationId,
    actorId: UserId,
  ): Promise<ConnectionActionResult> {
    const def = getIntegrationDefinition(integrationId);
    if (!def) {
      return {
        success: false,
        code: 'error',
        message: 'Unknown integration',
      };
    }

    const adapter = getConnectionAdapter(def.provider);
    if (!adapter) {
      return {
        success: false,
        code: 'not_implemented',
        message: 'No adapter for provider',
      };
    }

    const result = await adapter.startConnect({
      workspaceId,
      integrationId,
      userId: actorId,
      capabilities: def.capabilities,
    });

    if (result.code === 'oauth_redirect' && result.authorizeUrl) {
      return {
        success: true,
        code: 'oauth_redirect',
        authorizeUrl: result.authorizeUrl,
        redirectUri: result.redirectUri,
        message: result.message,
      };
    }

    if (!result.success) {
      await this.audit.record({
        workspaceId,
        actorId,
        action: 'connection.failed',
        metadata: {
          integrationId,
          provider: def.provider,
          code: result.code,
        },
      });
      return {
        success: false,
        code: result.code,
        message: result.message,
      };
    }

    return this.persistConnected({
      workspaceId,
      integrationId,
      provider: def.provider,
      actorId,
      result,
      auditAction: 'connection.connected',
      eventType: EVENT_TYPES.CONNECTION_CONNECTED,
    });
  }

  async completeOAuth(
    workspaceId: WorkspaceId,
    integrationId: IntegrationId,
    actorId: UserId,
    code: string,
  ): Promise<ConnectionActionResult> {
    const def = getIntegrationDefinition(integrationId);
    if (!def) {
      return { success: false, code: 'error', message: 'Unknown integration' };
    }
    const adapter = getConnectionAdapter(def.provider);
    if (!adapter?.completeConnect) {
      return {
        success: false,
        code: 'not_implemented',
        message: 'OAuth complete not supported',
      };
    }

    const result = await adapter.completeConnect({
      workspaceId,
      integrationId,
      userId: actorId,
      capabilities: def.capabilities,
      code,
    });

    if (!result.success) {
      await this.audit.record({
        workspaceId,
        actorId,
        action: 'connection.failed',
        metadata: {
          integrationId,
          provider: def.provider,
          code: result.code,
        },
      });
      return {
        success: false,
        code: result.code,
        message: result.message,
      };
    }

    return this.persistConnected({
      workspaceId,
      integrationId,
      provider: def.provider,
      actorId,
      result,
      auditAction: 'connection.connected',
      eventType: EVENT_TYPES.CONNECTION_CONNECTED,
    });
  }

  private async persistConnected(input: {
    workspaceId: WorkspaceId;
    integrationId: IntegrationId;
    provider: import('@kodem/contracts').ConnectionProviderId;
    actorId: UserId;
    result: import('@kodem/integrations').AdapterConnectResult;
    auditAction: 'connection.connected' | 'connection.reconnected';
    eventType: typeof EVENT_TYPES.CONNECTION_CONNECTED;
  }): Promise<ConnectionActionResult> {
    const connection = await this.connections.upsert({
      workspaceId: input.workspaceId,
      integrationId: input.integrationId,
      provider: input.provider,
      status: 'connected',
      capabilities:
        input.result.capabilities ??
        getIntegrationDefinition(input.integrationId)?.capabilities ??
        [],
      createdById: input.actorId,
      externalAccountId: input.result.externalAccountId ?? null,
      externalAccountName: input.result.externalAccountName ?? null,
    });

    if (input.result.credentials) {
      const encrypted = this.store.encrypt(input.result.credentials);
      await this.credentials.upsert(
        connection.id,
        encrypted.ciphertext,
        encrypted.keyVersion,
      );
    }

    await this.eventBus.emit({
      type: input.eventType,
      workspaceId: input.workspaceId,
      payload: {
        connectionId: connection.id,
        integrationId: input.integrationId,
        provider: input.provider,
      },
    });
    await this.audit.record({
      workspaceId: input.workspaceId,
      actorId: input.actorId,
      targetId: connection.id,
      action: input.auditAction,
      metadata: {
        integrationId: input.integrationId,
        provider: input.provider,
      },
    });

    return { success: true, code: 'ok', connection };
  }

  async reconnect(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    return this.connect(workspaceId, existing.integrationId, actorId);
  }

  async test(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    const adapter = getConnectionAdapter(existing.provider);
    if (!adapter?.test) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Test not available',
      };
    }
    const result = await adapter.test(id);
    return {
      success: result.success,
      code: result.code,
      message: result.message,
      connection: existing,
    };
  }

  async sync(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    const adapter = getConnectionAdapter(existing.provider);
    if (!adapter?.sync) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Sync not available',
      };
    }
    const result = await adapter.sync(id);
    return {
      success: result.success,
      code: result.code,
      message: result.message,
      connection: existing,
    };
  }

  async disconnect(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }

    const adapter = getConnectionAdapter(existing.provider);
    await adapter?.disconnect(id);
    await this.credentials.delete(existing.id);
    await this.connections.updateStatus(workspaceId, id, 'disconnected');

    await this.eventBus.emit({
      type: EVENT_TYPES.CONNECTION_DISCONNECTED,
      workspaceId,
      payload: {
        connectionId: id,
        integrationId: existing.integrationId,
        provider: existing.provider,
      },
    });
    await this.audit.record({
      workspaceId,
      actorId,
      targetId: id,
      action: 'connection.disconnected',
      metadata: { integrationId: existing.integrationId },
    });

    const connection = await this.connections.findById(workspaceId, id);
    return {
      success: true,
      code: 'ok',
      connection: connection ?? undefined,
    };
  }
}
