import type { ConversationMessageType } from '@kodem/contracts';
import { WorkspaceConnectionRepository } from '@kodem/database';
import type { MetaInboundMessage } from '@kodem/integrations';
import { ConversationIngestService } from '@kodem/modules/conversations';

/**
 * After the in-memory buffer, persist a parsed Meta message when the
 * connected account can be resolved to a workspace.
 */
export async function ingestMetaMessage(
  message: MetaInboundMessage,
): Promise<'ingested' | 'skipped'> {
  const from = message.from?.trim();
  if (!from || !message.id) return 'skipped';

  const connections = new WorkspaceConnectionRepository();
  let workspaceId: Awaited<
    ReturnType<WorkspaceConnectionRepository['findWorkspaceIdByMetadata']>
  > = null;
  let externalThreadKey = '';
  let phone: string | undefined;

  if (message.channel === 'whatsapp' && message.phoneNumberId) {
    workspaceId = await connections.findWorkspaceIdByMetadata(
      'phoneNumberId',
      message.phoneNumberId,
    );
    externalThreadKey = `${message.phoneNumberId}:${from}`;
    phone = from;
  } else if (message.channel === 'instagram' && message.igUserId) {
    workspaceId = await connections.findWorkspaceIdByMetadata(
      'igUserId',
      message.igUserId,
    );
    externalThreadKey = `${message.igUserId}:${from}`;
  } else if (message.channel === 'facebook_messenger' && message.pageId) {
    workspaceId = await connections.findWorkspaceIdByMetadata(
      'pageId',
      message.pageId,
    );
    externalThreadKey = `${message.pageId}:${from}`;
  }

  if (!workspaceId || !externalThreadKey) return 'skipped';

  const occurredAt = new Date(message.timestamp);
  await new ConversationIngestService().ingest({
    workspaceId,
    channel: message.channel,
    externalThreadKey,
    externalMessageId: message.id,
    direction: 'inbound',
    body: message.body ?? '',
    messageType: (message.messageType ?? 'text') as ConversationMessageType,
    occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    contact: {
      externalUserId: from,
      phone,
      name: message.name,
    },
    metadata: {
      phoneNumberId: message.phoneNumberId,
      pageId: message.pageId,
      igUserId: message.igUserId,
    },
  });
  return 'ingested';
}
