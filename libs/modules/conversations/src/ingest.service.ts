import type {
  IngestConversationInput,
  IngestConversationResult,
  NotificationPayload,
} from '@kodem/contracts';
import { createId } from '@kodem/contracts';
import { Prisma, getPrismaClient } from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import { PrismaEventStore } from '@kodem/database';
import { MailRouter } from '@kodem/platform/notifications';
import { CONTACT_PLACEHOLDER_NAME, normalizeEmail, normalizePhone } from './normalize';

type Tx = Prisma.TransactionClient;

interface CommittedIngest extends IngestConversationResult {
  outboxId?: string;
  notification?: NotificationPayload;
  leadEvent?: {
    leadId: string;
    name: string;
    status: string;
    source: string | null;
  };
}

function previewFor(body: string, messageType: string): string {
  const trimmed = body.trim();
  if (trimmed) return trimmed.slice(0, 180);
  if (messageType === 'image') return 'תמונה';
  if (messageType === 'file') return 'קובץ';
  if (messageType === 'audio') return 'הודעה קולית';
  if (messageType === 'video') return 'סרטון';
  if (messageType === 'system') return 'הודעת מערכת';
  return '';
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export class ConversationIngestService {
  private readonly db = getPrismaClient();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());
  private readonly mail = new MailRouter();

  async ingest(input: IngestConversationInput): Promise<IngestConversationResult> {
    const externalMessageId = input.externalMessageId.trim();
    const externalThreadKey = input.externalThreadKey.trim();
    if (!externalMessageId || !externalThreadKey) {
      throw new Error('external message id and thread key are required');
    }

    const committed = await this.db.$transaction((tx) =>
      this.ingestInTransaction(tx, {
        ...input,
        externalMessageId,
        externalThreadKey,
      }),
    );

    if (!committed.duplicate && committed.createdLead && committed.leadEvent) {
      try {
        await this.eventBus.emit({
          type: EVENT_TYPES.LEAD_CREATED,
          workspaceId: input.workspaceId,
          payload: {
            leadId: committed.leadEvent.leadId,
            name: committed.leadEvent.name,
            status: committed.leadEvent.status,
            source: committed.leadEvent.source,
          },
        });
      } catch (err) {
        console.error('[conversations] lead.created emit failed', err);
      }
    }

    if (committed.outboxId && committed.notification) {
      try {
        await this.mail.deliver(committed.notification);
        await this.db.notificationOutbox.update({
          where: { id: committed.outboxId },
          data: { status: 'sent', processedAt: new Date(), error: null },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.db.notificationOutbox.update({
          where: { id: committed.outboxId },
          data: { status: 'failed', processedAt: new Date(), error: message },
        });
      }
    }

    return {
      duplicate: committed.duplicate,
      conversationId: committed.conversationId,
      messageId: committed.messageId,
      contactId: committed.contactId,
      leadId: committed.leadId,
      createdLead: committed.createdLead,
    };
  }

  private async ingestInTransaction(
    tx: Tx,
    input: IngestConversationInput,
  ): Promise<CommittedIngest> {
    const existing = await tx.conversationMessage.findUnique({
      where: {
        workspaceId_externalMessageId: {
          workspaceId: input.workspaceId,
          externalMessageId: input.externalMessageId,
        },
      },
    });
    if (existing) {
      const conversation = await tx.conversation.findUnique({
        where: { id: existing.conversationId },
      });
      return {
        duplicate: true,
        conversationId: existing.conversationId,
        messageId: existing.id,
        contactId: conversation?.contactId ?? '',
        leadId: conversation?.leadId ?? undefined,
        createdLead: false,
      };
    }

    const phone = input.contact.phone
      ? normalizePhone(input.contact.phone)
      : '';
    const email = input.contact.email
      ? normalizeEmail(input.contact.email)
      : '';
    const externalUserId = input.contact.externalUserId?.trim() ?? '';
    const name = input.contact.name?.trim() || CONTACT_PLACEHOLDER_NAME;

    const contact = await this.resolveContact(tx, input.workspaceId, input.channel, {
      phone,
      email,
      externalUserId,
      name,
    });

    if (externalUserId) {
      await tx.crmContactIdentity.upsert({
        where: {
          workspaceId_channel_externalUserId: {
            workspaceId: input.workspaceId,
            channel: input.channel,
            externalUserId,
          },
        },
        create: {
          id: createId('cid'),
          workspaceId: input.workspaceId,
          contactId: contact.id,
          channel: input.channel,
          externalUserId,
        },
        update: {},
      });
    }

    const existingLead = await tx.crmLead.findFirst({
      where: {
        workspaceId: input.workspaceId,
        contactId: contact.id,
        status: { not: 'lost' },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let lead = existingLead;
    let createdLead = false;
    if (!lead) {
      lead = await tx.crmLead.create({
        data: {
          id: createId('lead'),
          workspaceId: input.workspaceId,
          contactId: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          source: input.channel,
          utmSource: optionalTrim(input.utmSource) ?? null,
          utmMedium: optionalTrim(input.utmMedium) ?? null,
          utmCampaign: optionalTrim(input.utmCampaign) ?? null,
          status: 'new',
        },
      });
      createdLead = true;
    }

    const preview = previewFor(input.body, input.messageType);
    const occurredAt = input.occurredAt;
    const conversation = await tx.conversation.upsert({
      where: {
        workspaceId_channel_externalThreadKey: {
          workspaceId: input.workspaceId,
          channel: input.channel,
          externalThreadKey: input.externalThreadKey,
        },
      },
      create: {
        id: createId('cnv'),
        workspaceId: input.workspaceId,
        contactId: contact.id,
        leadId: lead.id,
        channel: input.channel,
        externalThreadKey: input.externalThreadKey,
        subject: optionalTrim(input.subject) ?? null,
        preview,
        status: 'open',
        unread: input.direction === 'inbound',
        lastMessageDirection: input.direction,
        lastMessageAt: occurredAt,
        utmSource: optionalTrim(input.utmSource) ?? null,
        utmMedium: optionalTrim(input.utmMedium) ?? null,
        utmCampaign: optionalTrim(input.utmCampaign) ?? null,
      },
      update: {
        preview,
        lastMessageDirection: input.direction,
        lastMessageAt: occurredAt,
        ...(input.direction === 'inbound' ? { unread: true } : {}),
      },
    });

    if (!conversation.leadId) {
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { leadId: lead.id },
      });
    }

    const message = await tx.conversationMessage.create({
      data: {
        id: createId('msg'),
        workspaceId: input.workspaceId,
        conversationId: conversation.id,
        direction: input.direction,
        body: input.body,
        externalMessageId: input.externalMessageId,
        messageType: input.messageType,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        time: occurredAt,
      },
    });

    let outboxId: string | undefined;
    let notification: NotificationPayload | undefined;
    if (createdLead) {
      const workspace = await tx.workspace.findUnique({
        where: { id: input.workspaceId },
        include: { owner: { select: { email: true } } },
      });
      const to = workspace?.owner.email?.trim();
      if (to) {
        outboxId = `nout_${crypto.randomUUID()}`;
        notification = {
          type: 'system.notification',
          to,
          subject: `ליד חדש: ${lead.name}`,
          workspaceId: input.workspaceId,
          data: {
            name: lead.name,
            channel: input.channel,
            leadId: lead.id,
            conversationId: conversation.id,
          },
        };
        await tx.notificationOutbox.create({
          data: {
            id: outboxId,
            type: notification.type,
            channel: 'email',
            payload: JSON.stringify(notification),
            status: 'pending',
            workspaceId: input.workspaceId,
          },
        });
      }
    }

    return {
      duplicate: false,
      conversationId: conversation.id,
      messageId: message.id,
      contactId: contact.id,
      leadId: lead.id,
      createdLead,
      outboxId,
      notification,
      leadEvent: createdLead
        ? {
            leadId: lead.id,
            name: lead.name,
            status: lead.status,
            source: lead.source,
          }
        : undefined,
    };
  }

  private async resolveContact(
    tx: Tx,
    workspaceId: string,
    channel: string,
    hints: {
      phone: string;
      email: string;
      externalUserId: string;
      name: string;
    },
  ) {
    if (hints.externalUserId) {
      const identity = await tx.crmContactIdentity.findUnique({
        where: {
          workspaceId_channel_externalUserId: {
            workspaceId,
            channel,
            externalUserId: hints.externalUserId,
          },
        },
      });
      if (identity) {
        const linked = await tx.crmContact.findFirst({
          where: { id: identity.contactId, workspaceId },
        });
        if (linked) return this.fillContact(tx, linked, hints);
      }
    }

    const contacts = await tx.crmContact.findMany({ where: { workspaceId } });
    if (hints.phone) {
      const byPhone = contacts.find(
        (contact) =>
          contact.phone && normalizePhone(contact.phone) === hints.phone,
      );
      if (byPhone) return this.fillContact(tx, byPhone, hints);
    }
    if (hints.email) {
      const byEmail = contacts.find(
        (contact) =>
          contact.email && normalizeEmail(contact.email) === hints.email,
      );
      if (byEmail) return this.fillContact(tx, byEmail, hints);
    }

    return tx.crmContact.create({
      data: {
        id: createId('ctc'),
        workspaceId,
        name: hints.name,
        email: hints.email || null,
        phone: hints.phone || null,
      },
    });
  }

  private async fillContact(
    tx: Tx,
    contact: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    },
    hints: { phone: string; email: string; name: string },
  ) {
    const data: { name?: string; email?: string; phone?: string } = {};
    if (hints.phone && (!contact.phone || normalizePhone(contact.phone) === hints.phone)) {
      if (contact.phone !== hints.phone) data.phone = hints.phone;
    }
    if (hints.email && !contact.email) data.email = hints.email;
    if (
      hints.name &&
      hints.name !== CONTACT_PLACEHOLDER_NAME &&
      contact.name === CONTACT_PLACEHOLDER_NAME
    ) {
      data.name = hints.name;
    }
    if (Object.keys(data).length === 0) return contact;
    return tx.crmContact.update({ where: { id: contact.id }, data });
  }
}
