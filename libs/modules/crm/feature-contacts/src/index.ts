import {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  WorkspaceId,
} from '@kodem/contracts';
import { CrmContactRepository } from '@kodem/database';

export type { Contact, CrmContact } from '@kodem/contracts';

export class ContactService {
  private readonly contacts = new CrmContactRepository();

  create(
    workspaceId: WorkspaceId,
    input: CreateContactInput,
  ): Promise<Contact> {
    if (!input.name?.trim()) {
      throw new Error('Contact name is required');
    }
    return this.contacts.create(workspaceId, input);
  }

  list(workspaceId: WorkspaceId): Promise<Contact[]> {
    return this.contacts.findByWorkspace(workspaceId);
  }

  get(workspaceId: WorkspaceId, id: string): Promise<Contact | null> {
    return this.contacts.findById(workspaceId, id);
  }

  async update(
    workspaceId: WorkspaceId,
    id: string,
    input: UpdateContactInput,
  ): Promise<Contact> {
    const updated = await this.contacts.update(workspaceId, id, input);
    if (!updated) {
      throw new Error('Contact not found');
    }
    return updated;
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<void> {
    const deleted = await this.contacts.delete(workspaceId, id);
    if (!deleted) {
      throw new Error('Contact not found');
    }
  }

  count(workspaceId: WorkspaceId): Promise<number> {
    return this.contacts.countByWorkspace(workspaceId);
  }
}
