import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { PlatformContext } from '@kodem/contracts';
import {
  BusinessProfileRepository,
  BusinessReportRepository,
} from '@kodem/database';
import { cleanAiModelId, describeAiChat, listAiChatModels } from '@kodem/platform/ai';
import { ConnectionService } from '@kodem/platform/connections';
import {
  BusinessIntelligenceService,
  BusinessProfileSyncService,
  WorkspaceSetupService,
  factValue,
  isCrawling,
  recordFromProfile,
  recordFromSetup,
} from '@kodem/platform/workspace';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('workspace/business')
@UseGuards(JwtAuthGuard)
export class BusinessProfileController {
  private readonly setup = new WorkspaceSetupService();
  private readonly profiles = new BusinessProfileRepository();
  private readonly reports = new BusinessReportRepository();
  private readonly intelligence = new BusinessIntelligenceService();
  private readonly sync = new BusinessProfileSyncService(new ConnectionService());

  @Get()
  async read(@CurrentContext() context: PlatformContext) {
    const state = await this.setup.getState(context.workspace.id);
    const crawling = isCrawling(state.setup);
    const profile = await this.profiles.findByWorkspace(context.workspace.id);
    if (profile) {
      const report = await this.reports.findByWorkspace(context.workspace.id);
      return recordFromProfile(profile, report, crawling);
    }
    return recordFromSetup(state.setup);
  }

  @Post('refresh')
  async refresh(@CurrentContext() context: PlatformContext) {
    const view = await this.sync.refresh(context.workspace.id);
    if (!view.profile) {
      const state = await this.setup.getState(context.workspace.id);
      return recordFromSetup(state.setup);
    }
    const report = await this.reports.findByWorkspace(context.workspace.id);
    return recordFromProfile(view.profile, report, false);
  }

  @Get('ai')
  async aiStatus() {
    const status = describeAiChat();
    const models = await listAiChatModels();
    return { ...status, models };
  }

  @Post('try')
  async tryWebsite(
    @CurrentContext() context: PlatformContext,
    @Body() body: { websiteUrl?: string; model?: string },
  ) {
    const websiteUrl = body.websiteUrl?.trim();
    if (!websiteUrl) {
      throw new BadRequestException('websiteUrl is required');
    }
    const model = cleanAiModelId(body.model);
    const provider = describeAiChat();
    const used = {
      ...provider,
      model: model ?? provider.model,
    };
    try {
      const analysis = await this.intelligence.analyze(
        websiteUrl,
        websiteUrl,
        context.workspace.id,
        undefined,
        model,
      );
      return {
        provider: used,
        facts: analysis.discovery.facts.map((fact) => ({
          field: fact.field,
          value: factValue(fact.value),
          source: fact.source,
        })),
        assets: analysis.discovery.assetsProcessed.map((asset) => ({
          type: asset.type,
          url: asset.url,
          status: asset.status,
        })),
        understanding: analysis.report.understanding,
        error: null as string | null,
      };
    } catch {
      return {
        provider: used,
        facts: [],
        assets: [],
        understanding: null,
        error: 'לא הצלחנו לקרוא את האתר או להבין אותו.',
      };
    }
  }
}
