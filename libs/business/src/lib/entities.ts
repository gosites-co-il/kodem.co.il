import { Auditable } from '@kodem/core';
import { WorkspaceId } from '@kodem/core';

export interface BusinessProfile extends Auditable {
  workspaceId: WorkspaceId;
  name: string;
  industry?: string;
  services: string[];
  classification?: string;
  communicationChannels: string[];
  hypotheses: string[];
  version: number;
}

export interface Lead extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  email?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
}

export interface Contact extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  email?: string;
  phone?: string;
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
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface Activity extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
