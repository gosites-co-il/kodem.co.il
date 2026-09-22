import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailMessage, MailProvider } from './mail.types';

const GMAIL_SMTP_HOST = 'smtp.gmail.com';
const GMAIL_SMTP_PORT = 587;

export class GmailSmtpProvider implements MailProvider {
  readonly name = 'gmail';
  private readonly transporter: Transporter;
  private readonly user: string;

  constructor(user?: string, pass?: string) {
    this.user = (user ?? process.env['AUDIT_SMTP_USER']?.trim()) || '';
    const password = (pass ?? process.env['AUDIT_SMTP_PASS']?.trim()) || '';

    if (!this.user || !password) {
      throw new Error(
        'AUDIT_SMTP_USER and AUDIT_SMTP_PASS are required when AUDIT_MAIL_PROVIDER=gmail',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: GMAIL_SMTP_HOST,
      port: GMAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: this.user,
        pass: password,
      },
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
