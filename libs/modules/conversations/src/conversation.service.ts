import type {
  ChannelType,
  ConversationDetail,
  ConversationIntakeInput,
  ConversationListResult,
  ConversationMessage,
  ConversationMessageType,
  ConversationStatus,
  ConversationSummary,
  IngestConversationResult,
  LeadStatus,
  MessageDirection,
  WorkspaceId,
} from '@kodem/contracts';
import {
  CHANNEL_TYPES,
  CONVERSATION_REPLY_CHANNELS,
  createId,
} from '@kodem/contracts';
import { Prisma, WorkspaceRepository, getPrismaClient } from '@kodem/database';
import { ChannelService } from '@kodem/platform/channels';
import { WorkspaceModuleService } from '@kodem/platform/workspace';
import { ConversationIngestService } from './ingest.service';
import { extractEmailAddress, normalizeEmail } from './normalize';

const CONTACT_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
} as const;

const LEAD_SELECT = { id: true, status: true } as const;

type SummaryRow = {
  id: string;
  workspaceId: string;
  channel: string;
  externalThreadKey: string;
  subject: string | null;
  preview: string | null;
  status: string;
  unread: boolean;
  lastMessageDirection: string;
  lastMessageAt: Date;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  lead: { id: string; status: string } | null;
};

function mapSummary(row: SummaryRow): ConversationSummary {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    channel: row.channel as ChannelType,
    externalThreadKey: row.externalThreadKey,
    subject: row.subject ?? undefined,
    preview: row.preview ?? undefined,
    status: row.status as ConversationStatus,
    unread: row.unread,
    lastMessageDirection: row.lastMessageDirection as MessageDirection,
    lastMessageAt: row.lastMessageAt,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    contact: {
      id: row.contact.id,
      name: row.contact.name,
      email: row.contact.email ?? undefined,
      phone: row.contact.phone ?? undefined,
    },
    lead: row.lead
      ? { id: row.lead.id, status: row.lead.status as LeadStatus }
      : undefined,
  };
}

function mapMessage(row: {
  id: string;
  conversationId: string;
  direction: string;
  body: string;
  externalMessageId: string;
  messageType: string;
  metadata: string | null;
  time: Date;
}): ConversationMessage {
  let metadata: Record<string, unknown> | undefined;
  if (row.metadata) {
    try {
      const parsed = JSON.parse(row.metadata) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        metadata = parsed as Record<string, unknown>;
      }
    } catch {
      metadata = undefined;
    }
  }
  return {
    id: row.id,
    conversationId: row.conversationId,
    direction: row.direction as MessageDirection,
    body: row.body,
    externalMessageId: row.externalMessageId,
    messageType: row.messageType as ConversationMessageType,
    metadata,
    time: row.time,
  };
}

export class ConversationService {
  private readonly db = getPrismaClient();
  private readonly ingest = new ConversationIngestService();
  private readonly channels = new ChannelService();
  private readonly modules = new WorkspaceModuleService();
  private readonly workspaces = new WorkspaceRepository();

