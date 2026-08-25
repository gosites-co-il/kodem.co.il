export type Brand<T, B extends string> = T & { readonly __brand: B };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;
export type MemberId = Brand<string, 'MemberId'>;
export type EventId = Brand<string, 'EventId'>;
export type InsightId = Brand<string, 'InsightId'>;
export type RecommendationId = Brand<string, 'RecommendationId'>;
export type SubscriptionId = Brand<string, 'SubscriptionId'>;
export type AuthTokenId = Brand<string, 'AuthTokenId'>;
export type InviteId = Brand<string, 'InviteId'>;
export type UsageEventId = Brand<string, 'UsageEventId'>;
export type AuditEventId = Brand<string, 'AuditEventId'>;
export type WorkspaceModuleId = Brand<string, 'WorkspaceModuleId'>;

export function createId<B extends string>(prefix: string): Brand<string, B> {
  return `${prefix}_${crypto.randomUUID()}` as Brand<string, B>;
}
