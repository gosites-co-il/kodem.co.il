import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type {
  LegalAuthMethod,
  LegalConsentAcceptanceInput,
  LegalConsentSource,
  PlatformContext,
} from '@kodem/contracts';
import { listLegalDocumentMeta } from '@kodem/platform/legal';
import { LegalConsentService } from '@kodem/platform/legal/consent';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('legal')
export class LegalController {
  private readonly consentService = new LegalConsentService();

  @Get('documents')
  listDocuments() {
    return { documents: listLegalDocumentMeta() };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async status(@CurrentContext() context: PlatformContext) {
    return this.consentService.getStatus(context.user);
  }

  @Post('consent')
  @UseGuards(JwtAuthGuard)
  async accept(
    @CurrentContext() context: PlatformContext,
    @Req() req: Request,
    @Body()
    body: {
      consents?: LegalConsentAcceptanceInput[];
      source?: LegalConsentSource;
      authMethod?: LegalAuthMethod;
    },
  ) {
    if (!body.consents?.length) {
      throw new BadRequestException('consents are required');
    }

    const source = body.source ?? 'RECONSENT';
    const records = await this.consentService.recordAcceptances(
      body.consents.map((consent) => ({
        userId: context.user.id,
        document: consent.document,
        version: consent.version,
        source,
        ip: req.ip ?? req.headers['x-forwarded-for']?.toString(),
        userAgent: req.headers['user-agent'],
        locale: 'he-IL',
        authMethod: body.authMethod ?? 'unknown',
        workspaceId: context.workspace.id,
      })),
    );

    return {
      ok: true,
      accepted: records.map((record) => ({
        document: record.document,
        version: record.version,
        acceptedAt: record.acceptedAt,
      })),
      status: await this.consentService.getStatus(context.user),
    };
  }
}
