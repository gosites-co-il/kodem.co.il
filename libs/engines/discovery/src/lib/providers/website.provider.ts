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
  extractListItems,
  extractMetaTags,
  extractOpenGraph,
  extractPhones,
  extractTitle,
  extractVisibleText,
} from '../infrastructure/html-extractor';
import { extractFactsFromJsonLd } from '../infrastructure/json-ld-extractor';
import {
  detectSocialAssets,
  findInternalPages,
} from '../infrastructure/social-detector';
import { resolvePath } from '../infrastructure/url-utils';
import { inferIndustryFromSignals } from '../infrastructure/industry-inference';
import { appendFact, createFact } from '../domain/fact-utils';

export class WebsiteProvider implements DiscoveryProvider {
  readonly assetType = 'WEBSITE' as const;
  readonly priority = 100;

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

    const meta = extractMetaTags(html);
    const og = extractOpenGraph(html);
    const title = extractTitle(html);
    const jsonLd = extractJsonLd(html);
    const links = extractLinks(html, asset.url);
    const factOptions = { assetId: asset.id, assetType: asset.type };

    const description =
      og['og:description'] ?? meta.description ?? meta['twitter:description'];
    const businessName = og['og:site_name'] ?? title;

    appendFact(
      facts,
      createFact('website', asset.url, 'website', 1, {
        ...factOptions,
        verified: true,
      }),
    );

    appendFact(
      facts,
      createFact('businessName', businessName, 'open_graph', 0.78, factOptions),
    );

    appendFact(
      facts,
      createFact('description', description, 'open_graph', 0.76, factOptions),
    );

    if (!description) {
      const intro = extractVisibleText(html).slice(0, 600);
      if (intro.length > 40) {
        appendFact(
          facts,
          createFact('description', intro, 'website', 0.55, factOptions),
        );
      }
    }

    appendFact(
      facts,
      createFact('logo', og['og:image'], 'open_graph', 0.74, factOptions),
    );

    appendFact(
      facts,
      createFact('language', og['og:locale'] ?? meta['language'], 'website', 0.6, factOptions),
    );

    if (meta.keywords) {
      const keywords = meta.keywords
        .split(/[,،|]/)
        .map((k) => k.trim())
        .filter((k) => k.length >= 2);
      if (keywords.length > 0) {
        appendFact(
          facts,
          createFact('keywords', keywords, 'website', 0.68, factOptions),
        );
      }
    }

    const industryHint = inferIndustryFromSignals(
      title,
      meta.keywords,
      description ?? extractVisibleText(html).slice(0, 300),
    );
    if (industryHint) {
      appendFact(
        facts,
        createFact('industry', industryHint, 'website', 0.58, factOptions),
      );
    }

    facts.push(
      ...extractFactsFromJsonLd(jsonLd, asset.id, asset.type),
    );

    const emails = extractEmails(html);
    if (emails.length > 0) {
      appendFact(
        facts,
        createFact('emails', emails, 'regex', 0.72, {
          assetId: asset.id,
          assetType: asset.type,
        }),
      );
    }

    const phones = extractPhones(html);
    if (phones.length > 0) {
      appendFact(
        facts,
        createFact('phones', phones, 'regex', 0.68, {
          assetId: asset.id,
          assetType: asset.type,
        }),
      );
    }

    assets.push(...detectSocialAssets(links, asset.id, asset.depth + 1));

    const internalPages = findInternalPages(links, asset.url);
    for (const pageUrl of internalPages) {
      const pageAssets = await this.scanInternalPage(pageUrl, asset, context, facts);
      assets.push(...pageAssets);
    }

    await this.scanRobotsAndSitemap(asset, context, facts, assets);

    return { facts, assets };
  }

  private async scanInternalPage(
    pageUrl: string,
    asset: DiscoveryAsset,
    context: ProviderFetchContext,
    facts: BusinessFact[],
  ): Promise<DiscoveryAsset[]> {
    const discoveredAssets: DiscoveryAsset[] = [];
    const html = await context.fetchText(pageUrl);
    if (!html) {
      return discoveredAssets;
    }

    const path = new URL(pageUrl).pathname.toLowerCase();
    const text = extractVisibleText(html);
    const listItems = extractListItems(html);
    const pageLinks = extractLinks(html, pageUrl);

    if (path.includes('about')) {
      appendFact(
        facts,
        createFact('description', text.slice(0, 500), 'website', 0.7, {
          assetId: asset.id,
          assetType: asset.type,
        }),
      );
    }

    if (path.includes('contact')) {
      const emails = extractEmails(html);
      const phones = extractPhones(html);
      if (emails.length > 0) {
        appendFact(
          facts,
          createFact('emails', emails, 'website', 0.82, {
            assetId: asset.id,
            assetType: asset.type,
          }),
        );
      }
      if (phones.length > 0) {
        appendFact(
          facts,
          createFact('phones', phones, 'website', 0.8, {
            assetId: asset.id,
            assetType: asset.type,
          }),
        );
      }
    }

    if (path.includes('service')) {
      const services = listItems.length > 0 ? listItems : extractHeadingItems(html);
      if (services.length > 0) {
        appendFact(
          facts,
          createFact('services', services, 'website', 0.75, {
            assetId: asset.id,
            assetType: asset.type,
          }),
        );
      }
    }

    if (path.includes('product')) {
      const products = listItems.length > 0 ? listItems : extractHeadingItems(html);
      if (products.length > 0) {
        appendFact(
          facts,
          createFact('products', products, 'website', 0.75, {
            assetId: asset.id,
            assetType: asset.type,
          }),
        );
      }
    }

    facts.push(
      ...extractFactsFromJsonLd(extractJsonLd(html), asset.id, asset.type),
    );

    discoveredAssets.push(
      ...detectSocialAssets(pageLinks, asset.id, asset.depth + 1),
    );

    return discoveredAssets;
  }

  private async scanRobotsAndSitemap(
    asset: DiscoveryAsset,
    context: ProviderFetchContext,
    facts: BusinessFact[],
    assets: DiscoveryAsset[],
  ): Promise<void> {
    const robotsUrl = resolvePath(asset.url, '/robots.txt');
    if (robotsUrl) {
      const robots = await context.fetchText(robotsUrl);
      if (robots) {
        appendFact(
          facts,
          createFact('externalLinks', [robotsUrl], 'robots', 0.5, {
            assetId: asset.id,
            assetType: asset.type,
          }),
        );

        const sitemapMatch = robots.match(/^sitemap:\s*(.+)$/im);
        if (sitemapMatch?.[1]) {
          const sitemapUrl = sitemapMatch[1].trim();
          const sitemap = await context.fetchText(sitemapUrl);
          if (sitemap) {
            appendFact(
              facts,
              createFact('externalLinks', [sitemapUrl], 'sitemap', 0.55, {
                assetId: asset.id,
                assetType: asset.type,
              }),
            );
            const sitemapLinks = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(
              (m) => m[1],
            );
            assets.push(
              ...detectSocialAssets(sitemapLinks, asset.id, asset.depth + 1),
            );
          }
        }
      }
    }
  }
}

function extractHeadingItems(html: string): string[] {
  const items: string[] = [];
  const pattern = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const text = extractVisibleText(match[1]);
    if (text.length >= 3 && text.length <= 80) {
      items.push(text);
    }
  }

  return [...new Set(items)].slice(0, 15);
}
