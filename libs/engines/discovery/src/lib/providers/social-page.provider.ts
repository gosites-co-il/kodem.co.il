import type {
  BusinessFact,
  DiscoveryAsset,
  DiscoveryProvider,
  ProviderDiscoveryResult,
  ProviderFetchContext,
} from '@kodem/contracts';
import {
  extractEmails,
  extractJsonLd,
  extractLinks,
  extractMetaTags,
  extractOpenGraph,
  extractPhones,
  extractTitle,
  extractVisibleText,
} from '../infrastructure/html-extractor';
import { extractFactsFromJsonLd } from '../infrastructure/json-ld-extractor';
import { detectSocialAssets } from '../infrastructure/social-detector';
import { appendFact, createFact } from '../domain/fact-utils';

export abstract class SocialPageProvider implements DiscoveryProvider {
  abstract readonly assetType: DiscoveryAsset['type'];
  abstract readonly priority: number;
  abstract readonly factSource: BusinessFact['source'];

  async discover(
    asset: DiscoveryAsset,
    context: ProviderFetchContext,
  ): Promise<ProviderDiscoveryResult> {
    const facts: BusinessFact[] = [];
    const assets: DiscoveryAsset[] = [];
    const html = await context.fetchText(asset.url);

    if (!html) {
      return { facts, assets };
    }

    const og = extractOpenGraph(html);
    const meta = extractMetaTags(html);
    const title = extractTitle(html);
    const text = extractVisibleText(html);
    const links = extractLinks(html, asset.url);
    const options = { assetId: asset.id, assetType: asset.type };

    appendFact(
      facts,
      createFact('businessName', og['og:title'] ?? title, 'open_graph', 0.8, options),
    );
    appendFact(
      facts,
      createFact('description', og['og:description'] ?? meta.description, 'open_graph', 0.78, options),
    );
    appendFact(
      facts,
      createFact('logo', og['og:image'], 'open_graph', 0.72, options),
    );
    appendFact(
      facts,
      createFact('website', og['og:url'], 'open_graph', 0.7, options),
    );

    this.extractPlatformFacts(html, og, meta, text, facts, asset);
    facts.push(...extractFactsFromJsonLd(extractJsonLd(html), asset.id, asset.type));

    const emails = extractEmails(html);
    if (emails.length > 0) {
      appendFact(
        facts,
        createFact('emails', emails, this.factSource, 0.75, options),
      );
    }

    const phones = extractPhones(html);
    if (phones.length > 0) {
      appendFact(
        facts,
        createFact('phones', phones, this.factSource, 0.72, options),
      );
    }

    assets.push(
      ...detectSocialAssets(links, asset.id, asset.depth + 1).filter(
        (a) => a.type !== this.assetType,
      ),
    );

    return { facts, assets };
  }

  protected extractPlatformFacts(
    _html: string,
    _og: Record<string, string>,
    _meta: Record<string, string>,
    _text: string,
    _facts: BusinessFact[],
    _asset: DiscoveryAsset,
  ): void {
    // override per platform
  }
}
