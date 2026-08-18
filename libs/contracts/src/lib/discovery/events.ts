import type { DiscoveryAsset } from './asset';

export type DiscoveryLifecycleEventType =
  | 'discovery.started'
  | 'asset.discovered'
  | 'asset.processed'
  | 'discovery.completed'
  | 'business.updated';

export interface DiscoveryStartedPayload {
  businessName: string;
  websiteUrl?: string;
}

export interface AssetDiscoveredPayload {
  asset: Pick<DiscoveryAsset, 'id' | 'type' | 'url' | 'source' | 'priority' | 'depth'>;
}

export interface AssetProcessedPayload {
  asset: Pick<DiscoveryAsset, 'id' | 'type' | 'url' | 'status'>;
  factCount: number;
  newAssetCount: number;
}

export interface DiscoveryCompletedPayload {
  assetsProcessed: number;
  factCount: number;
  partial: boolean;
  stopReason: string;
}

export interface BusinessUpdatedPayload {
  fields: string[];
  source: string;
}

export type DiscoveryLifecycleEvent =
  | { type: 'discovery.started'; payload: DiscoveryStartedPayload }
  | { type: 'asset.discovered'; payload: AssetDiscoveredPayload }
  | { type: 'asset.processed'; payload: AssetProcessedPayload }
  | { type: 'discovery.completed'; payload: DiscoveryCompletedPayload }
  | { type: 'business.updated'; payload: BusinessUpdatedPayload };

export interface DiscoveryEventPublisher {
  publish(event: DiscoveryLifecycleEvent): void | Promise<void>;
}
