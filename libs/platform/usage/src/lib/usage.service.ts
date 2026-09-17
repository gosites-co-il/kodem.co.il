import type {
  TrackUsageInput,
  UsageEvent,
  UsageMetric,
  WorkspaceId,
} from '@kodem/contracts';
import { UsageEventRepository as DbUsageEventRepository } from '@kodem/database';
import {
  EntitlementsService,
  SubscriptionService,
} from '@kodem/platform/subscription';

export interface UsageEventRepository {
  create(input: TrackUsageInput): Promise<UsageEvent>;
  sumQuantity(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
    since: Date,
  ): Promise<number>;
}

const FALLBACK_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export class UsageService {
  private readonly usageRepo: UsageEventRepository;
  private readonly entitlements: EntitlementsService;
  private readonly subscriptions: SubscriptionService;

  constructor(
    usageRepo?: UsageEventRepository,
    entitlements?: EntitlementsService,
    subscriptions?: SubscriptionService,
  ) {
    this.usageRepo = usageRepo ?? new DbUsageEventRepository();
    this.entitlements = entitlements ?? new EntitlementsService();
    this.subscriptions = subscriptions ?? new SubscriptionService();
  }

  async track(input: TrackUsageInput): Promise<UsageEvent> {
    return this.usageRepo.create({
      ...input,
      quantity: input.quantity ?? 1,
    });
  }

  async countInPeriod(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
    since: Date,
  ): Promise<number> {
    return this.usageRepo.sumQuantity(workspaceId, metric, since);
  }

  async periodStart(workspaceId: WorkspaceId): Promise<Date> {
    const subscription =
      await this.subscriptions.getByWorkspace(workspaceId);
    if (subscription?.currentPeriodStart) {
      return subscription.currentPeriodStart;
    }
    return new Date(Date.now() - FALLBACK_PERIOD_MS);
  }

  /** Assert plan period limit using UsageEvent totals, then record usage. */
  async assertAndTrack(
    input: TrackUsageInput,
  ): Promise<UsageEvent> {
    const quantity = input.quantity ?? 1;
    const since = await this.periodStart(input.workspaceId);
    const current = await this.countInPeriod(
      input.workspaceId,
      input.metric,
      since,
    );
    await this.entitlements.assertLimit(
      input.workspaceId,
      input.metric,
      current + quantity - 1,
    );
    return this.track({ ...input, quantity });
  }
}
