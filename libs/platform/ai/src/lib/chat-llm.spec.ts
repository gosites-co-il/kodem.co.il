import { listAiChatModels, OpenAiCompatibleLLMProvider, resolveAiChatConfig } from './chat-llm';

describe('resolveAiChatConfig', () => {
  it('stays unset without a key', () => {
    expect(resolveAiChatConfig({})).toBeNull();
  });

  it('uses NVIDIA_API_KEY when AI_PROVIDER is nvidia and AI_API_KEY is empty', () => {
    const config = resolveAiChatConfig({
      AI_PROVIDER: 'nvidia',
      NVIDIA_API_KEY: 'nv-test',
    });
    expect(config?.id).toBe('nvidia');
    expect(config?.apiKey).toBe('nv-test');
    expect(config?.baseUrl).toBe('https://integrate.api.nvidia.com/v1');
  });

  it('selects OpenAI, Gemini, and Grok presets', () => {
    expect(resolveAiChatConfig({ AI_PROVIDER: 'openai', AI_API_KEY: 'k' })?.model).toBe(
      'gpt-4.1-mini',
    );
    expect(resolveAiChatConfig({ AI_PROVIDER: 'gemini', AI_API_KEY: 'k' })?.baseUrl).toContain(
      'generativelanguage.googleapis.com',
    );
    expect(resolveAiChatConfig({ AI_PROVIDER: 'grok', AI_API_KEY: 'k' })?.baseUrl).toBe(
      'https://api.x.ai/v1',
    );
  });
});

describe('OpenAiCompatibleLLMProvider', () => {
  it('posts chat completions with a bearer token and returns the message', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }),
    }));

    const provider = new OpenAiCompatibleLLMProvider(
      {
        id: 'openai',
        apiKey: 'secret',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4.1-mini',
      },
      fetchImpl as unknown as typeof fetch,
    );

    const text = await provider.complete(
      [{ role: 'user', content: 'hello' }],
      { model: 'fast', temperature: 0.2 },
    );

    expect(text).toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      }),
    );
    const calls = fetchImpl.mock.calls as unknown as Array<[string, { body: string }]>;
    const body = JSON.parse(calls[0][1].body) as { model: string };
    expect(body.model).toBe('gpt-4.1-mini');
  });

  it('sends a selected model instead of the preset', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    }));
    const provider = new OpenAiCompatibleLLMProvider(
      {
        id: 'nvidia',
        apiKey: 'secret',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        model: 'nvidia/llama-3.1-8b-instruct',
      },
      fetchImpl as unknown as typeof fetch,
    );
    await provider.complete([{ role: 'user', content: 'hello' }], {
      model: 'nvidia/llama-3.3-70b-instruct',
    });
    const calls = fetchImpl.mock.calls as unknown as Array<[string, { body: string }]>;
    expect(JSON.parse(calls[0][1].body).model).toBe('nvidia/llama-3.3-70b-instruct');
  });
});

describe('listAiChatModels', () => {
  it('reads model ids from the provider catalog', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          { id: 'nvidia/llama-3.3-70b-instruct' },
          { id: 'nvidia/llama-3.1-8b-instruct' },
          { id: 'nvidia/nv-embedqa-mistral-7b-v2' },
          { id: 'meta/llama-3.2-11b-vision-instruct' },
          { id: 'bigcode/starcoder2-15b' },
          { id: 'ibm/granite-8b-code-instruct' },
        ],
      }),
    }));
    const models = await listAiChatModels(
      { AI_PROVIDER: 'nvidia', AI_API_KEY: 'secret' },
      fetchImpl as unknown as typeof fetch,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      }),
    );
    expect(models).toEqual([
      'nvidia/llama-3.1-8b-instruct',
      'nvidia/llama-3.3-70b-instruct',
    ]);
  });
});
