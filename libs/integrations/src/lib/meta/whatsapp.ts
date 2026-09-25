import { META_GRAPH_BASE, parseMetaError } from './oauth';

export interface MetaWhatsAppPhoneNumber {
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName?: string;
  wabaId: string;
}

export async function listWhatsAppPhoneNumbers(
  userAccessToken: string,
): Promise<MetaWhatsAppPhoneNumber[]> {
  const businessesUrl = new URL(`${META_GRAPH_BASE}/me/businesses`);
  businessesUrl.searchParams.set('fields', 'id,name');
  businessesUrl.searchParams.set('access_token', userAccessToken);
  const bizRes = await fetch(businessesUrl.toString());
  if (!bizRes.ok) {
    throw new Error(
      parseMetaError(
        bizRes.status,
        await bizRes.text(),
        'טעינת עסקי Meta נכשלה — ודאו הרשאות WhatsApp Business',
      ),
    );
  }
  const bizJson = (await bizRes.json()) as {
    data?: Array<{ id?: string; name?: string }>;
  };
  const businesses = bizJson.data ?? [];
  const out: MetaWhatsAppPhoneNumber[] = [];

  for (const biz of businesses) {
    if (!biz.id) continue;
    const wabaUrl = new URL(
      `${META_GRAPH_BASE}/${encodeURIComponent(biz.id)}/owned_whatsapp_business_accounts`,
    );
    wabaUrl.searchParams.set('fields', 'id,name');
    wabaUrl.searchParams.set('access_token', userAccessToken);
    const wabaRes = await fetch(wabaUrl.toString());
    if (!wabaRes.ok) continue;
    const wabaJson = (await wabaRes.json()) as {
      data?: Array<{ id?: string }>;
    };
    for (const waba of wabaJson.data ?? []) {
      if (!waba.id) continue;
      const phoneUrl = new URL(
        `${META_GRAPH_BASE}/${encodeURIComponent(waba.id)}/phone_numbers`,
      );
      phoneUrl.searchParams.set(
        'fields',
        'id,display_phone_number,verified_name',
      );
      phoneUrl.searchParams.set('access_token', userAccessToken);
      const phoneRes = await fetch(phoneUrl.toString());
      if (!phoneRes.ok) continue;
      const phoneJson = (await phoneRes.json()) as {
        data?: Array<{
          id?: string;
          display_phone_number?: string;
          verified_name?: string;
        }>;
      };
      for (const phone of phoneJson.data ?? []) {
        if (!phone.id) continue;
        out.push({
          phoneNumberId: phone.id,
          displayPhoneNumber:
            phone.display_phone_number ?? phone.id,
          verifiedName: phone.verified_name,
          wabaId: waba.id,
        });
      }
    }
  }
  return out;
}

/** List phone numbers for a known WABA (preferred for BISU / Embedded Signup tokens). */
export async function listWhatsAppPhoneNumbersForWaba(
  accessToken: string,
  wabaId: string,
): Promise<MetaWhatsAppPhoneNumber[]> {
  const phoneUrl = new URL(
    `${META_GRAPH_BASE}/${encodeURIComponent(wabaId)}/phone_numbers`,
  );
  phoneUrl.searchParams.set(
    'fields',
    'id,display_phone_number,verified_name',
  );
  phoneUrl.searchParams.set('access_token', accessToken);
  const phoneRes = await fetch(phoneUrl.toString());
  if (!phoneRes.ok) {
    throw new Error(
      parseMetaError(
        phoneRes.status,
        await phoneRes.text(),
        'טעינת מספרי WhatsApp ל-WABA נכשלה',
      ),
    );
  }
  const phoneJson = (await phoneRes.json()) as {
    data?: Array<{
      id?: string;
      display_phone_number?: string;
      verified_name?: string;
    }>;
  };
  return (phoneJson.data ?? [])
    .filter((p): p is { id: string; display_phone_number?: string; verified_name?: string } =>
      Boolean(p.id),
    )
    .map((phone) => ({
      phoneNumberId: phone.id,
      displayPhoneNumber: phone.display_phone_number ?? phone.id,
      verifiedName: phone.verified_name,
      wabaId,
    }));
}

export async function whatsappSendText(
  accessToken: string,
  phoneNumberId: string,
  toE164: string,
  text: string,
): Promise<{ messageId: string }> {
  const to = toE164.replace(/[^\d]/g, '');
  if (!to) throw new Error('נא להזין מספר טלפון בינלאומי');

  const url = new URL(
    `${META_GRAPH_BASE}/${encodeURIComponent(phoneNumberId)}/messages`,
  );
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text.trim() || ' ' },
    }),
  });
  if (!res.ok) {
    throw new Error(
      parseMetaError(res.status, await res.text(), 'שליחת WhatsApp נכשלה'),
    );
  }
  const json = (await res.json()) as {
    messages?: Array<{ id?: string }>;
  };
  const messageId = json.messages?.[0]?.id;
  if (!messageId) throw new Error('WhatsApp לא החזיר מזהה הודעה');
  return { messageId };
}

/**
 * Cloud API does not expose a simple inbox list like Gmail.
 * Returns recent webhook-buffered messages if provided; otherwise empty with guidance.
 */
export async function whatsappListRecentStub(): Promise<
  Array<{
    id: string;
    from?: string;
    body?: string;
    timestamp?: string;
  }>
> {
  return [];
}
