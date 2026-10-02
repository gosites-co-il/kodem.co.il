import type { ChannelType, ConversationStatus, LeadStatus } from '@kodem/contracts';
import { CRM_LEAD_STATUS_LABELS } from './crm';

export const CONVERSATION_CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'וואטסאפ',
  instagram: 'אינסטגרם',
  facebook_messenger: 'מסנג׳ר',
  email: 'אימייל',
  web_chat: 'אתר',
  sms: 'SMS',
  telegram: 'טלגרם',
  phone: 'טלפון',
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'פתוחה',
  closed: 'סגורה',
};

export function conversationLeadLabel(status: LeadStatus | undefined): string {
  if (!status) return 'אין ליד';
  return CRM_LEAD_STATUS_LABELS[status];
}

export function formatConversationTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
