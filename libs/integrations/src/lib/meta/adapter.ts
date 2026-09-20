import type { ConnectionCapability } from '@kodem/contracts';
import type {
  AdapterConnectContext,
  AdapterConnectResult,
  ConnectionProviderAdapter,
} from '../types';
import {
  buildMetaAuthorizeUrl,
  exchangeMetaAuthCode,
  exchangeMetaLongLivedToken,
  fetchMetaUserInfo,
  isMetaIntegrationId,
  metaConnectionClientConfig,
  metaConnectionConfigMissingMessage,
  metaScopesFor,
  signMetaOAuthState,
} from './oauth';

const META_CAPABILITIES: ConnectionCapability[] = [
  'messaging.messenger.send',
  'messaging.messenger.receive',
  'messaging.instagram.send',
  'messaging.instagram.receive',
  'messaging.whatsapp.send',
  'messaging.whatsapp.receive',
];

function capabilitiesForIntegration(
  integrationId: string,
): ConnectionCapability[] {
  switch (integrationId) {
    case 'facebook':
      return ['messaging.messenger.send', 'messaging.messenger.receive'];
    case 'instagram':
      return ['messaging.instagram.send', 'messaging.instagram.receive'];
    case 'whatsapp':
      return ['messaging.whatsapp.send', 'messaging.whatsapp.receive'];
    default:
      return META_CAPABILITIES;
  }
}

export class MetaConnectionAdapter implements ConnectionProviderAdapter {
  readonly provider = 'meta' as const;
  readonly capabilities = META_CAPABILITIES;

  async startConnect(ctx: AdapterConnectContext): Promise<AdapterConnectResult> {
    if (!isMetaIntegrationId(ctx.integrationId)) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Meta connection for this product is coming soon',
      };
    }

    const scopes = metaScopesFor(ctx.integrationId);
    if (!scopes) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Meta connection for this product is coming soon',
      };
    }

    const config = metaConnectionClientConfig(ctx.integrationId);
    if (!config) {
      return {
        success: false,
        code: 'error',
        message: metaConnectionConfigMissingMessage(ctx.integrationId),
      };
    }

    const state = signMetaOAuthState({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      integrationId: ctx.integrationId,
      ...(ctx.connectionId ? { connectionId: ctx.connectionId } : {}),
    });

    const authorizeUrl = buildMetaAuthorizeUrl({
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
      message: 'Redirect to Meta to authorize',
    };
  }

  async completeConnect(
    ctx: AdapterConnectContext & { code: string },
  ): Promise<AdapterConnectResult> {
    if (!isMetaIntegrationId(ctx.integrationId)) {
      return {
        success: false,
        code: 'coming_soon',
        message: 'Meta connection for this product is coming soon',
      };
    }

    const config = metaConnectionClientConfig(ctx.integrationId);
    if (!config) {
      return {
        success: false,
        code: 'error',
        message: metaConnectionConfigMissingMessage(ctx.integrationId),
      };
    }

    const shortLived = await exchangeMetaAuthCode({
      code: ctx.code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      callbackUrl: config.callbackUrl,
    });

    let accessToken = shortLived.accessToken;
    let expiresIn = shortLived.expiresIn;
    try {
      const longLived = await exchangeMetaLongLivedToken({
        accessToken: shortLived.accessToken,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      });
      accessToken = longLived.accessToken;
      expiresIn = longLived.expiresIn ?? expiresIn;
    } catch {
      /* keep short-lived if exchange fails */
    }

    const user = await fetchMetaUserInfo(accessToken);
    const credentials: Record<string, string> = {
      accessToken,
    };
    if (expiresIn) {
      credentials['expiresAt'] = String(Date.now() + expiresIn * 1000);
    }

    return {
      success: true,
      code: 'ok',
      credentials,
      externalAccountId: user.id,
      externalAccountName: user.name ?? user.email ?? user.id,
      capabilities: capabilitiesForIntegration(ctx.integrationId),
      message: 'Connected to Meta',
    };
  }

  async disconnect(): Promise<void> {
    /* credentials removed by ConnectionService */
  }

  async test(): Promise<AdapterConnectResult> {
    return {
      success: true,
      code: 'ok',
      message: 'Meta adapter ready',
    };
  }
}

export const metaConnectionAdapter = new MetaConnectionAdapter();
