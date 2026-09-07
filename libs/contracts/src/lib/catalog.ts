import type { ModuleId, IntegrationId } from './workspace-setup';
import type { PlanId } from './subscription';

export type ModuleCategory = 'core' | 'growth' | 'marketing' | 'intelligence';

export interface PlatformModuleDefinition {
  id: ModuleId;
  name: string;
  description?: string;
  category: ModuleCategory;
  commercial: {
    includedIn: PlanId[];
  };
  capabilities?: string[];
}

export type IntegrationCatalogStatus =
  | 'available'
  | 'coming_soon'
  | 'disabled';

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  status: IntegrationCatalogStatus;
}

export type WorkspaceModuleStatus = 'ENABLED' | 'DISABLED';

export interface WorkspaceModule {
  id: string;
  workspaceId: string;
  moduleId: ModuleId;
  status: WorkspaceModuleStatus;
  enabledAt?: Date | null;
  disabledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
