import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { createAsset, createFact } from '../domain/fact-utils';

const USER_AGENT = 'KodemBusinessProfile/1.0 (https://kodem.co.il)';

export function referenceQueries(businessName: string, websiteUrl?: string): string[] {
  const host = hostLabel(websiteUrl);
  if (host) return [host];
  const brand = businessName.trim();
  if (brand.length >= 2 && brand.length <= 40 && !brand.includes('://')) return [brand];
  return [];
}

export async function collectPublicReferences(input: {
  businessName?: string;
  websiteUrl?: string;
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}): Promise<{ facts: BusinessFact[]; assets: DiscoveryAsset[] }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const queries = referenceQueries(input.businessName ?? '', input.websiteUrl);
  const query = queries[0];
  if (!query) return { facts: [], assets: [] };

  const facts: BusinessFact[] = [];
  const assets: DiscoveryAsset[] = [];

  const wiki = await lookupWikipedia(query, fetchImpl);
  if (wiki) {
    const fact = createFact('description', wiki.extract, 'wikipedia', 0.82, {
      assetType: 'WIKIPEDIA',
    });
    if (fact) facts.push(fact);
    const asset = completedAsset('WIKIPEDIA', wiki.url, 'wikipedia');
    if (asset) assets.push(asset);
  }

  const google = await lookupGoogle(query, fetchImpl, input.env ?? process.env);
  if (google) {
    const fact = createFact('description', google.snippets, 'google_search', 0.68, {
      assetType: 'GOOGLE_SEARCH',
    });
    if (fact) facts.push(fact);
    const asset = completedAsset('GOOGLE_SEARCH', google.url, 'google_search');
    if (asset) assets.push(asset);
  }

  return { facts, assets };
}

function completedAsset(
  type: 'WIKIPEDIA' | 'GOOGLE_SEARCH',
  url: string,
  source: string,
): DiscoveryAsset | null {
  const asset = createAsset(type, url, source, 40, 0);
  if (!asset) return null;
  asset.status = 'completed';
  return asset;
}

function hostLabel(websiteUrl?: string): string {
  if (!websiteUrl?.trim()) return '';
  try {
    const host = new URL(
      websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
    ).hostname.replace(/^www\./, '');
    const label = host.split('.')[0] ?? '';
    return label.length >= 3 ? label : '';
  } catch {
    return '';
  }
}

async function lookupWikipedia(
  query: string,
  fetchImpl: typeof fetch,
): Promise<{ extract: string; url: string } | null> {
  for (const host of ['https://he.wikipedia.org', 'https://en.wikipedia.org']) {
    const search = await fetchJson(
      `${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json`,
      fetchImpl,
    );
    const hit = search?.query?.search?.[0];
    const title = typeof hit?.title === 'string' ? hit.title : '';
    if (!title) continue;
    const summary = await fetchJson(
      `${host}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      fetchImpl,
    );
    const extract = typeof summary?.extract === 'string' ? summary.extract.trim() : '';
    const page =
      summary?.content_urls?.desktop?.page ??
      `${host}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    const blob = `${title} ${hit?.snippet ?? ''} ${extract}`.toLowerCase();
    if (extract.length < 80 || !blob.includes(query.toLowerCase())) continue;
    return { extract: extract.slice(0, 900), url: String(page) };
  }
  return null;
}

async function lookupGoogle(
  query: string,
  fetchImpl: typeof fetch,
  env: NodeJS.ProcessEnv,
): Promise<{ snippets: string; url: string } | null> {
  const key = env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = env.GOOGLE_SEARCH_CX?.trim();
  if (!key || !cx) return null;

  const endpoint = new URL('https://www.googleapis.com/customsearch/v1');
  endpoint.searchParams.set('key', key);
  endpoint.searchParams.set('cx', cx);
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('num', '3');

  const json = await fetchJson(endpoint.toString(), fetchImpl);
  const items = Array.isArray(json?.items) ? json.items : [];
  const lines = items
    .map((item) => {
      const title = typeof item?.title === 'string' ? item.title.trim() : '';
      const snippet = typeof item?.snippet === 'string' ? item.snippet.trim() : '';
      return [title, snippet].filter(Boolean).join(' — ');
    })
    .filter(Boolean)
    .slice(0, 3);
  if (lines.length === 0) return null;

  return {
    snippets: lines.join('\n').slice(0, 900),
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  };
}

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<Record<string, any> | null> {
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
