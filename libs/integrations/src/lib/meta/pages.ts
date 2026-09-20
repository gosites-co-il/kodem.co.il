import { META_GRAPH_BASE, parseMetaError } from './oauth';

export interface MetaFacebookPage {
  pageId: string;
  name: string;
  accessToken: string;
}

export async function listFacebookPages(
  userAccessToken: string,
): Promise<MetaFacebookPage[]> {
  const url = new URL(`${META_GRAPH_BASE}/me/accounts`);
  url.searchParams.set('fields', 'id,name,access_token');
  url.searchParams.set('access_token', userAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      parseMetaError(res.status, await res.text(), 'טעינת דפי Facebook נכשלה'),
    );
  }
  const json = (await res.json()) as {
    data?: Array<{ id?: string; name?: string; access_token?: string }>;
  };
  return (json.data ?? [])
    .filter((p) => p.id && p.access_token)
    .map((p) => ({
      pageId: p.id as string,
      name: p.name ?? (p.id as string),
      accessToken: p.access_token as string,
    }));
}

export async function messengerSendText(
  pageAccessToken: string,
  pageId: string,
  recipientId: string,
  text: string,
): Promise<{ messageId: string }> {
  const url = new URL(`${META_GRAPH_BASE}/${encodeURIComponent(pageId)}/messages`);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId.trim() },
      messaging_type: 'RESPONSE',
      message: { text: text.trim() || ' ' },
      access_token: pageAccessToken,
    }),
  });
  if (!res.ok) {
    throw new Error(
      parseMetaError(res.status, await res.text(), 'שליחת הודעת Messenger נכשלה'),
    );
  }
  const json = (await res.json()) as { message_id?: string };
  if (!json.message_id) throw new Error('Messenger לא החזיר message_id');
  return { messageId: json.message_id };
}

export async function messengerListConversations(
  pageAccessToken: string,
  pageId: string,
  limit = 15,
): Promise<
  Array<{
    id: string;
    from?: string;
    body?: string;
    timestamp?: string;
  }>
> {
  const url = new URL(
    `${META_GRAPH_BASE}/${encodeURIComponent(pageId)}/conversations`,
  );
  url.searchParams.set('fields', 'id,updated_time,participants,messages.limit(1){message,from,created_time}');
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 50)));
  url.searchParams.set('access_token', pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      parseMetaError(res.status, await res.text(), 'טעינת שיחות Messenger נכשלה'),
    );
  }
  const json = (await res.json()) as {
    data?: Array<{
      id?: string;
      updated_time?: string;
      messages?: {
        data?: Array<{
          message?: string;
          from?: { id?: string; name?: string };
          created_time?: string;
        }>;
      };
    }>;
  };
  return (json.data ?? []).map((c) => {
    const last = c.messages?.data?.[0];
    return {
      id: c.id ?? '',
      from: last?.from?.name ?? last?.from?.id,
      body: last?.message,
      timestamp: last?.created_time ?? c.updated_time,
    };
  }).filter((c) => c.id);
}
