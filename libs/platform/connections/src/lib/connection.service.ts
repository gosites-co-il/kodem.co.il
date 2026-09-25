import type {
  BindConnectionResourceInput,
  ConnectionActionResult,
  ConnectionAnalyticsPropertiesResult,
  ConnectionBusinessLocationsResult,
  ConnectionCatalogItem,
  ConnectionFacebookPagesResult,
  ConnectionInstagramAccountsResult,
  ConnectionPreviewResult,
  ConnectionSheetsListResult,
  ConnectionWhatsAppPhoneNumbersResult,
  FacebookConnectionMetadata,
  GoogleAnalyticsConnectionMetadata,
  GoogleBusinessConnectionMetadata,
  GoogleSheetsConnectionMetadata,
  ImportContactsFromSheetsInput,
  ImportContactsFromSheetsResult,
  InstagramConnectionMetadata,
  IntegrationId,
  SheetsContactImportField,
  UserId,
  WhatsAppConnectionMetadata,
  WhatsAppEmbeddedSignupCompleteInput,
  WhatsAppEmbeddedSignupConfig,
  WorkspaceConnection,
  WorkspaceId,
} from '@kodem/contracts';
import {
  ConnectionCredentialRepository,
  CrmContactRepository,
  PrismaEventStore,
  WorkspaceConnectionRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import {
  defaultImportRange,
  defaultPreviewRange,
  exchangeMetaEmbeddedSignupCode,
  getAnalyticsProperty,
  getBusinessLocation,
  getConnectionAdapter,
  getSpreadsheet,
  getValues,
  googleConnectionClientConfig,
  listAnalyticsProperties,
  listBusinessLocations,
  listFacebookPages,
  listInstagramAccounts,
  listWhatsAppPhoneNumbers,
  listWhatsAppPhoneNumbersForWaba,
  metaConnectionClientConfig,
  metaConnectionConfigMissingMessage,
  metaWhatsAppEmbeddedSignupPublicConfig,
  parseSpreadsheetId,
  refreshGoogleAccessToken,
  runAnalyticsSessionsSmoke,
  SHEETS_IMPORT_ROW_CAP,
  SHEETS_IMPORT_ROW_HARD_CAP,
  subscribeWhatsAppWaba,
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

function analyticsMetadata(
  connection: WorkspaceConnection,
): GoogleAnalyticsConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['propertyId'] !== 'string') return null;
  return {
    propertyId: meta['propertyId'],
    propertyName:
      typeof meta['propertyName'] === 'string'
        ? meta['propertyName']
        : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

function businessMetadata(
  connection: WorkspaceConnection,
): GoogleBusinessConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['locationName'] !== 'string') return null;
  return {
    locationName: meta['locationName'],
    locationTitle:
      typeof meta['locationTitle'] === 'string'
        ? meta['locationTitle']
        : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

function facebookMetadata(
  connection: WorkspaceConnection,
): FacebookConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['pageId'] !== 'string') return null;
  return {
    pageId: meta['pageId'],
    pageName:
      typeof meta['pageName'] === 'string' ? meta['pageName'] : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

function instagramMetadata(
  connection: WorkspaceConnection,
): InstagramConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['igUserId'] !== 'string') return null;
  return {
    igUserId: meta['igUserId'],
    igUsername:
      typeof meta['igUsername'] === 'string' ? meta['igUsername'] : undefined,
    pageId: typeof meta['pageId'] === 'string' ? meta['pageId'] : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

function whatsappMetadata(
  connection: WorkspaceConnection,
): WhatsAppConnectionMetadata | null {
  const meta = connection.metadata;
  if (!meta || typeof meta['phoneNumberId'] !== 'string') return null;
  return {
    phoneNumberId: meta['phoneNumberId'],
    displayPhoneNumber:
      typeof meta['displayPhoneNumber'] === 'string'
        ? meta['displayPhoneNumber']
        : undefined,
    wabaId: typeof meta['wabaId'] === 'string' ? meta['wabaId'] : undefined,
    lastBoundAt:
      typeof meta['lastBoundAt'] === 'string' ? meta['lastBoundAt'] : undefined,
  };
}

function requireActive(
  existing: WorkspaceConnection,
  inactiveMessage: string,
  otherMessage: string,
): ConnectionActionResult | null {
  if (existing.status === 'connected') return null;
  return {
    success: false,
    code: 'error',
    message:
      existing.status === 'inactive' ? inactiveMessage : otherMessage,
  };
}

function resolveImportColumns(
  mapping: Record<string, SheetsContactImportField>,
): Partial<Record<'name' | 'email' | 'phone' | 'notes', string>> {
  const out: Partial<Record<'name' | 'email' | 'phone' | 'notes', string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    const key = header.trim();
    if (!key || field === 'skip') continue;
    if (!out[field]) out[field] = key;
  }
  return out;
}

export class ConnectionService {
  private readonly connections = new WorkspaceConnectionRepository();
  private readonly credentials = new ConnectionCredentialRepository();
  private readonly contacts = new CrmContactRepository();
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

  whatsAppEmbeddedSignupConfig(): WhatsAppEmbeddedSignupConfig {
    return metaWhatsAppEmbeddedSignupPublicConfig();
  }

  /**
   * Completes Meta WhatsApp Embedded Signup (FB.login code + optional session ids).
   * Exchanges code → BISU token, persists connection, subscribes WABA, auto-binds phone.
   */
  async completeWhatsAppEmbeddedSignup(
    workspaceId: WorkspaceId,
    actorId: UserId,
    input: WhatsAppEmbeddedSignupCompleteInput,
  ): Promise<ConnectionActionResult> {
    const code = input.code?.trim();
    if (!code) {
      return {
        success: false,
        code: 'error',
        message: 'חסר קוד הרשאה מ-Meta Embedded Signup',
      };
    }

    const config = metaConnectionClientConfig('whatsapp');
    if (!config) {
      return {
        success: false,
        code: 'error',
        message: metaConnectionConfigMissingMessage('whatsapp'),
      };
    }

    try {
      const exchanged = await exchangeMetaEmbeddedSignupCode({
        code,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });

      const credentials: Record<string, string> = {
        accessToken: exchanged.accessToken,
      };
      if (exchanged.expiresIn) {
        credentials['expiresAt'] = String(
          Date.now() + exchanged.expiresIn * 1000,
        );
      }

      let phoneNumberId = input.phoneNumberId?.trim() || undefined;
      let wabaId = input.wabaId?.trim() || undefined;
      let displayPhoneNumber = input.displayPhoneNumber?.trim() || undefined;

      if (wabaId) {
        try {
          await subscribeWhatsAppWaba(exchanged.accessToken, wabaId);
        } catch {
          /* subscribe may fail if already subscribed — continue */
        }
      }

      if (!phoneNumberId || !wabaId) {
        try {
          const phones = wabaId
            ? await listWhatsAppPhoneNumbersForWaba(
                exchanged.accessToken,
                wabaId,
              )
            : await listWhatsAppPhoneNumbers(exchanged.accessToken);
          if (!phoneNumberId && phones[0]) {
            phoneNumberId = phones[0].phoneNumberId;
            displayPhoneNumber =
              displayPhoneNumber ?? phones[0].displayPhoneNumber;
            wabaId = wabaId ?? phones[0].wabaId;
          } else if (phoneNumberId) {
            const match = phones.find((p) => p.phoneNumberId === phoneNumberId);
            if (match) {
              displayPhoneNumber =
                displayPhoneNumber ?? match.displayPhoneNumber;
              wabaId = wabaId ?? match.wabaId;
            }
          }
        } catch {
          /* discovery optional when session already provided ids */
        }
      }

      const persist = await this.persistConnected({
        workspaceId,
        integrationId: 'whatsapp',
        provider: 'meta',
        actorId,
        result: {
          success: true,
          code: 'ok',
          credentials,
          externalAccountId: wabaId ?? phoneNumberId ?? 'whatsapp',
          externalAccountName:
            displayPhoneNumber ?? wabaId ?? 'WhatsApp Business',
          capabilities: [
            'messaging.whatsapp.send',
            'messaging.whatsapp.receive',
          ],
          message: 'WhatsApp Embedded Signup completed',
        },
        connectionId: input.connectionId,
        auditAction: input.connectionId
          ? 'connection.reconnected'
          : 'connection.connected',
        eventType: EVENT_TYPES.CONNECTION_CONNECTED,
      });

      if (!persist.success || !persist.connection) {
        return persist;
      }

      if (phoneNumberId) {
        const meta: WhatsAppConnectionMetadata = {
          phoneNumberId,
          displayPhoneNumber: displayPhoneNumber ?? phoneNumberId,
          wabaId,
          lastBoundAt: new Date().toISOString(),
        };
        const connection = await this.connections.updateMetadata(
          workspaceId,
          persist.connection.id,
          meta as unknown as Record<string, unknown>,
        );
        return {
          success: true,
          code: 'ok',
          message: `WhatsApp חובר: ${meta.displayPhoneNumber}`,
          connection: connection ?? persist.connection,
        };
      }

      return {
        success: true,
        code: 'ok',
        message:
          'WhatsApp חובר — בחרו מספר מהרשימה או השלימו Embedded Signup עם מספר',
        connection: persist.connection,
      };
    } catch (err) {
      await this.audit.record({
        workspaceId,
        actorId,
        action: 'connection.failed',
        metadata: {
          integrationId: 'whatsapp',
          provider: 'meta',
          flow: 'embedded_signup',
        },
      });
      return {
        success: false,
        code: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'השלמת WhatsApp Embedded Signup נכשלה',
      };
    }
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
   * For Meta, prefers `pageAccessToken` when present (Page / IG messaging).
   */
  async getValidAccessToken(
    workspaceId: WorkspaceId,
    connectionId: string,
    opts?: { preferPageToken?: boolean },
  ): Promise<string> {
    const existing = await this.connections.findById(workspaceId, connectionId);
    if (!existing) {
      throw new Error('Connection not found');
    }
    if (existing.status !== 'connected') {
      throw new Error(
        existing.status === 'inactive'
          ? 'החיבור אינו פעיל — הפעילו אותו כדי להשתמש בחיבור'
          : 'Connection is not active',
      );
    }

    const ciphertext = await this.credentials.findCiphertext(existing.id);
    if (!ciphertext) {
      throw new Error('No credentials stored for this connection');
    }

    const creds = this.store.decrypt(ciphertext);
    if (opts?.preferPageToken !== false && creds['pageAccessToken']) {
      return creds['pageAccessToken'];
    }

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

    if (existing.provider === 'meta') {
      throw new Error(
        'תוקף הגישה ל-Meta פג — חברו מחדש את החיבור',
      );
    }

    const refreshToken = creds['refreshToken'];
    if (!refreshToken) {
      throw new Error(
        'תוקף הגישה פג ואין refresh token — חברו מחדש את החיבור',
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

    if (existing.integrationId === 'google_sheets') {
      return this.bindSheetsResource(workspaceId, id, actorId, existing, input);
    }
    if (existing.integrationId === 'google_analytics') {
      return this.bindAnalyticsResource(
        workspaceId,
        id,
        actorId,
        existing,
        input,
      );
    }
    if (existing.integrationId === 'google_business') {
      return this.bindBusinessResource(
        workspaceId,
        id,
        actorId,
        existing,
        input,
      );
    }
    if (existing.integrationId === 'facebook') {
      return this.bindFacebookResource(
        workspaceId,
        id,
        actorId,
        existing,
        input,
      );
    }
    if (existing.integrationId === 'instagram') {
      return this.bindInstagramResource(
        workspaceId,
        id,
        actorId,
        existing,
        input,
      );
    }
    if (existing.integrationId === 'whatsapp') {
      return this.bindWhatsAppResource(
        workspaceId,
        id,
        actorId,
        existing,
        input,
      );
    }

    return {
      success: false,
      code: 'error',
      message: 'קשירת משאב אינה זמינה לחיבור זה',
    };
  }

  private async mergeCredentials(
    connectionId: string,
    patch: Record<string, string>,
  ): Promise<void> {
    const id = connectionId as import('@kodem/contracts').ConnectionId;
    const ciphertext = await this.credentials.findCiphertext(id);
    if (!ciphertext) {
      throw new Error('No credentials stored for this connection');
    }
    const creds = this.store.decrypt(ciphertext);
    const encrypted = this.store.encrypt({ ...creds, ...patch });
    await this.credentials.upsert(
      id,
      encrypted.ciphertext,
      encrypted.keyVersion,
    );
  }

  private async bindFacebookResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת דף',
      'יש לחבר את Facebook תחילה',
    );
    if (inactive) return inactive;

    const pageId = input.pageId?.trim();
    if (!pageId) {
      return {
        success: false,
        code: 'error',
        message: 'נא לבחור דף Facebook',
      };
    }

    try {
      const userToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const pages = await listFacebookPages(userToken);
      const page = pages.find((p) => p.pageId === pageId);
      if (!page) {
        return {
          success: false,
          code: 'error',
          message: 'הדף לא נמצא בחשבון המחובר',
        };
      }
      await this.mergeCredentials(id, { pageAccessToken: page.accessToken });
      const meta: FacebookConnectionMetadata = {
        pageId: page.pageId,
        pageName: page.name,
        lastBoundAt: new Date().toISOString(),
      };
      const connection = await this.connections.updateMetadata(
        workspaceId,
        id,
        meta as unknown as Record<string, unknown>,
      );
      await this.audit.record({
        workspaceId,
        actorId,
        targetId: id,
        action: 'connection.reconnected',
        metadata: { integrationId: 'facebook', pageId },
      });
      return {
        success: true,
        code: 'ok',
        message: `הדף נקשר: ${page.name}`,
        connection: connection ?? existing,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'קשירת הדף נכשלה',
        connection: existing,
      };
    }
  }

  private async bindInstagramResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת חשבון',
      'יש לחבר את Instagram תחילה',
    );
    if (inactive) return inactive;

    const igUserId = input.igUserId?.trim();
    if (!igUserId) {
      return {
        success: false,
        code: 'error',
        message: 'נא לבחור חשבון Instagram',
      };
    }

    try {
      const userToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const accounts = await listInstagramAccounts(userToken);
      const account = accounts.find((a) => a.igUserId === igUserId);
      if (!account) {
        return {
          success: false,
          code: 'error',
          message: 'חשבון Instagram לא נמצא',
        };
      }
      await this.mergeCredentials(id, {
        pageAccessToken: account.pageAccessToken,
      });
      const meta: InstagramConnectionMetadata = {
        igUserId: account.igUserId,
        igUsername: account.username,
        pageId: account.pageId,
        lastBoundAt: new Date().toISOString(),
      };
      const connection = await this.connections.updateMetadata(
        workspaceId,
        id,
        meta as unknown as Record<string, unknown>,
      );
      await this.audit.record({
        workspaceId,
        actorId,
        targetId: id,
        action: 'connection.reconnected',
        metadata: { integrationId: 'instagram', igUserId },
      });
      return {
        success: true,
        code: 'ok',
        message: `Instagram נקשר: @${account.username}`,
        connection: connection ?? existing,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'קשירת Instagram נכשלה',
        connection: existing,
      };
    }
  }

  private async bindWhatsAppResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת מספר',
      'יש לחבר את WhatsApp תחילה',
    );
    if (inactive) return inactive;

    const phoneNumberId = input.phoneNumberId?.trim();
    if (!phoneNumberId) {
      return {
        success: false,
        code: 'error',
        message: 'נא לבחור מספר WhatsApp',
      };
    }

    try {
      const userToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const phones = await listWhatsAppPhoneNumbers(userToken);
      const phone =
        phones.find((p) => p.phoneNumberId === phoneNumberId) ??
        (input.wabaId
          ? {
              phoneNumberId,
              displayPhoneNumber: phoneNumberId,
              wabaId: input.wabaId,
            }
          : null);
      if (!phone) {
        return {
          success: false,
          code: 'error',
          message:
            'מספר WhatsApp לא נמצא — ודאו הרשאות Business / Embedded Signup',
        };
      }
      const meta: WhatsAppConnectionMetadata = {
        phoneNumberId: phone.phoneNumberId,
        displayPhoneNumber: phone.displayPhoneNumber,
        wabaId: phone.wabaId,
        lastBoundAt: new Date().toISOString(),
      };
      const connection = await this.connections.updateMetadata(
        workspaceId,
        id,
        meta as unknown as Record<string, unknown>,
      );
      await this.audit.record({
        workspaceId,
        actorId,
        targetId: id,
        action: 'connection.reconnected',
        metadata: { integrationId: 'whatsapp', phoneNumberId },
      });
      return {
        success: true,
        code: 'ok',
        message: `WhatsApp נקשר: ${phone.displayPhoneNumber}`,
        connection: connection ?? existing,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'קשירת WhatsApp נכשלה',
        connection: existing,
      };
    }
  }

  private async bindSheetsResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת קובץ',
      'יש לחבר את Google Sheets לפני בחירת קובץ',
    );
    if (inactive) return inactive;

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

  private async bindAnalyticsResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת נכס',
      'יש לחבר את Google Analytics לפני בחירת נכס',
    );
    if (inactive) return inactive;

    const raw = input.propertyId?.trim();
    if (!raw) {
      return {
        success: false,
        code: 'error',
        message: 'נא לבחור נכס Analytics',
      };
    }
    const propertyId = raw.replace(/^properties\//, '');

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const summary = await getAnalyticsProperty(accessToken, propertyId);
      const meta: GoogleAnalyticsConnectionMetadata = {
        propertyId: summary.propertyId,
        propertyName: summary.displayName,
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
          propertyId: summary.propertyId,
          bound: true,
        },
      });

      return {
        success: true,
        code: 'ok',
        connection: connection ?? undefined,
        message: `נקשר: ${summary.displayName}`,
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'קשירת הנכס נכשלה',
        connection: existing,
      };
    }
  }

  private async bindBusinessResource(
    workspaceId: WorkspaceId,
    id: string,
    actorId: UserId,
    existing: WorkspaceConnection,
    input: BindConnectionResourceInput,
  ): Promise<ConnectionActionResult> {
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו לפני בחירת מיקום',
      'יש לחבר את Google Business Profile לפני בחירת מיקום',
    );
    if (inactive) return inactive;

    const locationName = input.locationName?.trim();
    if (!locationName) {
      return {
        success: false,
        code: 'error',
        message: 'נא לבחור מיקום עסקי',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const summary = await getBusinessLocation(accessToken, locationName);
      const meta: GoogleBusinessConnectionMetadata = {
        locationName: summary.locationName,
        locationTitle: summary.title,
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
          locationName: summary.locationName,
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
        message: err instanceof Error ? err.message : 'קשירת המיקום נכשלה',
        connection: existing,
      };
    }
  }

  async listAnalyticsProperties(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionAnalyticsPropertiesResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'google_analytics') {
      return {
        success: false,
        code: 'error',
        message: 'רשימת נכסים זמינה רק ל-Google Analytics',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לטעון נכסים',
      'יש לחבר את Google Analytics תחילה',
    );
    if (inactive) return inactive;

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const properties = await listAnalyticsProperties(accessToken);
      return { properties };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת הנכסים נכשלה',
        connection: existing,
      };
    }
  }

  async listBusinessLocations(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionBusinessLocationsResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'google_business') {
      return {
        success: false,
        code: 'error',
        message: 'רשימת מיקומים זמינה רק ל-Google Business Profile',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לטעון מיקומים',
      'יש לחבר את Google Business Profile תחילה',
    );
    if (inactive) return inactive;

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const locations = await listBusinessLocations(accessToken);
      return { locations };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת המיקומים נכשלה',
        connection: existing,
      };
    }
  }

  async listFacebookPages(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionFacebookPagesResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'facebook') {
      return {
        success: false,
        code: 'error',
        message: 'רשימת דפים זמינה רק לחיבור Facebook',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לטעון דפים',
      'יש לחבר את Facebook תחילה',
    );
    if (inactive) return inactive;

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const pages = await listFacebookPages(accessToken);
      return {
        pages: pages.map((p) => ({ pageId: p.pageId, name: p.name })),
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת הדפים נכשלה',
        connection: existing,
      };
    }
  }

  async listInstagramAccounts(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionInstagramAccountsResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'instagram') {
      return {
        success: false,
        code: 'error',
        message: 'רשימת חשבונות זמינה רק לחיבור Instagram',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לטעון חשבונות',
      'יש לחבר את Instagram תחילה',
    );
    if (inactive) return inactive;

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const accounts = await listInstagramAccounts(accessToken);
      return {
        accounts: accounts.map((a) => ({
          igUserId: a.igUserId,
          username: a.username,
          pageId: a.pageId,
          pageName: a.pageName,
        })),
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת חשבונות Instagram נכשלה',
        connection: existing,
      };
    }
  }

  async listWhatsAppPhoneNumbers(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConnectionWhatsAppPhoneNumbersResult | ConnectionActionResult> {
    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { success: false, code: 'error', message: 'Connection not found' };
    }
    if (existing.integrationId !== 'whatsapp') {
      return {
        success: false,
        code: 'error',
        message: 'רשימת מספרים זמינה רק לחיבור WhatsApp',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לטעון מספרים',
      'יש לחבר את WhatsApp תחילה',
    );
    if (inactive) return inactive;

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id, {
        preferPageToken: false,
      });
      const phoneNumbers = await listWhatsAppPhoneNumbers(accessToken);
      return {
        phoneNumbers: phoneNumbers.map((p) => ({
          phoneNumberId: p.phoneNumberId,
          displayPhoneNumber: p.displayPhoneNumber,
          verifiedName: p.verifiedName,
          wabaId: p.wabaId,
        })),
      };
    } catch (err) {
      return {
        success: false,
        code: 'error',
        message: err instanceof Error ? err.message : 'טעינת מספרי WhatsApp נכשלה',
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

  async importContactsFromSheets(
    workspaceId: WorkspaceId,
    id: string,
    input: ImportContactsFromSheetsInput,
  ): Promise<ImportContactsFromSheetsResult> {
    const empty: ImportContactsFromSheetsResult = {
      success: false,
      created: 0,
      skipped: 0,
      errors: [],
    };

    const existing = await this.connections.findById(workspaceId, id);
    if (!existing) {
      return { ...empty, message: 'Connection not found', code: 'error' };
    }
    if (existing.integrationId !== 'google_sheets') {
      return {
        ...empty,
        message: 'ייבוא אנשי קשר זמין רק לחיבור Google Sheets',
        code: 'error',
      };
    }
    const inactive = requireActive(
      existing,
      'החיבור מחובר אך לא פעיל — הפעילו אותו כדי לייבא',
      'יש לחבר את Google Sheets תחילה',
    );
    if (inactive) {
      return {
        ...empty,
        message: inactive.message,
        code: inactive.code,
      };
    }

    const bound = sheetsMetadata(existing);
    if (!bound) {
      return {
        ...empty,
        message: 'לא נבחר גיליון — הדביקו קישור לקובץ Sheets',
        code: 'error',
      };
    }

    const sheet = input.sheet?.trim();
    if (!sheet) {
      return { ...empty, message: 'נא לבחור גיליון', code: 'error' };
    }

    const headerRow = Math.max(0, Math.floor(input.headerRow ?? 0));
    const dataCap = Math.min(
      Math.max(input.maxRows ?? SHEETS_IMPORT_ROW_CAP, 1),
      SHEETS_IMPORT_ROW_HARD_CAP,
    );

    const mapping = input.mapping ?? {};
    const fieldColumns = resolveImportColumns(mapping);
    if (!fieldColumns.name) {
      return {
        ...empty,
        message: 'יש למפות לפחות עמודה אחת לשדה שם',
        code: 'error',
      };
    }

    try {
      const accessToken = await this.getValidAccessToken(workspaceId, id);
      const range = defaultImportRange(sheet, dataCap + headerRow);
      const fetched = await getValues(
        accessToken,
        bound.spreadsheetId,
        range,
        { maxRows: dataCap + headerRow + 1 },
      );
      const rows = fetched.values;
      if (rows.length <= headerRow) {
        return {
          success: true,
          spreadsheetId: bound.spreadsheetId,
          sheet,
          created: 0,
          skipped: 0,
          errors: [],
          message: 'אין שורות לייבוא',
        };
      }

      const headers = (rows[headerRow] ?? []).map((h) => h.trim());
      const colIndex = (header: string) =>
        headers.findIndex((h) => h === header);

      const nameIdx = colIndex(fieldColumns.name);
      if (nameIdx < 0) {
        return {
          ...empty,
          message: `עמודת השם "${fieldColumns.name}" לא נמצאה בכותרות`,
          code: 'error',
        };
      }
      const emailIdx = fieldColumns.email
        ? colIndex(fieldColumns.email)
        : -1;
      const phoneIdx = fieldColumns.phone
        ? colIndex(fieldColumns.phone)
        : -1;
      const notesIdx = fieldColumns.notes
        ? colIndex(fieldColumns.notes)
        : -1;

      let created = 0;
      let skipped = 0;
      const errors: Array<{ row: number; message: string }> = [];
      const contactIds: string[] = [];
      const dataRows = rows.slice(headerRow + 1, headerRow + 1 + dataCap);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] ?? [];
        const sheetRowNumber = headerRow + 2 + i; // 1-based spreadsheet row
        const cell = (idx: number) =>
          idx >= 0 ? (row[idx] ?? '').trim() : '';
        const name = cell(nameIdx);
        const email = cell(emailIdx);
        const phone = cell(phoneIdx);
        const notes = cell(notesIdx);

        if (!name && !email && !phone && !notes) {
          skipped += 1;
          continue;
        }
        if (!name) {
          skipped += 1;
          errors.push({
            row: sheetRowNumber,
            message: 'חסר שם',
          });
          continue;
        }

        try {
          const contact = await this.contacts.create(workspaceId, {
            name,
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
            ...(notes ? { notes } : {}),
          });
          created += 1;
          contactIds.push(contact.id);
        } catch (err) {
          errors.push({
            row: sheetRowNumber,
            message:
              err instanceof Error ? err.message : 'יצירת איש קשר נכשלה',
          });
        }
      }

      return {
        success: true,
        spreadsheetId: bound.spreadsheetId,
        sheet,
        created,
        skipped,
        errors: errors.slice(0, 25),
        contactIds,
        message:
          created > 0
            ? `יובאו ${created} אנשי קשר${skipped ? ` (דולגו ${skipped})` : ''}`
            : skipped
              ? `לא יובאו אנשי קשר — דולגו ${skipped} שורות`
              : 'אין שורות לייבוא',
      };
    } catch (err) {
      return {
        ...empty,
        message: err instanceof Error ? err.message : 'ייבוא אנשי הקשר נכשל',
        code: 'error',
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

    if (existing.integrationId === 'google_analytics') {
      try {
        const accessToken = await this.getValidAccessToken(workspaceId, id);
        const bound = analyticsMetadata(existing);
        if (!bound) {
          return {
            success: true,
            code: 'ok',
            message: 'החיבור תקין — עדיין לא נבחר נכס',
            connection: existing,
          };
        }
        const smoke = await runAnalyticsSessionsSmoke(
          accessToken,
          bound.propertyId,
        );
        return {
          success: true,
          code: 'ok',
          message: `החיבור תקין: ${bound.propertyName ?? bound.propertyId} · ${smoke.sessions} sessions (7 ימים)`,
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

    if (existing.integrationId === 'google_business') {
      try {
        const accessToken = await this.getValidAccessToken(workspaceId, id);
        const bound = businessMetadata(existing);
        if (!bound) {
          return {
            success: true,
            code: 'ok',
            message: 'החיבור תקין — עדיין לא נבחר מיקום',
            connection: existing,
          };
        }
        const summary = await getBusinessLocation(
          accessToken,
          bound.locationName,
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

    if (existing.integrationId === 'google_workspace') {
      try {
        await this.getValidAccessToken(workspaceId, id);
        return {
          success: true,
          code: 'ok',
          message: existing.externalAccountName
            ? `החיבור תקין: ${existing.externalAccountName}`
            : 'החיבור תקין',
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

    if (
      existing.integrationId === 'facebook' ||
      existing.integrationId === 'instagram' ||
      existing.integrationId === 'whatsapp'
    ) {
      try {
        await this.getValidAccessToken(workspaceId, id, {
          preferPageToken: false,
        });
        const bound =
          existing.integrationId === 'facebook'
            ? facebookMetadata(existing)
            : existing.integrationId === 'instagram'
              ? instagramMetadata(existing)
              : whatsappMetadata(existing);
        if (!bound) {
          return {
            success: true,
            code: 'ok',
            message: 'החיבור תקין — עדיין לא נבחר משאב',
            connection: existing,
          };
        }
        const label =
          existing.integrationId === 'facebook'
            ? (bound as FacebookConnectionMetadata).pageName ??
              (bound as FacebookConnectionMetadata).pageId
            : existing.integrationId === 'instagram'
              ? (bound as InstagramConnectionMetadata).igUsername ??
                (bound as InstagramConnectionMetadata).igUserId
              : (bound as WhatsAppConnectionMetadata).displayPhoneNumber ??
                (bound as WhatsAppConnectionMetadata).phoneNumberId;
        return {
          success: true,
          code: 'ok',
          message: `החיבור תקין: ${label}`,
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
