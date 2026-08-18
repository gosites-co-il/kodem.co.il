import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class TikTokProvider extends SocialPageProvider {
  readonly assetType = 'TIKTOK' as const;
  readonly priority = 60;
  readonly factSource = 'tiktok' as const;

  protected extractPlatformFacts(
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
        createFact('description', og['og:description'], 'tiktok', 0.72, options),
      );
    }

    const externalLinks: string[] = [];
    for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
      const url = match[0];
      if (!url.includes('tiktok.com')) {
        externalLinks.push(url);
        if (externalLinks.length >= 5) {
          break;
        }
      }
    }

    if (externalLinks.length > 0) {
      appendFact(
        facts,
        createFact('externalLinks', externalLinks, 'tiktok', 0.68, options),
      );

      const website = externalLinks.find((url) => !url.includes('instagram.com'));
      if (website) {
        appendFact(
          facts,
          createFact('website', website, 'tiktok', 0.7, options),
        );
      }
    }
  }
}
