export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<string>;
}

export interface StructuredOutputParser<T> {
  parse(raw: string): T;
}
