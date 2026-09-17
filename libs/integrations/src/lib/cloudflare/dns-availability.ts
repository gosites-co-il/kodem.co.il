/**
 * Cloudflare DNS availability (check-only).
 * Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID.
 * When unset, returns { checked: false } so callers can fall back to DB-only.
 */

export type DnsAvailabilityResult =
  | { checked: true; available: boolean; hostname: string }
  | { checked: false; reason: 'not_configured' | 'request_failed'; hostname: string };

const WORKSPACE_SUBDOMAIN_SUFFIX =
  process.env['WORKSPACE_SUBDOMAIN_SUFFIX'] ?? '.app.kodem.co.il';

export function workspaceHostname(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  const suffix = WORKSPACE_SUBDOMAIN_SUFFIX.startsWith('.')
    ? WORKSPACE_SUBDOMAIN_SUFFIX
    : `.${WORKSPACE_SUBDOMAIN_SUFFIX}`;
  return `${normalized}${suffix}`;
}

export async function checkHostnameAvailable(
  slug: string,
): Promise<DnsAvailabilityResult> {
  const hostname = workspaceHostname(slug);
  const token = process.env['CLOUDFLARE_API_TOKEN'];
  const zoneId = process.env['CLOUDFLARE_ZONE_ID'];

  if (!token || !zoneId) {
    return { checked: false, reason: 'not_configured', hostname };
  }

  try {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    );
    url.searchParams.set('name', hostname);
    url.searchParams.set('per_page', '1');

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return { checked: false, reason: 'request_failed', hostname };
    }

    const body = (await res.json()) as {
      success?: boolean;
      result?: unknown[];
    };

    if (!body.success) {
      return { checked: false, reason: 'request_failed', hostname };
    }

    const taken = Array.isArray(body.result) && body.result.length > 0;
    return { checked: true, available: !taken, hostname };
  } catch {
    return { checked: false, reason: 'request_failed', hostname };
  }
}

export { WORKSPACE_SUBDOMAIN_SUFFIX };
