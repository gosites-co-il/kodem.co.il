import { Auditable } from './types';
import { WorkspaceId } from './ids';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Lead extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  contactId?: string;
}

export interface Contact extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  companyId?: string;
}

export interface Customer extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  contactId: string;
  lifetimeValue?: number;
}

export interface Company extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  domain?: string;
}

export interface Task extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  leadId?: string;
  contactId?: string;
  dueAt?: Date;
}

export interface Activity extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
  status?: LeadStatus;
}

export interface ConvertLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  leadId?: string;
  contactId?: string;
  dueAt?: string | Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  leadId?: string | null;
  contactId?: string | null;
  dueAt?: string | Date | null;
}

export type { Lead as CrmLead };
export type { Contact as CrmContact };
