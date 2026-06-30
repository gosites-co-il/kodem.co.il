import {
  CreateWorkspaceInput,
  CreateWorkspaceForUserInput,
  Workspace,
  WorkspaceId,
  createId,
  UserId,
  MemberId,
  KodemEvent,
  EventStore,
} from '@kodem/contracts';
import { getPrismaClient } from './client';
import { mapEventRowToDomain, mapEventToPersistence } from './mappers';
import { mapWorkspaceRowToDomain } from './mappers/workspace.mapper';

export class WorkspaceRepository {
  private readonly db = getPrismaClient();

  async create(input: CreateWorkspaceInput): Promise<{
    workspace: Workspace;
    userId: UserId;
    memberId: MemberId;
  }> {
    const workspaceId = createId<'WorkspaceId'>('ws');
    const userId = createId<'UserId'>('usr');
    const memberId = createId<'MemberId'>('mem');
    const now = new Date();

    await this.db.$transaction([
      this.db.user.create({
        data: { id: userId, email: input.ownerEmail, name: input.ownerName },
      }),
      this.db.workspace.create({
        data: {
          id: workspaceId,
          name: input.name,
          slug: input.slug,
          ownerId: userId,
          status: 'onboarding',
          websiteUrl: input.websiteUrl,
        },
      }),
      this.db.member.create({
        data: {
          id: memberId,
          workspaceId,
          userId,
          role: 'owner',
        },
      }),
      this.db.user.update({
        where: { id: userId },
        data: { activeWorkspaceId: workspaceId },
      }),
    ]);

    return {
      workspace: {
        id: workspaceId,
        name: input.name,
        slug: input.slug,
        ownerId: userId,
        status: 'onboarding',
        websiteUrl: input.websiteUrl,
        createdAt: now,
        updatedAt: now,
      },
      userId,
      memberId,
    };
  }

  async createForUser(input: CreateWorkspaceForUserInput): Promise<{
    workspace: Workspace;
    memberId: MemberId;
  }> {
    const workspaceId = createId<'WorkspaceId'>('ws');
    const memberId = createId<'MemberId'>('mem');
    const now = new Date();

    await this.db.$transaction([
      this.db.workspace.create({
        data: {
          id: workspaceId,
          name: input.name,
          slug: input.slug,
          ownerId: input.ownerId,
          status: 'onboarding',
          websiteUrl: input.websiteUrl,
        },
      }),
      this.db.member.create({
        data: {
          id: memberId,
          workspaceId,
          userId: input.ownerId,
          role: 'owner',
        },
      }),
      this.db.user.update({
        where: { id: input.ownerId },
        data: { activeWorkspaceId: workspaceId },
      }),
    ]);

    return {
      workspace: {
        id: workspaceId,
        name: input.name,
        slug: input.slug,
        ownerId: input.ownerId,
        status: 'onboarding',
        websiteUrl: input.websiteUrl,
        createdAt: now,
        updatedAt: now,
      },
      memberId,
    };
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const row = await this.db.workspace.findUnique({ where: { id } });
    if (!row) return null;
    return mapWorkspaceRowToDomain(row);
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const row = await this.db.workspace.findUnique({ where: { slug } });
    if (!row) return null;
    return mapWorkspaceRowToDomain(row);
  }
}

export class PrismaEventStore implements EventStore {
  private readonly db = getPrismaClient();

  async save<TPayload extends Record<string, unknown>>(
    event: KodemEvent<TPayload>,
  ): Promise<KodemEvent<TPayload>> {
    await this.db.event.create({ data: mapEventToPersistence(event) });
    return event;
  }

  async findPending(limit = 10): Promise<KodemEvent[]> {
    const rows = await this.db.event.findMany({
      where: { status: 'pending' },
      orderBy: { occurredAt: 'asc' },
      take: limit,
    });
    return rows.map(mapEventRowToDomain);
  }

  async markProcessing(id: string): Promise<void> {
    await this.db.event.update({
      where: { id },
      data: { status: 'processing' },
    });
  }

  async markCompleted(id: string): Promise<void> {
    await this.db.event.update({
      where: { id },
      data: { status: 'completed', processedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db.event.update({
      where: { id },
      data: { status: 'failed', error, processedAt: new Date() },
    });
  }

  async findByWorkspace(workspaceId: string): Promise<KodemEvent[]> {
    const rows = await this.db.event.findMany({
      where: { workspaceId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map(mapEventRowToDomain);
  }
}
