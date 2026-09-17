import type {
  NotificationOutboxRecord,
  NotificationPayload,
} from '@kodem/contracts';
import { NotificationOutboxRepository as DbNotificationOutboxRepository } from '@kodem/database';
import nodemailer from 'nodemailer';

export interface NotificationOutboxRepository {
  enqueue(input: {
    type: NotificationPayload['type'];
    channel: NotificationOutboxRecord['channel'];
    payload: NotificationPayload;
    workspaceId?: string | null;
  }): Promise<NotificationOutboxRecord>;
  markSent(id: string): Promise<NotificationOutboxRecord>;
  markFailed(id: string, error: string): Promise<NotificationOutboxRecord>;
}

export interface NotificationChannel {
  deliver(payload: NotificationPayload): Promise<void>;
}

function formatEmailBody(payload: NotificationPayload): string {
  const lines = Object.entries(payload.data).map(
    ([key, value]) => `${key}: ${String(value ?? '')}`,
  );
  return lines.length > 0 ? lines.join('\n') : payload.type;
}

export class EmailChannel implements NotificationChannel {
  async deliver(payload: NotificationPayload): Promise<void> {
    const subject = payload.subject ?? payload.type;
    const body = formatEmailBody(payload);
    const provider = (process.env['MAIL_PROVIDER'] ?? 'stub').toLowerCase();
    const from = process.env['MAIL_FROM'] ?? 'noreply@kodem.co.il';

    if (provider === 'smtp') {
      const host = process.env['SMTP_HOST'];
      const port = Number(process.env['SMTP_PORT'] ?? '587');
      if (!host) {
        throw new Error('SMTP_HOST is required when MAIL_PROVIDER=smtp');
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env['SMTP_SECURE'] === 'true',
        auth:
          process.env['SMTP_USER'] && process.env['SMTP_PASS']
            ? {
                user: process.env['SMTP_USER'],
                pass: process.env['SMTP_PASS'],
              }
            : undefined,
      });

      await transporter.sendMail({
        from,
        to: payload.to,
        subject,
        text: body,
      });
      return;
    }

    // Stub delivery — logs until SMTP is configured.
    console.log(
      `[EmailChannel] to=${payload.to} subject=${subject} type=${payload.type}`,
      payload.data,
    );
  }
}

export class NotificationService {
  private readonly outboxRepo: NotificationOutboxRepository;
  private readonly emailChannel: NotificationChannel;

  constructor(
    outboxRepo?: NotificationOutboxRepository,
    emailChannel: NotificationChannel = new EmailChannel(),
  ) {
    this.outboxRepo = outboxRepo ?? new DbNotificationOutboxRepository();
    this.emailChannel = emailChannel;
  }

  async notify(
    payload: NotificationPayload,
  ): Promise<NotificationOutboxRecord> {
    const record = await this.outboxRepo.enqueue({
      type: payload.type,
      channel: 'email',
      payload,
      workspaceId: payload.workspaceId ?? null,
    });

    try {
      await this.emailChannel.deliver(payload);
      return this.outboxRepo.markSent(record.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.outboxRepo.markFailed(record.id, message);
    }
  }
}
