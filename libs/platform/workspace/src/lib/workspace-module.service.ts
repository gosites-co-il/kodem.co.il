import {
  ModuleId,
  Workspace,
  WorkspaceId,
  WorkspaceModule,
} from '@kodem/contracts';
import { WorkspaceModuleRepository } from '@kodem/database';
import { EntitlementsService } from '@kodem/platform/subscription';

export class WorkspaceModuleService {
  private readonly moduleRepo = new WorkspaceModuleRepository();
  private readonly entitlements = new EntitlementsService();

  async list(workspaceId: WorkspaceId): Promise<WorkspaceModule[]> {
    return this.moduleRepo.listByWorkspace(workspaceId);
  }

  async isEnabled(
    workspaceId: WorkspaceId,
    moduleId: ModuleId,
  ): Promise<boolean> {
    const modules = await this.moduleRepo.listByWorkspace(workspaceId);
    const row = modules.find((m) => m.moduleId === moduleId);
    return row?.status === 'ENABLED';
  }

  async enable(
    workspaceId: WorkspaceId,
    moduleId: ModuleId,
  ): Promise<WorkspaceModule> {
    return this.moduleRepo.upsert({
      workspaceId,
      moduleId,
      status: 'ENABLED',
    });
  }

  async disable(
    workspaceId: WorkspaceId,
    moduleId: ModuleId,
  ): Promise<WorkspaceModule> {
    return this.moduleRepo.upsert({
      workspaceId,
      moduleId,
      status: 'DISABLED',
    });
  }

  async syncFromSetup(
    workspaceId: WorkspaceId,
    moduleIds: ModuleId[],
  ): Promise<WorkspaceModule[]> {
    const results: WorkspaceModule[] = [];
    for (const moduleId of moduleIds) {
      results.push(await this.enable(workspaceId, moduleId));
    }
    return results;
  }

  async canUseModule(
    workspaceId: WorkspaceId,
    moduleId: ModuleId,
  ): Promise<boolean> {
    const entitled = await this.entitlements.hasModule(workspaceId, moduleId);
    if (!entitled) return false;
    return this.isEnabled(workspaceId, moduleId);
  }

  async migrateFromSetupData(workspace: Workspace): Promise<WorkspaceModule[]> {
    const activated = workspace.setupData?.modules?.activated ?? [];
    if (activated.length === 0) return [];
    return this.syncFromSetup(workspace.id, activated as ModuleId[]);
  }

  async enableDefaultFreeModules(
    workspaceId: WorkspaceId,
  ): Promise<WorkspaceModule[]> {
    const entitlements = await this.entitlements.resolve(workspaceId);
    return this.syncFromSetup(workspaceId, entitlements.modules);
  }
}
