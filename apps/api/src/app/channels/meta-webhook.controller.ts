import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  metaWebhookVerifyToken,
  parseMetaWebhookPayload,
  pushMetaInboundMessage,
  verifyMetaWebhookSignature,
} from '@kodem/integrations';
import { ingestMetaMessage } from './meta-conversation-ingest';

/** DEBUG=true, DEBUG=1, DEBUG=*, or a list that includes meta-webhook. */
function metaWebhookDebugEnabled(): boolean {
  const flag = process.env['DEBUG']?.trim();
  if (!flag) return false;
  if (flag === '1' || flag === 'true' || flag === '*') return true;
  return flag.split(/[,\s]+/).includes('meta-webhook');
}

function debugMetaWebhook(message: string) {
  if (!metaWebhookDebugEnabled()) return;
  console.log(`[meta-webhook] ${message}`);
}

/**
 * Public Meta webhook (no JWT) — verify + inbound events.
 * Register URL: {APP_URL}/api/channels/meta/webhook
 */
@Controller('channels/meta')
export class MetaWebhookController {
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() res: Response,
  ) {
    const expected = metaWebhookVerifyToken();
    if (!expected) {
      debugMetaWebhook('verify rejected: META_WEBHOOK_VERIFY_TOKEN is not configured');
      throw new BadRequestException(
        'META_WEBHOOK_VERIFY_TOKEN is not configured',
      );
    }
    const matched = mode === 'subscribe' && token === expected && Boolean(challenge);
    debugMetaWebhook(
      `verify mode=${mode ?? 'missing'} tokenMatched=${token === expected} challengePresent=${Boolean(challenge)}`,
    );
    if (matched) {
      return res.status(200).send(challenge);
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  @Post('webhook')
  @HttpCode(200)
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const raw =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    const object =
      body && typeof body === 'object' && 'object' in body
        ? String((body as { object?: unknown }).object ?? 'unknown')
        : 'unknown';
    if (!verifyMetaWebhookSignature(raw, signature)) {
      // Allow through in local if META_APP_SECRET unset (dev only)
      if (process.env['META_APP_SECRET']?.trim()) {
        debugMetaWebhook(`event rejected object=${object} signature=invalid`);
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    const messages = parseMetaWebhookPayload(body);
    debugMetaWebhook(
      `event object=${object} messages=${messages.length} signature=${signature ? 'present' : 'missing'}`,
    );
    for (const msg of messages) {
      pushMetaInboundMessage(msg);
    }

    for (const msg of messages) {
      try {
        await ingestMetaMessage(msg);
      } catch (err) {
        console.error('[meta-webhook] conversation ingest failed', err);
        throw new InternalServerErrorException('Conversation ingest failed');
      }
    }
    return { ok: true, received: messages.length };
  }
}
