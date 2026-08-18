import type { WorkspaceId } from '../ids';
import type { BusinessProfile } from '../profile';
import type { DiscoveredBusinessInfo } from '../workspace-setup';
import type { DiscoveryAsset } from './asset';
import type { BusinessFact } from './fact';
import type { DiscoveryConfig } from './config';

export interface DiscoveryRunInput {
  workspaceId: WorkspaceId;
  businessName: string;
  websiteUrl?: string;
  config?: Partial<DiscoveryConfig>;
}

export interface DiscoveryRunResult {
  workspaceId: WorkspaceId;
  profile: Omit<BusinessProfile, 'createdAt' | 'updatedAt'>;
  discovered: DiscoveredBusinessInfo;
  facts: BusinessFact[];
  assetsProcessed: DiscoveryAsset[];
  hypotheses: string[];
  completedAt: Date;
  partial: boolean;
  stopReason: 'queue_empty' | 'max_depth' | 'max_assets' | 'timeout' | 'no_seed';
}
