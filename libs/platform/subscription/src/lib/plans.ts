import type {
  ModuleId,
  PlanDefinition,
  PlanId,
  UsageMetric,
} from '@kodem/contracts';

export type { PlanId, PlanDefinition, UsageMetric };

const FREE_MODULES: ModuleId[] = [
  'crm',
  'knowledge',
  'insights',
  'digital_card',
];

const STARTER_MODULES: ModuleId[] = [...FREE_MODULES, 'campaign_manager'];
const GROWTH_MODULES: ModuleId[] = [...STARTER_MODULES, 'automation'];
const ENTERPRISE_MODULES: ModuleId[] = [...GROWTH_MODULES, 'external_ai'];

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    modules: FREE_MODULES,
    limits: {
      members: 2,
      events: 500,
      ai_requests: 100,
      workspaces: 1,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    modules: STARTER_MODULES,
    limits: {
      members: 5,
      events: 5000,
      ai_requests: 1000,
      workspaces: 1,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 149,
    modules: GROWTH_MODULES,
    limits: {
      members: 15,
      events: 50000,
      ai_requests: 10000,
      workspaces: 3,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    modules: ENTERPRISE_MODULES,
    limits: {
      members: null,
      events: null,
      ai_requests: null,
      workspaces: null,
    },
  },
};

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId];
}

export function listPlans(): PlanDefinition[] {
  return Object.values(PLANS);
}
