import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class InstagramProvider extends SocialPageProvider {
  readonly assetType = 'INSTAGRAM' as const;
  readonly priority = 80;
  readonly factSource = 'instagram' as const;

  protected extractPlatformFacts(
    _html: string,
    og: Record<string, string>,
    meta: Record<string, string>,
    text: string,
    facts: BusinessFact[],
    asset: DiscoveryAsset,
  ): void {
    const options = { assetId: asset.id, assetType: asset.type };

    appendFact(
      facts,
      createFact('businessCategory', meta['instagram:category'], 'instagram', 0.72, options),
    );

    if (og['og:description']) {
      appendFact(
        facts,
        createFact('brandTagline', og['og:description'], 'instagram', 0.74, options),
      );
    }

    if (text.length > 20) {
      appendFact(
        facts,
        createFact('description', text.slice(0, 300), 'instagram', 0.65, options),
      );
    }
  }
}
