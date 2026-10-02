import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConversationService } from '@kodem/modules/conversations';

const WINDOW_MS = 60_000;
const MAX_HITS = 8;
const hits = new Map<string, { count: number; resetAt: number }>();

function allowIntake(ip: string, slug: string): boolean {
  const key = `${ip}:${slug}`;
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= MAX_HITS) return false;
  row.count += 1;
  return true;
}

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

@Controller('conversations')
export class ConversationsIntakeController {
  private readonly conversations = new ConversationService();

  @Post('intake')
  @HttpCode(200)
  async intake(
    @Req() req: Request,
    @Body()
    body: {
      slug?: string;
      name?: string;
      email?: string;
      message?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    },
  ) {
    const slug = text(body?.slug, 80);
    const name = text(body?.name, 120);
    const email = text(body?.email, 200);
    const message = text(body?.message, 5000);
    if (!slug || !name || !email || !message) {
      throw new BadRequestException('נא למלא שם, אימייל והודעה');
    }
    if (!email.includes('@')) {
      throw new BadRequestException('אימייל לא תקין');
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!allowIntake(ip, slug)) {
      throw new HttpException(
        'יותר מדי פניות. נסו שוב בעוד דקה',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      const result = await this.conversations.intakeWeb({
        slug,
        name,
        email,
        message,
        utmSource: text(body.utmSource ?? body.utm_source, 200) || undefined,
        utmMedium: text(body.utmMedium ?? body.utm_medium, 200) || undefined,
        utmCampaign: text(body.utmCampaign ?? body.utm_campaign, 200) || undefined,
      });
      return { ok: true, conversationId: result.conversationId };
    } catch (err) {
      if (err instanceof Error && err.message === 'WORKSPACE_NOT_FOUND') {
        throw new NotFoundException('הטופס לא נמצא');
      }
      throw new BadRequestException('שליחת הטופס נכשלה');
    }
  }
}
