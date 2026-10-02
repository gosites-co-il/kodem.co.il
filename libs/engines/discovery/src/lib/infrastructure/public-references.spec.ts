import { collectPublicReferences, referenceQueries } from './public-references';

describe('public references', () => {
  it('searches by the site name, not the whole page title', () => {
    expect(
      referenceQueries(
        'מלונות בישראל: רשת מלונות ישרוטל - המובילה בישראל',
        'https://isrotel.co.il/',
      ),
    ).toEqual(['isrotel']);
  });

  it('keeps a Wikipedia extract and Google snippets as separate evidence', async () => {
    const fetchImpl = jest.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes('he.wikipedia.org/w/api.php')) {
        return json({
          query: { search: [{ title: 'ישרוטל', snippet: 'Isrotel היא רשת מלונות' }] },
        });
      }
      if (href.includes('he.wikipedia.org/api/rest_v1')) {
        return json({
          extract:
            'ישרוטל (Isrotel) היא רשת מלונות ישראלית ציבורית, מהגדולות בישראל, עם מלונות נופש ויוקרה.',
          content_urls: { desktop: { page: 'https://he.wikipedia.org/wiki/%D7%99%D7%A9%D7%A8%D7%95%D7%98%D7%9C' } },
        });
      }
      if (href.includes('customsearch')) {
        return json({
          items: [
            { title: 'Isrotel', snippet: 'רשת מלונות ישראלית עם אתרי נופש באילת ובירושלים.' },
          ],
        });
      }
      return json({});
    });

    const result = await collectPublicReferences({
      businessName: 'ישרוטל',
      websiteUrl: 'https://isrotel.co.il/',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      env: { GOOGLE_SEARCH_API_KEY: 'test-key', GOOGLE_SEARCH_CX: 'test-cx' },
    });

    expect(result.facts.map((fact) => fact.source)).toEqual(['wikipedia', 'google_search']);
    expect(String(result.facts[0]?.value)).toContain('רשת מלונות ישראלית');
    expect(result.assets.map((asset) => asset.type)).toEqual(['WIKIPEDIA', 'GOOGLE_SEARCH']);
  });

  it('skips Google when no search key is configured', async () => {
    const fetchImpl = jest.fn(async () => json({ query: { search: [] } }));
    const result = await collectPublicReferences({
      websiteUrl: 'https://isrotel.co.il/',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      env: {},
    });
    expect(result.facts).toEqual([]);
    expect(String(fetchImpl.mock.calls)).not.toContain('customsearch');
  });
});

function json(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}
