import { KodemEvent } from '@kodem/contracts';

export function mapEventRowToDomain(row: {
  id: string;
  type: string;
  workspaceId: string;
  payload: string;
  status: string;
  occurredAt: Date;
}): KodemEvent {
  return {
    id: row.id as KodemEvent['id'],
    type: row.type as KodemEvent['type'],
    workspaceId: row.workspaceId as KodemEvent['workspaceId'],
    payload: JSON.parse(row.payload),
    occurredAt: row.occurredAt,
    immutable: true as const,
    status: row.status as KodemEvent['status'],
  };
}

export function mapEventToPersistence<TPayload extends Record<string, unknown>>(
  event: KodemEvent<TPayload>,
) {
  return {
    id: event.id,
    type: event.type,
    workspaceId: event.workspaceId,
    payload: JSON.stringify(event.payload),
    status: event.status ?? 'pending',
    occurredAt: event.occurredAt,
  };
}
