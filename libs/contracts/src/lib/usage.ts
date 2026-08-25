import type { WorkspaceId } from './ids';
import type { UsageMetric } from './subscription';

export interface TrackUsageInput {
  workspaceId: WorkspaceId;
  metric: UsageMetric;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface UsageEvent {
  id: string;
  workspaceId: WorkspaceId;
  metric: UsageMetric;
  quantity: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
