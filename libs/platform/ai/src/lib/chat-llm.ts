import type { LLMCompletionOptions, LLMMessage, LLMProvider } from './llm';
import { StubLLMProvider } from './stub-llm';

export type AiChatProviderId = 'openai' | 'gemini' | 'grok' | 'nvidia';

const ROUTE_LABELS = new Set(['fast', 'balanced', 'quality']);

const PRESETS: Record<AiChatProviderId, { base: string; model: string }> = {
  openai: { base: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
  gemini: {
    base: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash',
  },
  grok: { base: 'https://api.x.ai/v1', model: 'grok-3-mini' },
  nvidia: {
    base: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/llama-3.1-8b-instruct',
  },
};

export interface AiChatConfig {
  id: AiChatProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function resolveAiChatConfig(
  env: NodeJS.ProcessEnv = process.env,
): AiChatConfig | null {
  const hinted = env['AI_PROVIDER']?.trim().toLowerCase();
  const nvidiaKey = env['NVIDIA_API_KEY']?.trim();
  const id = (hinted || (nvidiaKey ? 'nvidia' : '')) as AiChatProviderId;
  const preset = PRESETS[id];
  if (!preset) return null;

  const apiKey = env['AI_API_KEY']?.trim() || (id === 'nvidia' ? nvidiaKey : '') || '';
  if (!apiKey) return null;

  return {
    id,
    apiKey,
    baseUrl: (env['AI_API_BASE']?.trim() || preset.base).replace(/\/$/, ''),
    model: env['AI_MODEL']?.trim() || preset.model,
  };
}

export function describeAiChat(env: NodeJS.ProcessEnv = process.env): {
  provider: AiChatProviderId | 'stub';
  model: string | null;
  configured: boolean;
} {
  const config = resolveAiChatConfig(env);
  if (!config) return { provider: 'stub', model: null, configured: false };
  return { provider: config.id, model: config.model, configured: true };
}

/** Model id safe to send to an OpenAI-compatible chat endpoint. */
export function cleanAiModelId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const model = value.trim();
  if (!model || model.length > 160) return undefined;
  if (!/^[\w./:@+-]+$/.test(model)) return undefined;
  if (ROUTE_LABELS.has(model)) return undefined;
  return model;
}

const NOT_A_READING_MODEL =
  /embed|rerank|reward|vision|vlm|clip|neva|vila|fuyu|kosmos|deplot|diffusion|video|guard|safety|parse|ocr|starcoder|codellama|codegemma|codestral|code-|coder|translate|detector|calibration|omni|chatqa|\/med-|\/fin-|creative|cosmos|poolside/i;

const READING_MODEL =
  /instruct|(?:^|[/-])it(?:$|[^a-z])|chat|reasoning|yi-large|mistral-large$|dbrx|kimi-|glm-|gpt-oss|nemotron-(?:3-super|3-ultra|3\.5-lightning|nano|ultra)|jamba|deepseek-v/i;

/** Text chat models that can write the business reading. */
export function isBusinessReadingModel(id: string): boolean {
  const name = id.toLowerCase();
  if (NOT_A_READING_MODEL.test(name)) return false;
  return READING_MODEL.test(name);
}

/** Models the configured provider lists. Falls back to the preset model. */
export async function listAiChatModels(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const config = resolveAiChatConfig(env);
  if (!config) return [];
  try {
    const response = await fetchImpl(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!response.ok) return [config.model];
    const json = (await response.json()) as { data?: Array<{ id?: string }> };
    const ids = [
      ...new Set(
        (json.data ?? [])
          .map((item) => cleanAiModelId(item.id))
          .filter((id): id is string => !!id && isBusinessReadingModel(id)),
      ),
    ].sort((a, b) => a.localeCompare(b));
    if (!ids.includes(config.model)) ids.unshift(config.model);
    return ids;
  } catch {
    return [config.model];
  }
}

export class OpenAiCompatibleLLMProvider implements LLMProvider {
  readonly name: string;

  constructor(
    private readonly config: AiChatConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.name = config.id;
  }

  async complete(
    messages: LLMMessage[],
    options?: LLMCompletionOptions,
  ): Promise<string> {
    const requested = options?.model?.trim();
    const model =
      requested && !ROUTE_LABELS.has(requested) ? requested : this.config.model;
    const response = await this.fetchImpl(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: options?.temperature ?? 0.2,
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI provider ${this.config.id} returned ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error(`AI provider ${this.config.id} returned an empty response`);
    }
    return content;
  }
}

export function createDefaultLLMProvider(
  env: NodeJS.ProcessEnv = process.env,
): LLMProvider {
  const config = resolveAiChatConfig(env);
  if (!config) return new StubLLMProvider();
  return new OpenAiCompatibleLLMProvider(config);
}

export const defaultLLMProvider = createDefaultLLMProvider();
