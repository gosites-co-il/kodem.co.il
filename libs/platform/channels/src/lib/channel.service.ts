import type {
  ChannelCatalogItem,
  ChannelType,
  ConfigureChannelInput,
  ConnectionId,
  EmailMessageItem,
  EmailMessagesResult,
  EmailSendInput,
  EmailSendResult,
  MessagingMessageItem,
  MessagingMessagesResult,
  MessagingSendInput,
  MessagingSendResult,
  UserId,
  WorkspaceChannel,
  WorkspaceId,
} from '@kodem/contracts';
import {
  PrismaEventStore,
  WorkspaceChannelRepository,
  WorkspaceConnectionRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import {
  gmailListMessages,
  gmailSendMessage,
  instagramListConversations,
  instagramSendText,
  listMetaInboundMessages,
  messengerListConversations,
  messengerSendText,
  whatsappSendText,
} from '@kodem/integrations';
import {
  PLATFORM_CHANNELS,
  getChannelDefinition,
} from '@kodem/platform/catalog';
import { ConnectionService } from '@kodem/platform/connections';

const META_CHANNEL_INTEGRATION: Partial<
  Record<ChannelType, 'facebook' | 'instagram' | 'whatsapp'>
> = {
  facebook_messenger: 'facebook',
  instagram: 'instagram',
  whatsapp: 'whatsapp',
};

export class ChannelService {
  private readonly channels = new WorkspaceChannelRepository();
  private readonly connections = new WorkspaceConnectionRepository();
  private readonly connectionService = new ConnectionService();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  async listCatalog(workspaceId: WorkspaceId): Promise<ChannelCatalogItem[]> {
    const existing = await this.channels.findByWorkspace(workspaceId);
    const byType = new Map(
      existing.map((e) => [e.channel.type, e] as const),
    );
    const connections = await this.connections.findByWorkspace(workspaceId);
    const connById = new Map(connections.map((c) => [c.id, c] as const));

    return PLATFORM_CHANNELS.map((def) => {
      const row = byType.get(def.type);
      const channel: WorkspaceChannel | null = row
        ? {
            ...row.channel,
            bindings: row.bindings.map((b) => {
              const conn = connById.get(b.connectionId as ConnectionId);
              return {
                connectionId: b.connectionId as ConnectionId,
                isPrimary: b.isPrimary,
                provider: conn?.provider,
                externalAccountName: conn?.externalAccountName,
              };
            }),
          }
        : null;

      return {
        type: def.type,
        name: def.name,
        description: def.description,
        allowedProviders: def.allowedProviders,
        status: def.status,
        channel,
      };
    });
  }

  /**
   * CRM / Campaigns port — list configured channels without provider details.
   */
  async listWorkspaceChannels(
    workspaceId: WorkspaceId,
  ): Promise<WorkspaceChannel[]> {
    const catalog = await this.listCatalog(workspaceId);
    return catalog
      .map((c) => c.channel)
      .filter((c): c is WorkspaceChannel => c != null);
  }

  async getByType(
    workspaceId: WorkspaceId,
    type: ChannelType,
  ): Promise<WorkspaceChannel | null> {
    const catalog = await this.listCatalog(workspaceId);
    return catalog.find((c) => c.type === type)?.channel ?? null;
  }

  async configure(
    workspaceId: WorkspaceId,
    type: ChannelType,
    input: ConfigureChannelInput,
    _actorId: UserId,
  ): Promise<WorkspaceChannel> {
    const def = getChannelDefinition(type);
    if (!def) {
      throw new Error('Unknown channel type');
    }

    const connection = await this.connections.findById(
      workspaceId,
      input.connectionId,
    );
    if (!connection || connection.status !== 'connected') {
      throw new Error('Connection not found or not connected');
    }
    if (!def.allowedProviders.includes(connection.provider)) {
      throw new Error('Connection provider cannot back this channel');
    }
    if (
      type === 'email' &&
      connection.provider === 'google' &&
      connection.integrationId !== 'google_workspace'
    ) {
      throw new Error(
        'ערוץ אימייל דורש חיבור Google Workspace (לא Sheets / Analytics)',
      );
    }
    const expectedMeta = META_CHANNEL_INTEGRATION[type];
    if (expectedMeta && connection.integrationId !== expectedMeta) {
      throw new Error(
        `ערוץ זה דורש חיבור ${expectedMeta}`,
      );
    }

    const channel = await this.channels.upsertChannel({
      workspaceId,
      type,
      status: 'connected',
    });

    await this.channels.setBinding({
      channelId: channel.id,
      connectionId: connection.id,
      isPrimary: input.isPrimary !== false,
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.CHANNEL_CONFIGURED,
      workspaceId,
      payload: {
        channelId: channel.id,
        type,
        connectionId: connection.id,
      },
    });

    const result = await this.getByType(workspaceId, type);
    if (!result) {
      throw new Error('Failed to load configured channel');
    }
    return result;
  }

  async disconnect(
    workspaceId: WorkspaceId,
    type: ChannelType,
    _actorId: UserId,
  ): Promise<void> {
    const existing = await this.channels.findByType(workspaceId, type);
    if (!existing) return;

    await this.channels.clearBindings(existing.channel.id);
    await this.channels.upsertChannel({
      workspaceId,
      type,
      status: 'not_configured',
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.CHANNEL_DISCONNECTED,
      workspaceId,
      payload: { channelId: existing.channel.id, type },
    });
  }

  async sendEmail(
    workspaceId: WorkspaceId,
    input: EmailSendInput,
  ): Promise<EmailSendResult> {
    const resolved = await this.resolveEmailConnection(workspaceId);
    if (resolved.ok === false) {
      return { success: false, message: resolved.message };
    }

    try {
      const accessToken = await this.connectionService.getValidAccessToken(
        workspaceId,
        resolved.connectionId,
      );
      const sent = await gmailSendMessage(accessToken, {
        to: input.to,
        subject: input.subject,
        body: input.body,
      });
      return {
        success: true,
        message: `נשלח ל-${input.to.trim()}`,
        messageId: sent.id,
        threadId: sent.threadId,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'שליחת המייל נכשלה',
      };
    }
  }

  async listEmailMessages(
    workspaceId: WorkspaceId,
    opts?: { maxResults?: number },
  ): Promise<EmailMessagesResult> {
    const resolved = await this.resolveEmailConnection(workspaceId);
    if (resolved.ok === false) {
      return { success: false, messages: [], message: resolved.message };
    }

    try {
      const accessToken = await this.connectionService.getValidAccessToken(
        workspaceId,
        resolved.connectionId,
      );
      const messages = await gmailListMessages(accessToken, {
        maxResults: opts?.maxResults ?? 15,
      });
      const items: EmailMessageItem[] = messages.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        snippet: m.snippet,
        subject: m.subject,
        from: m.from,
        date: m.date,
      }));
      return { success: true, messages: items };
    } catch (err) {
      return {
        success: false,
        messages: [],
        message: err instanceof Error ? err.message : 'טעינת תיבת הדואר נכשלה',
      };
    }
  }

  private async resolveEmailConnection(
    workspaceId: WorkspaceId,
  ): Promise<
    | { ok: true; connectionId: string }
    | { ok: false; message: string }
  > {
    const channel = await this.getByType(workspaceId, 'email');
    if (!channel || channel.status !== 'connected') {
      return {
        ok: false,
        message: 'הגדירו את ערוץ האימייל עם חיבור Google Workspace תחילה',
      };
    }
    const primary =
      channel.bindings.find((b) => b.isPrimary) ?? channel.bindings[0];
    if (!primary) {
      return {
        ok: false,
        message: 'לערוץ האימייל אין חיבור מקושר',
      };
    }
    const connection = await this.connections.findById(
      workspaceId,
      primary.connectionId,
    );
    if (!connection || connection.status !== 'connected') {
      return {
        ok: false,
        message:
          connection?.status === 'inactive'
            ? 'חיבור Google Workspace אינו פעיל — הפעילו אותו תחת חיבורים'
            : 'חיבור Google Workspace חסר או מנותק',
      };
    }
    if (connection.integrationId !== 'google_workspace') {
      return {
        ok: false,
        message: 'ערוץ אימייל נתמך כרגע רק דרך Google Workspace',
      };
    }
    return { ok: true, connectionId: connection.id };
  }

  async sendMessaging(
    workspaceId: WorkspaceId,
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
    input: MessagingSendInput,
  ): Promise<MessagingSendResult> {
    const resolved = await this.resolveMetaChannel(workspaceId, type);
    if (resolved.ok === false) {
      return { success: false, message: resolved.message };
    }
    if (!input.to?.trim() || !input.body?.trim()) {
      return { success: false, message: 'נא למלא נמען ותוכן' };
    }

    try {
      const accessToken = await this.connectionService.getValidAccessToken(
        workspaceId,
        resolved.connectionId,
      );
      if (type === 'whatsapp') {
        const phoneNumberId = resolved.meta['phoneNumberId'];
        if (!phoneNumberId) {
          return {
            success: false,
            message: 'קשרו מספר WhatsApp בחיבור תחילה',
          };
        }
        const sent = await whatsappSendText(
          accessToken,
          phoneNumberId,
          input.to,
          input.body,
        );
        return {
          success: true,
          message: `נשלח ל-${input.to.trim()}`,
          messageId: sent.messageId,
        };
      }
      if (type === 'facebook_messenger') {
        const pageId = resolved.meta['pageId'];
        if (!pageId) {
          return { success: false, message: 'קשרו דף Facebook בחיבור תחילה' };
        }
        const sent = await messengerSendText(
          accessToken,
          pageId,
          input.to,
          input.body,
        );
        return {
          success: true,
          message: 'ההודעה נשלחה ב-Messenger',
          messageId: sent.messageId,
        };
      }
      const igUserId = resolved.meta['igUserId'];
      if (!igUserId) {
        return { success: false, message: 'קשרו חשבון Instagram בחיבור תחילה' };
      }
      const sent = await instagramSendText(
        accessToken,
        igUserId,
        input.to,
        input.body,
      );
      return {
        success: true,
        message: 'ההודעה נשלחה ב-Instagram',
        messageId: sent.messageId,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'שליחה נכשלה',
      };
    }
  }

  async listMessaging(
    workspaceId: WorkspaceId,
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
    opts?: { maxResults?: number },
  ): Promise<MessagingMessagesResult> {
    const resolved = await this.resolveMetaChannel(workspaceId, type);
    if (resolved.ok === false) {
      return { success: false, messages: [], message: resolved.message };
    }
    const limit = opts?.maxResults ?? 15;

    try {
      if (type === 'whatsapp') {
        const phoneNumberId = resolved.meta['phoneNumberId'];
        const inbound = listMetaInboundMessages({
          channel: 'whatsapp',
          phoneNumberId,
          limit,
        });
        const messages: MessagingMessageItem[] = inbound.map((m) => ({
          id: m.id,
          from: m.from,
          to: m.to,
          body: m.body,
          timestamp: m.timestamp,
          direction: 'inbound',
        }));
        return {
          success: true,
          messages,
          message:
            messages.length === 0
              ? 'אין הודעות נכנסות עדיין — הגדירו Webhook של Meta'
              : undefined,
        };
      }

      const accessToken = await this.connectionService.getValidAccessToken(
        workspaceId,
        resolved.connectionId,
      );

      if (type === 'facebook_messenger') {
        const pageId = resolved.meta['pageId'];
        if (!pageId) {
          return {
            success: false,
            messages: [],
            message: 'קשרו דף Facebook בחיבור תחילה',
          };
        }
        const rows = await messengerListConversations(
          accessToken,
          pageId,
          limit,
        );
        return {
          success: true,
          messages: rows.map((r) => ({
            id: r.id,
            from: r.from,
            body: r.body,
            timestamp: r.timestamp,
          })),
        };
      }

      const igUserId = resolved.meta['igUserId'];
      if (!igUserId) {
        return {
          success: false,
          messages: [],
          message: 'קשרו חשבון Instagram בחיבור תחילה',
        };
      }
      const rows = await instagramListConversations(
        accessToken,
        igUserId,
        limit,
      );
      return {
        success: true,
        messages: rows.map((r) => ({
          id: r.id,
          from: r.from,
          body: r.body,
          timestamp: r.timestamp,
        })),
      };
    } catch (err) {
      return {
        success: false,
        messages: [],
        message: err instanceof Error ? err.message : 'טעינת הודעות נכשלה',
      };
    }
  }

  private async resolveMetaChannel(
    workspaceId: WorkspaceId,
    type: 'whatsapp' | 'instagram' | 'facebook_messenger',
  ): Promise<
    | { ok: true; connectionId: string; meta: Record<string, string> }
    | { ok: false; message: string }
  > {
    const channel = await this.getByType(workspaceId, type);
    if (!channel || channel.status !== 'connected') {
      return {
        ok: false,
        message: 'הגדירו את הערוץ עם חיבור Meta תחילה',
      };
    }
    const primary =
      channel.bindings.find((b) => b.isPrimary) ?? channel.bindings[0];
    if (!primary) {
      return { ok: false, message: 'לערוץ אין חיבור מקושר' };
    }
    const connection = await this.connections.findById(
      workspaceId,
      primary.connectionId,
    );
    if (!connection || connection.status !== 'connected') {
      return {
        ok: false,
        message:
          connection?.status === 'inactive'
            ? 'החיבור אינו פעיל — הפעילו אותו תחת חיבורים'
            : 'החיבור חסר או מנותק',
      };
    }
    const expected = META_CHANNEL_INTEGRATION[type];
    if (expected && connection.integrationId !== expected) {
      return {
        ok: false,
        message: `ערוץ זה דורש חיבור ${expected}`,
      };
    }
    const meta: Record<string, string> = {};
    const raw = connection.metadata ?? {};
    for (const key of [
      'pageId',
      'pageName',
      'igUserId',
      'igUsername',
      'phoneNumberId',
      'displayPhoneNumber',
      'wabaId',
    ]) {
      if (typeof raw[key] === 'string') meta[key] = raw[key] as string;
    }
    return { ok: true, connectionId: connection.id, meta };
  }
}

/** Port type for CRM / modules that depend on Channels without providers. */
export type ChannelPort = Pick<
  ChannelService,
  | 'listWorkspaceChannels'
  | 'getByType'
  | 'sendEmail'
  | 'listEmailMessages'
  | 'sendMessaging'
  | 'listMessaging'
>;
