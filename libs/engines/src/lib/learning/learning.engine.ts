import { WorkspaceId } from '@kodem/core';
import { Engine, EngineResult } from '../types';

export interface LearningEngineInput {
  workspaceId: WorkspaceId;
  feedback: {
    recommendationAccepted: boolean;
    insightHelpful: boolean;
  };
}

export interface LearningEngineOutput {
  updatedHypotheses: string[];
  confidenceAdjustment: number;
}

export class LearningEngine
  implements Engine<LearningEngineInput, LearningEngineOutput>
{
  readonly name = 'learning';

  async run(
    input: LearningEngineInput,
  ): Promise<EngineResult<LearningEngineOutput>> {
    const adjustment = input.feedback.recommendationAccepted ? 0.05 : -0.02;

    return {
      success: true,
      data: {
        updatedHypotheses: [
          input.feedback.insightHelpful
            ? 'User finds insights valuable'
            : 'Insights need refinement',
        ],
        confidenceAdjustment: adjustment,
      },
    };
  }
}

export const learningEngine = new LearningEngine();
