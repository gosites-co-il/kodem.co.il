import type {
  BindConnectionResourceInput,
  ConnectionActionResult,
  ConnectionCatalogItem,
  ConnectionPreviewResult,
  ConnectionSheetsListResult,
  GoogleSheetsConnectionMetadata,
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
import {
  defaultPreviewRange,
  getConnectionAdapter,
  getSpreadsheet,
  getValues,
  googleConnectionClientConfig,
  parseSpreadsheetId,
  refreshGoogleAccessToken,
} from '@kodem/integrations';
import {
  PLATFORM_INTEGRATIONS,
  getIntegrationDefinition,
} from '@kodem/platform/catalog';
import { AuditService } from '@kodem/platform/audit';
import { ConnectionCredentialsStore } from './credentials-store';

const TOKEN_REFRESH_SKEW_MS = 60_000;

function sheetsMetadata(
  connection: WorkspaceConnection,
): GoogleSheetsConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['spreadsheetId'] !== 'string') return null;
  return {
    spreadsheetId: meta['spreadsheetId'],
    spreadsheetTitle:
      typeof meta['spreadsheetTitle'] === 'string'
        ? meta['spreadsheetTitle']
        : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

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
    const byIntegration = new Map<IntegrationId, WorkspaceConnection[]>();
    for (const c of existing) {
      const list = byIntegration.get(c.integrationId) ?? [];
      list.push(c);
      byIntegration.set(c.integrationId, list);
    }

    return PLATFORM_INTEGRATIONS.map((def) => {
      const connections = byIntegration.get(def.id) ?? [];
      const active =
        connections.find((c) => c.status === 'connected') ??
        connections[0] ??
        null;
      return {
        integrationId: def.id,
        provider: def.provider,
        name: def.name,
        description: def.description ?? '',
        category: def.category,
        status: def.status,
        capabilities: def.capabilities,
        connections,
        connection: active,
      };
    });
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
    capabilities?: import('@kodem/contracts').ConnectionCapability[],
    options?: { connectionId?: string; accessMode?: 'full' | 'readonly' },
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

    if (options?.connectionId) {
      const existing = await this.connections.findById(
        workspaceId,
        options.connectionId,
      );
      if (!existing || existing.integrationId !== integrationId) {
        return {
          success: false,
          code: 'error',
          message: 'Connection not found',
        };
      }
    }

    const sheetsCaps =
      integrationId === 'google_sheets' && options?.accessMode
        ? options.accessMode === 'readonly'
          ? (['sheets.read'] as import('@kodem/contracts').ConnectionCapability[])
          : ([
              'sheets.read',
              'sheets.write',
            ] as import('@kodem/contracts').ConnectionCapability[])
        : undefined;

    const result = await adapter.startConnect({
      workspaceId,
      integrationId,
      userId: actorId,
      capabilities:
        sheetsCaps ??
        (capabilities?.length ? capabilities : def.capabilities),
      accessMode: options?.accessMode,
      connectionId: options?.connectionId,
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
    options?: {
      accessMode?: 'full' | 'readonly';
      connectionId?: string;
    },
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

    const capabilities: import('@kodem/contracts').ConnectionCapability[] =
      integrationId === 'google_sheets'
        ? options?.accessMode === 'readonly'
          ? ['sheets.read']
          : ['sheets.read', 'sheets.write']
        : def.capabilities;

    const result = await adapter.completeConnect({
      workspaceId,
      integrationId,
      userId: actorId,
      capabilities,
      code,
      accessMode: options?.accessMode,
      connectionId: options?.connectionId,
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
      connectionId: options?.connectionId,
      auditAction: options?.connectionId
        ? 'connection.reconnected'
        : 'connection.connected',
      eventType: EVENT_TYPES.CONNECTION_CONNECTED,
    });
  }

  private async persistConnected(input: {
    workspaceId: WorkspaceId;
    integrationId: IntegrationId;
    provider: import('@kodem/contracts').ConnectionProviderId;
    actorId: UserId;
    result: import('@kodem/integrations').AdapterConnectResult;
    connectionId?: string;
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
      connectionId: input.connectionId,
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

  /**
   * Decrypts stored OAuth credentials and refreshes the access token when near expiry.
   */
  async getValidAccessToken(
    workspaceId: WorkspaceId,
    connectionId: string,
  ): Promise<string> {
    const existing = await this.connections.findById(workspaceId, connectionId);
    if (!existing) {
      throw new Error('Connection not found');
    }
    if (existing.status !== 'connected') {
      throw new Error(
        existing.status === 'inactive'
          ? 'החיבור אינו פעיל — הפעילו אותו כדי להשתמש בגיליון'
          : 'Connection is not active',
      );
    }

    const ciphertext = await this.credentials.findCiphertext(existing.id);
    if (!ciphertext) {
      throw new Error('No credentials stored for this connection');
    }

    const creds = this.store.decrypt(ciphertext);
    const accessToken = creds['accessToken'];
    if (!accessToken) {
      throw new Error('Stored credentials are missing an access token');
    }

    const expiresAtRaw = creds['expiresAt'];
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;
    const needsRefresh =
      Number.isFinite(expiresAt) &&
      expiresAt - TOKEN_REFRESH_SKEW_MS <= Date.now();

    if (!needsRefresh) {
      return accessToken;
    }

    const refreshToken = creds['refreshToken'];
    if (!refreshToken) {
      throw new Error(
        'תוקף הגישה פג ואין refresh token — חברו מחדש את Google Sheets',
      );
    }

    const config = googleConnectionClientConfig(existing.integrationId);
    if (!config) {
      throw new Error('Google OAuth client is not configured');
    }

    const refreshed = await refreshGoogleAccessToken({
      refreshToken,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });

    const next: Record<string, string> = {
      ...creds,
      accessToken: refreshed.accessToken,
    };
    if (refreshed.expiresIn) {
      next['expiresAt'] = String(Date.now() + refreshed.expiresIn * 1000);
    }
    if (refreshed.scope) {
      next['scope'] = refreshed.scope;
    }

    const encrypted = this.store.encrypt(next);
    await this.credentials.upsert(
      existing.id,
      encrypted.ciphertext,
      encrypted.keyVersion,
    );

    return refreshed.accessToken;
  }

  async bindResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'google_sheets') {
      return {
        success: false,
        code: 'error',
        message: 'קשירת גיליון זמינה רק ל-Google Sheets',
      };
    }
    if (existing.status !== 'connected') {
      return {
        success: false,
        code: 'error',
        message:
          existing.status === 'inactive'
            ? 'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת קובץ'
            : 'יש לחבר את Google Sheets לפני בחירת קובץ',
      };
    }

    const spreadsheetId = parseSpreadsheetId(
      input.spreadsheetId?.trim() || input.spreadsheetUrl?.trim() || '',
    );
    if (!spreadsheetId) {
      return {
        success: false,
        code: 'error',
        message: 'קישור או מזהה גיליון לא תקין',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const summary = await getSpreadsheet(accessToken, spreadsheetId);
      const meta: GoogleSheetsConnectionMetadata = {
        spreadsheetId: summary.spreadsheetId,
        spreadsheetTitle: summary.title,
        lastBoundAt: new Date().toISOString(),
      };
      const connection = await this.connections.updateMetadata(
        workspaceId,
        id,
        { ...existing.metadata, ...meta },
      );

      await this.audit.record({
        workspaceId,
        actorId,
        targetId: id,
        action: 'connection.reconnected',
        metadata: {
          integrationId: existing.integrationId,
          spreadsheetId: summary.spreadsheetId,
          bound: true,
        },
      });

      return {
        success: true,
        code: 'ok',
        connection: connection ?? undefined,
        message: `נקשר: ${summary.title}`,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'קשירת הגיליון נכשלה',
        connection: existing,
      };
    }
  }

  async listSheets(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionSheetsListResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    const bound = sheetsMetadata(existing);
    if (!bound) {
      return {
        success: false,
        code: 'error',
        message: 'לא נבחר גיליון — הדביקו קישור לקובץ Sheets',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const summary = await getSpreadsheet(accessToken, bound.spreadsheetId);
      return {
        spreadsheetId: summary.spreadsheetId,
        title: summary.title,
        sheets: summary.sheets,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת הגיליונות נכשלה',
        connection: existing,
      };
    }
  }

  async preview(
    workspaceId: WorkspaceId,
    id: string,
    opts?: { sheet?: string; range?: string },
  ): Promise<ConnectionPreviewResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    const bound = sheetsMetadata(existing);
    if (!bound) {
      return {
        success: false,
        code: 'error',
        message: 'לא נבחר גיליון — הדביקו קישור לקובץ Sheets',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      let range = opts?.range?.trim();
      if (!range) {
        const sheetTitle = opts?.sheet?.trim();
        if (sheetTitle) {
          range = defaultPreviewRange(sheetTitle);
        } else {
          const summary = await getSpreadsheet(
            accessToken,
            bound.spreadsheetId,
          );
          const first = summary.sheets[0]?.title;
          if (!first) {
            return {
              success: false,
              code: 'error',
              message: 'הקובץ לא מכיל גיליונות',
            };
          }
          range = defaultPreviewRange(first);
        }
      }

      const values = await getValues(
        accessToken,
        bound.spreadsheetId,
        range,
      );
      return {
        spreadsheetId: bound.spreadsheetId,
        range: values.range,
        values: values.values,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'תצוגה מקדימה נכשלה',
        connection: existing,
      };
    }
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
    return this.connect(workspaceId, existing.integrationId, actorId, existing.capabilities, {
      connectionId: existing.id,
    });
  }

  /**
   * Soft enable/disable — keeps credentials. Unlike disconnect, can be turned back on.
   */
  async setActive(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    active: boolean,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.status === 'disconnected') {
      return {
        success: false,
        code: 'error',
        message: 'חיבור מנותק — חברו מחדש לפני הפעלה',
      };
    }
    if (
      active &&
      (existing.status === 'expired' || existing.status === 'error')
    ) {
      return {
        success: false,
        code: 'error',
        message: 'יש לחדש את החיבור לפני הפעלה',
      };
    }

    const nextStatus = active ? 'connected' : 'inactive';
    if (existing.status === nextStatus) {
      return { success: true, code: 'ok', connection: existing };
    }

    const connection = await this.connections.updateStatus(
      workspaceId,
      id,
      nextStatus,
    );
    await this.audit.record({
      workspaceId,
      actorId,
      targetId: id,
      action: active ? 'connection.reconnected' : 'connection.disconnected',
      metadata: {
        integrationId: existing.integrationId,
        soft: true,
        active,
      },
    });

    return {
      success: true,
      code: 'ok',
      connection: connection ?? undefined,
      message: active ? 'החיבור הופעל' : 'החיבור הושבת',
    };
  }

  async test(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }

    if (existing.integrationId === 'google_sheets') {
      try {
        await this.getValidAccessToken(workspaceId, id);
        const bound = sheetsMetadata(existing);
        if (!bound) {
          return {
            success: true,
            code: 'ok',
            message: 'החיבור תקין — עדיין לא נבחר גיליון',
            connection: existing,
          };
        }
        const accessToken = await this.getValidAccessToken(workspaceId, id);
        const summary = await getSpreadsheet(
          accessToken,
          bound.spreadsheetId,
        );
        return {
          success: true,
          code: 'ok',
          message: `החיבור תקין: ${summary.title}`,
          connection: existing,
        };
      } catch (err) {
        return {
          success: false,
          code: 'error',
          message: err instanceof Error ? err.message : 'בדיקת החיבור נכשלה',
          connection: existing,
        };
      }
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
    await this.connections.delete(workspaceId, id);

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

    return {
      success: true,
      code: 'ok',
      message: 'החיבור נמחק',
    };
  }
}
