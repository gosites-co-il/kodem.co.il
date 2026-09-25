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
  | 'inactive'
  | 'expired'
  | 'error';

/**
 * Public Connection DTO — never includes credentials.
 *
 * Two dimensions (both required for API access):
 * - **status** — OAuth/credential health. `connected` and `inactive` both mean
 *   credentials are stored; `inactive` is soft-disabled (not disconnected).
 * - **active** — soft enablement (`true` only when `status === 'connected'`).
 */
export interface WorkspaceConnection {
  id: ConnectionId;
  workspaceId: WorkspaceId;
  /** Catalog entry (same as onboarding חיבורים). */
  integrationId: IntegrationId;
  provider: ConnectionProviderId;
  status: ConnectionStatus;
  /** Soft enablement. Access (bind/preview/use) requires `active === true`. */
  active: boolean;
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
  /** All workspace instances of this integration (may be empty). */
  connections: WorkspaceConnection[];
  /** Latest/primary instance when any exist; else null. Prefer `connections`. */
  connection: WorkspaceConnection | null;
}

export interface ConnectConnectionInput {
  /** Optional scopes / capability subset requested at connect time. */
  capabilities?: ConnectionCapability[];
  /** Explicit Sheets access mode (preferred over inferring from capabilities). */
  accessMode?: 'full' | 'readonly';
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

/**
 * google_sheets connection metadata (stored on WorkspaceConnection.metadata):
 * { spreadsheetId, spreadsheetTitle?, lastBoundAt? }
 */
export interface GoogleSheetsConnectionMetadata {
  spreadsheetId: string;
  spreadsheetTitle?: string;
  lastBoundAt?: string;
}

/** google_analytics metadata: { propertyId, propertyName?, lastBoundAt? } */
export interface GoogleAnalyticsConnectionMetadata {
  propertyId: string;
  propertyName?: string;
  lastBoundAt?: string;
}

/** google_business metadata: { locationName, locationTitle?, lastBoundAt? } */
export interface GoogleBusinessConnectionMetadata {
  locationName: string;
  locationTitle?: string;
  lastBoundAt?: string;
}

export interface BindConnectionResourceInput {
  spreadsheetUrl?: string;
  spreadsheetId?: string;
  /** GA4 property id (with or without `properties/` prefix). */
  propertyId?: string;
  /** Business Profile location resource name. */
  locationName?: string;
  /** Facebook Page id. */
  pageId?: string;
  /** Instagram Business account id. */
  igUserId?: string;
  /** WhatsApp Business phone number id. */
  phoneNumberId?: string;
  /** WhatsApp Business Account id. */
  wabaId?: string;
}

export interface ConnectionSheetTab {
  title: string;
  sheetId: number;
}

export interface ConnectionSheetsListResult {
  spreadsheetId: string;
  title: string;
  sheets: ConnectionSheetTab[];
}

export interface ConnectionPreviewResult {
  spreadsheetId: string;
  range: string;
  values: string[][];
}

export interface ConnectionAnalyticsProperty {
  propertyId: string;
  displayName: string;
  accountDisplayName?: string;
}

export interface ConnectionAnalyticsPropertiesResult {
  properties: ConnectionAnalyticsProperty[];
}

export interface ConnectionBusinessLocation {
  locationName: string;
  title: string;
  accountName?: string;
}

export interface ConnectionBusinessLocationsResult {
  locations: ConnectionBusinessLocation[];
}

/** facebook connection metadata */
export interface FacebookConnectionMetadata {
  pageId: string;
  pageName?: string;
  lastBoundAt?: string;
}

/** instagram connection metadata */
export interface InstagramConnectionMetadata {
  igUserId: string;
  igUsername?: string;
  pageId?: string;
  lastBoundAt?: string;
}

/** whatsapp connection metadata */
export interface WhatsAppConnectionMetadata {
  phoneNumberId: string;
  displayPhoneNumber?: string;
  wabaId?: string;
  lastBoundAt?: string;
}

/** Public config for launching Meta WhatsApp Embedded Signup in the browser. */
export interface WhatsAppEmbeddedSignupConfig {
  configured: boolean;
  appId: string | null;
  configId: string | null;
  graphVersion: string;
}

export interface WhatsAppEmbeddedSignupCompleteInput {
  /** Authorization code from FB.login (response_type=code). */
  code: string;
  /** From WA_EMBEDDED_SIGNUP postMessage when present. */
  phoneNumberId?: string;
  wabaId?: string;
  /** Optional display hint collected in the pre-wizard (E.164 or local). */
  displayPhoneNumber?: string;
  /** Re-run Embedded Signup against an existing connection. */
  connectionId?: string;
}

export interface ConnectionFacebookPage {
  pageId: string;
  name: string;
}

export interface ConnectionFacebookPagesResult {
  pages: ConnectionFacebookPage[];
}

export interface ConnectionInstagramAccount {
  igUserId: string;
  username: string;
  pageId?: string;
  pageName?: string;
}

export interface ConnectionInstagramAccountsResult {
  accounts: ConnectionInstagramAccount[];
}

export interface ConnectionWhatsAppPhoneNumber {
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName?: string;
  wabaId?: string;
}

export interface ConnectionWhatsAppPhoneNumbersResult {
  phoneNumbers: ConnectionWhatsAppPhoneNumber[];
}

/** Target CRM contact fields when importing from Sheets (or skip the column). */
export type SheetsContactImportField =
  | 'name'
  | 'email'
  | 'phone'
  | 'notes'
  | 'skip';

export interface ImportContactsFromSheetsInput {
  /** Tab title (same as preview `sheet`). */
  sheet: string;
  /** 0-based header row index. Default 0. */
  headerRow?: number;
  /**
   * Header cell text → contact field.
   * At least one column must map to `name`.
   */
  mapping: Record<string, SheetsContactImportField>;
  /** Max data rows to read (excluding header). Default 500, hard cap 1000. */
  maxRows?: number;
}

export interface ImportContactsFromSheetsResult {
  success: boolean;
  spreadsheetId?: string;
  sheet?: string;
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  contactIds?: string[];
  message?: string;
  code?: string;
}
