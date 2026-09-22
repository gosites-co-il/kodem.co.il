import type { NotificationPayload } from '@kodem/contracts';
import {
  formatMailBody,
  mailLaneFor,
  type MailLane,
  type MailMessage,
  type MailProvider,
} from './mail.types';
import { StubMailProvider } from './stub.provider';
import { ResendMailProvider } from './resend.provider';
import { GmailSmtpProvider } from './gmail.provider';

function resolveSystemProvider(): MailProvider {
  const name = (process.env['SYSTEM_MAIL_PROVIDER'] ?? 'stub').toLowerCase();
  if (name === 'resend') {
    return new ResendMailProvider();
  }
  return new StubMailProvider();
}

function resolveAuditProvider(): MailProvider {
  const name = (process.env['AUDIT_MAIL_PROVIDER'] ?? 'stub').toLowerCase();
  if (name === 'gmail') {
    return new GmailSmtpProvider();
  }
  return new StubMailProvider();
}

function fromForLane(lane: MailLane): string {
  if (lane === 'audit') {
    return (
      process.env['AUDIT_MAIL_FROM']?.trim() ||
      process.env['SIGNUP_ADMIN_EMAIL']?.trim() ||
      'admin@kodem.co.il'
    );
  }
  return process.env['MAIL_FROM']?.trim() || 'noreply@kodem.co.il';
}

export class MailRouter {
  private readonly system: MailProvider;
  private readonly audit: MailProvider;

  constructor(system?: MailProvider, audit?: MailProvider) {
    this.system = system ?? resolveSystemProvider();
    this.audit = audit ?? resolveAuditProvider();
  }

  providerFor(lane: MailLane): MailProvider {
    return lane === 'audit' ? this.audit : this.system;
  }

  async deliver(payload: NotificationPayload): Promise<void> {
    const lane = mailLaneFor(payload.type);
    const provider = this.providerFor(lane);
    const message: MailMessage = {
      to: payload.to,
      from: fromForLane(lane),
      subject: payload.subject ?? payload.type,
      text: formatMailBody(payload),
      type: payload.type,
    };
    await provider.send(message);
  }
}
