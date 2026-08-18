import {
  SETUP_STEPS,
  migrateLegacyStepIndex,
  type AdvanceSetupInput,
  type DiscoveryEventPublisher,
  type SetupStateResponse,
  type SetupStepId,
  type Workspace,
  type WorkspaceId,
  type WorkspaceSetupData,
} from '@kodem/contracts';
import {
  BusinessProfileRepository,
  BusinessReportRepository,
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
import {
  buildProfileDraftFromReport,
  reportFromDraft,
} from './report-draft.builder';
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
  private readonly reportRepo = new BusinessReportRepository();
  private readonly progressService = new SetupProgressService();
  private readonly discoveryService = new BusinessDiscoveryService();
  private readonly eventBus = new KodemEventBus(new PrismaEventStore());

  async getState(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    const freshDraft = setup.businessReport
      ? buildProfileDraftFromReport(setup.businessReport, setup.discovered)
      : buildProfileDraftFromSetup(setup);
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
    if (input.action === 'restart_discovery') {
      return this.restartDiscovery(workspaceId);
    }

    const workspace = await this.requireWorkspace(workspaceId);
    const currentSetup = this.mergeSetupData(workspace);
    const nextSetup = this.mergeStepData(currentSetup, input);
    const stepIndex = STEP_INDEX[input.step];
    const nextStepIndex = Math.min(stepIndex + 1, SETUP_STEPS.length - 1);

    if (input.step === 'business_understanding') {
      if (input.data?.businessReport) {
        nextSetup.businessReport = {
          ...currentSetup.businessReport,
          ...input.data.businessReport,
        };
      }
      nextSetup.confirmedProfile = mergeConfirmedDraft(
        currentSetup.confirmedProfile ??
          (nextSetup.businessReport
            ? buildProfileDraftFromReport(
                nextSetup.businessReport,
                nextSetup.discovered,
              )
            : buildProfileDraftFromSetup(nextSetup)),
        input.data?.confirmedProfile ??
          (nextSetup.businessReport
            ? buildProfileDraftFromReport(
                nextSetup.businessReport,
                nextSetup.discovered,
              )
            : buildProfileDraftFromSetup(nextSetup)),
      );
      await this.finalizeBusinessFromApproval(workspaceId, nextSetup);
    }

    const patch = this.buildWorkspacePatch(input.step, nextSetup);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      ...patch,
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: nextStepIndex,
      setupData: serializeSetup(nextSetup),
    });

    if (input.step === 'business_discovery' && nextSetup.business?.websiteUrl) {
      void this.runDiscoveryInBackground(
        workspaceId,
        nextSetup.business.websiteUrl,
        nextSetup.business.name ?? workspace.name,
      );
    }

    if (input.step === 'business_discovery' && !nextSetup.business?.websiteUrl) {
      void this.runDiscoveryInBackground(
        workspaceId,
        '',
        nextSetup.business?.name ?? workspace.name,
      );
    }

    if (input.step === 'workspace_creation') {
      await this.finalizeWorkspaceCreation(workspaceId, nextSetup);
    }

    return this.getState(workspaceId);
  }

  /** Return to business discovery and clear incomplete BI results. */
  async restartDiscovery(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    delete setup.businessReport;
    delete setup.discovered;
    delete setup.confirmedProfile;

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.business_discovery,
      onboardingStatus: 'IN_PROGRESS',
      setupData: serializeSetup(setup),
    });

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
    setup.businessReport = {
      workspaceId,
      facts: [],
      understanding: {
        businessSummary: { value: '', confidence: 0, source: 'facts' },
        industry: { value: '', confidence: 0, source: 'facts' },
        businessModel: { value: '', confidence: 0, source: 'facts' },
        targetAudience: { value: '', confidence: 0, source: 'facts' },
        idealCustomer: { value: '', confidence: 0, source: 'facts' },
        mainServices: { value: [], confidence: 0, source: 'facts' },
        products: { value: [], confidence: 0, source: 'facts' },
        uniqueSellingProposition: { value: '', confidence: 0, source: 'facts' },
        competitiveAdvantages: { value: [], confidence: 0, source: 'facts' },
        brandVoice: { value: '', confidence: 0, source: 'facts' },
        keywords: { value: [], confidence: 0, source: 'facts' },
        customerJourney: { value: '', confidence: 0, source: 'facts' },
        marketingChannels: { value: [], confidence: 0, source: 'facts' },
        confidence: 0,
        missingInformation: [],
      },
      recommendations: [],
      questions: [],
      confidence: 0,
      generatedAt: new Date(),
      status: 'running',
    };
    await this.workspaceRepo.updateOnboarding(workspaceId, {
      setupData: serializeSetup(setup),
    });

    try {
      const analysis = await this.discoveryService.discover(
        websiteUrl,
        setup.business?.name ?? workspace.name,
        workspaceId,
        this.createDiscoveryPublisher(workspaceId),
      );
      setup.discovered = analysis.discovered;
      setup.businessReport = analysis.report;

      if (analysis.discovered.businessName?.value && !setup.business?.name) {
        setup.business = {
          ...setup.business,
          name: analysis.discovered.businessName.value,
        };
      }
      if (analysis.discovered.industry?.value && !setup.business?.industry) {
        setup.business = {
          ...setup.business,
          industry: analysis.discovered.industry.value,
        };
      }

      setup.confirmedProfile = buildProfileDraftFromReport(
        analysis.report,
        analysis.discovered,
      );
    } catch {
      setup.discovered = { status: 'failed' };
      setup.businessReport = {
        ...(setup.businessReport ?? {
          workspaceId,
          facts: [],
          understanding: {
            businessSummary: { value: '', confidence: 0, source: 'facts' },
            industry: { value: '', confidence: 0, source: 'facts' },
            businessModel: { value: '', confidence: 0, source: 'facts' },
            targetAudience: { value: '', confidence: 0, source: 'facts' },
            idealCustomer: { value: '', confidence: 0, source: 'facts' },
            mainServices: { value: [], confidence: 0, source: 'facts' },
            products: { value: [], confidence: 0, source: 'facts' },
            uniqueSellingProposition: { value: '', confidence: 0, source: 'facts' },
            competitiveAdvantages: { value: [], confidence: 0, source: 'facts' },
            brandVoice: { value: '', confidence: 0, source: 'facts' },
            keywords: { value: [], confidence: 0, source: 'facts' },
            customerJourney: { value: '', confidence: 0, source: 'facts' },
            marketingChannels: { value: [], confidence: 0, source: 'facts' },
            confidence: 0,
            missingInformation: [],
          },
          recommendations: [],
          questions: [],
          confidence: 0,
          generatedAt: new Date(),
        }),
        status: 'failed',
      };
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

  private async finalizeBusinessFromApproval(
    workspaceId: WorkspaceId,
    setup: WorkspaceSetupData,
  ): Promise<void> {
    const draft =
      setup.confirmedProfile ??
      (setup.businessReport
        ? buildProfileDraftFromReport(setup.businessReport, setup.discovered)
        : buildProfileDraftFromSetup(setup));

    if (!draft.businessName.trim()) {
      throw new Error('Business must be approved before continuing');
    }

    const profile = draftToBusinessProfile(
      workspaceId,
      draft,
      setup.discovered,
    );
    await this.profileRepo.upsert(profile);

    if (setup.businessReport) {
      const report = reportFromDraft({
        ...setup.businessReport,
        approvedAt: new Date(),
      });
      await this.reportRepo.upsert(report);
    }

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: draft.businessName,
      websiteUrl: draft.website ?? null,
      industry: draft.industry ?? null,
    });
  }

  private async finalizeWorkspaceCreation(
    workspaceId: WorkspaceId,
    setup: WorkspaceSetupData,
  ): Promise<void> {
    setup.modules ??= this.progressService.defaultModules();
    setup.ai ??= this.progressService.defaultAi();
    setup.connections ??= { connected: [], skipped: [] };

    const draft =
      setup.confirmedProfile ??
      (setup.businessReport
        ? buildProfileDraftFromReport(setup.businessReport, setup.discovered)
        : buildProfileDraftFromSetup(setup));

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
    businessName: string,
  ): Promise<void> {
    try {
      await this.eventBus.emit({
        type: EVENT_TYPES.DISCOVERY_STARTED,
        workspaceId,
        payload: { websiteUrl, businessName },
      });
      await this.discoverWebsite(workspaceId, websiteUrl);
    } catch {
      // Discovery is best-effort during setup
    }
  }

  private createDiscoveryPublisher(
    workspaceId: WorkspaceId,
  ): DiscoveryEventPublisher {
    return {
      publish: async (event) => {
        const typeMap = {
          'discovery.started': EVENT_TYPES.DISCOVERY_STARTED,
          'asset.discovered': EVENT_TYPES.ASSET_DISCOVERED,
          'asset.processed': EVENT_TYPES.ASSET_PROCESSED,
          'discovery.completed': EVENT_TYPES.DISCOVERY_COMPLETED,
          'business.updated': EVENT_TYPES.BUSINESS_UPDATED,
        } as const;

        await this.eventBus.emit({
          type: typeMap[event.type],
          workspaceId,
          payload: event.payload as unknown as Record<string, unknown>,
        });
      },
    };
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
      businessReport: data.businessReport ?? current.businessReport,
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

    if (step === 'business_understanding' && setup.confirmedProfile) {
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
