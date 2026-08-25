import type {
  NotificationOutboxRecord,
  NotificationPayload,
} from '@kodem/contracts';
import { NotificationOutboxRepository as DbNotificationOutboxRepository } from '@kodem/database';

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

export class EmailChannel implements NotificationChannel {
  async deliver(payload: NotificationPayload): Promise<void> {
    const subject = payload.subject ?? payload.type;
    // Stub delivery — replace with real email provider later.
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
