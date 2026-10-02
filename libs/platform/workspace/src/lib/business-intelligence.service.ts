import type {
  BusinessIntelligenceResult,
  BusinessReportDraft,
  DiscoveryEventPublisher,
  WorkspaceId,
} from '@kodem/contracts';
import { businessIntelligenceRunner } from '@kodem/engines/business-intelligence';

export class BusinessIntelligenceService {
  async analyze(
    websiteUrl: string,
    businessName: string,
    workspaceId: WorkspaceId,
    publisher?: DiscoveryEventPublisher,
    model?: string,
  ): Promise<BusinessIntelligenceResult & { draft: BusinessReportDraft }> {
    const result = await businessIntelligenceRunner.run(
      {
        workspaceId,
        businessName: businessName.trim() || websiteUrl,
        websiteUrl: websiteUrl.trim(),
      },
      publisher,
      model,
    );

    const draft: BusinessReportDraft = {
      ...result.report,
      status: result.discovery.partial ? 'partial' : 'completed',
    };

    return { ...result, draft };
  }
}
