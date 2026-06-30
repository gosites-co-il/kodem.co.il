import {
  CreateWorkspaceInput,
  Workspace,
  WorkspaceId,
  createId,
  UserId,
  MemberId,
} from '@kodem/core';
import { KodemEvent, EventStore } from '@kodem/events';
import { getPrismaClient } from './client';

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
    ]);

    return {
      workspace: {
        id: workspaceId,
        name: input.name,
        slug: input.slug,
        status: 'onboarding',
        websiteUrl: input.websiteUrl,
        createdAt: now,
        updatedAt: now,
      },
      userId,
      memberId,
    };
  }

  async findById(id: WorkspaceId): Promise<Workspace | null> {
    const row = await this.db.workspace.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id as WorkspaceId,
      name: row.name,
      slug: row.slug,
      status: row.status as Workspace['status'],
      websiteUrl: row.websiteUrl ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    const row = await this.db.workspace.findUnique({ where: { slug } });
    if (!row) return null;
    return {
      id: row.id as WorkspaceId,
      name: row.name,
      slug: row.slug,
      status: row.status as Workspace['status'],
      websiteUrl: row.websiteUrl ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export class PrismaEventStore implements EventStore {
  private readonly db = getPrismaClient();

  async save<TPayload>(event: KodemEvent<TPayload>): Promise<KodemEvent<TPayload>> {
    await this.db.event.create({
      data: {
        id: event.id,
        type: event.type,
        workspaceId: event.workspaceId,
        payload: JSON.stringify(event.payload),
        status: event.status ?? 'pending',
        occurredAt: event.occurredAt,
      },
    });
    return event;
  }

  async findPending(limit = 10): Promise<KodemEvent[]> {
    const rows = await this.db.event.findMany({
      where: { status: 'pending' },
      orderBy: { occurredAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id as KodemEvent['id'],
      type: row.type as KodemEvent['type'],
      workspaceId: row.workspaceId as KodemEvent['workspaceId'],
      payload: JSON.parse(row.payload),
      occurredAt: row.occurredAt,
      immutable: true as const,
      status: row.status as KodemEvent['status'],
    }));
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
    return rows.map((row) => ({
      id: row.id as KodemEvent['id'],
      type: row.type as KodemEvent['type'],
      workspaceId: row.workspaceId as KodemEvent['workspaceId'],
      payload: JSON.parse(row.payload),
      occurredAt: row.occurredAt,
      immutable: true as const,
      status: row.status as KodemEvent['status'],
    }));
  }
}
