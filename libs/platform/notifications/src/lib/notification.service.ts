import type {
  NotificationOutboxRecord,
  NotificationPayload,
} from '@kodem/contracts';
import { NotificationOutboxRepository as DbNotificationOutboxRepository } from '@kodem/database';
import { MailRouter } from './mail/mail.router';

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

export class NotificationService {
  private readonly outboxRepo: NotificationOutboxRepository;
  private readonly mailRouter: MailRouter;

  constructor(
    outboxRepo?: NotificationOutboxRepository,
    mailRouter: MailRouter = new MailRouter(),
  ) {
    this.outboxRepo = outboxRepo ?? new DbNotificationOutboxRepository();
    this.mailRouter = mailRouter;
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
      await this.mailRouter.deliver(payload);
      return this.outboxRepo.markSent(record.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.outboxRepo.markFailed(record.id, message);
    }
  }
}
