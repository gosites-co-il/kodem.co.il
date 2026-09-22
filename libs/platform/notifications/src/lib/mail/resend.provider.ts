import { Resend } from 'resend';
import type { MailMessage, MailProvider } from './mail.types';

export class ResendMailProvider implements MailProvider {
  readonly name = 'resend';
  private readonly client: Resend;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env['RESEND_API_KEY']?.trim();
    if (!key) {
      throw new Error('RESEND_API_KEY is required when SYSTEM_MAIL_PROVIDER=resend');
    }
    this.client = new Resend(key);
  }

  async send(message: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
