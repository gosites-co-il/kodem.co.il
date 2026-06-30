export type Brand<T, B extends string> = T & { readonly __brand: B };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;
export type MemberId = Brand<string, 'MemberId'>;
export type EventId = Brand<string, 'EventId'>;
export type InsightId = Brand<string, 'InsightId'>;
export type RecommendationId = Brand<string, 'RecommendationId'>;

export function createId<B extends string>(prefix: string): Brand<string, B> {
  return `${prefix}_${crypto.randomUUID()}` as Brand<string, B>;
}
