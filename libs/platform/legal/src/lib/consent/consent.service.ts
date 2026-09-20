import {
  LegalConsentRecord,
  LegalConsentStatus,
  LegalDocumentCode,
  PendingLegalDocument,
  RecordLegalConsentInput,
  SIGNUP_REQUIRED_DOCUMENTS,
  User,
} from '@kodem/contracts';
import { LegalConsentRepository } from '@kodem/database';
import {
  getLegalDocumentByCode,
  getRequiredSignupConsents,
} from '../documents/registry';

/**
 * Users created before this instant are grandfathered for signup-required
 * documents that do not yet require re-consent.
 */
export const LEGAL_CONSENT_ENFORCEMENT_STARTED_AT = new Date(
  '2026-09-20T00:00:00.000Z',
);

export class LegalConsentService {
  private readonly repo = new LegalConsentRepository();

  async recordAcceptance(
    input: RecordLegalConsentInput,
  ): Promise<LegalConsentRecord> {
    const current = getLegalDocumentByCode(input.document);
    if (input.version !== current.version) {
      throw new Error(
        `Cannot accept outdated version of ${input.document}. Current is ${current.version}`,
      );
    }

    return this.repo.create({
      userId: input.userId,
      document: input.document,
      version: input.version,
      source: input.source,
      ip: input.ip,
      userAgent: input.userAgent,
      locale: input.locale,
      authMethod: input.authMethod,
      workspaceId: input.workspaceId,
    });
  }

  async recordAcceptances(
    inputs: RecordLegalConsentInput[],
  ): Promise<LegalConsentRecord[]> {
    const results: LegalConsentRecord[] = [];
    for (const input of inputs) {
      results.push(await this.recordAcceptance(input));
    }
    return results;
  }

  async recordSignupConsents(params: {
    userId: User['id'];
    consents: Array<{ document: LegalDocumentCode; version: string }>;
    source: 'SIGNUP' | 'OAUTH_SIGNUP';
    ip?: string;
    userAgent?: string;
    locale?: string;
    authMethod?: RecordLegalConsentInput['authMethod'];
    workspaceId?: RecordLegalConsentInput['workspaceId'];
  }): Promise<LegalConsentRecord[]> {
    return this.recordAcceptances(
      params.consents.map((consent) => ({
        userId: params.userId,
        document: consent.document,
        version: consent.version,
        source: params.source,
        ip: params.ip,
        userAgent: params.userAgent,
        locale: params.locale,
        authMethod: params.authMethod,
        workspaceId: params.workspaceId,
      })),
    );
  }

  async getStatus(user: User): Promise<LegalConsentStatus> {
    const pending: PendingLegalDocument[] = [];

    for (const code of SIGNUP_REQUIRED_DOCUMENTS) {
      const doc = getLegalDocumentByCode(code);
      const hasCurrent = await this.repo.hasAcceptedVersion(
        user.id,
        code,
        doc.version,
      );
      if (hasCurrent) continue;

      if (doc.requiresReconsent) {
        const hasAny = await this.repo.hasAcceptedDocument(user.id, code);
        if (hasAny) {
          pending.push(toPending(doc, 'reconsent'));
          continue;
        }
      }

      const createdAt =
        user.createdAt instanceof Date
          ? user.createdAt
          : new Date(user.createdAt);
      const mustConsentAtSignup =
        createdAt.getTime() >= LEGAL_CONSENT_ENFORCEMENT_STARTED_AT.getTime();

      if (mustConsentAtSignup) {
        const hasAny = await this.repo.hasAcceptedDocument(user.id, code);
        if (!hasAny) {
          pending.push(toPending(doc, 'signup'));
        }
      }
    }

    // Optional documents that explicitly require re-consent.
    for (const doc of [
      getLegalDocumentByCode('COOKIES'),
      getLegalDocumentByCode('AI_TERMS'),
    ]) {
      if (!doc.requiresReconsent) continue;
      const hasCurrent = await this.repo.hasAcceptedVersion(
        user.id,
        doc.code,
        doc.version,
      );
      if (hasCurrent) continue;
      const hasAny = await this.repo.hasAcceptedDocument(user.id, doc.code);
      if (hasAny) {
        pending.push(toPending(doc, 'reconsent'));
      }
    }

    return { pending };
  }
}

function toPending(
  doc: ReturnType<typeof getLegalDocumentByCode>,
  reason: PendingLegalDocument['reason'],
): PendingLegalDocument {
  return {
    id: doc.id,
    code: doc.code,
    title: doc.title,
    version: doc.version,
    route: doc.route,
    reason,
    summary: doc.reconsentSummary,
  };
}

export function buildSignupConsentPayload() {
  return getRequiredSignupConsents();
}
