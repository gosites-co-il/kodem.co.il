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
  googleScopesFor,
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
];

export class GoogleConnectionAdapter implements ConnectionProviderAdapter {
  readonly provider = 'google' as const;
  readonly capabilities = GOOGLE_CAPABILITIES;

  async startConnect(ctx: AdapterConnectContext): Promise<AdapterConnectResult> {
    const scopes = googleScopesFor(ctx.integrationId);
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
    });

    const authorizeUrl = buildGoogleAuthorizeUrl({
      clientId: config.clientId,
      callbackUrl: config.callbackUrl,
      scopes,
      state,
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
    const scopes = googleScopesFor(ctx.integrationId);
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

    const profile = await fetchGoogleUserInfo(tokens.accessToken);

    const capabilities: ConnectionCapability[] =
      ctx.integrationId === 'google_sheets'
        ? ['sheets.read', 'sheets.write']
        : GOOGLE_CAPABILITIES;

    return {
      success: true,
      code: 'ok',
      capabilities,
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
