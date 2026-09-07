import type { PlanId } from './subscription';
import type { WorkspaceId } from './ids';

export type FeatureFlagId = string;

export type FeatureFlagScope =
  | 'global'
  | 'environment'
  | 'plan'
  | 'workspace';

export interface FeatureFlagContext {
  workspaceId?: WorkspaceId;
  planId?: PlanId;
  environment?: string;
}

export interface FeatureFlagOverride {
  id: string;
  key: string;
  scope: FeatureFlagScope;
  enabled: boolean;
  planId?: PlanId | null;
  workspaceId?: WorkspaceId | null;
  environment?: string | null;
}
