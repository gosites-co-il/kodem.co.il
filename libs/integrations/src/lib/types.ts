import type {
  ConnectionCapability,
  ConnectionProviderId,
  IntegrationId,
} from '@kodem/contracts';

export interface AdapterConnectContext {
  workspaceId: string;
  integrationId: IntegrationId;
  userId: string;
  capabilities?: ConnectionCapability[];
  /** Sheets (and similar): full vs read-only OAuth scopes. */
  accessMode?: 'full' | 'readonly';
  /** When set, OAuth refreshes this connection instead of creating a new one. */
  connectionId?: string;
  /** Absolute callback URL for OAuth (future). */
  redirectUri?: string;
}

export interface AdapterConnectResult {
  success: boolean;
  code:
    | 'coming_soon'
    | 'not_implemented'
    | 'ok'
    | 'error'
    | 'oauth_redirect';
  message?: string;
  /** Browser redirect for OAuth — never includes tokens. */
  authorizeUrl?: string;
  /** Exact redirect_uri registered with the provider. */
  redirectUri?: string;
  /** Opaque secrets for ConnectionCredentialsStore — never returned to API clients. */
  credentials?: Record<string, string>;
  externalAccountId?: string;
  externalAccountName?: string;
  capabilities?: ConnectionCapability[];
}

export interface ConnectionProviderAdapter {
  readonly provider: ConnectionProviderId;
  readonly capabilities: ConnectionCapability[];
  startConnect(ctx: AdapterConnectContext): Promise<AdapterConnectResult>;
  completeConnect?(
    ctx: AdapterConnectContext & { code: string; state?: string },
  ): Promise<AdapterConnectResult>;
  disconnect(connectionId: string): Promise<void>;
  refresh?(connectionId: string): Promise<AdapterConnectResult>;
  test?(connectionId: string): Promise<AdapterConnectResult>;
  sync?(connectionId: string): Promise<AdapterConnectResult>;
}

export function stubAdapter(
  provider: ConnectionProviderId,
  capabilities: ConnectionCapability[],
  label: string,
): ConnectionProviderAdapter {
  return {
    provider,
    capabilities,
    async startConnect() {
      return {
        success: false,
        code: 'coming_soon',
        message: `${label} connection is coming soon`,
      };
    },
    async disconnect() {
      /* no-op for stubs */
    },
    async test() {
      return {
        success: false,
        code: 'coming_soon',
        message: `${label} test is coming soon`,
      };
    },
    async sync() {
      return {
        success: false,
        code: 'coming_soon',
        message: `${label} sync is coming soon`,
      };
    },
    async refresh() {
      return {
        success: false,
        code: 'coming_soon',
        message: `${label} refresh is coming soon`,
      };
    },
  };
}
