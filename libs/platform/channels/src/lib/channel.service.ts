import type {
  ChannelCatalogItem,
  ChannelType,
  ConfigureChannelInput,
  ConnectionId,
  UserId,
  WorkspaceChannel,
  WorkspaceId,
} from '@kodem/contracts';
import {
  PrismaEventStore,
  WorkspaceChannelRepository,
  WorkspaceConnectionRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import {
  PLATFORM_CHANNELS,
  getChannelDefinition,
} from '@kodem/platform/catalog';

export class ChannelService {
  private readonly channels = new WorkspaceChannelRepository();
  private readonly connections = new WorkspaceConnectionRepository();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  async listCatalog(workspaceId: WorkspaceId): Promise<ChannelCatalogItem[]> {
    const existing = await this.channels.findByWorkspace(workspaceId);
    const byType = new Map(
      existing.map((e) => [e.channel.type, e] as const),
    );
    const connections = await this.connections.findByWorkspace(workspaceId);
    const connById = new Map(connections.map((c) => [c.id, c] as const));

    return PLATFORM_CHANNELS.map((def) => {
      const row = byType.get(def.type);
      const channel: WorkspaceChannel | null = row
        ? {
            ...row.channel,
            bindings: row.bindings.map((b) => {
              const conn = connById.get(b.connectionId as ConnectionId);
              return {
                connectionId: b.connectionId as ConnectionId,
                isPrimary: b.isPrimary,
                provider: conn?.provider,
                externalAccountName: conn?.externalAccountName,
              };
            }),
          }
        : null;

      return {
        type: def.type,
        name: def.name,
        description: def.description,
        allowedProviders: def.allowedProviders,
        status: def.status,
        channel,
      };
    });
  }

  /**
   * CRM / Campaigns port — list configured channels without provider details.
   */
  async listWorkspaceChannels(
    workspaceId: WorkspaceId,
  ): Promise<WorkspaceChannel[]> {
    const catalog = await this.listCatalog(workspaceId);
    return catalog
      .map((c) => c.channel)
      .filter((c): c is WorkspaceChannel => c != null);
  }

  async getByType(
    workspaceId: WorkspaceId,
    type: ChannelType,
  ): Promise<WorkspaceChannel | null> {
    const catalog = await this.listCatalog(workspaceId);
    return catalog.find((c) => c.type === type)?.channel ?? null;
  }

  async configure(
    workspaceId: WorkspaceId,
    type: ChannelType,
    input: ConfigureChannelInput,
    _actorId: UserId,
  ): Promise<WorkspaceChannel> {
    const def = getChannelDefinition(type);
    if (!def) {
      throw new Error('Unknown channel type');
    }

    const connection = await this.connections.findById(
      workspaceId,
      input.connectionId,
    );
    if (!connection || connection.status !== 'connected') {
      throw new Error('Connection not found or not connected');
    }
    if (!def.allowedProviders.includes(connection.provider)) {
      throw new Error('Connection provider cannot back this channel');
    }

    const channel = await this.channels.upsertChannel({
      workspaceId,
      type,
      status: 'connected',
    });

    await this.channels.setBinding({
      channelId: channel.id,
      connectionId: connection.id,
      isPrimary: input.isPrimary !== false,
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.CHANNEL_CONFIGURED,
      workspaceId,
      payload: {
        channelId: channel.id,
        type,
        connectionId: connection.id,
      },
    });

    const result = await this.getByType(workspaceId, type);
    if (!result) {
      throw new Error('Failed to load configured channel');
    }
    return result;
  }

  async disconnect(
    workspaceId: WorkspaceId,
    type: ChannelType,
    _actorId: UserId,
  ): Promise<void> {
    const existing = await this.channels.findByType(workspaceId, type);
    if (!existing) return;

    await this.channels.clearBindings(existing.channel.id);
    await this.channels.upsertChannel({
      workspaceId,
      type,
      status: 'not_configured',
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.CHANNEL_DISCONNECTED,
      workspaceId,
      payload: { channelId: existing.channel.id, type },
    });
  }
}

/** Port type for CRM / modules that depend on Channels without providers. */
export type ChannelPort = Pick<
  ChannelService,
  'listWorkspaceChannels' | 'getByType'
>;
