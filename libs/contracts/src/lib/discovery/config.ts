export interface DiscoveryConfig {
  maxDepth: number;
  maxAssets: number;
  timeoutMs: number;
  maxPageFetches: number;
  fetchTimeoutMs: number;
}

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  maxDepth: 3,
  maxAssets: 25,
  timeoutMs: 60_000,
  maxPageFetches: 15,
  fetchTimeoutMs: 12_000,
};
