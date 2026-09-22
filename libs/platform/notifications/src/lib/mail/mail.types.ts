import type { NotificationPayload, NotificationType } from '@kodem/contracts';

export type MailLane = 'system' | 'audit';

export interface MailMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
  type: NotificationType;
}

export interface MailProvider {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}

export function formatMailBody(payload: NotificationPayload): string {
  const lines = Object.entries(payload.data).map(
    ([key, value]) => `${key}: ${String(value ?? '')}`,
  );
  return lines.length > 0 ? lines.join('\n') : payload.type;
}

/** Ops alerts (signup, etc.) go via audit lane; everything else is system. */
export function mailLaneFor(type: NotificationType): MailLane {
  return type === 'auth.signup' ? 'audit' : 'system';
}
