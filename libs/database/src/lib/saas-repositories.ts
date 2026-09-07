import {
  AuditEvent,
  AuthTokenType,
  CreateAuditEventInput,
  createId,
  FeatureFlagOverride,
  FeatureFlagScope,
  InviteStatus,
  ModuleId,
  NotificationOutboxRecord,
  NotificationPayload,
  PlanId,
  RoleName,
  Subscription,
  SubscriptionStatus,
  TrackUsageInput,
  UsageEvent,
  UsageMetric,
  UserId,
  WorkspaceId,
  WorkspaceInvite,
  WorkspaceModule,
  WorkspaceModuleStatus,
} from '@kodem/contracts';
import { getPrismaClient } from './client';

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapSubscriptionRow(row: {
  id: string;
  workspaceId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Subscription {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    planId: row.planId as PlanId,
    status: row.status as SubscriptionStatus,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapInviteRow(row: {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  invitedById: string;
  status: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceInvite {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    email: row.email,
    role: row.role as RoleName,
    invitedById: row.invitedById as UserId,
    status: row.status as InviteStatus,
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapWorkspaceModuleRow(row: {
  id: string;
  workspaceId: string;
  moduleId: string;
  status: string;
  enabledAt: Date | null;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkspaceModule {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    moduleId: row.moduleId as ModuleId,
    status: row.status as WorkspaceModuleStatus,
    enabledAt: row.enabledAt,
    disabledAt: row.disabledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapUsageEventRow(row: {
  id: string;
  workspaceId: string;
  metric: string;
  quantity: number;
  metadata: string | null;
  createdAt: Date;
}): UsageEvent {
  return {
    id: row.id,
    workspaceId: row.workspaceId as WorkspaceId,
    metric: row.metric as UsageMetric,
    quantity: row.quantity,
    metadata: parseJson<Record<string, unknown>>(row.metadata),
    createdAt: row.createdAt,
  };
}

function mapFeatureFlagOverrideRow(row: {
  id: string;
  key: string;
  scope: string;
  enabled: boolean;
  planId: string | null;
  workspaceId: string | null;
  environment: string | null;
}): FeatureFlagOverride {
  return {
    id: row.id,
    key: row.key,
    scope: row.scope as FeatureFlagScope,
    enabled: row.enabled,
    planId: (row.planId as PlanId | null) ?? null,
    workspaceId: (row.workspaceId as WorkspaceId | null) ?? null,
    environment: row.environment,
  };
}

function mapNotificationOutboxRow(row: {
  id: string;
  type: string;
  channel: string;
  payload: string;
  status: string;
  error: string | null;
  createdAt: Date;
  processedAt: Date | null;
}): NotificationOutboxRecord {
  return {
    id: row.id,
    type: row.type as NotificationOutboxRecord['type'],
    channel: row.channel as NotificationOutboxRecord['channel'],
    payload: parseJson<NotificationPayload>(row.payload) ?? {
      type: row.type as NotificationPayload['type'],
      to: '',
      data: {},
    },
    status: row.status as NotificationOutboxRecord['status'],
    error: row.error,
    createdAt: row.createdAt,
    processedAt: row.processedAt,
  };
}

function mapAuditEventRow(row: {
  id: string;
  workspaceId: string | null;
  actorId: string | null;
  targetId: string | null;
  action: string;
  metadata: string | null;
  createdAt: Date;
}): AuditEvent {
  return {
    id: row.id,
    workspaceId: (row.workspaceId as WorkspaceId | null) ?? null,
    actorId: (row.actorId as UserId | null) ?? null,
    targetId: row.targetId,
    action: row.action as AuditEvent['action'],
    metadata: parseJson<Record<string, unknown>>(row.metadata),
    createdAt: row.createdAt,
  };
}

export interface AuthTokenRecord {
  id: string;
  userId: UserId;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export class AuthTokenRepository {
  private readonly db = getPrismaClient();

  async create(input: {
    userId: UserId;
    type: AuthTokenType;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthTokenRecord> {
    const id = createId<'AuthTokenId'>('atk');
    const row = await this.db.authToken.create({
      data: {
        id,
        userId: input.userId,
        type: input.type,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: row.id,
      userId: row.userId as UserId,
      type: row.type as AuthTokenType,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    };
  }

  async findValidByHash(
    tokenHash: string,
    type: AuthTokenType,
  ): Promise<AuthTokenRecord | null> {
    const row = await this.db.authToken.findFirst({
      where: {
        tokenHash,
        type,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId as UserId,
      type: row.type as AuthTokenType,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    };
  }

  async markUsed(id: string): Promise<void> {
    await this.db.authToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: UserId, type: AuthTokenType): Promise<void> {
    await this.db.authToken.updateMany({
      where: { userId, type, revokedAt: null, usedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export class WorkspaceInviteRepository {
  private readonly db = getPrismaClient();

  async create(input: {
    workspaceId: WorkspaceId;
    email: string;
    role: RoleName;
    tokenHash: string;
    invitedById: UserId;
    expiresAt: Date;
  }): Promise<WorkspaceInvite> {
    const id = createId<'InviteId'>('inv');
    const row = await this.db.workspaceInvite.create({
      data: {
        id,
        workspaceId: input.workspaceId,
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash: input.tokenHash,
        invitedById: input.invitedById,
        status: 'pending',
        expiresAt: input.expiresAt,
      },
    });
    return mapInviteRow(row);
  }

  async findById(id: string): Promise<WorkspaceInvite | null> {
    const row = await this.db.workspaceInvite.findUnique({ where: { id } });
    return row ? mapInviteRow(row) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<(WorkspaceInvite & { tokenHash: string }) | null> {
    const row = await this.db.workspaceInvite.findFirst({
      where: { tokenHash },
    });
    if (!row) return null;
    return { ...mapInviteRow(row), tokenHash: row.tokenHash };
  }

  async listByWorkspace(workspaceId: WorkspaceId): Promise<WorkspaceInvite[]> {
    const rows = await this.db.workspaceInvite.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapInviteRow);
  }

  async updateStatus(
    id: string,
    status: InviteStatus,
    acceptedAt?: Date | null,
  ): Promise<WorkspaceInvite> {
    const row = await this.db.workspaceInvite.update({
      where: { id },
      data: {
        status,
        acceptedAt: acceptedAt ?? undefined,
      },
    });
    return mapInviteRow(row);
  }

  async markAccepted(id: string): Promise<WorkspaceInvite> {
    return this.updateStatus(id, 'accepted', new Date());
  }

  async countPendingByWorkspace(workspaceId: WorkspaceId): Promise<number> {
    return this.db.workspaceInvite.count({
      where: { workspaceId, status: 'pending' },
    });
  }

  async updateToken(
    id: string,
    input: { tokenHash: string; expiresAt: Date },
  ): Promise<WorkspaceInvite> {
    const row = await this.db.workspaceInvite.update({
      where: { id },
      data: {
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        status: 'pending',
        acceptedAt: null,
      },
    });
    return mapInviteRow(row);
  }
}

export class SubscriptionRepository {
  private readonly db = getPrismaClient();

  async findByWorkspaceId(
    workspaceId: WorkspaceId,
  ): Promise<Subscription | null> {
    const row = await this.db.subscription.findUnique({
      where: { workspaceId },
    });
    return row ? mapSubscriptionRow(row) : null;
  }

  async create(input: {
    workspaceId: WorkspaceId;
    planId: PlanId;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }): Promise<Subscription> {
    const id = createId<'SubscriptionId'>('sub');
    const now = new Date();
    const periodEnd =
      input.currentPeriodEnd ??
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const row = await this.db.subscription.create({
      data: {
        id,
        workspaceId: input.workspaceId,
        planId: input.planId,
        status: input.status ?? 'active',
        currentPeriodStart: input.currentPeriodStart ?? now,
        currentPeriodEnd: periodEnd,
      },
    });
    return mapSubscriptionRow(row);
  }

  async updatePlan(
    workspaceId: WorkspaceId,
    planId: PlanId,
    status?: SubscriptionStatus,
  ): Promise<Subscription> {
    const row = await this.db.subscription.update({
      where: { workspaceId },
      data: {
        planId,
        ...(status ? { status } : {}),
      },
    });
    return mapSubscriptionRow(row);
  }
}

export class WorkspaceModuleRepository {
  private readonly db = getPrismaClient();

  async listByWorkspace(workspaceId: WorkspaceId): Promise<WorkspaceModule[]> {
    const rows = await this.db.workspaceModule.findMany({
      where: { workspaceId },
      orderBy: { moduleId: 'asc' },
    });
    return rows.map(mapWorkspaceModuleRow);
  }

  async upsert(input: {
    workspaceId: WorkspaceId;
    moduleId: ModuleId;
    status: WorkspaceModuleStatus;
  }): Promise<WorkspaceModule> {
    const existing = await this.db.workspaceModule.findUnique({
      where: {
        workspaceId_moduleId: {
          workspaceId: input.workspaceId,
          moduleId: input.moduleId,
        },
      },
    });

    const now = new Date();
    if (existing) {
      const row = await this.db.workspaceModule.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          enabledAt: input.status === 'ENABLED' ? now : existing.enabledAt,
          disabledAt: input.status === 'DISABLED' ? now : null,
        },
      });
      return mapWorkspaceModuleRow(row);
    }

    const id = createId<'WorkspaceModuleId'>('wmod');
    const row = await this.db.workspaceModule.create({
      data: {
        id,
        workspaceId: input.workspaceId,
        moduleId: input.moduleId,
        status: input.status,
        enabledAt: input.status === 'ENABLED' ? now : null,
        disabledAt: input.status === 'DISABLED' ? now : null,
      },
    });
    return mapWorkspaceModuleRow(row);
  }
}

export class UsageEventRepository {
  private readonly db = getPrismaClient();

  async create(input: TrackUsageInput): Promise<UsageEvent> {
    const id = createId<'UsageEventId'>('uevt');
    const row = await this.db.usageEvent.create({
      data: {
        id,
        workspaceId: input.workspaceId,
        metric: input.metric,
        quantity: input.quantity ?? 1,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
    return mapUsageEventRow(row);
  }

  async sumQuantity(
    workspaceId: WorkspaceId,
    metric: UsageMetric,
    since: Date,
  ): Promise<number> {
    const result = await this.db.usageEvent.aggregate({
      where: {
        workspaceId,
        metric,
        createdAt: { gte: since },
      },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
}

export class FeatureFlagOverrideRepository {
  private readonly db = getPrismaClient();

  async listByKey(key: string): Promise<FeatureFlagOverride[]> {
    const rows = await this.db.featureFlagOverride.findMany({
      where: { key },
    });
    return rows.map(mapFeatureFlagOverrideRow);
  }

  async upsert(input: {
    key: string;
    scope: FeatureFlagScope;
    enabled: boolean;
    planId?: PlanId | null;
    workspaceId?: WorkspaceId | null;
    environment?: string | null;
  }): Promise<FeatureFlagOverride> {
    const id = `ffo_${crypto.randomUUID()}`;
    const row = await this.db.featureFlagOverride.create({
      data: {
        id,
        key: input.key,
        scope: input.scope,
        enabled: input.enabled,
        planId: input.planId ?? null,
        workspaceId: input.workspaceId ?? null,
        environment: input.environment ?? null,
      },
    });
    return mapFeatureFlagOverrideRow(row);
  }
}

export class NotificationOutboxRepository {
  private readonly db = getPrismaClient();

  async enqueue(input: {
    type: NotificationPayload['type'];
    channel: NotificationOutboxRecord['channel'];
    payload: NotificationPayload;
    workspaceId?: string | null;
  }): Promise<NotificationOutboxRecord> {
    const id = `nout_${crypto.randomUUID()}`;
    const row = await this.db.notificationOutbox.create({
      data: {
        id,
        type: input.type,
        channel: input.channel,
        payload: JSON.stringify(input.payload),
        status: 'pending',
        workspaceId: input.workspaceId ?? null,
      },
    });
    return mapNotificationOutboxRow(row);
  }

  async markSent(id: string): Promise<NotificationOutboxRecord> {
    const row = await this.db.notificationOutbox.update({
      where: { id },
      data: { status: 'sent', processedAt: new Date(), error: null },
    });
    return mapNotificationOutboxRow(row);
  }

  async markFailed(
    id: string,
    error: string,
  ): Promise<NotificationOutboxRecord> {
    const row = await this.db.notificationOutbox.update({
      where: { id },
      data: { status: 'failed', processedAt: new Date(), error },
    });
    return mapNotificationOutboxRow(row);
  }

  async listPending(limit = 50): Promise<NotificationOutboxRecord[]> {
    const rows = await this.db.notificationOutbox.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(mapNotificationOutboxRow);
  }
}

export class AuditEventRepository {
  private readonly db = getPrismaClient();

  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    const id = createId<'AuditEventId'>('aud');
    const row = await this.db.auditEvent.create({
      data: {
        id,
        workspaceId: input.workspaceId ?? null,
        actorId: input.actorId ?? null,
        targetId: input.targetId ?? null,
        action: input.action,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
    return mapAuditEventRow(row);
  }

  async listByWorkspace(
    workspaceId: WorkspaceId,
    limit = 100,
  ): Promise<AuditEvent[]> {
    const rows = await this.db.auditEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapAuditEventRow);
  }
}
