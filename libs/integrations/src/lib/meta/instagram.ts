import { META_GRAPH_BASE, parseMetaError } from './oauth';
import { listFacebookPages } from './pages';

export interface MetaInstagramAccount {
  igUserId: string;
  username: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
}

export async function listInstagramAccounts(
  userAccessToken: string,
): Promise<MetaInstagramAccount[]> {
  const pages = await listFacebookPages(userAccessToken);
  const out: MetaInstagramAccount[] = [];
  for (const page of pages) {
    const url = new URL(
      `${META_GRAPH_BASE}/${encodeURIComponent(page.pageId)}`,
    );
    url.searchParams.set(
      'fields',
      'instagram_business_account{id,username}',
    );
    url.searchParams.set('access_token', page.accessToken);
    const res = await fetch(url.toString());
    if (!res.ok) continue;
    const json = (await res.json()) as {
      instagram_business_account?: { id?: string; username?: string };
    };
    const ig = json.instagram_business_account;
    if (!ig?.id) continue;
    out.push({
      igUserId: ig.id,
      username: ig.username ?? ig.id,
      pageId: page.pageId,
      pageName: page.name,
      pageAccessToken: page.accessToken,
    });
  }
  return out;
}

export async function instagramSendText(
  pageAccessToken: string,
  igUserId: string,
  recipientId: string,
  text: string,
): Promise<{ messageId: string }> {
  const url = new URL(
    `${META_GRAPH_BASE}/${encodeURIComponent(igUserId)}/messages`,
  );
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId.trim() },
      message: { text: text.trim() || ' ' },
      access_token: pageAccessToken,
    }),
  });
  if (!res.ok) {
    throw new Error(
      parseMetaError(
        res.status,
        await res.text(),
        'שליחת הודעת Instagram נכשלה',
      ),
    );
  }
  const json = (await res.json()) as { message_id?: string };
  if (!json.message_id) throw new Error('Instagram לא החזיר message_id');
  return { messageId: json.message_id };
}

export async function instagramListConversations(
  pageAccessToken: string,
  igUserId: string,
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
    `${META_GRAPH_BASE}/${encodeURIComponent(igUserId)}/conversations`,
  );
  url.searchParams.set('platform', 'instagram');
  url.searchParams.set(
    'fields',
    'id,updated_time,messages.limit(1){message,from,created_time}',
  );
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 50)));
  url.searchParams.set('access_token', pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      parseMetaError(
        res.status,
        await res.text(),
        'טעינת שיחות Instagram נכשלה',
      ),
    );
  }
  const json = (await res.json()) as {
    data?: Array<{
      id?: string;
      updated_time?: string;
      messages?: {
        data?: Array<{
          message?: string;
          from?: { id?: string; username?: string };
          created_time?: string;
        }>;
      };
    }>;
  };
  return (json.data ?? [])
    .map((c) => {
      const last = c.messages?.data?.[0];
      return {
        id: c.id ?? '',
        from: last?.from?.username ?? last?.from?.id,
        body: last?.message,
        timestamp: last?.created_time ?? c.updated_time,
      };
    })
    .filter((c) => c.id);
}
