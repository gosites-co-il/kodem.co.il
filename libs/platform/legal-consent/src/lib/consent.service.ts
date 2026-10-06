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
} from '@kodem/platform/legal';

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
    return Promise.all(inputs.map((input) => this.recordAcceptance(input)));
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
    const [required, optional] = await Promise.all([
      Promise.all(
        SIGNUP_REQUIRED_DOCUMENTS.map(async (code) => {
          const doc = getLegalDocumentByCode(code);
          const hasCurrent = await this.repo.hasAcceptedVersion(
            user.id,
            code,
            doc.version,
          );
          if (hasCurrent) return null;

          if (doc.requiresReconsent) {
            const hasAny = await this.repo.hasAcceptedDocument(user.id, code);
            if (hasAny) return toPending(doc, 'reconsent');
          }

          const createdAt =
            user.createdAt instanceof Date
              ? user.createdAt
              : new Date(user.createdAt);
          const mustConsentAtSignup =
            createdAt.getTime() >=
            LEGAL_CONSENT_ENFORCEMENT_STARTED_AT.getTime();

          if (mustConsentAtSignup) {
            const hasAny = await this.repo.hasAcceptedDocument(user.id, code);
            if (!hasAny) return toPending(doc, 'signup');
          }
          return null;
        }),
      ),
      // Optional documents that explicitly require re-consent.
      Promise.all(
        [
          getLegalDocumentByCode('COOKIES'),
          getLegalDocumentByCode('AI_TERMS'),
        ].map(async (doc) => {
          if (!doc.requiresReconsent) return null;
          const hasCurrent = await this.repo.hasAcceptedVersion(
            user.id,
            doc.code,
            doc.version,
          );
          if (hasCurrent) return null;
          const hasAny = await this.repo.hasAcceptedDocument(user.id, doc.code);
          if (hasAny) return toPending(doc, 'reconsent');
          return null;
        }),
      ),
    ]);

    return {
      pending: [...required, ...optional].filter(
        (item): item is PendingLegalDocument => item !== null,
      ),
    };
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
