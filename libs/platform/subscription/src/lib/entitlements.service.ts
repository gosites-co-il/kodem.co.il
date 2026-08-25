import type {
  ModuleId,
  PlanId,
  ResolvedEntitlements,
  Subscription,
  UsageMetric,
  WorkspaceId,
} from '@kodem/contracts';
import { SubscriptionRepository as DbSubscriptionRepository } from '@kodem/database';
import { getPlan } from './plans';

export interface SubscriptionRepository {
  findByWorkspaceId(workspaceId: WorkspaceId): Promise<Subscription | null>;
  create(input: {
    workspaceId: WorkspaceId;
    planId: PlanId;
    status?: Subscription['status'];
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }): Promise<Subscription>;
}

export class EntitlementsService {
  private readonly subscriptionRepo: SubscriptionRepository;

  constructor(subscriptionRepo?: SubscriptionRepository) {
    this.subscriptionRepo =
      subscriptionRepo ?? new DbSubscriptionRepository();
  }

  async resolve(workspaceId: WorkspaceId): Promise<ResolvedEntitlements> {
    const subscription =
      await this.subscriptionRepo.findByWorkspaceId(workspaceId);
    const planId: PlanId = subscription?.planId ?? 'free';
    const plan = getPlan(planId);
    return {
      planId,
      modules: [...plan.modules],
      limits: { ...plan.limits },
    };
  }

  async hasModule(
    workspaceId: WorkspaceId,
    moduleId: ModuleId,
  ): Promise<boolean> {
    const entitlements = await this.resolve(workspaceId);
    return entitlements.modules.includes(moduleId);
  }

  async getLimit(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
  ): Promise<number | null> {
    const entitlements = await this.resolve(workspaceId);
    return entitlements.limits[metric];
  }

  async assertLimit(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
    currentUsage: number,
  ): Promise<void> {
    const limit = await this.getLimit(workspaceId, metric);
    if (limit === null) return;
    if (currentUsage >= limit) {
      throw new Error(
        `Usage limit exceeded for ${metric}: ${currentUsage}/${limit}`,
      );
    }
  }
}
