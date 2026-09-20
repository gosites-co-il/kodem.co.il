const ACCOUNT_MGMT = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const BUSINESS_INFO = 'https://mybusinessbusinessinformation.googleapis.com/v1';

export interface BusinessLocationSummary {
  /** Resource name e.g. locations/123 or accounts/x/locations/y */
  locationName: string;
  title: string;
  accountName?: string;
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
    throw new Error(`Failed to list Business Profile accounts: ${text}`);
  }
  const accountsJson = (await accountsRes.json()) as {
    accounts?: Array<{ name?: string; accountName?: string }>;
  };

  const out: BusinessLocationSummary[] = [];
  for (const account of accountsJson.accounts ?? []) {
    const accountName = account.name?.trim();
    if (!accountName) continue;

    const locUrl = new URL(
      `${BUSINESS_INFO}/${accountName}/locations`,
    );
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
  const name = locationName.startsWith('locations/')
    ? locationName
    : locationName.includes('/locations/')
      ? locationName
      : `locations/${locationName}`;

  const url = new URL(`${BUSINESS_INFO}/${name}`);
  url.searchParams.set('readMask', 'name,title');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load Business Profile location: ${text}`);
  }
  const json = (await res.json()) as { name?: string; title?: string };
  return {
    locationName: json.name ?? name,
    title: json.title ?? name,
  };
}
