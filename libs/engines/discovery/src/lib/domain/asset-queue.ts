import type { DiscoveryAsset } from '@kodem/contracts';

export class AssetQueue {
  private readonly items: DiscoveryAsset[] = [];

  push(asset: DiscoveryAsset): void {
    this.items.push(asset);
    this.items.sort((a, b) => b.priority - a.priority);
  }

  pushMany(assets: DiscoveryAsset[]): void {
    for (const asset of assets) {
      this.push(asset);
    }
  }

  pop(): DiscoveryAsset | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  get size(): number {
    return this.items.length;
  }
}
