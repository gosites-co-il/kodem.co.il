const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

export interface AnalyticsPropertySummary {
  propertyId: string;
  displayName: string;
  accountDisplayName?: string;
}

/** List GA4 properties the user can access (via accountSummaries). */
export async function listAnalyticsProperties(
  accessToken: string,
): Promise<AnalyticsPropertySummary[]> {
  const res = await fetch(`${ADMIN_API}/accountSummaries`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list Analytics properties: ${text}`);
  }
  const json = (await res.json()) as {
    accountSummaries?: Array<{
      displayName?: string;
      propertySummaries?: Array<{
        property?: string;
        displayName?: string;
      }>;
    }>;
  };

  const out: AnalyticsPropertySummary[] = [];
  for (const account of json.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      const raw = prop.property?.trim();
      if (!raw) continue;
      const propertyId = raw.startsWith('properties/')
        ? raw.slice('properties/'.length)
        : raw;
      out.push({
        propertyId,
        displayName: prop.displayName ?? propertyId,
        accountDisplayName: account.displayName,
      });
    }
  }
  return out;
}

export async function getAnalyticsProperty(
  accessToken: string,
  propertyId: string,
): Promise<{ propertyId: string; displayName: string }> {
  const id = propertyId.replace(/^properties\//, '');
  const res = await fetch(`${ADMIN_API}/properties/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to load Analytics property: ${text}`);
  }
  const json = (await res.json()) as { name?: string; displayName?: string };
  return {
    propertyId: id,
    displayName: json.displayName ?? id,
  };
}

/** Smoke read: last 7 days sessions for a GA4 property. */
export async function runAnalyticsSessionsSmoke(
  accessToken: string,
  propertyId: string,
): Promise<{ sessions: string }> {
  const id = propertyId.replace(/^properties\//, '');
  const res = await fetch(
    `${DATA_API}/properties/${encodeURIComponent(id)}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }],
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analytics report failed: ${text}`);
  }
  const json = (await res.json()) as {
    rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
  };
  const sessions = json.rows?.[0]?.metricValues?.[0]?.value ?? '0';
  return { sessions };
}
