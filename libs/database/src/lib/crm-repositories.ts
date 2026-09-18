import {
  Contact,
  CreateContactInput,
  CreateLeadInput,
  CreateTaskInput,
  Lead,
  LeadStatus,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateContactInput,
  UpdateLeadInput,
  UpdateTaskInput,
  WorkspaceId,
  createId,
} from '@kodem/contracts';
import { getPrismaClient } from './client';

type LeadRow = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  contactId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ContactRow = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRow = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  leadId: string | null;
  contactId: string | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    source: row.source ?? undefined,
    status: row.status as LeadStatus,
    notes: row.notes ?? undefined,
    contactId: row.contactId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    leadId: row.leadId ?? undefined,
    contactId: row.contactId ?? undefined,
    dueAt: row.dueAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function optionalString(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDueAt(value: string | Date | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class CrmLeadRepository {
  private readonly db = getPrismaClient();

  async create(workspaceId: WorkspaceId, input: CreateLeadInput): Promise<Lead> {
    const row = await this.db.crmLead.create({
      data: {
        id: createId('lead'),
        workspaceId,
        name: input.name.trim(),
        email: optionalString(input.email),
        phone: optionalString(input.phone),
        source: optionalString(input.source),
        notes: optionalString(input.notes),
        status: input.status ?? 'new',
      },
    });
    return mapLead(row);
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Lead[]> {
    const rows = await this.db.crmLead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapLead);
  }

  async findById(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<Lead | null> {
    const row = await this.db.crmLead.findFirst({
      where: { id, workspaceId },
    });
    return row ? mapLead(row) : null;
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateLeadInput,
  ): Promise<Lead | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;

    const row = await this.db.crmLead.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.email !== undefined
          ? { email: optionalString(input.email) }
          : {}),
        ...(input.phone !== undefined
          ? { phone: optionalString(input.phone) }
          : {}),
        ...(input.source !== undefined
          ? { source: optionalString(input.source) }
          : {}),
        ...(input.notes !== undefined
          ? { notes: optionalString(input.notes) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    return mapLead(row);
  }

  async markConverted(
    workspaceId: WorkspaceId,
    id: string,
    contactId: string,
  ): Promise<Lead | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;

    const row = await this.db.crmLead.update({
      where: { id },
      data: {
        contactId,
        status: 'qualified',
      },
    });
    return mapLead(row);
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<boolean> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return false;
    await this.db.crmLead.delete({ where: { id } });
    return true;
  }

  async countByWorkspace(workspaceId: WorkspaceId): Promise<number> {
    return this.db.crmLead.count({ where: { workspaceId } });
  }
}

export class CrmContactRepository {
  private readonly db = getPrismaClient();

  async create(
    workspaceId: WorkspaceId,
    input: CreateContactInput,
  ): Promise<Contact> {
    const row = await this.db.crmContact.create({
      data: {
        id: createId('ctc'),
        workspaceId,
        name: input.name.trim(),
        email: optionalString(input.email),
        phone: optionalString(input.phone),
        notes: optionalString(input.notes),
      },
    });
    return mapContact(row);
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Contact[]> {
    const rows = await this.db.crmContact.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapContact);
  }

  async findById(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<Contact | null> {
    const row = await this.db.crmContact.findFirst({
      where: { id, workspaceId },
    });
    return row ? mapContact(row) : null;
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateContactInput,
  ): Promise<Contact | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;

    const row = await this.db.crmContact.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.email !== undefined
          ? { email: optionalString(input.email) }
          : {}),
        ...(input.phone !== undefined
          ? { phone: optionalString(input.phone) }
          : {}),
        ...(input.notes !== undefined
          ? { notes: optionalString(input.notes) }
          : {}),
      },
    });
    return mapContact(row);
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<boolean> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return false;
    await this.db.crmContact.delete({ where: { id } });
    return true;
  }

  async countByWorkspace(workspaceId: WorkspaceId): Promise<number> {
    return this.db.crmContact.count({ where: { workspaceId } });
  }
}

export class CrmTaskRepository {
  private readonly db = getPrismaClient();

  async create(workspaceId: WorkspaceId, input: CreateTaskInput): Promise<Task> {
    const dueAt = parseDueAt(input.dueAt);
    const row = await this.db.crmTask.create({
      data: {
        id: createId('task'),
        workspaceId,
        title: input.title.trim(),
        description: optionalString(input.description),
        status: input.status ?? 'pending',
        priority: input.priority ?? 'medium',
        leadId: optionalString(input.leadId),
        contactId: optionalString(input.contactId),
        dueAt: dueAt === undefined ? null : dueAt,
      },
    });
    return mapTask(row);
  }

  async findByWorkspace(
    workspaceId: WorkspaceId,
    filters?: { leadId?: string; contactId?: string; status?: TaskStatus },
  ): Promise<Task[]> {
    const rows = await this.db.crmTask.findMany({
      where: {
        workspaceId,
        ...(filters?.leadId ? { leadId: filters.leadId } : {}),
        ...(filters?.contactId ? { contactId: filters.contactId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapTask);
  }

  async findById(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<Task | null> {
    const row = await this.db.crmTask.findFirst({
      where: { id, workspaceId },
    });
    return row ? mapTask(row) : null;
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateTaskInput,
  ): Promise<Task | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;

    const dueAt = parseDueAt(input.dueAt);

    const row = await this.db.crmTask.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: optionalString(input.description) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.leadId !== undefined
          ? { leadId: optionalString(input.leadId) }
          : {}),
        ...(input.contactId !== undefined
          ? { contactId: optionalString(input.contactId) }
          : {}),
        ...(dueAt !== undefined ? { dueAt } : {}),
      },
    });
    return mapTask(row);
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<boolean> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return false;
    await this.db.crmTask.delete({ where: { id } });
    return true;
  }

  async countByWorkspace(
    workspaceId: WorkspaceId,
    status?: TaskStatus,
  ): Promise<number> {
    return this.db.crmTask.count({
      where: {
        workspaceId,
        ...(status ? { status } : {}),
      },
    });
  }
}
