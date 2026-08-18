const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
};

function buildFetchCandidates(url: string): string[] {
  try {
    const parsed = new URL(url);
    const candidates = [parsed.toString()];
    const host = parsed.hostname;

    if (!host.startsWith('www.')) {
      candidates.push(
        `${parsed.protocol}//www.${host}${parsed.pathname}${parsed.search}`,
      );
    } else {
      const apex = host.replace(/^www\./, '');
      candidates.push(
        `${parsed.protocol}//${apex}${parsed.pathname}${parsed.search}`,
      );
    }

    return [...new Set(candidates)];
  } catch {
    return [url];
  }
}

async function fetchTextOnce(
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml') &&
      !contentType.includes('application/xml') &&
      !contentType.includes('text/xml') &&
      !contentType.includes('text/plain')
    ) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const candidates = buildFetchCandidates(url);

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const attemptTimeout =
      index === 0 ? Math.min(timeoutMs, 8_000) : timeoutMs;
    const html = await fetchTextOnce(candidate, attemptTimeout);
    if (html) {
      return html;
    }
  }

  return null;
}

export function createFetchContext(
  maxFetches: number,
  fetchTimeoutMs: number,
): {
  fetchText(url: string): Promise<string | null>;
  fetchCount: number;
  maxFetches: number;
} {
  let fetchCount = 0;

  return {
    get fetchCount() {
      return fetchCount;
    },
    maxFetches,
    async fetchText(url: string) {
      if (fetchCount >= maxFetches) {
        return null;
      }
      fetchCount += 1;
      return fetchText(url, fetchTimeoutMs);
    },
  };
}
