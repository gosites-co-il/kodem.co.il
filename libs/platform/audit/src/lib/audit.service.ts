import type { AuditEvent, CreateAuditEventInput } from '@kodem/contracts';
import { AuditEventRepository as DbAuditEventRepository } from '@kodem/database';

export interface AuditEventRepository {
  create(input: CreateAuditEventInput): Promise<AuditEvent>;
}

export class AuditService {
  private readonly auditRepo: AuditEventRepository;

  constructor(auditRepo?: AuditEventRepository) {
    this.auditRepo = auditRepo ?? new DbAuditEventRepository();
  }

  async record(input: CreateAuditEventInput): Promise<AuditEvent> {
    return this.auditRepo.create(input);
  }
}
