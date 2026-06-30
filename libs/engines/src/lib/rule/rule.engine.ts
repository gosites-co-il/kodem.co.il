import { Engine, EngineResult } from '../types';

export interface RuleEngineInput {
  ruleId: string;
  context: Record<string, unknown>;
}

export interface RuleEngineOutput {
  triggered: boolean;
  actions: string[];
}

export class RuleEngine implements Engine<RuleEngineInput, RuleEngineOutput> {
  readonly name = 'rule';

  async run(input: RuleEngineInput): Promise<EngineResult<RuleEngineOutput>> {
    const responseTime = input.context['responseTimeMs'] as number | undefined;
    const triggered =
      input.ruleId === 'slow-response' &&
      responseTime !== undefined &&
      responseTime > 3600000;

    return {
      success: true,
      data: {
        triggered,
        actions: triggered ? ['generate-insight:slow-response'] : [],
      },
    };
  }
}

export const ruleEngine = new RuleEngine();
