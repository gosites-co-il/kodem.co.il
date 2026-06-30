import {
  Engine,
  EngineResult,
  RuleEngineInput,
  RuleEngineOutput,
} from '@kodem/contracts';

export class RuleEngine implements Engine<RuleEngineInput, RuleEngineOutput> {
  readonly name = 'rule';

  async run(input: RuleEngineInput): Promise<EngineResult<RuleEngineOutput>> {
    return {
      success: true,
      data: {
        triggered: Boolean(input.context['trigger']),
        actions: input.context['trigger'] ? ['notify'] : [],
      },
    };
  }
}

export const ruleEngine = new RuleEngine();
