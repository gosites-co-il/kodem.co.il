/**
 * In-memory recent inbound Meta messages (webhook → channel list).
 * Process-local; sufficient for v1 smoke until CRM inbox exists.
 */

export interface MetaInboundMessage {
  id: string;
  workspaceHint?: string;
  channel: 'whatsapp' | 'instagram' | 'facebook_messenger';
  from?: string;
  to?: string;
  body?: string;
  timestamp: string;
  phoneNumberId?: string;
  pageId?: string;
  igUserId?: string;
}

const MAX = 200;
const buffer: MetaInboundMessage[] = [];

export function pushMetaInboundMessage(msg: MetaInboundMessage): void {
  buffer.unshift(msg);
  if (buffer.length > MAX) buffer.length = MAX;
}

export function listMetaInboundMessages(filter: {
  channel?: MetaInboundMessage['channel'];
  phoneNumberId?: string;
  pageId?: string;
  igUserId?: string;
  limit?: number;
}): MetaInboundMessage[] {
  const limit = Math.min(Math.max(filter.limit ?? 15, 1), 50);
  return buffer
    .filter((m) => {
      if (filter.channel && m.channel !== filter.channel) return false;
      if (filter.phoneNumberId && m.phoneNumberId !== filter.phoneNumberId)
        return false;
      if (filter.pageId && m.pageId !== filter.pageId) return false;
      if (filter.igUserId && m.igUserId !== filter.igUserId) return false;
      return true;
    })
    .slice(0, limit);
}

export function parseMetaWebhookPayload(body: unknown): MetaInboundMessage[] {
  const out: MetaInboundMessage[] = [];
  const root = body as {
    object?: string;
    entry?: Array<{
      id?: string;
      time?: number;
      changes?: Array<{
        field?: string;
        value?: {
          messaging_product?: string;
          metadata?: { phone_number_id?: string; display_phone_number?: string };
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: Array<{
            id?: string;
            from?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
        };
      }>;
      messaging?: Array<{
        sender?: { id?: string };
        recipient?: { id?: string };
        timestamp?: number;
        message?: { mid?: string; text?: string };
      }>;
    }>;
  };

  for (const entry of root.entry ?? []) {
    // WhatsApp Cloud API
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      for (const msg of value?.messages ?? []) {
        if (!msg.id) continue;
        out.push({
          id: msg.id,
          channel: 'whatsapp',
          from: msg.from,
          body: msg.text?.body,
          timestamp: msg.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          phoneNumberId,
        });
      }
    }

    // Messenger / Instagram messaging
    for (const m of entry.messaging ?? []) {
      if (!m.message?.mid) continue;
      const isIg = root.object === 'instagram';
      out.push({
        id: m.message.mid,
        channel: isIg ? 'instagram' : 'facebook_messenger',
        from: m.sender?.id,
        to: m.recipient?.id,
        body: m.message.text,
        timestamp: m.timestamp
          ? new Date(m.timestamp).toISOString()
          : new Date().toISOString(),
        pageId: isIg ? undefined : entry.id,
        igUserId: isIg ? entry.id : undefined,
      });
    }
  }
  return out;
}
