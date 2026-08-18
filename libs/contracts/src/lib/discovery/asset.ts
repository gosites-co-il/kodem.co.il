/** Discovered business asset types — extensible registry. */
export type DiscoveryAssetType =
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'GOOGLE_BUSINESS'
  | 'INSTAGRAM'
  | 'LINKEDIN'
  | 'TIKTOK';

export type DiscoveryAssetStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface DiscoveryAsset {
  id: string;
  type: DiscoveryAssetType;
  source: string;
  url: string;
  status: DiscoveryAssetStatus;
  priority: number;
  depth: number;
}
