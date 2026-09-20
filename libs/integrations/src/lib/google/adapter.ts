import type { ConnectionCapability } from '@kodem/contracts';
import type {
  AdapterConnectContext,
  AdapterConnectResult,
  ConnectionProviderAdapter,
} from '../types';
import {
  buildGoogleAuthorizeUrl,
  exchangeGoogleAuthCode,
  fetchGoogleUserInfo,
  googleConnectionClientConfig,
  googleConnectionConfigMissingMessage,
  googleGrantedSheetsWrite,
  googleScopesFor,
  sheetsAccessModeFromCapabilities,
  signGoogleOAuthState,
} from './oauth';

const GOOGLE_CAPABILITIES: ConnectionCapability[] = [
  'email.read',
  'email.send',
  'calendar.read',
  'calendar.write',
  'drive.read',
  'drive.write',
  'sheets.read',
  'sheets.write',
  'analytics.read',
  'local.reviews.read',
  'local.listing.read',
];

function sheetsCapabilitiesForMode(
  accessMode: 'full' | 'readonly',
): ConnectionCapability[] {
  return accessMode === 'readonly'
    ? ['sheets.read']
    : ['sheets.read', 'sheets.write'];
}

function capabilitiesForIntegration(
  integrationId: string,
  accessMode: 'full' | 'readonly',
): ConnectionCapability[] {
  switch (integrationId) {
    case 'google_sheets':
      return sheetsCapabilitiesForMode(accessMode);
    case 'google_analytics':
      return ['analytics.read'];
    case 'google_business':
      return ['local.reviews.read', 'local.listing.read'];
    case 'google_workspace':
      return ['email.read', 'email.send'];
    default:
      return GOOGLE_CAPABILITIES;
  }
}

export class GoogleConnectionAdapter implements ConnectionProviderAdapter {
  readonly provider = 'google' as const;
  readonly capabilities = GOOGLE_CAPABILITIES;

  async startConnect(ctx: AdapterConnectContext): Promise<AdapterConnectResult> {
    const accessMode =
      ctx.accessMode ??
      (ctx.integrationId === 'google_sheets'
        ? sheetsAccessModeFromCapabilities(ctx.capabilities)
        : 'full');
    const scopes = googleScopesFor(ctx.integrationId, accessMode);
    if (!scopes) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Google connection for this product is coming soon',
      };
    }

    const config = googleConnectionClientConfig(ctx.integrationId);
    if (!config) {
      return {
        success: false,
        code: 'error',
        message: googleConnectionConfigMissingMessage(ctx.integrationId),
      };
    }

    const state = signGoogleOAuthState({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      integrationId: ctx.integrationId,
      ...(ctx.integrationId === 'google_sheets' ? { accessMode } : {}),
      ...(ctx.connectionId ? { connectionId: ctx.connectionId } : {}),
    });

    const authorizeUrl = buildGoogleAuthorizeUrl({
      clientId: config.clientId,
      callbackUrl: config.callbackUrl,
      scopes,
      state,
      includeGrantedScopes: false,
    });

    return {
      success: true,
      code: 'oauth_redirect',
      authorizeUrl,
      redirectUri: config.callbackUrl,
      message: 'Redirect to Google to authorize',
    };
  }

  async completeConnect(
    ctx: AdapterConnectContext & { code: string },
  ): Promise<AdapterConnectResult> {
    const accessMode =
      ctx.accessMode ??
      (ctx.integrationId === 'google_sheets'
        ? sheetsAccessModeFromCapabilities(ctx.capabilities)
        : 'full');
    const scopes = googleScopesFor(ctx.integrationId, accessMode);
    if (!scopes) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Google connection for this product is coming soon',
      };
    }

    const config = googleConnectionClientConfig(ctx.integrationId);
    if (!config) {
      return {
        success: false,
        code: 'error',
        message: googleConnectionConfigMissingMessage(ctx.integrationId),
      };
    }

    const tokens = await exchangeGoogleAuthCode({
      code: ctx.code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      callbackUrl: config.callbackUrl,
    });

    if (
      ctx.integrationId === 'google_sheets' &&
      accessMode === 'readonly' &&
      googleGrantedSheetsWrite(tokens.scope)
    ) {
      return {
        success: false,
        code: 'error',
        message:
          'Google העניק הרשאות כתיבה למרות שבחרתם קריאה בלבד. בטלו את הגישה ל-kodem בחשבון Google (אבטחה → גישה של צד שלישי) ונסו שוב.',
      };
    }

    const profile = await fetchGoogleUserInfo(tokens.accessToken);

    return {
      success: true,
      code: 'ok',
      capabilities: capabilitiesForIntegration(ctx.integrationId, accessMode),
      externalAccountId: profile.id,
      externalAccountName: profile.email ?? profile.name ?? profile.id,
      credentials: {
        accessToken: tokens.accessToken,
        ...(tokens.refreshToken
          ? { refreshToken: tokens.refreshToken }
          : {}),
        ...(tokens.expiresIn
          ? { expiresAt: String(Date.now() + tokens.expiresIn * 1000) }
          : {}),
        ...(tokens.scope ? { scope: tokens.scope } : {}),
        accessMode,
      },
    };
  }

  async disconnect(): Promise<void> {
    /* Token revoke can be added later; credentials row is deleted by ConnectionService. */
  }

  async test(): Promise<AdapterConnectResult> {
    return {
      success: true,
      code: 'ok',
      message: 'Google connection credentials are stored',
    };
  }
}

export const googleConnectionAdapter = new GoogleConnectionAdapter();
