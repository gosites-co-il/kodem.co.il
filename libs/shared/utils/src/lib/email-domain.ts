/**
 * Free / consumer mailbox providers — not treated as a business domain.
 * Keep lowercase host labels only (no TLD). Matching is on the full domain
 * and on the registrable-ish second-level when needed (e.g. mail.google.com).
 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.co.il',
  'hotmail.com',
  'hotmail.co.il',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.il',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'zoho.com',
  'zohomail.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'email.com',
  'fastmail.com',
  'hey.com',
  'tutanota.com',
  'tutamail.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'walla.co.il',
  'walla.com',
  'nana10.co.il',
]);

export function parseEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1).replace(/\.+$/, '');
  if (!domain.includes('.') || domain.includes(' ')) return null;
  return domain;
}

export function isFreeEmailDomain(domain: string): boolean {
  const host = domain.trim().toLowerCase();
  if (FREE_EMAIL_DOMAINS.has(host)) return true;
  // Catch subdomains of free providers (e.g. mail.proton.me)
  for (const free of FREE_EMAIL_DOMAINS) {
    if (host.endsWith(`.${free}`)) return true;
  }
  return false;
}

/** First label of the domain: acme.co.il → acme, shop.acme.com → shop */
export function domainLabelForSlug(domain: string): string {
  const host = domain.trim().toLowerCase();
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 0) return '';
  // Strip common second-level public suffixes for IL / UK style: foo.co.il → foo
  if (
    parts.length >= 3 &&
    ['co', 'com', 'org', 'net', 'ac', 'gov'].includes(parts[parts.length - 2])
  ) {
    return parts[parts.length - 3] ?? parts[0];
  }
  return parts[0];
}

export function websiteUrlFromEmailDomain(domain: string): string {
  return `https://${domain.trim().toLowerCase()}`;
}

/**
 * Corporate mailbox → slug + website defaults.
 * Returns null for free providers or unparseable addresses.
 */
export function corporateEmailIdentityHints(email: string): {
  domain: string;
  slug: string;
  websiteUrl: string;
} | null {
  const domain = parseEmailDomain(email);
  if (!domain || isFreeEmailDomain(domain)) return null;

  const slug = domainLabelForSlug(domain)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  if (slug.length < 2) return null;

  return {
    domain,
    slug,
    websiteUrl: websiteUrlFromEmailDomain(domain),
  };
}
