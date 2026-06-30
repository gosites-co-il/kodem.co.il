import {
  BusinessProfile,
  KodemEvent,
  PipelineContext,
  PipelineDraftResult,
  WorkspaceId,
} from '@kodem/contracts';
import { EVENT_TYPES } from '@kodem/events';
import { discoveryEngine } from '@kodem/engines/discovery';
import { insightEngine } from '@kodem/engines/insight';
import { recommendationEngine } from '@kodem/engines/recommendation';

export type { PipelineContext, PipelineDraftResult } from '@kodem/contracts';

export async function runEnginePipeline(
  event: KodemEvent,
  context: PipelineContext,
): Promise<PipelineDraftResult> {
  const workspaceId = event.workspaceId as WorkspaceId;
  let profile = context.existingProfile ?? undefined;
  const insightDrafts: PipelineDraftResult['insightDrafts'] = [];
  const recommendationDrafts: PipelineDraftResult['recommendationDrafts'] = [];

  if (event.type === EVENT_TYPES.WORKSPACE_CREATED) {
    const discovery = await discoveryEngine.run({
      workspaceId,
      businessName: context.workspaceName,
      websiteUrl: context.websiteUrl,
    });

    if (discovery.success && discovery.data) {
      const now = new Date();
      profile = {
        ...discovery.data.profile,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  if (profile) {
    const insightResult = await insightEngine.run({
      workspaceId,
      profile,
      eventCount: context.eventCount,
    });

    if (insightResult.success && insightResult.data) {
      insightDrafts.push(...insightResult.data.insights);

      const recResult = await recommendationEngine.run({
        workspaceId,
        insights: insightResult.data.insights,
      });

      if (recResult.success && recResult.data) {
        recommendationDrafts.push(
          { ...recResult.data.primary, isPrimary: true },
          ...recResult.data.alternatives,
        );
      }
    }
  }

  return { profile, insightDrafts, recommendationDrafts };
}
