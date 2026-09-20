const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailSendInput {
  to: string;
  subject?: string;
  body?: string;
  /** Optional From display; Gmail uses the authenticated account. */
  from?: string;
}

export interface GmailSendResult {
  id: string;
  threadId?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId?: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
  labelIds?: string[];
}

function toBase64Url(raw: string): string {
  return Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildRfc822(input: GmailSendInput): string {
  const to = input.to.trim();
  const subject = (input.subject ?? '').replace(/[\r\n]+/g, ' ').trim();
  const body = input.body ?? '';
  const lines = [
    `To: ${to}`,
    `Subject: ${subject || '(no subject)'}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ];
  return lines.join('\r\n');
}

export async function gmailSendMessage(
  accessToken: string,
  input: GmailSendInput,
): Promise<GmailSendResult> {
  if (!input.to?.trim()) {
    throw new Error('נא להזין כתובת נמען');
  }
  const raw = toBase64Url(buildRfc822(input));
  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseGmailError(res.status, text, 'שליחת המייל נכשלה'));
  }
  const json = (await res.json()) as { id?: string; threadId?: string };
  if (!json.id) {
    throw new Error('Gmail לא החזיר מזהה הודעה');
  }
  return { id: json.id, threadId: json.threadId };
}

export async function gmailListMessages(
  accessToken: string,
  opts?: { maxResults?: number; q?: string },
): Promise<GmailMessageSummary[]> {
  const maxResults = Math.min(Math.max(opts?.maxResults ?? 15, 1), 50);
  const listUrl = new URL(`${GMAIL_API}/messages`);
  listUrl.searchParams.set('maxResults', String(maxResults));
  if (opts?.q?.trim()) {
    listUrl.searchParams.set('q', opts.q.trim());
  }

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(
      parseGmailError(listRes.status, text, 'טעינת תיבת הדואר נכשלה'),
    );
  }
  const listJson = (await listRes.json()) as {
    messages?: Array<{ id?: string; threadId?: string }>;
  };
  const ids = (listJson.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));

  const out: GmailMessageSummary[] = [];
  for (const id of ids) {
    const msgUrl = new URL(`${GMAIL_API}/messages/${encodeURIComponent(id)}`);
    msgUrl.searchParams.set('format', 'metadata');
    msgUrl.searchParams.set('metadataHeaders', 'From');
    msgUrl.searchParams.append('metadataHeaders', 'Subject');
    msgUrl.searchParams.append('metadataHeaders', 'Date');

    const msgRes = await fetch(msgUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!msgRes.ok) {
      continue;
    }
    const msg = (await msgRes.json()) as {
      id?: string;
      threadId?: string;
      snippet?: string;
      labelIds?: string[];
      payload?: { headers?: Array<{ name?: string; value?: string }> };
    };
    const headers = msg.payload?.headers ?? [];
    const header = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value;

    out.push({
      id: msg.id ?? id,
      threadId: msg.threadId,
      snippet: msg.snippet,
      subject: header('Subject'),
      from: header('From'),
      date: header('Date'),
      labelIds: msg.labelIds,
    });
  }
  return out;
}

function parseGmailError(
  status: number,
  text: string,
  fallback: string,
): string {
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string; status?: string };
    };
    if (status === 403 || json.error?.status === 'PERMISSION_DENIED') {
      return (
        'אין הרשאת Gmail — ודאו שהופעלה Gmail API ושהחיבור כולל gmail.send / gmail.readonly. ' +
        (json.error?.message ?? '')
      ).trim();
    }
    if (json.error?.message) return json.error.message;
  } catch {
    /* fallback */
  }
  return text?.trim() ? `${fallback}: ${text}` : fallback;
}
