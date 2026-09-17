export function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}

export function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const pattern =
    /<meta\s+[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    tags[match[1].toLowerCase()] = decodeHtml(match[2]);
  }

  const reversePattern =
    /<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']([^"']+)["'][^>]*>/gi;

  while ((match = reversePattern.exec(html)) !== null) {
    tags[match[2].toLowerCase()] = decodeHtml(match[1]);
  }

  return tags;
}

export function extractOpenGraph(html: string): Record<string, string> {
  const meta = extractMetaTags(html);
  const og: Record<string, string> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (key.startsWith('og:')) {
      og[key] = value;
    }
  }

  return og;
}

/** Prefer og:image, then apple-touch-icon, then favicon link tags. */
export function extractBrandLogoUrl(
  html: string,
  baseUrl: string,
): string | undefined {
  const ogImage = extractOpenGraph(html)['og:image']?.trim();
  if (ogImage) {
    const absolute = toAbsoluteUrl(ogImage, baseUrl);
    if (absolute) return absolute;
  }

  const linkPattern = /<link\b[^>]*>/gi;
  const candidates: { priority: number; href: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const tag = match[0];
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase().trim();
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1]?.trim();
    if (!rel || !href || href.startsWith('data:')) continue;

    let priority = 99;
    if (rel.includes('apple-touch-icon')) priority = 1;
    else if (rel === 'shortcut icon' || rel === 'icon') priority = 2;
    else if (rel.split(/\s+/).includes('icon')) priority = 3;
    if (priority === 99) continue;

    candidates.push({ priority, href });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  for (const candidate of candidates) {
    const absolute = toAbsoluteUrl(candidate.href, baseUrl);
    if (absolute) return absolute;
  }

  return undefined;
}

function toAbsoluteUrl(value: string, baseUrl: string): string | undefined {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  return results;
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const pattern = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      links.push(new URL(match[1], baseUrl).toString());
    } catch {
      // skip invalid href
    }
  }

  return links;
}

const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}/g;

export function extractEmails(html: string): string[] {
  const mailtoPattern = /href=["']mailto:([^"'?]+)/gi;
  const emails = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = mailtoPattern.exec(html)) !== null) {
    emails.add(match[1].trim().toLowerCase());
  }

  for (const email of html.match(EMAIL_PATTERN) ?? []) {
    if (!email.endsWith('.png') && !email.endsWith('.jpg')) {
      emails.add(email.toLowerCase());
    }
  }

  return [...emails];
}

export function extractPhones(html: string): string[] {
  const telPattern = /href=["']tel:([^"']+)["']/gi;
  const phones = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = telPattern.exec(html)) !== null) {
    phones.add(cleanPhone(match[1]));
  }

  for (const phone of html.match(PHONE_PATTERN) ?? []) {
    const cleaned = cleanPhone(phone);
    if (cleaned.replace(/\D/g, '').length >= 9) {
      phones.add(cleaned);
    }
  }

  return [...phones].slice(0, 5);
}

export function extractVisibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractListItems(html: string): string[] {
  const items: string[] = [];
  const pattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = extractVisibleText(match[1]);
    if (text.length >= 3 && text.length <= 120) {
      items.push(text);
    }
  }

  return [...new Set(items)].slice(0, 20);
}

function cleanPhone(value: string): string {
  return value.replace(/[^\d+().\s-]/g, '').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
