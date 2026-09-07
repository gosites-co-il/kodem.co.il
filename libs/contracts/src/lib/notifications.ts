export type NotificationType =
  | 'workspace.invite'
  | 'auth.password_reset'
  | 'auth.email_verification'
  | 'billing.subscription_changed'
  | 'system.notification';

export type NotificationChannel = 'email' | 'in_app' | 'push' | 'sms' | 'whatsapp';

export type NotificationOutboxStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed';

export interface NotificationPayload {
  type: NotificationType;
  to: string;
  subject?: string;
  data: Record<string, unknown>;
  workspaceId?: string;
  userId?: string;
}

export interface NotificationOutboxRecord {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  payload: NotificationPayload;
  status: NotificationOutboxStatus;
  error?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
}
