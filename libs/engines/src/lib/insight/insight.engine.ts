import { WorkspaceId } from '@kodem/core';
import { BusinessProfile } from '@kodem/business';
import { Engine, EngineResult } from '../types';

export interface InsightEngineInput {
  workspaceId: WorkspaceId;
  profile: BusinessProfile;
  eventCount: number;
}

export interface InsightEngineOutput {
  insights: Array<{
    title: string;
    what: string;
    why: string;
    confidence: number;
    supportingData: Record<string, unknown>;
  }>;
}

export class InsightEngine
  implements Engine<InsightEngineInput, InsightEngineOutput>
{
  readonly name = 'insight';

  async run(
    input: InsightEngineInput,
  ): Promise<EngineResult<InsightEngineOutput>> {
    const insights: InsightEngineOutput['insights'] = [
      {
        title: 'Business profile established',
        what: `${input.profile.name} is classified as ${input.profile.classification ?? 'unknown'}`,
        why: 'Understanding your business type enables relevant recommendations',
        confidence: 0.85,
        supportingData: {
          industry: input.profile.industry,
          services: input.profile.services,
        },
      },
    ];

    if (input.eventCount === 0) {
      insights.push({
        title: 'No activity events yet',
        what: 'Your workspace has no recorded business events',
        why: 'Events drive insights — connect integrations or add leads to unlock deeper analysis',
        confidence: 0.95,
        supportingData: { eventCount: 0 },
      });
    }

    if (input.profile.hypotheses.length > 0) {
      insights.push({
        title: 'Discovery hypotheses generated',
        what: `${input.profile.hypotheses.length} hypotheses about your business`,
        why: 'Early hypotheses guide the WOW experience and next actions',
        confidence: 0.7,
        supportingData: { hypotheses: input.profile.hypotheses },
      });
    }

    return { success: true, data: { insights } };
  }
}

export const insightEngine = new InsightEngine();
