import type { IntegrationId } from './workspace-setup';
import type {
  ConnectionId,
  UserId,
  WorkspaceId,
} from './ids';

/** Runtime adapter id — maps from catalog IntegrationId. */
export type ConnectionProviderId =
  | 'google'
  | 'microsoft'
  | 'meta'
  | 'smtp'
  | 'slack'
  | 'zoom'
  | 'kodem'
  | 'google_analytics'
  | 'google_ads'
  | 'google_business';

export type ConnectionCapability =
  | 'email.read'
  | 'email.send'
  | 'calendar.read'
  | 'calendar.write'
  | 'drive.read'
  | 'drive.write'
  | 'sheets.read'
  | 'sheets.write'
  | 'messaging.whatsapp.send'
  | 'messaging.whatsapp.receive'
  | 'messaging.instagram.send'
  | 'messaging.instagram.receive'
  | 'messaging.messenger.send'
  | 'messaging.messenger.receive'
  | 'messaging.web_chat.send'
  | 'messaging.web_chat.receive'
  | 'messaging.sms.send'
  | 'messaging.sms.receive'
  | 'messaging.telegram.send'
  | 'messaging.telegram.receive'
  | 'analytics.read'
  | 'ads.read'
  | 'local.reviews.read'
  | 'local.listing.read'
  | 'chat.post'
  | 'meetings.create'
  | 'meetings.read';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'error';

/** Public Connection DTO — never includes credentials. */
export interface WorkspaceConnection {
  id: ConnectionId;
  workspaceId: WorkspaceId;
  /** Catalog entry (same as onboarding חיבורים). */
  integrationId: IntegrationId;
  provider: ConnectionProviderId;
  status: ConnectionStatus;
  capabilities: ConnectionCapability[];
  externalAccountId?: string | null;
  externalAccountName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdById: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionCatalogItem {
  integrationId: IntegrationId;
  provider: ConnectionProviderId;
  name: string;
  description: string;
  category: string;
  status: 'available' | 'coming_soon' | 'disabled';
  capabilities: ConnectionCapability[];
  /** Workspace connection when linked, else null. */
  connection: WorkspaceConnection | null;
}

export interface ConnectConnectionInput {
  /** Optional scopes / capability subset requested at connect time. */
  capabilities?: ConnectionCapability[];
}

export interface ConnectionActionResult {
  success: boolean;
  connection?: WorkspaceConnection;
  /** Phase 0 stubs return coming_soon until real OAuth exists. */
  code?:
    | 'coming_soon'
    | 'not_implemented'
    | 'ok'
    | 'error'
    | 'oauth_redirect';
  message?: string;
  /** When code is oauth_redirect — frontend navigates here (never includes secrets). */
  authorizeUrl?: string;
  /** Exact redirect_uri sent to Google — add this in Cloud Console if mismatch. */
  redirectUri?: string;
}
