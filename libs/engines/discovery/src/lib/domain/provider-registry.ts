import type { DiscoveryProvider } from '@kodem/contracts';

export class ProviderRegistry {
  private readonly providers = new Map<
    DiscoveryProvider['assetType'],
    DiscoveryProvider
  >();

  register(provider: DiscoveryProvider): void {
    this.providers.set(provider.assetType, provider);
  }

  registerMany(providers: DiscoveryProvider[]): void {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  get(assetType: DiscoveryProvider['assetType']): DiscoveryProvider | undefined {
    return this.providers.get(assetType);
  }

  getPriority(assetType: DiscoveryProvider['assetType']): number {
    return this.providers.get(assetType)?.priority ?? 0;
  }

  list(): DiscoveryProvider[] {
    return [...this.providers.values()].sort((a, b) => b.priority - a.priority);
  }
}
