import type {
  LegalDocumentCode,
  LegalDocumentId,
} from '@kodem/contracts';
import { SIGNUP_REQUIRED_DOCUMENTS } from '@kodem/contracts';
import { aiTermsHe } from './ai-terms.he';
import { cookiesHe } from './cookies.he';
import { privacyHe } from './privacy.he';
import { termsHe } from './terms.he';
import type { LegalDocument, LegalDocumentMeta } from './types';

const DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  terms: termsHe,
  privacy: privacyHe,
  cookies: cookiesHe,
  'ai-terms': aiTermsHe,
};

export function listLegalDocuments(): LegalDocument[] {
  return Object.values(DOCUMENTS);
}

export function listLegalDocumentMeta(): LegalDocumentMeta[] {
  return listLegalDocuments().map(
    ({ sections: _sections, ...meta }) => meta,
  );
}

export function getLegalDocument(id: LegalDocumentId): LegalDocument {
  const doc = DOCUMENTS[id];
  if (!doc) {
    throw new Error(`Unknown legal document: ${id}`);
  }
  return doc;
}

export function getLegalDocumentByCode(
  code: LegalDocumentCode,
): LegalDocument {
  const doc = listLegalDocuments().find((item) => item.code === code);
  if (!doc) {
    throw new Error(`Unknown legal document code: ${code}`);
  }
  return doc;
}

export function getLegalDocumentMeta(
  id: LegalDocumentId,
): LegalDocumentMeta {
  const { sections: _sections, ...meta } = getLegalDocument(id);
  return meta;
}

export function getCurrentLegalVersion(code: LegalDocumentCode): string {
  return getLegalDocumentByCode(code).version;
}

/** Current TERMS + PRIVACY acceptances expected at signup. */
export function getRequiredSignupConsents(): Array<{
  document: LegalDocumentCode;
  version: string;
}> {
  return SIGNUP_REQUIRED_DOCUMENTS.map((document) => ({
    document,
    version: getCurrentLegalVersion(document),
  }));
}

export function validateSignupConsents(
  consents: Array<{ document: LegalDocumentCode; version: string }> | undefined,
): { ok: true } | { ok: false; message: string } {
  if (!consents || consents.length === 0) {
    return {
      ok: false,
      message: 'Legal consent is required to create an account',
    };
  }

  for (const required of getRequiredSignupConsents()) {
    const match = consents.find(
      (item) =>
        item.document === required.document &&
        item.version === required.version,
    );
    if (!match) {
      return {
        ok: false,
        message: `Acceptance of ${required.document} v${required.version} is required`,
      };
    }
  }

  return { ok: true };
}

export {
  termsHe,
  privacyHe,
  cookiesHe,
  aiTermsHe,
};
