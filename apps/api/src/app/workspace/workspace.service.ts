import { Injectable } from '@nestjs/common';
import { CreateWorkspaceInput } from '@kodem/contracts';
import {
  WorkspaceRepository,
  PrismaEventStore,
} from '@kodem/database';
import { KodemEventBus, EVENT_TYPES } from '@kodem/events';

@Injectable()
export class WorkspaceService {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly eventStore = new PrismaEventStore();
  private readonly eventBus = new KodemEventBus(this.eventStore);

  async create(input: CreateWorkspaceInput) {
    const existing = await this.workspaceRepo.findBySlug(input.slug);
    if (existing) {
      throw new Error(`Workspace slug "${input.slug}" already exists`);
    }

    const { workspace } = await this.workspaceRepo.create(input);

    await this.eventBus.emit({
      type: EVENT_TYPES.WORKSPACE_CREATED,
      workspaceId: workspace.id,
      payload: {
        name: workspace.name,
        slug: workspace.slug,
        websiteUrl: workspace.websiteUrl,
      },
    });

    return workspace;
  }

  async findBySlug(slug: string) {
    return this.workspaceRepo.findBySlug(slug);
  }

  async findById(id: string) {
    return this.workspaceRepo.findById(id as never);
  }
}
