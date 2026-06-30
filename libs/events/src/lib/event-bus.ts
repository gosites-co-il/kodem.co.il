import { createId, EventId } from '@kodem/contracts';
import {
  KodemEvent,
  CreateEventInput,
  EventBus,
  EventStore,
} from '@kodem/contracts';

export class KodemEventBus implements EventBus {
  private handlers = new Map<
    string,
    Array<(event: KodemEvent) => Promise<void>>
  >();

  constructor(private readonly store: EventStore) {}

  async emit<TPayload extends Record<string, unknown>>(
    input: CreateEventInput<TPayload>,
  ): Promise<KodemEvent<TPayload>> {
    const event: KodemEvent<TPayload> = {
      id: createId<'EventId'>('evt'),
      type: input.type,
      workspaceId: input.workspaceId,
      payload: input.payload,
      occurredAt: new Date(),
      immutable: true,
      status: 'pending',
    };

    const saved = await this.store.save(event);
    const handlers = this.handlers.get(input.type) ?? [];
    await Promise.all(handlers.map((h) => h(saved as KodemEvent)));
    return saved;
  }

  subscribe(
    type: string,
    handler: (event: KodemEvent) => Promise<void>,
  ): () => void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
    return () => {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }
}
