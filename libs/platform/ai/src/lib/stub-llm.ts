import { LLMProvider, LLMMessage, LLMCompletionOptions } from './llm';

export class StubLLMProvider implements LLMProvider {
  readonly name = 'stub';

  async complete(
    messages: LLMMessage[],
    _options?: LLMCompletionOptions,
  ): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    return JSON.stringify({
      summary: `Stub response for: ${lastUser?.content ?? 'empty'}`,
      confidence: 0.5,
    });
  }
}

export const defaultLLMProvider = new StubLLMProvider();
