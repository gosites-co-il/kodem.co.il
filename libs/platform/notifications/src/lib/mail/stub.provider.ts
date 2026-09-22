import type { MailMessage, MailProvider } from './mail.types';

export class StubMailProvider implements MailProvider {
  readonly name = 'stub';

  async send(message: MailMessage): Promise<void> {
    console.log(
      `[StubMail] to=${message.to} from=${message.from} subject=${message.subject} type=${message.type}`,
      message.text,
    );
  }
}
