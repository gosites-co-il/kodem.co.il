import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class GoogleBusinessProvider extends SocialPageProvider {
  readonly assetType = 'GOOGLE_BUSINESS' as const;
  readonly priority = 85;
  readonly factSource = 'google_business' as const;

  protected extractPlatformFacts(
    html: string,
    og: Record<string, string>,
    _meta: Record<string, string>,
    text: string,
    facts: BusinessFact[],
    asset: DiscoveryAsset,
  ): void {
    const options = { assetId: asset.id, assetType: asset.type };

    appendFact(
      facts,
      createFact('businessName', og['og:title'], 'google_business', 0.88, options),
    );

    const ratingMatch = text.match(/(\d(?:\.\d)?)\s*(?:stars?|★|דירוג)/i);
    if (ratingMatch?.[1]) {
      appendFact(
        facts,
        createFact('rating', Number(ratingMatch[1]), 'google_business', 0.8, options),
      );
    }

    const reviewMatch = text.match(/(\d[\d,]*)\s*(?:reviews?|ביקורות)/i);
    if (reviewMatch?.[1]) {
      appendFact(
        facts,
        createFact('reviewCount', Number(reviewMatch[1].replace(/,/g, '')), 'google_business', 0.78, options),
      );
    }

    const addressMatch = text.match(
      /(?:Address|כתובת)[:\s]+([^\n|]{8,120})/i,
    );
    if (addressMatch?.[1]) {
      appendFact(
        facts,
        createFact('addresses', [addressMatch[1].trim()], 'google_business', 0.84, options),
      );
    }

    const hoursMatch = text.match(
      /(?:Hours|שעות פתיחה)[:\s]+([^\n]{8,200})/i,
    );
    if (hoursMatch?.[1]) {
      appendFact(
        facts,
        createFact('openingHours', hoursMatch[1].trim(), 'google_business', 0.75, options),
      );
    }
  }
}
