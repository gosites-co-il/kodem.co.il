import { WorkspaceId } from '@kodem/core';
import { BusinessProfile } from '@kodem/business';
import { KodemEvent, EVENT_TYPES } from '@kodem/events';
import { Insight, toInsight } from '@kodem/insights';
import { Recommendation, toRecommendation } from '@kodem/recommendations';
import { discoveryEngine } from './discovery/discovery.engine';
import { insightEngine } from './insight/insight.engine';
import { recommendationEngine } from './recommendation/recommendation.engine';

export interface PipelineResult {
  profile?: BusinessProfile;
  insights: Insight[];
  recommendations: Recommendation[];
}

export interface PipelineContext {
  workspaceName: string;
  websiteUrl?: string;
  existingProfile?: BusinessProfile | null;
  eventCount: number;
}

export async function runEnginePipeline(
  event: KodemEvent,
  context: PipelineContext,
): Promise<PipelineResult> {
  const workspaceId = event.workspaceId as WorkspaceId;
  let profile = context.existingProfile ?? undefined;
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];

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
      insights.push(
        ...insightResult.data.insights.map((draft) =>
          toInsight(workspaceId, draft),
        ),
      );

      const recResult = await recommendationEngine.run({
        workspaceId,
        insights: insightResult.data.insights,
      });

      if (recResult.success && recResult.data) {
        recommendations.push(
          toRecommendation(workspaceId, {
            ...recResult.data.primary,
            isPrimary: true,
          }),
          ...recResult.data.alternatives.map((alt) =>
            toRecommendation(workspaceId, alt),
          ),
        );
      }
    }
  }

  return { profile, insights, recommendations };
}
