import { createHmac, timingSafeEqual } from 'crypto';
import type { IntegrationId } from '@kodem/contracts';

const STATE_TTL_MS = 15 * 60 * 1000;
const GRAPH_VERSION = 'v21.0';
export const META_GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type MetaIntegrationId = 'facebook' | 'instagram' | 'whatsapp';

export interface MetaOAuthState {
  workspaceId: string;
  userId: string;
  integrationId: IntegrationId;
  connectionId?: string;
  exp: number;
}

function stateSecret(): string {
  return (
    process.env['CONNECTION_CREDENTIALS_KEY'] ??
    process.env['JWT_SECRET'] ??
    'kodem-dev-oauth-state'
  );
}

export function isMetaIntegrationId(
  id: string,
): id is MetaIntegrationId {
  return id === 'facebook' || id === 'instagram' || id === 'whatsapp';
}

/**
 * Per-connection Meta OAuth client.
 * Env pattern (do NOT reuse login FACEBOOK_CLIENT_*):
 *   META_FACEBOOK_CLIENT_ID / _SECRET / _CALLBACK_URL
 *   META_INSTAGRAM_*
 *   META_WHATSAPP_*
 */
export function metaConnectionClientConfig(integrationId: IntegrationId): {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
} | null {
  if (!isMetaIntegrationId(integrationId)) return null;
  const prefix = `META_${integrationId.toUpperCase()}`;
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
  const appUrl = (process.env['APP_URL'] ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const callbackUrl = (
    process.env[`${prefix}_CALLBACK_URL`]?.trim() ||
    `${appUrl}/api/connections/oauth/meta/${integrationId}/callback`
  ).replace(/\/$/, '');

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, callbackUrl };
}

export function metaConnectionConfigMissingMessage(
  integrationId: IntegrationId,
): string {
  const prefix = `META_${integrationId.toUpperCase()}`;
  return `Missing ${prefix}_CLIENT_ID / ${prefix}_CLIENT_SECRET — create a Meta App OAuth client for this connection (not login FACEBOOK_CLIENT_*)`;
}

export function metaScopesFor(integrationId: IntegrationId): string[] | null {
  switch (integrationId) {
    case 'facebook':
      return [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_messaging',
        'pages_manage_metadata',
        'pages_read_engagement',
      ];
    case 'instagram':
      return [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_messaging',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_manage_messages',
      ];
    case 'whatsapp':
      return [
        'public_profile',
        'email',
        'business_management',
        'whatsapp_business_management',
        'whatsapp_business_messaging',
      ];
    default:
      return null;
  }
}

export function signMetaOAuthState(
  payload: Omit<MetaOAuthState, 'exp'>,
): string {
  const body: MetaOAuthState = {
    ...payload,
    exp: Date.now() + STATE_TTL_MS,
  };
  const json = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = createHmac('sha256', stateSecret())
    .update(json)
    .digest('base64url');
  return `${json}.${sig}`;
}

export function verifyMetaOAuthState(state: string): MetaOAuthState | null {
  const [json, sig] = state.split('.');
  if (!json || !sig) return null;
  const expected = createHmac('sha256', stateSecret())
    .update(json)
    .digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(json, 'base64url').toString('utf8'),
    ) as MetaOAuthState;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildMetaAuthorizeUrl(input: {
  clientId: string;
  callbackUrl: string;
  scopes: string[];
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.callbackUrl,
    state: input.state,
    response_type: 'code',
    scope: input.scopes.join(','),
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaAuthCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}): Promise<{
  accessToken: string;
  expiresIn?: number;
  tokenType?: string;
}> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('client_secret', input.clientSecret);
  url.searchParams.set('redirect_uri', input.callbackUrl);
  url.searchParams.set('code', input.code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta token exchange failed: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!json.access_token) {
    throw new Error('Meta token exchange returned no access_token');
  }
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
    tokenType: json.token_type,
  };
}

/** Exchange short-lived user token for a long-lived one (~60 days). */
export async function exchangeMetaLongLivedToken(input: {
  accessToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL(`${META_GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('client_secret', input.clientSecret);
  url.searchParams.set('fb_exchange_token', input.accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta long-lived token exchange failed: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error('Meta long-lived exchange returned no access_token');
  }
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
  };
}

export async function fetchMetaUserInfo(accessToken: string): Promise<{
  id: string;
  name?: string;
  email?: string;
}> {
  const url = new URL(`${META_GRAPH_BASE}/me`);
  url.searchParams.set('fields', 'id,name,email');
  url.searchParams.set('access_token', accessToken);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta userinfo failed: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    id?: string;
    name?: string;
    email?: string;
  };
  if (!json.id) throw new Error('Meta userinfo missing id');
  return { id: json.id, name: json.name, email: json.email };
}

export function metaAppSecret(): string | null {
  return process.env['META_APP_SECRET']?.trim() || null;
}

export function metaWebhookVerifyToken(): string | null {
  return process.env['META_WEBHOOK_VERIFY_TOKEN']?.trim() || null;
}

export function verifyMetaWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
): boolean {
  const secret = metaAppSecret();
  if (!secret || !signatureHeader?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(provided, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function parseMetaError(status: number, text: string, fallback: string): string {
  try {
    const json = JSON.parse(text) as {
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (json.error?.message) {
      if (status === 403 || json.error.code === 10 || json.error.code === 200) {
        return `אין הרשאה מ-Meta — ${json.error.message}`;
      }
      return json.error.message;
    }
  } catch {
    /* fallback */
  }
  return text?.trim() ? `${fallback}: ${text.slice(0, 200)}` : fallback;
}
