import type { PlanId, SubscriptionStatus, ResolvedEntitlements } from './subscription';

export interface BillingSnapshot {
  configured: boolean;
  subscription: {
    planId: PlanId;
    status: SubscriptionStatus;
  };
  entitlements: ResolvedEntitlements;
}

export interface UpgradeIntentResult {
  configured: boolean;
  message: string;
  planId?: PlanId;
}
