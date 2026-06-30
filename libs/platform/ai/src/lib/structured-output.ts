import { StructuredOutputParser } from './llm';

export function createJsonParser<T>(): StructuredOutputParser<T> {
  return {
    parse(raw: string): T {
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned) as T;
    },
  };
}

export type ModelRoute = 'fast' | 'balanced' | 'quality';

export function routeModel(task: 'discovery' | 'insight' | 'recommendation'): ModelRoute {
  if (task === 'discovery') return 'fast';
  if (task === 'recommendation') return 'balanced';
  return 'quality';
}
