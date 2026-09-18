import {
  ChannelId,
  ConnectionCapability,
  ConnectionId,
  ConnectionProviderId,
  ConnectionStatus,
  IntegrationId,
  UserId,
  WorkspaceChannel,
  WorkspaceConnection,
  WorkspaceId,
  ChannelStatus,
  ChannelType,
  createId,
} from '@kodem/contracts';
import { getPrismaClient } from './client';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  integrationId: string;
  provider: string;
  status: string;
  capabilities: string;
  externalAccountId: string | null;
  externalAccountName: string | null;
  metadata: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

type ChannelRow = {
  id: string;
  workspaceId: string;
  type: string;
  status: string;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BindingRow = {
  id: string;
  channelId: string;
  connectionId: string;
  isPrimary: boolean;
};

function parseJsonObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseCapabilities(raw: string): ConnectionCapability[] {
  try {
    return JSON.parse(raw) as ConnectionCapability[];
  } catch {
    return [];
  }
}

export function mapConnection(row: ConnectionRow): WorkspaceConnection {
  return {
    id: row.id as ConnectionId,
    workspaceId: row.workspaceId as WorkspaceId,
    integrationId: row.integrationId as IntegrationId,
    provider: row.provider as ConnectionProviderId,
    status: row.status as ConnectionStatus,
    capabilities: parseCapabilities(row.capabilities),
    externalAccountId: row.externalAccountId,
    externalAccountName: row.externalAccountName,
    metadata: parseJsonObject(row.metadata),
    createdById: row.createdById as UserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class WorkspaceConnectionRepository {
  private readonly db = getPrismaClient();

  async findByWorkspace(
    workspaceId: WorkspaceId,
  ): Promise<WorkspaceConnection[]> {
    const rows = await this.db.workspaceConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapConnection);
  }

  async findById(
    workspaceId: WorkspaceId,
    id: string,
  ): Promise<WorkspaceConnection | null> {
    const row = await this.db.workspaceConnection.findFirst({
      where: { id, workspaceId },
    });
    return row ? mapConnection(row) : null;
  }

  async findByIntegration(
    workspaceId: WorkspaceId,
    integrationId: IntegrationId,
  ): Promise<WorkspaceConnection | null> {
    const row = await this.db.workspaceConnection.findUnique({
      where: {
        workspaceId_integrationId: { workspaceId, integrationId },
      },
    });
    return row ? mapConnection(row) : null;
  }

  async upsert(input: {
    workspaceId: WorkspaceId;
    integrationId: IntegrationId;
    provider: ConnectionProviderId;
    status: ConnectionStatus;
    capabilities: ConnectionCapability[];
    createdById: UserId;
    externalAccountId?: string | null;
    externalAccountName?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<WorkspaceConnection> {
    const existing = await this.findByIntegration(
      input.workspaceId,
      input.integrationId,
    );
    const capabilities = JSON.stringify(input.capabilities);
    const metadataJson =
      input.metadata !== undefined
        ? input.metadata
          ? JSON.stringify(input.metadata)
          : null
        : undefined;

    if (existing) {
      const row = await this.db.workspaceConnection.update({
        where: { id: existing.id },
        data: {
          provider: input.provider,
          status: input.status,
          capabilities,
          externalAccountId: input.externalAccountId ?? null,
          externalAccountName: input.externalAccountName ?? null,
          ...(metadataJson !== undefined ? { metadata: metadataJson } : {}),
        },
      });
      return mapConnection(row);
    }

    const row = await this.db.workspaceConnection.create({
      data: {
        id: createId<ConnectionId>('conn'),
        workspaceId: input.workspaceId,
        integrationId: input.integrationId,
        provider: input.provider,
        status: input.status,
        capabilities,
        externalAccountId: input.externalAccountId ?? null,
        externalAccountName: input.externalAccountName ?? null,
        metadata: metadataJson ?? null,
        createdById: input.createdById,
      },
    });
    return mapConnection(row);
  }

  async updateMetadata(
    workspaceId: WorkspaceId,
    id: string,
    metadata: Record<string, unknown> | null,
  ): Promise<WorkspaceConnection | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;
    const row = await this.db.workspaceConnection.update({
      where: { id },
      data: {
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return mapConnection(row);
  }

  async updateStatus(
    workspaceId: WorkspaceId,
    id: string,
    status: ConnectionStatus,
  ): Promise<WorkspaceConnection | null> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return null;
    const row = await this.db.workspaceConnection.update({
      where: { id },
      data: { status },
    });
    return mapConnection(row);
  }

  async delete(workspaceId: WorkspaceId, id: string): Promise<boolean> {
    const existing = await this.findById(workspaceId, id);
    if (!existing) return false;
    await this.db.workspaceConnection.delete({ where: { id } });
    return true;
  }
}

export class ConnectionCredentialRepository {
  private readonly db = getPrismaClient();

  async upsert(
    connectionId: ConnectionId,
    ciphertext: string,
    keyVersion = 1,
  ): Promise<void> {
    await this.db.connectionCredential.upsert({
      where: { connectionId },
      create: { connectionId, ciphertext, keyVersion },
      update: { ciphertext, keyVersion },
    });
  }

  async findCiphertext(connectionId: ConnectionId): Promise<string | null> {
    const row = await this.db.connectionCredential.findUnique({
      where: { connectionId },
    });
    return row?.ciphertext ?? null;
  }

  async delete(connectionId: ConnectionId): Promise<void> {
    await this.db.connectionCredential
      .delete({ where: { connectionId } })
      .catch(() => undefined);
  }
}

export class WorkspaceChannelRepository {
  private readonly db = getPrismaClient();

  async findByWorkspace(workspaceId: WorkspaceId): Promise<
    Array<{
      channel: Omit<WorkspaceChannel, 'bindings'>;
      bindings: BindingRow[];
    }>
  > {
    const rows = await this.db.workspaceChannel.findMany({
      where: { workspaceId },
      include: { bindings: true },
      orderBy: { type: 'asc' },
    });
    return rows.map((row) => ({
      channel: {
        id: row.id as ChannelId,
        workspaceId: row.workspaceId as WorkspaceId,
        type: row.type as ChannelType,
        status: row.status as ChannelStatus,
        metadata: parseJsonObject(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      bindings: row.bindings,
    }));
  }

  async findByType(
    workspaceId: WorkspaceId,
    type: ChannelType,
  ): Promise<{
    channel: Omit<WorkspaceChannel, 'bindings'>;
    bindings: BindingRow[];
  } | null> {
    const row = await this.db.workspaceChannel.findUnique({
      where: { workspaceId_type: { workspaceId, type } },
      include: { bindings: true },
    });
    if (!row) return null;
    return {
      channel: {
        id: row.id as ChannelId,
        workspaceId: row.workspaceId as WorkspaceId,
        type: row.type as ChannelType,
        status: row.status as ChannelStatus,
        metadata: parseJsonObject(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      bindings: row.bindings,
    };
  }

  async upsertChannel(input: {
    workspaceId: WorkspaceId;
    type: ChannelType;
    status: ChannelStatus;
    metadata?: Record<string, unknown> | null;
  }): Promise<Omit<WorkspaceChannel, 'bindings'>> {
    const existing = await this.findByType(input.workspaceId, input.type);
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

    if (existing) {
      const row = await this.db.workspaceChannel.update({
        where: { id: existing.channel.id },
        data: { status: input.status, metadata },
      });
      return {
        id: row.id as ChannelId,
        workspaceId: row.workspaceId as WorkspaceId,
        type: row.type as ChannelType,
        status: row.status as ChannelStatus,
        metadata: parseJsonObject(row.metadata),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }

    const row = await this.db.workspaceChannel.create({
      data: {
        id: createId<ChannelId>('chan'),
        workspaceId: input.workspaceId,
        type: input.type,
        status: input.status,
        metadata,
      },
    });
    return {
      id: row.id as ChannelId,
      workspaceId: row.workspaceId as WorkspaceId,
      type: row.type as ChannelType,
      status: row.status as ChannelStatus,
      metadata: parseJsonObject(row.metadata),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async setBinding(input: {
    channelId: ChannelId;
    connectionId: ConnectionId;
    isPrimary: boolean;
  }): Promise<void> {
    if (input.isPrimary) {
      await this.db.channelConnectionBinding.updateMany({
        where: { channelId: input.channelId },
        data: { isPrimary: false },
      });
    }
    await this.db.channelConnectionBinding.upsert({
      where: {
        channelId_connectionId: {
          channelId: input.channelId,
          connectionId: input.connectionId,
        },
      },
      create: {
        id: createId('cbind'),
        channelId: input.channelId,
        connectionId: input.connectionId,
        isPrimary: input.isPrimary,
      },
      update: { isPrimary: input.isPrimary },
    });
  }

  async clearBindings(channelId: ChannelId): Promise<void> {
    await this.db.channelConnectionBinding.deleteMany({
      where: { channelId },
    });
  }

  async deleteChannel(
    workspaceId: WorkspaceId,
    type: ChannelType,
  ): Promise<boolean> {
    const existing = await this.findByType(workspaceId, type);
    if (!existing) return false;
    await this.db.workspaceChannel.delete({
      where: { id: existing.channel.id },
    });
    return true;
  }
}
