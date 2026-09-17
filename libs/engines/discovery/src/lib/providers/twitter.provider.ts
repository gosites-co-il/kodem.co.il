import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class TwitterProvider extends SocialPageProvider {
  readonly assetType = 'TWITTER' as const;
  readonly priority = 55;
  readonly factSource = 'twitter' as const;

  protected override extractPlatformFacts(
    _html: string,
    og: Record<string, string>,
    _meta: Record<string, string>,
    text: string,
    facts: BusinessFact[],
    asset: DiscoveryAsset,
  ): void {
    const options = { assetId: asset.id, assetType: asset.type };

    if (og['og:description']) {
      appendFact(
        facts,
        createFact('brandTagline', og['og:description'], 'twitter', 0.72, options),
      );
    }

    if (text.length > 20) {
      appendFact(
        facts,
        createFact('description', text.slice(0, 300), 'twitter', 0.62, options),
      );
    }
  }
}
