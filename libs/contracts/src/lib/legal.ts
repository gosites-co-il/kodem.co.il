import { UserId, WorkspaceId } from './ids';

/** Stable document codes persisted on acceptance records. */
export type LegalDocumentCode =
  | 'TERMS'
  | 'PRIVACY'
  | 'COOKIES'
  | 'AI_TERMS';

/** Public document ids used in routes and content registry. */
export type LegalDocumentId = 'terms' | 'privacy' | 'cookies' | 'ai-terms';

export type LegalConsentSource =
  | 'SIGNUP'
  | 'OAUTH_SIGNUP'
  | 'RECONSENT'
  | 'SETTINGS';

export type LegalAuthMethod =
  | 'password'
  | 'google'
  | 'github'
  | 'facebook'
  | 'unknown';

export interface LegalConsentAcceptanceInput {
  document: LegalDocumentCode;
  version: string;
}

export interface LegalConsentRecord {
  id: string;
  userId: UserId;
  document: LegalDocumentCode;
  version: string;
  acceptedAt: Date;
  source: LegalConsentSource;
  ip?: string;
  userAgent?: string;
  locale?: string;
  authMethod?: LegalAuthMethod;
  workspaceId?: WorkspaceId;
}

export interface RecordLegalConsentInput {
  userId: UserId;
  document: LegalDocumentCode;
  version: string;
  source: LegalConsentSource;
  ip?: string;
  userAgent?: string;
  locale?: string;
  authMethod?: LegalAuthMethod;
  workspaceId?: WorkspaceId;
}

export interface PendingLegalDocument {
  id: LegalDocumentId;
  code: LegalDocumentCode;
  title: string;
  version: string;
  route: string;
  reason: 'signup' | 'reconsent';
  summary: string;
}

export interface LegalConsentStatus {
  pending: PendingLegalDocument[];
}

/** Documents that must be accepted at account creation. */
export const SIGNUP_REQUIRED_DOCUMENTS: LegalDocumentCode[] = [
  'TERMS',
  'PRIVACY',
];

export const LEGAL_DOCUMENT_CODE_BY_ID: Record<
  LegalDocumentId,
  LegalDocumentCode
> = {
  terms: 'TERMS',
  privacy: 'PRIVACY',
  cookies: 'COOKIES',
  'ai-terms': 'AI_TERMS',
};

export const LEGAL_DOCUMENT_ID_BY_CODE: Record<
  LegalDocumentCode,
  LegalDocumentId
> = {
  TERMS: 'terms',
  PRIVACY: 'privacy',
  COOKIES: 'cookies',
  AI_TERMS: 'ai-terms',
};
