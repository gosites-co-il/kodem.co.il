import { EventId, WorkspaceId } from '@kodem/core';

export const EVENT_TYPES = {
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  LEAD_CREATED: 'lead.created',
  INTEGRATION_CONNECTED: 'integration.connected',
  TASK_COMPLETED: 'task.completed',
  INSIGHT_GENERATED: 'insight.generated',
  RECOMMENDATION_GENERATED: 'recommendation.generated',
  DISCOVERY_COMPLETED: 'discovery.completed',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface KodemEvent<TPayload = Record<string, unknown>> {
  readonly id: EventId;
  readonly type: EventType;
  readonly workspaceId: WorkspaceId;
  readonly payload: TPayload;
  readonly occurredAt: Date;
  readonly immutable: true;
  status?: EventStatus;
}

export interface CreateEventInput<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  type: EventType;
  workspaceId: WorkspaceId;
  payload: TPayload;
}
