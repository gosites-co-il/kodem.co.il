import { KodemEvent, CreateEventInput } from './schema';

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
  save<TPayload>(event: KodemEvent<TPayload>): Promise<KodemEvent<TPayload>>;
  findPending(limit?: number): Promise<KodemEvent[]>;
  markProcessing(id: string): Promise<void>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  findByWorkspace(workspaceId: string): Promise<KodemEvent[]>;
}
