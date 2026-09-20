import { createHmac, timingSafeEqual } from 'crypto';
import type { IntegrationId } from '@kodem/contracts';

const STATE_TTL_MS = 15 * 60 * 1000;

export interface GoogleOAuthState {
  workspaceId: string;
  userId: string;
  integrationId: IntegrationId;
  /** Sheets (and future): full write vs read-only scopes. */
  accessMode?: 'full' | 'readonly';
  /** Reconnect an existing connection instance. */
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

/**
 * Per-connection OAuth client — each IntegrationId has its own Google Cloud
 * OAuth client (never reuse login GOOGLE_CLIENT_ID).
 *
 * Env pattern (example for google_sheets):
 *   GOOGLE_SHEETS_CLIENT_ID=
 *   GOOGLE_SHEETS_CLIENT_SECRET=
 *   GOOGLE_SHEETS_CALLBACK_URL=  (optional; defaults below)
 */
export function googleConnectionClientConfig(integrationId: IntegrationId): {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
} | null {
  const prefix = integrationId.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
  const appUrl = (process.env['APP_URL'] ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const callbackUrl = (
    process.env[`${prefix}_CALLBACK_URL`]?.trim() ||
    `${appUrl}/api/connections/oauth/google/${integrationId}/callback`
  ).replace(/\/$/, '');

  if (!clientId?.trim() || !clientSecret?.trim()) {
    return null;
  }
  return { clientId, clientSecret, callbackUrl };
}

export function googleConnectionConfigMissingMessage(
  integrationId: IntegrationId,
): string {
  const prefix = integrationId.toUpperCase();
  return `Missing ${prefix}_CLIENT_ID / ${prefix}_CLIENT_SECRET — create a dedicated OAuth client for this connection`;
}

/** Scopes per Google integration catalog entry. */
export function googleScopesFor(
  integrationId: IntegrationId,
  accessMode: 'full' | 'readonly' = 'full',
): string[] | null {
  switch (integrationId) {
    case 'google_sheets':
      if (accessMode === 'readonly') {
        return [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/spreadsheets.readonly',
        ];
      }
      return [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ];
    case 'google_analytics':
      return [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/analytics.readonly',
      ];
    case 'google_business':
      return [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage',
      ];
    case 'google_workspace':
      return [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ];
    default:
      return null;
  }
}

export function sheetsAccessModeFromCapabilities(
  capabilities?: import('@kodem/contracts').ConnectionCapability[],
): 'full' | 'readonly' {
  if (!capabilities?.length) return 'full';
  if (capabilities.includes('sheets.write')) return 'full';
  if (capabilities.includes('sheets.read')) return 'readonly';
  return 'full';
}

export function signGoogleOAuthState(payload: Omit<GoogleOAuthState, 'exp'>): string {
  const body: GoogleOAuthState = {
    ...payload,
    exp: Date.now() + STATE_TTL_MS,
  };
  const json = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = createHmac('sha256', stateSecret()).update(json).digest('base64url');
  return `${json}.${sig}`;
}

export function verifyGoogleOAuthState(state: string): GoogleOAuthState | null {
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
    ) as GoogleOAuthState;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizeUrl(input: {
  clientId: string;
  callbackUrl: string;
  scopes: string[];
  state: string;
  /** When true, Google merges previously granted scopes (can widen a read-only request). */
  includeGrantedScopes?: boolean;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.callbackUrl,
    response_type: 'code',
    scope: input.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: input.includeGrantedScopes ? 'true' : 'false',
    state: input.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** True if granted OAuth scope string includes Sheets write access. */
export function googleGrantedSheetsWrite(scope?: string): boolean {
  if (!scope) return false;
  const parts = scope.split(/[\s,]+/).filter(Boolean);
  return parts.some(
    (s) =>
      s === 'https://www.googleapis.com/auth/spreadsheets' ||
      s === 'https://www.googleapis.com/auth/drive' ||
      s === 'https://www.googleapis.com/auth/drive.file',
  );
}

export async function exchangeGoogleAuthCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    scope: json.scope,
    tokenType: json.token_type,
  };
}

export async function refreshGoogleAccessToken(input: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{
  accessToken: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: input.refreshToken,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
    scope: json.scope,
    tokenType: json.token_type,
  };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email?: string;
  name?: string;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load Google user info');
  }
  const json = (await res.json()) as {
    id: string;
    email?: string;
    name?: string;
  };
  return json;
}
