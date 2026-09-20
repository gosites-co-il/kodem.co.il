import {
  LegalAuthMethod,
  LegalConsentRecord,
  LegalConsentSource,
  LegalDocumentCode,
  LegalConsentId,
  UserId,
  WorkspaceId,
  createId,
} from '@kodem/contracts';
import { getPrismaClient } from './client';

type LegalConsentRow = {
  id: string;
  userId: string;
  document: string;
  version: string;
  acceptedAt: Date;
  source: string;
  ip: string | null;
  userAgent: string | null;
  locale: string | null;
  authMethod: string | null;
  workspaceId: string | null;
  createdAt: Date;
};

function mapRow(row: LegalConsentRow): LegalConsentRecord {
  return {
    id: row.id,
    userId: row.userId as UserId,
    document: row.document as LegalDocumentCode,
    version: row.version,
    acceptedAt: row.acceptedAt,
    source: row.source as LegalConsentSource,
    ip: row.ip ?? undefined,
    userAgent: row.userAgent ?? undefined,
    locale: row.locale ?? undefined,
    authMethod: (row.authMethod as LegalAuthMethod | null) ?? undefined,
    workspaceId: (row.workspaceId as WorkspaceId | null) ?? undefined,
  };
}

export class LegalConsentRepository {
  private readonly db = getPrismaClient();

  async create(input: {
    id?: LegalConsentId;
    userId: UserId;
    document: LegalDocumentCode;
    version: string;
    source: LegalConsentSource;
    ip?: string;
    userAgent?: string;
    locale?: string;
    authMethod?: LegalAuthMethod;
    workspaceId?: WorkspaceId;
    acceptedAt?: Date;
  }): Promise<LegalConsentRecord> {
    const id = input.id ?? createId<'LegalConsentId'>('lc');
    const row = await this.db.legalConsent.create({
      data: {
        id,
        userId: input.userId,
        document: input.document,
        version: input.version,
        source: input.source,
        ip: input.ip,
        userAgent: input.userAgent,
        locale: input.locale,
        authMethod: input.authMethod,
        workspaceId: input.workspaceId,
        acceptedAt: input.acceptedAt ?? new Date(),
      },
    });
    return mapRow(row);
  }

  async listByUser(userId: UserId): Promise<LegalConsentRecord[]> {
    const rows = await this.db.legalConsent.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });
    return rows.map(mapRow);
  }

  async hasAcceptedVersion(
    userId: UserId,
    document: LegalDocumentCode,
    version: string,
  ): Promise<boolean> {
    const row = await this.db.legalConsent.findFirst({
      where: { userId, document, version },
      select: { id: true },
    });
    return Boolean(row);
  }

  async hasAcceptedDocument(
    userId: UserId,
    document: LegalDocumentCode,
  ): Promise<boolean> {
    const row = await this.db.legalConsent.findFirst({
      where: { userId, document },
      select: { id: true },
    });
    return Boolean(row);
  }
}
