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
import { UsageService } from '@kodem/platform/usage';
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

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
const WORKSPACE_SUBDOMAIN_SUFFIX =
  process.env['WORKSPACE_SUBDOMAIN_SUFFIX'] ?? '.app.kodem.co.il';

export function normalizeWorkspaceSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function isValidWorkspaceSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

function workspaceHostname(slug: string): string {
  const suffix = WORKSPACE_SUBDOMAIN_SUFFIX.startsWith('.')
    ? WORKSPACE_SUBDOMAIN_SUFFIX
    : `.${WORKSPACE_SUBDOMAIN_SUFFIX}`;
  return `${slug}${suffix}`;
}

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
  private readonly usage = new UsageService();

  async getState(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    // Recover workspaces that lost businessReport after slim without the flag.
    if (!setup.businessApproved) {
      const profile = await this.profileRepo.findByWorkspace(workspaceId);
      if (profile?.name) {
        setup.businessApproved = true;
        setup.confirmedProfile ??= {
          businessName: profile.name,
          description: profile.description,
          industry: profile.industry,
          website: profile.website,
          emails: profile.emails ?? [],
          phones: profile.phones ?? [],
          addresses: profile.addresses ?? [],
          socialProfiles: profile.socialProfiles ?? [],
          services: profile.services ?? [],
          products: profile.products ?? [],
          fieldStatus: {},
        };
      }
    }

    const freshDraft = setup.businessReport
      ? buildProfileDraftFromReport(setup.businessReport, setup.discovered)
      : buildProfileDraftFromSetup(setup);
    setup.confirmedProfile = setup.confirmedProfile
      ? mergeConfirmedDraft(freshDraft, setup.confirmedProfile)
      : freshDraft;

    const stepIndex = migrateLegacyStepIndex(workspace.onboardingStep, setup);
    if (
      stepIndex !== workspace.onboardingStep ||
      setup.businessApproved !== workspace.setupData?.businessApproved ||
      setup.identityComplete !== workspace.setupData?.identityComplete
    ) {
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        onboardingStep: stepIndex,
        setupData: serializeSetup(setup),
      });
    }

    return {
      step: this.getStepId({ ...workspace, onboardingStep: stepIndex }),
      stepIndex,
      totalSteps: SETUP_STEPS.length,
      workspace: { ...workspace, setupData: setup, onboardingStep: stepIndex },
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

    // Identity (step 1) must be completed before advancing further.
    if (!currentSetup.identityComplete) {
      throw new Error('Complete business identity before continuing');
    }

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
      this.slimAfterBusinessApproval(nextSetup);
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

  async checkSlugAvailability(
    workspaceId: WorkspaceId,
    rawSlug: string,
  ): Promise<{
    slug: string;
    hostname: string;
    available: boolean;
    reason?: 'invalid' | 'taken_db' | 'current';
  }> {
    const slug = normalizeWorkspaceSlug(rawSlug);
    const hostname = workspaceHostname(slug);

    if (!isValidWorkspaceSlug(slug)) {
      return {
        slug,
        hostname,
        available: false,
        reason: 'invalid',
      };
    }

    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.slug === slug) {
      return {
        slug,
        hostname,
        available: true,
        reason: 'current',
      };
    }

    const existing = await this.workspaceRepo.findBySlug(slug);
    if (existing && existing.id !== workspaceId) {
      return {
        slug,
        hostname,
        available: false,
        reason: 'taken_db',
      };
    }

    return {
      slug,
      hostname,
      available: true,
    };
  }

  /**
   * Questionnaire step 1 — business name, workspace name, subdomain slug.
   * Advances past welcome when still on the first step.
   */
  async saveIdentity(
    workspaceId: WorkspaceId,
    input: {
      businessName: string;
      workspaceName: string;
      slug: string;
    },
  ): Promise<SetupStateResponse> {
    const businessName = input.businessName.trim();
    const workspaceName = input.workspaceName.trim();
    const slug = normalizeWorkspaceSlug(input.slug);

    if (!businessName || !workspaceName) {
      throw new Error('Business name and workspace name are required');
    }

    const availability = await this.checkSlugAvailability(workspaceId, slug);
    if (!availability.available) {
      throw new Error(
        availability.reason === 'invalid'
          ? 'Invalid subdomain'
          : `Subdomain unavailable: ${availability.hostname}`,
      );
    }

    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);
    setup.business = {
      ...setup.business,
      name: businessName,
    };
    setup.identityComplete = true;

    const nextStep =
      workspace.onboardingStep <= STEP_INDEX.welcome
        ? STEP_INDEX.business_discovery
        : Math.max(workspace.onboardingStep, STEP_INDEX.business_discovery);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: workspaceName,
      slug,
      onboardingStatus:
        workspace.onboardingStatus === 'NOT_STARTED'
          ? 'IN_PROGRESS'
          : workspace.onboardingStatus,
      onboardingStep: nextStep,
      setupData: serializeSetup(setup),
    });

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

  /**
   * Starts preparation asynchronously via the event bus.
   * Returns immediately; UI should poll GET /workspace/setup.
   */
  async runPreparation(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    if (workspace.onboardingStep >= STEP_INDEX.ready) {
      return this.getState(workspaceId);
    }

    const tasks = setup.preparationTasks ?? [];
    const isRunning = tasks.some((task) => task.status === 'running');
    const allDone =
      tasks.length > 0 && tasks.every((task) => task.status === 'completed');

    if (allDone) {
      setup.discoveryFindings =
        setup.discoveryFindings ??
        this.progressService.buildDiscoveryFindings(setup);
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        onboardingStep: STEP_INDEX.ready,
        setupData: serializeSetup(setup),
      });
      return this.getState(workspaceId);
    }

    if (isRunning) {
      return this.getState(workspaceId);
    }

    setup.preparationTasks = this.progressService.buildPreparationTasks(0);
    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.preparation,
      onboardingStatus: 'IN_PROGRESS',
      setupData: serializeSetup(setup),
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.SETUP_PREPARATION_REQUESTED,
      workspaceId,
      payload: { requestedAt: new Date().toISOString() },
    });

    // Fire-and-forget so local/dev works without waiting on the worker.
    // Worker also handles the event; processPreparationJob is idempotent.
    void this.processPreparationJob(workspaceId).catch(() => {
      /* logged via failed preparation state if needed */
    });

    return this.getState(workspaceId);
  }

  /** Worker/API entry — advances preparation tasks and moves to ready. */
  async processPreparationJob(workspaceId: WorkspaceId): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.onboardingStatus === 'COMPLETED') {
      return;
    }
    if (workspace.onboardingStep >= STEP_INDEX.ready) {
      return;
    }

    const setup = this.mergeSetupData(workspace);
    const completedCount =
      setup.preparationTasks?.filter((task) => task.status === 'completed')
        .length ?? 0;

    // Another runner already progressed past kickoff.
    if (completedCount > 0) {
      return;
    }

    for (let i = 0; i <= 6; i++) {
      setup.preparationTasks = this.progressService.buildPreparationTasks(i + 1);
      await this.workspaceRepo.updateOnboarding(workspaceId, {
        setupData: serializeSetup(setup),
        onboardingStep: STEP_INDEX.preparation,
      });
      await this.delay(300);
    }

    setup.discoveryFindings = this.progressService.buildDiscoveryFindings(setup);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.ready,
      setupData: serializeSetup(setup),
    });
  }

  async complete(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.onboardingStatus === 'COMPLETED') {
      return this.getState(workspaceId);
    }

    const setup = this.slimJourneyPrefs(this.mergeSetupData(workspace));

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

  private slimAfterBusinessApproval(setup: WorkspaceSetupData): void {
    setup.businessApproved = true;
    delete setup.businessReport;
    if (setup.discovered) {
      setup.discovered = { status: setup.discovered.status ?? 'completed' };
    }
  }

  /** Keep journey prefs only — business truth lives in Profile/Report. */
  private slimJourneyPrefs(setup: WorkspaceSetupData): WorkspaceSetupData {
    return {
      business: setup.business,
      businessApproved: setup.businessApproved,
      identityComplete: setup.identityComplete,
      confirmedProfile: setup.confirmedProfile,
      discovered: setup.discovered
        ? { status: setup.discovered.status }
        : undefined,
      connections: setup.connections,
      modules: setup.modules,
      ai: setup.ai,
      preparationTasks: setup.preparationTasks,
      discoveryFindings: setup.discoveryFindings,
    };
  }

  private async finalizeWorkspaceCreation(
    workspaceId: WorkspaceId,
    setup: WorkspaceSetupData,
  ): Promise<void> {
    const modules: NonNullable<WorkspaceSetupData['modules']> =
      setup.modules ?? this.progressService.defaultModules();
    setup.modules = modules;
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

    const activated = modules.activated ?? [];
    if (activated.length > 0) {
      const { WorkspaceModuleService } = await import(
        './workspace-module.service'
      );
      await new WorkspaceModuleService().syncFromSetup(workspaceId, activated);
    }

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

        if (event.type === 'discovery.completed') {
          await this.usage.assertAndTrack({
            workspaceId,
            metric: 'events',
            quantity: 1,
            metadata: { source: 'discovery.completed' },
          });
        }
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
