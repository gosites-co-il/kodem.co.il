import { WorkspaceId } from '@kodem/core';
import { Engine, EngineResult } from '../types';
import { InsightEngineOutput } from '../insight/insight.engine';

export interface RecommendationEngineInput {
  workspaceId: WorkspaceId;
  insights: InsightEngineOutput['insights'];
}

export interface RecommendationEngineOutput {
  primary: {
    action: string;
    rationale: string;
    expectedImpact: 'low' | 'medium' | 'high';
    priority: number;
  };
  alternatives: Array<{
    action: string;
    rationale: string;
    expectedImpact: 'low' | 'medium' | 'high';
    priority: number;
  }>;
}

export class RecommendationEngine
  implements Engine<RecommendationEngineInput, RecommendationEngineOutput>
{
  readonly name = 'recommendation';

  async run(
    input: RecommendationEngineInput,
  ): Promise<EngineResult<RecommendationEngineOutput>> {
    const noEvents = input.insights.some((i) =>
      i.title.includes('No activity'),
    );

    const primary = noEvents
      ? {
          action: 'Add your first lead or connect an integration',
          rationale:
            'Events are the fuel for Kodem engines — start capturing business activity',
          expectedImpact: 'high' as const,
          priority: 1,
        }
      : {
          action: 'Review your business profile and confirm services',
          rationale:
            'Validating discovery output improves insight accuracy',
          expectedImpact: 'medium' as const,
          priority: 1,
        };

    return {
      success: true,
      data: {
        primary,
        alternatives: [
          {
            action: 'Invite a team member',
            rationale: 'Collaboration accelerates business knowledge building',
            expectedImpact: 'medium',
            priority: 2,
          },
        ],
      },
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
