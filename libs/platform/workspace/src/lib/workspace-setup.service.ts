import {
  SETUP_STEPS,
  migrateLegacyStepIndex,
  type AdvanceSetupInput,
  type SetupStateResponse,
  type SetupStepId,
  type Workspace,
  type WorkspaceId,
  type WorkspaceSetupData,
} from '@kodem/contracts';
import {
  BusinessProfileRepository,
  PrismaEventStore,
  WorkspaceRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import { BusinessDiscoveryService } from './business-discovery.service';
import {
  buildProfileDraftFromSetup,
  draftToBusinessProfile,
  mergeConfirmedDraft,
} from './profile-draft.builder';
import { SetupProgressService } from './setup-progress.service';

const STEP_INDEX: Record<SetupStepId, number> = Object.fromEntries(
  SETUP_STEPS.map((step, index) => [step, index]),
) as Record<SetupStepId, number>;

function serializeSetup(data: WorkspaceSetupData | undefined): string | null {
  if (!data || Object.keys(data).length === 0) return null;
  return JSON.stringify(data);
}

export class WorkspaceSetupService {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly profileRepo = new BusinessProfileRepository();
  private readonly progressService = new SetupProgressService();
  private readonly discoveryService = new BusinessDiscoveryService();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  async getState(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    const freshDraft = buildProfileDraftFromSetup(setup);
    setup.confirmedProfile = setup.confirmedProfile
      ? mergeConfirmedDraft(freshDraft, setup.confirmedProfile)
      : freshDraft;

    const stepIndex = migrateLegacyStepIndex(workspace.onboardingStep, setup);
    if (stepIndex !== workspace.onboardingStep) {
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        onboardingStep: stepIndex,
      });
    }

    return {
      step: this.getStepId({ ...workspace, onboardingStep: stepIndex }),
      stepIndex,
      totalSteps: SETUP_STEPS.length,
      workspace: { ...workspace, setupData: setup },
      setup,
    };
  }

  async advanceStep(
    workspaceId: WorkspaceId,
    input: AdvanceSetupInput,
  ): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const currentSetup = this.mergeSetupData(workspace);
    const nextSetup = this.mergeStepData(currentSetup, input);
    const stepIndex = STEP_INDEX[input.step];
    const nextStepIndex = Math.min(stepIndex + 1, SETUP_STEPS.length - 1);

    if (input.step === 'business_confirmation') {
      nextSetup.confirmedProfile = mergeConfirmedDraft(
        currentSetup.confirmedProfile ?? buildProfileDraftFromSetup(nextSetup),
        input.data?.confirmedProfile ??
          buildProfileDraftFromSetup(nextSetup),
      );
    }

    const patch = this.buildWorkspacePatch(input.step, nextSetup);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      ...patch,
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: nextStepIndex,
      setupData: serializeSetup(nextSetup),
    });

    if (input.step === 'business_discovery' && nextSetup.business?.websiteUrl) {
      void this.runDiscoveryInBackground(workspaceId, nextSetup.business.websiteUrl);
    }

    if (input.step === 'business_discovery' && !nextSetup.business?.websiteUrl) {
      nextSetup.discovered = { status: 'idle' };
      nextSetup.confirmedProfile = buildProfileDraftFromSetup(nextSetup);
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        setupData: serializeSetup(nextSetup),
      });
    }

    if (input.step === 'workspace_creation') {
      await this.finalizeWorkspaceCreation(workspaceId, nextSetup);
    }

    return this.getState(workspaceId);
  }

  async runPreparation(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    for (let i = 0; i <= 6; i++) {
      setup.preparationTasks = this.progressService.buildPreparationTasks(i + 1);
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        setupData: serializeSetup(setup),
        onboardingStep: STEP_INDEX.preparation,
      });
      await this.delay(400);
    }

    setup.discoveryFindings = this.progressService.buildDiscoveryFindings(setup);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.ready,
      setupData: serializeSetup(setup),
    });

    return this.getState(workspaceId);
  }

  async complete(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStatus: 'COMPLETED',
      onboardingStep: SETUP_STEPS.length - 1,
      status: 'active',
      setupData: serializeSetup(setup),
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.DISCOVERY_COMPLETED,
      workspaceId,
      payload: { completedAt: new Date().toISOString() },
    });

    return this.getState(workspaceId);
  }

  async discoverWebsite(
    workspaceId: WorkspaceId,
    websiteUrl: string,
  ): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    setup.discovered = { status: 'running' };
    await this.workspaceRepo.updateOnboarding(workspaceId, {
      setupData: serializeSetup(setup),
    });

    try {
      const discovered = await this.discoveryService.discover(websiteUrl);
      setup.discovered = discovered;

      if (discovered.businessName?.value && !setup.business?.name) {
        setup.business = {
          ...setup.business,
          name: discovered.businessName.value,
        };
      }
      if (discovered.industry?.value && !setup.business?.industry) {
        setup.business = {
          ...setup.business,
          industry: discovered.industry.value,
        };
      }

      setup.confirmedProfile = buildProfileDraftFromSetup(setup);
    } catch {
      setup.discovered = { status: 'failed' };
      setup.confirmedProfile = buildProfileDraftFromSetup(setup);
    }

    const updated = await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: setup.business?.name ?? workspace.name,
      industry: setup.business?.industry ?? workspace.industry ?? null,
      websiteUrl: websiteUrl.trim() || workspace.websiteUrl || null,
      setupData: serializeSetup(setup),
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.WORKSPACE_UPDATED,
      workspaceId,
      payload: { websiteUrl, discovered: true },
    });

    return {
      ...(await this.getState(workspaceId)),
      workspace: updated,
    };
  }

  getStepId(workspace: Workspace): SetupStepId {
    const setup = this.mergeSetupData(workspace);
    const index = migrateLegacyStepIndex(
      workspace.onboardingStep,
      setup,
    );
    return SETUP_STEPS[Math.max(0, Math.min(index, SETUP_STEPS.length - 1))];
  }

  private async finalizeWorkspaceCreation(
    workspaceId: WorkspaceId,
    setup: WorkspaceSetupData,
  ): Promise<void> {
    const draft =
      setup.confirmedProfile ?? buildProfileDraftFromSetup(setup);

    if (!draft.businessName.trim()) {
      throw new Error('Business profile must be confirmed before workspace creation');
    }

    const profile = draftToBusinessProfile(
      workspaceId,
      draft,
      setup.discovered,
    );
    await this.profileRepo.upsert(profile);

    setup.modules ??= this.progressService.defaultModules();
    setup.ai ??= this.progressService.defaultAi();
    setup.connections ??= { connected: [], skipped: [] };

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: draft.businessName,
      websiteUrl: draft.website ?? null,
      industry: draft.industry ?? null,
      setupData: serializeSetup(setup),
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.WORKSPACE_CREATED,
      workspaceId,
      payload: {
        name: draft.businessName,
        websiteUrl: draft.website,
        industry: draft.industry,
        profileCreated: true,
      },
    });
  }

  private async runDiscoveryInBackground(
    workspaceId: WorkspaceId,
    websiteUrl: string,
  ): Promise<void> {
    try {
      await this.discoverWebsite(workspaceId, websiteUrl);
      await this.eventBus.emit({
        type: 'discovery.started' as never,
        workspaceId,
        payload: { websiteUrl },
      });
    } catch {
      // Discovery is best-effort during setup
    }
  }

  private mergeSetupData(workspace: Workspace): WorkspaceSetupData {
    return {
      modules: this.progressService.defaultModules(),
      ai: this.progressService.defaultAi(),
      connections: { connected: [], skipped: [] },
      ...workspace.setupData,
      business: {
        name: workspace.name,
        websiteUrl: workspace.websiteUrl,
        industry: workspace.industry,
        businessSize: workspace.businessSize,
        ...workspace.setupData?.business,
      },
    };
  }

  private mergeStepData(
    current: WorkspaceSetupData,
    input: AdvanceSetupInput,
  ): WorkspaceSetupData {
    const data = input.data ?? {};
    return {
      ...current,
      ...data,
      business: { ...current.business, ...data.business },
      connections: {
        ...current.connections,
        ...data.connections,
      } as WorkspaceSetupData['connections'],
      modules: data.modules ?? current.modules,
      ai: data.ai ?? current.ai,
      discovered: data.discovered ?? current.discovered,
      confirmedProfile: data.confirmedProfile ?? current.confirmedProfile,
    };
  }

  private buildWorkspacePatch(
    step: SetupStepId,
    setup: WorkspaceSetupData,
  ): Partial<{
    name: string;
    websiteUrl: string | null;
    industry: string | null;
    businessSize: string | null;
  }> {
    if (step === 'business_discovery' && setup.business) {
      return {
        name: setup.business.name?.trim() || undefined,
        websiteUrl: setup.business.websiteUrl?.trim() || null,
      };
    }

    if (step === 'business_confirmation' && setup.confirmedProfile) {
      return {
        name: setup.confirmedProfile.businessName.trim() || undefined,
        websiteUrl: setup.confirmedProfile.website?.trim() || null,
        industry: setup.confirmedProfile.industry || null,
      };
    }

    return {};
  }

  private async requireWorkspace(workspaceId: WorkspaceId): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');
    return workspace;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