  async list(
    workspaceId: WorkspaceId,
    query: {
      channel?: ChannelType;
      unread?: boolean;
      q?: string;
      contactId?: string;
    } = {},
  ): Promise<ConversationListResult> {
    const where: Prisma.ConversationWhereInput = { workspaceId };
    if (query.contactId) where.contactId = query.contactId;
    if (query.channel) where.channel = query.channel;
    if (query.unread) where.unread = true;
    const q = query.q?.trim();
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { preview: { contains: q, mode: 'insensitive' } },
        { contact: { name: { contains: q, mode: 'insensitive' } } },
        { messages: { some: { body: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [rows, grouped, unreadCount] = await Promise.all([
      this.db.conversation.findMany({
        where,
        include: { contact: { select: CONTACT_SELECT }, lead: { select: LEAD_SELECT } },
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
      }),
      this.db.conversation.groupBy({
        by: ['channel'],
        where: { workspaceId },
        _count: { _all: true },
      }),
      this.db.conversation.count({ where: { workspaceId, unread: true } }),
    ]);

    const byChannel = new Map(grouped.map((row) => [row.channel, row._count._all]));
    return {
      conversations: rows.map(mapSummary),
      counts: CHANNEL_TYPES.map((channel) => ({
        channel,
        count: byChannel.get(channel) ?? 0,
      })),
      unreadCount,
    };
  }

  async get(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConversationDetail | null> {
    const row = await this.db.conversation.findFirst({
      where: { id, workspaceId },
      include: {
        contact: { select: CONTACT_SELECT },
        lead: { select: LEAD_SELECT },
        messages: { orderBy: { time: 'asc' } },
      },
    });
    if (!row) return null;
    return {
      ...mapSummary(row),
      messages: row.messages.map(mapMessage),
    };
  }

  async markRead(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<ConversationDetail | null> {
    const existing = await this.db.conversation.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });
    if (!existing) return null;
    await this.db.conversation.update({
      where: { id },
      data: { unread: false },
    });
    return this.get(workspaceId, id);
  }

  async reply(
    workspaceId: WorkspaceId,
    id: string,
    body: string,
  ): Promise<IngestConversationResult> {
    const text = body.trim();
    if (!text) throw new Error('נא לכתוב הודעה');
    const conversation = await this.get(workspaceId, id);
    if (!conversation) throw new Error('השיחה לא נמצאה');
    if (
      !CONVERSATION_REPLY_CHANNELS.includes(
        conversation.channel as (typeof CONVERSATION_REPLY_CHANNELS)[number],
      )
    ) {
      throw new Error('אין שליחה בערוץ זה');
    }

    let externalMessageId: string | undefined;
    let externalUserId: string | undefined;
    if (conversation.channel === 'email') {
      const to = conversation.contact.email;
      if (!to) throw new Error('לאיש הקשר אין אימייל');
      const sent = await this.channels.sendEmail(workspaceId, {
        to,
        subject: conversation.subject ? `Re: ${conversation.subject}` : 'Re:',
        body: text,
      });
      if (!sent.success) throw new Error(sent.message ?? 'שליחת האימייל נכשלה');
      externalMessageId = sent.messageId;
      externalUserId = to;
    } else if (conversation.channel === 'whatsapp') {
      const to = conversation.contact.phone;
      if (!to) throw new Error('לאיש הקשר אין טלפון');
      const sent = await this.channels.sendMessaging(workspaceId, 'whatsapp', {
        to,
        body: text,
      });
      if (!sent.success) throw new Error(sent.message ?? 'השליחה נכשלה');
      externalMessageId = sent.messageId;
      externalUserId = to;
    } else {
      const channel = conversation.channel as 'instagram' | 'facebook_messenger';
      const identity = await this.db.crmContactIdentity.findFirst({
        where: {
          workspaceId,
          contactId: conversation.contact.id,
          channel,
        },
      });
      if (!identity) throw new Error('לא נמצא מזהה נמען בערוץ');
      externalUserId = identity.externalUserId;
      const sent = await this.channels.sendMessaging(workspaceId, channel, {
        to: identity.externalUserId,
        body: text,
      });
      if (!sent.success) throw new Error(sent.message ?? 'השליחה נכשלה');
      externalMessageId = sent.messageId;
    }

    return this.ingest.ingest({
      workspaceId,
      channel: conversation.channel,
      externalThreadKey: conversation.externalThreadKey,
      externalMessageId: externalMessageId ?? `out_${createId('msg')}`,
      direction: 'outbound',
      body: text,
      messageType: 'text',
      occurredAt: new Date(),
      contact: {
        name: conversation.contact.name,
        email: conversation.contact.email,
        phone: conversation.contact.phone,
        externalUserId,
      },
    });
  }

  async syncEmail(
    workspaceId: WorkspaceId,
  ): Promise<{ imported: number; skipped: number }> {
    const listed = await this.channels.listEmailMessages(workspaceId, {
      maxResults: 30,
    });
    if (!listed.success) {
      throw new Error(listed.message ?? 'סנכרון האימייל נכשל');
    }
    let imported = 0;
    let skipped = 0;
    for (const message of listed.messages) {
      const email = extractEmailAddress(message.from ?? '');
      if (!message.id || !message.threadId || !email.includes('@')) {
        skipped += 1;
        continue;
      }
      const result = await this.ingest.ingest({
        workspaceId,
        channel: 'email',
        externalThreadKey: message.threadId,
        externalMessageId: message.id,
        direction: 'inbound',
        body: message.snippet ?? '',
        messageType: 'text',
        occurredAt: message.date ? new Date(message.date) : new Date(),
        subject: message.subject,
        contact: {
          email,
          name: message.from,
          externalUserId: email,
        },
      });
      if (result.duplicate) skipped += 1;
      else imported += 1;
    }
    return { imported, skipped };
  }

  async intakeWeb(
    input: ConversationIntakeInput,
  ): Promise<IngestConversationResult> {
    const workspace = await this.workspaces.findBySlug(input.slug.trim());
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
    await this.modules.enableMissingEntitledModules(workspace.id);
    const allowed = await this.modules.canUseModule(
      workspace.id,
      'conversations',
    );
    if (!allowed) throw new Error('WORKSPACE_NOT_FOUND');
    const email = normalizeEmail(input.email);
    return this.ingest.ingest({
      workspaceId: workspace.id,
      channel: 'web_chat',
      externalThreadKey: createId('wth'),
      externalMessageId: createId('wmsg'),
      direction: 'inbound',
      body: input.message.trim(),
      messageType: 'text',
      occurredAt: new Date(),
      subject: input.message.trim().slice(0, 80),
      contact: {
        name: input.name.trim(),
        email,
        externalUserId: email,
      },
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
    });
  }
}
