import type { DiscoveredBusinessInfo } from '@kodem/contracts';
import { BusinessDiscoveryService } from './business-discovery.service';

/** @deprecated Use BusinessDiscoveryService — thin alias for compatibility. */
export class WebsiteDiscoveryService {
  private readonly engine = new BusinessDiscoveryService();

  async discover(
    websiteUrl: string,
    businessName = websiteUrl,
    workspaceId = 'ws_legacy' as import('@kodem/contracts').WorkspaceId,
  ): Promise<DiscoveredBusinessInfo> {
    const result = await this.engine.discover(
      websiteUrl,
      businessName,
      workspaceId,
    );
    return result.discovered;
  }
}

export { BusinessDiscoveryService };
