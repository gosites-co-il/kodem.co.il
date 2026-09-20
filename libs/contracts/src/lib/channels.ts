import type { ConnectionId, ChannelId, WorkspaceId } from './ids';
import type { ConnectionProviderId } from './connections';

export type ChannelType =
  | 'whatsapp'
  | 'email'
  | 'instagram'
  | 'facebook_messenger'
  | 'sms'
  | 'telegram'
  | 'phone'
  | 'web_chat';

export type ChannelStatus = 'not_configured' | 'connected' | 'error';

export interface ChannelConnectionBinding {
  channelId: ChannelId;
  connectionId: ConnectionId;
  isPrimary: boolean;
}

export interface WorkspaceChannel {
  id: ChannelId;
  workspaceId: WorkspaceId;
  type: ChannelType;
  status: ChannelStatus;
  metadata?: Record<string, unknown> | null;
  bindings: ChannelConnectionBindingView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelConnectionBindingView {
  connectionId: ConnectionId;
  isPrimary: boolean;
  provider?: ConnectionProviderId;
  externalAccountName?: string | null;
}

export interface ChannelCatalogItem {
  type: ChannelType;
  name: string;
  description: string;
  /** Providers that can back this channel. */
  allowedProviders: ConnectionProviderId[];
  status: 'available' | 'coming_soon' | 'disabled';
  channel: WorkspaceChannel | null;
}

export interface ConfigureChannelInput {
  connectionId: ConnectionId;
  isPrimary?: boolean;
}

export interface EmailSendInput {
  to: string;
  subject?: string;
  body?: string;
}

export interface EmailSendResult {
  success: boolean;
  message?: string;
  messageId?: string;
  threadId?: string;
}

export interface EmailMessageItem {
  id: string;
  threadId?: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface EmailMessagesResult {
  success: boolean;
  messages: EmailMessageItem[];
  message?: string;
}

/** Contracts-only messaging shapes for future omnichannel work. */
export type MessageDirection = 'inbound' | 'outbound';

/** Shared send/list shapes for WhatsApp / Instagram / Messenger. */
export interface MessagingSendInput {
  to: string;
  body: string;
}

export interface MessagingSendResult {
  success: boolean;
  message?: string;
  messageId?: string;
}

export interface MessagingMessageItem {
  id: string;
  from?: string;
  to?: string;
  body?: string;
  timestamp?: string;
  direction?: MessageDirection;
}

export interface MessagingMessagesResult {
  success: boolean;
  messages: MessagingMessageItem[];
  message?: string;
}

export interface MetaWebhookVerifyQuery {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}

export interface ConversationRef {
  workspaceId: WorkspaceId;
  contactId?: string;
  channelType: ChannelType;
  connectionId?: ConnectionId;
}

export interface MessageRef {
  workspaceId: WorkspaceId;
  conversationId?: string;
  contactId?: string;
  channelType: ChannelType;
  connectionId?: ConnectionId;
  direction: MessageDirection;
  externalMessageId?: string;
  occurredAt: Date;
}

/** Campaigns should select a Channel, not a provider. */
export interface CampaignChannelRef {
  channel: ChannelType;
}
