import {
  Engine,
  EngineResult,
  LearningEngineInput,
  LearningEngineOutput,
} from '@kodem/contracts';

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
        updatedHypotheses: [],
        confidenceAdjustment: adjustment,
      },
    };
  }
}

export const learningEngine = new LearningEngine();
