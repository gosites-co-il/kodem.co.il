import type { DiscoveredBusinessInfo } from '@kodem/contracts';
import { BusinessDiscoveryService } from './business-discovery.service';

/** @deprecated Use BusinessDiscoveryService — thin alias for compatibility. */
export class WebsiteDiscoveryService {
  private readonly engine = new BusinessDiscoveryService();

  async discover(websiteUrl: string): Promise<DiscoveredBusinessInfo> {
    return this.engine.discover(websiteUrl);
  }
}

export { BusinessDiscoveryService };
