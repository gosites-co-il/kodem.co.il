import type { ModuleId } from './workspace-setup';
import type { WorkspaceId } from './ids';

export type PlanId = 'free' | 'starter' | 'growth' | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'incomplete';

export type UsageMetric =
  | 'members'
  | 'events'
  | 'ai_requests'
  | 'workspaces';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  modules: ModuleId[];
  limits: Record<UsageMetric, number | null>;
}

export interface Subscription {
  id: string;
  workspaceId: WorkspaceId;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolvedEntitlements {
  planId: PlanId;
  modules: ModuleId[];
  limits: Record<UsageMetric, number | null>;
  capabilities?: string[];
}
