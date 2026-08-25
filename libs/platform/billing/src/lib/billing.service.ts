import type {
  BillingSnapshot,
  PlanDefinition,
  PlanId,
  UpgradeIntentResult,
  WorkspaceId,
} from '@kodem/contracts';
import {
  EntitlementsService,
  listPlans,
  SubscriptionService,
  type SubscriptionRepository,
} from '@kodem/platform/subscription';

export interface BillingProvider {
  getSnapshot(workspaceId: WorkspaceId): Promise<BillingSnapshot>;
  getPlans(): PlanDefinition[];
  upgradeIntent(
    workspaceId: WorkspaceId,
    planId: PlanId,
  ): Promise<UpgradeIntentResult>;
}

export class UnconfiguredBillingProvider implements BillingProvider {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async getSnapshot(workspaceId: WorkspaceId): Promise<BillingSnapshot> {
    await this.subscriptions.ensureForWorkspace(workspaceId);
    const subscription = await this.subscriptions.getByWorkspace(workspaceId);
    const entitlements = await this.entitlements.resolve(workspaceId);

    return {
      configured: false,
      subscription: {
        planId: subscription?.planId ?? 'free',
        status: subscription?.status ?? 'active',
      },
      entitlements,
    };
  }

  getPlans(): PlanDefinition[] {
    return listPlans();
  }

  async upgradeIntent(
    _workspaceId: WorkspaceId,
    planId: PlanId,
  ): Promise<UpgradeIntentResult> {
    return {
      configured: false,
      message: 'Billing is not configured',
      planId,
    };
  }
}

export class BillingService {
  private readonly provider: BillingProvider;

  constructor(
    subscriptionRepo?: SubscriptionRepository,
    provider?: BillingProvider,
  ) {
    const subscriptions = new SubscriptionService(subscriptionRepo);
    const entitlements = new EntitlementsService(subscriptionRepo);
    this.provider =
      provider ??
      new UnconfiguredBillingProvider(subscriptions, entitlements);
  }

  getSnapshot(workspaceId: WorkspaceId): Promise<BillingSnapshot> {
    return this.provider.getSnapshot(workspaceId);
  }

  getPlans(): PlanDefinition[] {
    return this.provider.getPlans();
  }

  upgradeIntent(
    workspaceId: WorkspaceId,
    planId: PlanId,
  ): Promise<UpgradeIntentResult> {
    return this.provider.upgradeIntent(workspaceId, planId);
  }
}
