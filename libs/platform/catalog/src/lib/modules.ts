import type { ModuleId, PlanId, PlatformModuleDefinition } from '@kodem/contracts';

const ALL_PLANS: PlanId[] = ['free', 'starter', 'growth', 'enterprise'];
const FROM_STARTER: PlanId[] = ['starter', 'growth', 'enterprise'];
const FROM_GROWTH: PlanId[] = ['growth', 'enterprise'];
const ENTERPRISE_ONLY: PlanId[] = ['enterprise'];

export const PLATFORM_MODULES: PlatformModuleDefinition[] = [
  {
    id: 'crm',
    name: 'CRM',
    description: 'Contacts, leads, and pipeline management',
    category: 'core',
    commercial: { includedIn: ALL_PLANS },
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'Business knowledge base and documents',
    category: 'core',
    commercial: { includedIn: ALL_PLANS },
  },
  {
    id: 'insights',
    name: 'Insights',
    description: 'AI-powered business insights',
    category: 'intelligence',
    commercial: { includedIn: ALL_PLANS },
  },
  {
    id: 'digital_card',
    name: 'Digital Card',
    description: 'Shareable digital business card',
    category: 'marketing',
    commercial: { includedIn: ALL_PLANS },
  },
  {
    id: 'campaign_manager',
    name: 'Campaign Manager',
    description: 'Plan and run marketing campaigns',
    category: 'growth',
    commercial: { includedIn: FROM_STARTER },
  },
  {
    id: 'automation',
    name: 'Automation',
    description: 'Workflow automation and rules',
    category: 'growth',
    commercial: { includedIn: FROM_GROWTH },
  },
  {
    id: 'external_ai',
    name: 'External AI',
    description: 'Bring your own AI providers',
    category: 'intelligence',
    commercial: { includedIn: ENTERPRISE_ONLY },
  },
];

export function getModuleDefinition(
  moduleId: ModuleId,
): PlatformModuleDefinition | undefined {
  return PLATFORM_MODULES.find((m) => m.id === moduleId);
}
