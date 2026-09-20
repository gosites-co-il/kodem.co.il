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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  metaWebhookVerifyToken,
  parseMetaWebhookPayload,
  pushMetaInboundMessage,
  verifyMetaWebhookSignature,
} from '@kodem/integrations';

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
      throw new BadRequestException(
        'META_WEBHOOK_VERIFY_TOKEN is not configured',
      );
    }
    if (mode === 'subscribe' && token === expected && challenge) {
      return res.status(200).send(challenge);
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  @Post('webhook')
  @HttpCode(200)
  receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const raw =
      req.rawBody ??
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    if (!verifyMetaWebhookSignature(raw, signature)) {
      // Allow through in local if META_APP_SECRET unset (dev only)
      if (process.env['META_APP_SECRET']?.trim()) {
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    const messages = parseMetaWebhookPayload(body);
    for (const msg of messages) {
      pushMetaInboundMessage(msg);
    }
    return { ok: true, received: messages.length };
  }
}
