import type { ChannelType, MessageDirection } from './channels';
import type { LeadStatus } from './crm';
import type { WorkspaceId } from './ids';

export const CONVERSATION_STATUSES = ['open', 'closed'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CONVERSATION_MESSAGE_TYPES = [
  'text',
  'image',
  'file',
  'audio',
  'video',
  'system',
] as const;
export type ConversationMessageType =
  (typeof CONVERSATION_MESSAGE_TYPES)[number];

export const CONVERSATION_REPLY_CHANNELS = [
  'whatsapp',
  'instagram',
  'facebook_messenger',
  'email',
] as const satisfies readonly ChannelType[];

export type ConversationReplyChannel =
  (typeof CONVERSATION_REPLY_CHANNELS)[number];

export interface ConversationContactSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ConversationLeadSummary {
  id: string;
  status: LeadStatus;
}

export interface ConversationSummary {
  id: string;
  workspaceId: WorkspaceId;
  channel: ChannelType;
  externalThreadKey: string;
  subject?: string;
  preview?: string;
  status: ConversationStatus;
  unread: boolean;
  lastMessageDirection: MessageDirection;
  lastMessageAt: Date;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  contact: ConversationContactSummary;
  lead?: ConversationLeadSummary;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  body: string;
  externalMessageId: string;
  messageType: ConversationMessageType;
  metadata?: Record<string, unknown>;
  time: Date;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
}

export interface ConversationChannelCount {
  channel: ChannelType;
  count: number;
}

export interface ConversationListResult {
  conversations: ConversationSummary[];
  counts: ConversationChannelCount[];
  unreadCount: number;
}

export interface IngestConversationInput {
  workspaceId: WorkspaceId;
  channel: ChannelType;
  externalThreadKey: string;
  externalMessageId: string;
  direction: MessageDirection;
  body: string;
  messageType: ConversationMessageType;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
  subject?: string;
  contact: {
    externalUserId?: string;
    phone?: string;
    email?: string;
    name?: string;
  };
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface IngestConversationResult {
  duplicate: boolean;
  conversationId: string;
  messageId: string;
  contactId: string;
  leadId?: string;
  createdLead: boolean;
}

export interface ConversationIntakeInput {
  slug: string;
  name: string;
  email: string;
  message: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
