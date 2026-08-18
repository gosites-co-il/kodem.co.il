import type {
  BusinessReportDraft,
  DiscoveredBusinessInfo,
  DiscoveryEventPublisher,
  WorkspaceId,
} from '@kodem/contracts';
import { BusinessIntelligenceService } from './business-intelligence.service';

export interface BusinessAnalysisResult {
  discovered: DiscoveredBusinessInfo;
  report: BusinessReportDraft;
}

/**
 * Platform adapter — runs Business Intelligence (discovery + AI understanding).
 * @deprecated Prefer BusinessIntelligenceService directly for new integrations.
 */
export class BusinessDiscoveryService {
  private readonly intelligenceService = new BusinessIntelligenceService();

  async discover(
    websiteUrl: string,
    businessName: string,
    workspaceId: WorkspaceId,
    publisher?: DiscoveryEventPublisher,
  ): Promise<BusinessAnalysisResult> {
    const result = await this.intelligenceService.analyze(
      websiteUrl,
      businessName,
      workspaceId,
      publisher,
    );

    return {
      discovered: result.discovery.discovered,
      report: result.draft,
    };
  }
}

export { BusinessIntelligenceService };
