export type PlanId = 'free' | 'starter' | 'growth' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  modules: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    modules: ['discovery', 'insights'],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 49,
    modules: ['discovery', 'insights', 'recommendations'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 149,
    modules: ['discovery', 'insights', 'recommendations', 'integrations'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0,
    modules: ['discovery', 'insights', 'recommendations', 'integrations', 'learning'],
  },
};

export interface Entitlements {
  planId: PlanId;
  modules: string[];
  limits: {
    workspaces: number;
    members: number;
    eventsPerMonth: number;
  };
}

export function getEntitlements(planId: PlanId): Entitlements {
  const plan = PLANS[planId];
  const limits = {
    free: { workspaces: 1, members: 2, eventsPerMonth: 500 },
    starter: { workspaces: 1, members: 5, eventsPerMonth: 5000 },
    growth: { workspaces: 3, members: 15, eventsPerMonth: 50000 },
    enterprise: { workspaces: 999, members: 999, eventsPerMonth: 999999 },
  }[planId];

  return { planId, modules: plan.modules, limits };
}

export function hasModule(entitlements: Entitlements, module: string): boolean {
  return entitlements.modules.includes(module);
}
