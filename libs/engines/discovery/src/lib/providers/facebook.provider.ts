import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class FacebookProvider extends SocialPageProvider {
  readonly assetType = 'FACEBOOK' as const;
  readonly priority = 90;
  readonly factSource = 'facebook' as const;

  protected extractPlatformFacts(
    html: string,
    og: Record<string, string>,
    meta: Record<string, string>,
    text: string,
    facts: BusinessFact[],
    asset: DiscoveryAsset,
  ): void {
    const options = { assetId: asset.id, assetType: asset.type };

    appendFact(
      facts,
      createFact('businessCategory', meta['business:contact_data:category'] ?? og['og:locale'], 'facebook', 0.7, options),
    );

    const whatsappMatch = html.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/i);
    if (whatsappMatch?.[0]) {
      appendFact(
        facts,
        createFact('whatsapp', whatsappMatch[0], 'facebook', 0.82, options),
      );
    }

    if (text.length > 40) {
      appendFact(
        facts,
        createFact('description', text.slice(0, 600), 'facebook', 0.68, options),
      );
    }
  }
}
