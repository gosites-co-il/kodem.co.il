import type { PlanId, Subscription, WorkspaceId } from '@kodem/contracts';
import { SubscriptionRepository as DbSubscriptionRepository } from '@kodem/database';
import type { SubscriptionRepository } from './entitlements.service';

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export class SubscriptionService {
  private readonly subscriptionRepo: SubscriptionRepository;

  constructor(subscriptionRepo?: SubscriptionRepository) {
    this.subscriptionRepo =
      subscriptionRepo ?? new DbSubscriptionRepository();
  }

  async getByWorkspace(
    workspaceId: WorkspaceId,
  ): Promise<Subscription | null> {
    return this.subscriptionRepo.findByWorkspaceId(workspaceId);
  }

  async ensureForWorkspace(workspaceId: WorkspaceId): Promise<Subscription> {
    const existing =
      await this.subscriptionRepo.findByWorkspaceId(workspaceId);
    if (existing) return existing;

    const now = new Date();
    return this.subscriptionRepo.create({
      workspaceId,
      planId: 'free' satisfies PlanId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + PERIOD_MS),
    });
  }
}
