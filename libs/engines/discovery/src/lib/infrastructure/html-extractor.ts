export function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const text = match?.[1] ? decodeHtml(match[1]).replace(/\s+/g, ' ').trim() : '';
  return text || undefined;
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
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4,}/g;

const CONTACT_HEADING =
  /טלפון|שיחת ייעוץ|דברו|צור קשר|call us|contact us|phone call|אנחנו במרחק/i;

const CHROME_HEADING =
  /חיפוש|התחבר|התנתק|ניוזלטר|דוא.?ל|הרשמ|כניסה|תפריט|menu|search|login|sign in|cookie|הקלידו|תאריכים|מבוגרים|אחרונים|מעוניינים|newsletter|subscribe|cart|סל קניות/i;

/** Cloudflare email-protection hex: first byte is the XOR key. */
export function decodeCloudflareEmail(hex: string): string | null {
  const cleaned = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(cleaned) || cleaned.length < 4 || cleaned.length % 2 !== 0) {
    return null;
  }
  const key = parseInt(cleaned.slice(0, 2), 16);
  let email = '';
  for (let index = 2; index < cleaned.length; index += 2) {
    email += String.fromCharCode(parseInt(cleaned.slice(index, index + 2), 16) ^ key);
  }
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) return null;
  return normalized;
}

function rememberEmail(emails: Set<string>, value: string | null | undefined): void {
  const email = value?.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) return;
  if (email.endsWith('.png') || email.endsWith('.jpg') || email.endsWith('.gif')) return;
  emails.add(email);
}

export function extractEmails(html: string): string[] {
  const mailtoPattern = /href=["']mailto:([^"'?]+)/gi;
  const emails = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = mailtoPattern.exec(html)) !== null) {
    rememberEmail(emails, safeDecode(match[1]));
  }

  const cfHref = /email-protection#([0-9a-fA-F]+)/g;
  while ((match = cfHref.exec(html)) !== null) {
    rememberEmail(emails, decodeCloudflareEmail(match[1]));
  }

  const cfData = /data-cfemail=["']([0-9a-fA-F]+)["']/gi;
  while ((match = cfData.exec(html)) !== null) {
    rememberEmail(emails, decodeCloudflareEmail(match[1]));
  }

  for (const email of html.match(new RegExp(EMAIL_PATTERN.source, 'g')) ?? []) {
    rememberEmail(emails, email);
  }

  return [...emails];
}

function isPhoneShaped(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

function phoneKey(value: string): string {
  return value.replace(/\D/g, '').slice(-9);
}

export function extractPhones(html: string): string[] {
  const telPattern = /href=["']tel:([^"']+)["']/gi;
  const phones: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const cleaned = cleanPhone(value);
    if (!isPhoneShaped(cleaned)) return;
    const key = phoneKey(cleaned);
    if (seen.has(key)) return;
    seen.add(key);
    phones.push(cleaned);
  };

  let match: RegExpExecArray | null;
  while ((match = telPattern.exec(html)) !== null) {
    add(safeDecode(match[1]));
  }

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

  for (const phone of visible.match(PHONE_PATTERN) ?? []) {
    add(phone);
  }

  return phones.slice(0, 5);
}

const CHROME_TEXT =
  /\b(skip to content|top of page|bottom of page|use tab to navigate through the menu items)\b/gi;

function stripPageChrome(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ');
}

/** Sentences from the page body. Menus and booking widgets are left out. */
export function extractCleanVisibleExcerpt(html: string, maxLength = 700): string {
  const body = stripPageChrome(html);
  const paragraphs: string[] = [];
  const pattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const text = extractVisibleText(match[1]).replace(CHROME_TEXT, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 40) continue;
    if (CHROME_HEADING.test(text)) continue;
    paragraphs.push(text);
    if (paragraphs.join(' ').length >= maxLength) break;
  }

  return paragraphs.join(' ').slice(0, maxLength).trim();
}

/** h2–h4 offer headings. Skips the business name, menus, and contact calls to action. */
export function extractOfferHeadings(html: string, businessName?: string): string[] {
  const items: string[] = [];
  const pattern = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  const name = businessName?.trim().toLowerCase();
  const body = stripPageChrome(html);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    const text = extractVisibleText(match[1]);
    if (text.length < 3 || text.length > 80) continue;
    if (text.endsWith('?')) continue;
    if (CONTACT_HEADING.test(text) || CHROME_HEADING.test(text)) continue;
    if (name && text.toLowerCase() === name) continue;
    items.push(text);
  }

  return [...new Set(items)].slice(0, 8);
}

export function extractVisibleText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&');
}
