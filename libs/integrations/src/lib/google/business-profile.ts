const ACCOUNT_MGMT = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const BUSINESS_INFO = 'https://mybusinessbusinessinformation.googleapis.com/v1';

export interface BusinessLocationSummary {
  /** Resource name e.g. locations/123 or accounts/x/locations/y */
  locationName: string;
  title: string;
  accountName?: string;
}

function googleApiErrorMessage(status: number, text: string, fallback: string): string {
  try {
    const json = JSON.parse(text) as {
      error?: {
        code?: number;
        message?: string;
        status?: string;
        details?: Array<{
          '@type'?: string;
          metadata?: { quota_limit_value?: string; service?: string };
        }>;
      };
    };
    const err = json.error;
    if (!err) return fallback;

    const quotaDetail = err.details?.find(
      (d) => d.metadata?.quota_limit_value !== undefined,
    );
    const limitValue = quotaDetail?.metadata?.quota_limit_value;
    if (
      status === 429 ||
      err.status === 'RESOURCE_EXHAUSTED' ||
      limitValue !== undefined
    ) {
      if (limitValue === '0') {
        return (
          'מכסת Google Business Profile היא 0 לפרויקט הזה. ב-Google Cloud Console: ' +
          'הפעילו את My Business Account Management API ו-Business Information API, ' +
          'ואז ב-Quotas בקשו העלאת מכסה (DefaultRequestsPerMinutePerProject). ' +
          'בינתיים אפשר להדביק שם מיקום ידנית.'
        );
      }
      return (
        'חריגה ממכסת Google Business Profile (429). המתינו דקה ונסו שוב, ' +
        'או הדביקו שם מיקום ידנית.'
      );
    }
    if (err.message) return err.message;
  } catch {
    /* use fallback */
  }
  return text?.trim() ? `${fallback}: ${text}` : fallback;
}

/** Normalize pasted location resource names. */
export function normalizeBusinessLocationName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/locations/')) return trimmed;
  if (trimmed.startsWith('locations/')) return trimmed;
  if (/^\d+$/.test(trimmed)) return `locations/${trimmed}`;
  return trimmed;
}

/** List Business Profile locations across accounts the user can access. */
export async function listBusinessLocations(
  accessToken: string,
): Promise<BusinessLocationSummary[]> {
  const accountsRes = await fetch(`${ACCOUNT_MGMT}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!accountsRes.ok) {
    const text = await accountsRes.text();
    throw new Error(
      googleApiErrorMessage(
        accountsRes.status,
        text,
        'Failed to list Business Profile accounts',
      ),
    );
  }
  const accountsJson = (await accountsRes.json()) as {
    accounts?: Array<{ name?: string; accountName?: string }>;
  };

  const out: BusinessLocationSummary[] = [];
  for (const account of accountsJson.accounts ?? []) {
    const accountName = account.name?.trim();
    if (!accountName) continue;

    const locUrl = new URL(`${BUSINESS_INFO}/${accountName}/locations`);
    locUrl.searchParams.set('readMask', 'name,title');
    locUrl.searchParams.set('pageSize', '100');

    const locRes = await fetch(locUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!locRes.ok) {
      // Skip accounts the user cannot list locations for.
      continue;
    }
    const locJson = (await locRes.json()) as {
      locations?: Array<{ name?: string; title?: string }>;
    };
    for (const loc of locJson.locations ?? []) {
      if (!loc.name) continue;
      out.push({
        locationName: loc.name,
        title: loc.title ?? loc.name,
        accountName: account.accountName ?? accountName,
      });
    }
  }
  return out;
}

export async function getBusinessLocation(
  accessToken: string,
  locationName: string,
): Promise<{ locationName: string; title: string }> {
  const normalized = normalizeBusinessLocationName(locationName);
  if (!normalized) {
    throw new Error('שם מיקום לא תקין');
  }
  const name = normalized;

  const url = new URL(`${BUSINESS_INFO}/${name}`);
  url.searchParams.set('readMask', 'name,title');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      googleApiErrorMessage(
        res.status,
        text,
        'Failed to load Business Profile location',
      ),
    );
  }
  const json = (await res.json()) as { name?: string; title?: string };
  return {
    locationName: json.name ?? name,
    title: json.title ?? name,
  };
}
