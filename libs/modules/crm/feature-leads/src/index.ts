import {
  ConvertLeadInput,
  CreateLeadInput,
  Lead,
  LeadStatus,
  UpdateLeadInput,
  WorkspaceId,
} from '@kodem/contracts';
import {
  CrmContactRepository,
  CrmLeadRepository,
  PrismaEventStore,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';

export type { Lead, CrmLead } from '@kodem/contracts';
export { LEAD_STATUSES } from '@kodem/contracts';
export type { LeadStatus } from '@kodem/contracts';

export class LeadService {
  private readonly leads = new CrmLeadRepository();
  private readonly contacts = new CrmContactRepository();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  create(workspaceId: WorkspaceId, input: CreateLeadInput): Promise<Lead> {
    return this.createLead(workspaceId, input);
  }

  async createLead(
    workspaceId: WorkspaceId,
    input: CreateLeadInput,
  ): Promise<Lead> {
    if (!input.name?.trim()) {
      throw new Error('Lead name is required');
    }

    const lead = await this.leads.create(workspaceId, input);
    await this.eventBus.emit({
      type: EVENT_TYPES.LEAD_CREATED,
      workspaceId,
      payload: {
        leadId: lead.id,
        name: lead.name,
        status: lead.status,
        source: lead.source ?? null,
      },
    });
    return lead;
  }

  list(workspaceId: WorkspaceId): Promise<Lead[]> {
    return this.leads.findByWorkspace(workspaceId);
  }

  get(workspaceId: WorkspaceId, id: string): Promise<Lead | null> {
    return this.leads.findById(workspaceId, id);
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateLeadInput,
  ): Promise<Lead> {
    const updated = await this.leads.update(workspaceId, id, input);
    if (!updated) {
      throw new Error('Lead not found');
    }
    return updated;
  }

  async changeStatus(
    workspaceId: WorkspaceId,
    id: string,
    status: LeadStatus,
  ): Promise<Lead> {
    return this.update(workspaceId, id, { status });
  }

  async convertToContact(
    workspaceId: WorkspaceId,
    id: string,
    input: ConvertLeadInput = {},
  ): Promise<{ lead: Lead; contactId: string }> {
    const lead = await this.leads.findById(workspaceId, id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    if (lead.contactId) {
      throw new Error('Lead already converted');
    }

    const contact = await this.contacts.create(workspaceId, {
      name: input.name?.trim() || lead.name,
      email: input.email ?? lead.email,
      phone: input.phone ?? lead.phone,
      notes: input.notes ?? lead.notes,
    });

    const converted = await this.leads.markConverted(
      workspaceId,
      id,
      contact.id,
    );
    if (!converted) {
      throw new Error('Lead not found');
    }

    await this.eventBus.emit({
      type: EVENT_TYPES.LEAD_CONVERTED,
      workspaceId,
      payload: {
        leadId: converted.id,
        contactId: contact.id,
        name: converted.name,
      },
    });

    return { lead: converted, contactId: contact.id };
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<void> {
    const deleted = await this.leads.delete(workspaceId, id);
    if (!deleted) {
      throw new Error('Lead not found');
    }
  }

  count(workspaceId: WorkspaceId): Promise<number> {
    return this.leads.countByWorkspace(workspaceId);
  }
}
