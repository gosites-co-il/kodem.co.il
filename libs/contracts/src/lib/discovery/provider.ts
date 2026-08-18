import type { DiscoveryAsset } from './asset';
import type { BusinessFact } from './fact';

export interface ProviderDiscoveryResult {
  facts: BusinessFact[];
  assets: DiscoveryAsset[];
}

export interface ProviderFetchContext {
  fetchText(url: string): Promise<string | null>;
  fetchCount: number;
  maxFetches: number;
}

export interface DiscoveryProvider {
  readonly assetType: DiscoveryAsset['type'];
  readonly priority: number;
  discover(
    asset: DiscoveryAsset,
    context: ProviderFetchContext,
  ): Promise<ProviderDiscoveryResult>;
}
