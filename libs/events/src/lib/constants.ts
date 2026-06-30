import { EventType } from '@kodem/contracts';

export const EVENT_TYPES = {
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  LEAD_CREATED: 'lead.created',
  INTEGRATION_CONNECTED: 'integration.connected',
  TASK_COMPLETED: 'task.completed',
  INSIGHT_GENERATED: 'insight.generated',
  RECOMMENDATION_GENERATED: 'recommendation.generated',
  DISCOVERY_COMPLETED: 'discovery.completed',
} as const satisfies Record<string, EventType>;
