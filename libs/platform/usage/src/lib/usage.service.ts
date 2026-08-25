import type {
  TrackUsageInput,
  UsageEvent,
  UsageMetric,
  WorkspaceId,
} from '@kodem/contracts';
import { UsageEventRepository as DbUsageEventRepository } from '@kodem/database';

export interface UsageEventRepository {
  create(input: TrackUsageInput): Promise<UsageEvent>;
  sumQuantity(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
    since: Date,
  ): Promise<number>;
}

export class UsageService {
  private readonly usageRepo: UsageEventRepository;

  constructor(usageRepo?: UsageEventRepository) {
    this.usageRepo = usageRepo ?? new DbUsageEventRepository();
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
}
