import { EventId, WorkspaceId } from './ids';

export type EventType =
  | 'workspace.created'
  | 'workspace.updated'
  | 'lead.created'
  | 'integration.connected'
  | 'task.completed'
  | 'insight.generated'
  | 'recommendation.generated'
  | 'discovery.completed';

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

export interface CreateEventInput<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  type: EventType;
  workspaceId: WorkspaceId;
  payload: TPayload;
}

export interface EventBus {
  emit<TPayload extends Record<string, unknown>>(
    input: CreateEventInput<TPayload>,
  ): Promise<KodemEvent<TPayload>>;
  subscribe(
    type: string,
    handler: (event: KodemEvent) => Promise<void>,
  ): () => void;
}

export interface EventStore {
  save<TPayload extends Record<string, unknown>>(
    event: KodemEvent<TPayload>,
  ): Promise<KodemEvent<TPayload>>;
  findPending(limit?: number): Promise<KodemEvent[]>;
  markProcessing(id: string): Promise<void>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  findByWorkspace(workspaceId: string): Promise<KodemEvent[]>;
}
