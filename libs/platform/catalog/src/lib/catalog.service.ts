import type {
  IntegrationDefinition,
  IntegrationId,
  ModuleId,
  PlanId,
  PlatformModuleDefinition,
} from '@kodem/contracts';
import { PLATFORM_INTEGRATIONS, getIntegrationDefinition } from './integrations';
import { PLATFORM_MODULES, getModuleDefinition } from './modules';

export class CatalogService {
  listModules(): PlatformModuleDefinition[] {
    return [...PLATFORM_MODULES];
  }

  listIntegrations(): IntegrationDefinition[] {
    return [...PLATFORM_INTEGRATIONS];
  }

  getModule(moduleId: ModuleId): PlatformModuleDefinition | undefined {
    return getModuleDefinition(moduleId);
  }

  getIntegration(
    integrationId: IntegrationId,
  ): IntegrationDefinition | undefined {
    return getIntegrationDefinition(integrationId);
  }

  modulesForPlan(planId: PlanId): PlatformModuleDefinition[] {
    return PLATFORM_MODULES.filter((m) =>
      m.commercial.includedIn.includes(planId),
    );
  }

  availableIntegrations(): IntegrationDefinition[] {
    return PLATFORM_INTEGRATIONS.filter((i) => i.status === 'available');
  }
}
