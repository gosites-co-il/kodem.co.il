import {
  SETUP_JOURNEY_VERSION,
  SETUP_STEPS,
  migrateLegacyStepIndex,
  type AdvanceSetupInput,
  type DiscoveryEventPublisher,
  type DiscoveredBusinessInfo,
  type EarlyDiscoverySource,
  type EarlyDiscoveryState,
  type SetupStateResponse,
  type SetupStepId,
  type Workspace,
  type WorkspaceId,
  type WorkspaceSetupData,
} from '@kodem/contracts';
import {
  BusinessProfileRepository,
  BusinessReportRepository,
  InsightRepository,
  PrismaEventStore,
  RecommendationRepository,
  WorkspaceModuleRepository,
  WorkspaceRepository,
} from '@kodem/database';
import { EVENT_TYPES, KodemEventBus } from '@kodem/events';
import { UsageService } from '@kodem/platform/usage';
import { corporateEmailIdentityHints } from '@kodem/shared/utils';
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

const EARLY_DISCOVERY_SOURCES: readonly Omit<EarlyDiscoverySource, 'status'>[] =
  [
    { id: 'website', label: 'אתר' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'google_business', label: 'Google Business' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'twitter', label: 'X / Twitter' },
  ];

const ASSET_TYPE_TO_EARLY_SOURCE: Record<string, EarlyDiscoverySource['id']> = {
  WEBSITE: 'website',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  GOOGLE_BUSINESS: 'google_business',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
};

function normalizeComparableUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '') || '';
    return `${host}${path}`;
  } catch {
    return url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

function extractHostname(url: string): string | null {
  try {
    let candidate = url.trim();
    if (!candidate) return null;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    return new URL(candidate).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function domainsMatch(a: string, b: string): boolean {
  const hostA = extractHostname(a);
  const hostB = extractHostname(b);
  if (hostA && hostB) return hostA === hostB;
  return normalizeComparableUrl(a) === normalizeComparableUrl(b);
}

function buildEarlyDiscoveryState(websiteUrl: string): EarlyDiscoveryState {
  return {
    startedAt: new Date().toISOString(),
    websiteUrl,
    sources: EARLY_DISCOVERY_SOURCES.map((source) => ({
      ...source,
      status: source.id === 'website' ? 'running' : 'pending',
      ...(source.id === 'website' ? { url: websiteUrl } : {}),
    })),
  };
}

function classifySocialUrlToEarlySource(
  url: string,
): EarlyDiscoverySource['id'] | null {
  const lower = url.toLowerCase();
  if (/(^|\.)facebook\.com\//.test(lower)) return 'facebook';
  if (/(^|\.)instagram\.com\//.test(lower)) return 'instagram';
  if (/(^|\.)tiktok\.com\/@/.test(lower)) return 'tiktok';
  if (/(^|\.)google\.com\/maps|(^|\.)business\.google\.com/.test(lower)) {
    return 'google_business';
  }
  if (/(^|\.)linkedin\.com\/(company|school|showcase)\//.test(lower)) {
    return 'linkedin';
  }
  if (/(^|\.)(?:twitter|x)\.com\//.test(lower)) return 'twitter';
  return null;
}

function patchEarlySource(
  sources: EarlyDiscoverySource[],
  id: EarlyDiscoverySource['id'],
  patch: Partial<Pick<EarlyDiscoverySource, 'status' | 'url'>>,
): EarlyDiscoverySource[] {
  return sources.map((source) =>
    source.id === id ? { ...source, ...patch } : source,
  );
}

function syncEarlyDiscoveryFromSocials(
  early: EarlyDiscoveryState,
  socialProfiles: string[] | undefined,
  discoveryStatus: DiscoveredBusinessInfo['status'] | undefined,
): EarlyDiscoveryState {
  let sources = [...early.sources];

  if (discoveryStatus === 'failed') {
    sources = sources.map((source) =>
      source.status === 'found'
        ? source
        : { ...source, status: 'failed' as const },
    );
    return { ...early, sources };
  }

  const websiteOk =
    discoveryStatus === 'completed' || discoveryStatus === 'partial';
  if (websiteOk) {
    sources = patchEarlySource(sources, 'website', {
      status: 'found',
      url: early.websiteUrl,
    });
  }

  const foundIds = new Set<EarlyDiscoverySource['id']>(
    websiteOk ? ['website'] : [],
  );

  for (const profileUrl of socialProfiles ?? []) {
    const id = classifySocialUrlToEarlySource(profileUrl);
    if (!id) continue;
    foundIds.add(id);
    sources = patchEarlySource(sources, id, {
      status: 'found',
      url: profileUrl,
    });
  }

  if (websiteOk) {
    sources = sources.map((source) =>
      foundIds.has(source.id) || source.status === 'found'
        ? source
        : { ...source, status: 'not_found' as const },
    );
  }

  return { ...early, sources };
}

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

function cleanPeekedBusinessName(html: string): string | null {
  const ogSite = html.match(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const ogSiteAlt = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
  )?.[1];
  const title = html
    .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();

  const raw = (ogSite || ogSiteAlt || title || '').trim();
  if (!raw) return null;

  const cleaned = raw
    .split(/\s[|\-–—:]\s/)[0]
    ?.replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 2 || cleaned.length > 120) return null;
  // Skip generic page titles
  if (/^(home|welcome|index|untitled)$/i.test(cleaned)) return null;
  return cleaned;
}

export class WorkspaceSetupService {
  private readonly workspaceRepo = new WorkspaceRepository();
  private readonly profileRepo = new BusinessProfileRepository();
  private readonly reportRepo = new BusinessReportRepository();
  private readonly insightRepo = new InsightRepository();
  private readonly recommendationRepo = new RecommendationRepository();
  private readonly moduleRepo = new WorkspaceModuleRepository();
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
    const needsJourneyStamp =
      (setup.setupJourneyVersion ?? 1) < SETUP_JOURNEY_VERSION;
    if (needsJourneyStamp) {
      setup.setupJourneyVersion = SETUP_JOURNEY_VERSION;
    }
    if (
      stepIndex !== workspace.onboardingStep ||
      setup.businessApproved !== workspace.setupData?.businessApproved ||
      setup.identityComplete !== workspace.setupData?.identityComplete ||
      needsJourneyStamp
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

    if (input.action === 'go_back') {
      return this.goBack(workspaceId, input.step);
    }

    if (input.action === 'start_over') {
      return this.startOver(workspaceId);
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
      await this.finalizeWorkspaceCreation(workspaceId, nextSetup);
    }

    const patch = this.buildWorkspacePatch(input.step, nextSetup);

    if (input.step === 'business_discovery') {
      this.applyBusinessDetailsToProfile(nextSetup);
    }

    if (input.step === 'connections') {
      nextSetup.modules ??= this.progressService.defaultModules();
      nextSetup.ai ??= this.progressService.defaultAi();
      nextSetup.discoveryFindings ??=
        this.progressService.buildDiscoveryFindings(nextSetup);
    }

    nextSetup.setupJourneyVersion = SETUP_JOURNEY_VERSION;

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
   * Corporate email → default slug + website peek, then kick off full
   * multi-source discovery in the background for stage 2.
   * No-op when identityMode is `manual` (start-over / new workspace).
   */
  async suggestIdentityFromEmail(
    workspaceId: WorkspaceId,
    email: string,
  ): Promise<{
    source: 'corporate_email' | 'none';
    domain?: string;
    slug?: string;
    websiteUrl?: string;
    businessName?: string;
    discoveryStarted?: boolean;
  }> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);
    if (setup.identityMode === 'manual') {
      return { source: 'none' };
    }

    const hints = corporateEmailIdentityHints(email);
    if (!hints) {
      return { source: 'none' };
    }

    const businessName = await this.peekWebsiteBusinessName(hints.websiteUrl);

    const discoveryStarted = await this.startEarlyDiscovery(workspaceId, {
      websiteUrl: hints.websiteUrl,
      businessName: businessName ?? hints.slug,
    });

    return {
      source: 'corporate_email',
      domain: hints.domain,
      slug: hints.slug,
      websiteUrl: hints.websiteUrl,
      businessName: businessName ?? undefined,
      discoveryStarted,
    };
  }

  /**
   * Questionnaire step 1 — workspace name + subdomain slug.
   * Advances past welcome when still on the first step.
   */
  async saveIdentity(
    workspaceId: WorkspaceId,
    input: {
      businessName: string;
      workspaceName: string;
      slug: string;
      websiteUrl?: string;
    },
  ): Promise<SetupStateResponse> {
    const businessName = input.businessName.trim();
    const workspaceName = input.workspaceName.trim();
    const slug = normalizeWorkspaceSlug(input.slug);
    const websiteUrl = input.websiteUrl?.trim();

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
      ...(websiteUrl ? { websiteUrl } : {}),
    };
    setup.identityComplete = true;
    setup.setupJourneyVersion = SETUP_JOURNEY_VERSION;
    // Manual vs email only matters for the welcome screen.
    delete setup.identityMode;

    const nextStep =
      workspace.onboardingStep <= STEP_INDEX.welcome
        ? STEP_INDEX.business_discovery
        : Math.max(workspace.onboardingStep, STEP_INDEX.business_discovery);

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: workspaceName,
      slug,
      ...(websiteUrl ? { websiteUrl } : {}),
      onboardingStatus:
        workspace.onboardingStatus === 'NOT_STARTED'
          ? 'IN_PROGRESS'
          : workspace.onboardingStatus,
      onboardingStep: nextStep,
      setupData: serializeSetup(setup),
    });

    if (websiteUrl) {
      void this.startEarlyDiscovery(workspaceId, {
        websiteUrl,
        businessName,
      });
    }

    return this.getState(workspaceId);
  }

  /** Light HTML peek — og:site_name / title only (no full BI pipeline). */
  private async peekWebsiteBusinessName(
    websiteUrl: string,
  ): Promise<string | null> {
    const candidates = [websiteUrl];
    try {
      const host = new URL(websiteUrl).hostname;
      if (!host.startsWith('www.')) {
        candidates.push(`https://www.${host}`);
      }
    } catch {
      return null;
    }

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(4500),
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'KodemSetupBot/1.0 (+https://kodem.co.il)',
          },
        });
        if (!res.ok) continue;
        const html = await res.text();
        const name = cleanPeekedBusinessName(html);
        if (name) return name;
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  /**
   * Persist website seed + kick off multi-source discovery (website → socials).
   * Idempotent while already running/completed for the same URL.
   */
  private async startEarlyDiscovery(
    workspaceId: WorkspaceId,
    input: { websiteUrl: string; businessName: string },
  ): Promise<boolean> {
    const websiteUrl = input.websiteUrl.trim();
    if (!websiteUrl) return false;

    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);
    const existingUrl = setup.earlyDiscovery?.websiteUrl ?? setup.business?.websiteUrl;
    const alreadyRunning =
      setup.discovered?.status === 'running' &&
      !!existingUrl &&
      domainsMatch(existingUrl, websiteUrl);
    const alreadyDone =
      (setup.discovered?.status === 'completed' ||
        setup.discovered?.status === 'partial') &&
      !!existingUrl &&
      domainsMatch(existingUrl, websiteUrl);

    if (alreadyRunning || alreadyDone) {
      return false;
    }

    setup.business = {
      ...setup.business,
      websiteUrl,
      name: setup.business?.name?.trim() || input.businessName,
    };
    setup.earlyDiscovery = buildEarlyDiscoveryState(websiteUrl);
    setup.discovered = { status: 'running' };

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      websiteUrl,
      setupData: serializeSetup(setup),
    });

    void this.runDiscoveryInBackground(
      workspaceId,
      websiteUrl,
      setup.business.name ?? input.businessName,
    );

    return true;
  }

  /** Wipe workspace setup artifacts and return to a clean identity step. */
  async startOver(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.onboardingStatus === 'COMPLETED') {
      throw new Error('Setup already completed');
    }

    await Promise.all([
      this.profileRepo.deleteByWorkspace(workspaceId),
      this.reportRepo.deleteByWorkspace(workspaceId),
      this.insightRepo.deleteByWorkspace(workspaceId),
      this.recommendationRepo.deleteByWorkspace(workspaceId),
      this.moduleRepo.deleteByWorkspace(workspaceId),
    ]);

    const freshSlug = await this.allocateFreshSlug(workspaceId);
    const setup: WorkspaceSetupData = {
      setupJourneyVersion: SETUP_JOURNEY_VERSION,
      // Same welcome UI as first-run, but no corporate-email peek / early discovery.
      // Reuse this mode when creating an additional workspace.
      identityMode: 'manual',
    };

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      name: 'Workspace',
      slug: freshSlug,
      websiteUrl: null,
      industry: null,
      businessSize: null,
      onboardingStep: STEP_INDEX.welcome,
      onboardingStatus: 'NOT_STARTED',
      status: 'active',
      setupData: serializeSetup(setup),
    });

    await this.eventBus.emit({
      type: EVENT_TYPES.WORKSPACE_UPDATED,
      workspaceId,
      payload: { startOver: true, at: new Date().toISOString() },
    });

    return this.getState(workspaceId);
  }

  private async allocateFreshSlug(workspaceId: WorkspaceId): Promise<string> {
    const base = `ws-${workspaceId.replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase() || 'new'}`;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = normalizeWorkspaceSlug(
        attempt === 0 ? base : `${base}-${attempt}`,
      );
      if (!isValidWorkspaceSlug(candidate)) continue;
      const existing = await this.workspaceRepo.findBySlug(candidate);
      if (!existing || existing.id === workspaceId) {
        return candidate;
      }
    }
    return normalizeWorkspaceSlug(`ws-${Date.now().toString(36)}`);
  }

  /** Return to business discovery and clear incomplete BI results. */
  async restartDiscovery(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    delete setup.businessReport;
    delete setup.discovered;
    delete setup.confirmedProfile;
    delete setup.earlyDiscovery;

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.business_discovery,
      onboardingStatus: 'IN_PROGRESS',
      setupData: serializeSetup(setup),
    });

    return this.getState(workspaceId);
  }

  /**
   * Move backward in the journey.
   * From connections → פרטים (business_discovery), clearing connections and
   * post-approval state so business details can be edited again.
   */
  async goBack(
    workspaceId: WorkspaceId,
    fromStep?: SetupStepId,
  ): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);
    const stepIndex = migrateLegacyStepIndex(workspace.onboardingStep, setup);

    if (fromStep === 'connections') {
      setup.connections = { connected: [], skipped: [] };
      delete setup.modules;
      delete setup.ai;
      delete setup.discoveryFindings;
      delete setup.preparationTasks;
      delete setup.businessApproved;

      // Profile/report were written on understanding approval; remove so
      // getState does not re-mark businessApproved and bounce back to connections.
      await Promise.all([
        this.profileRepo.deleteByWorkspace(workspaceId),
        this.reportRepo.deleteByWorkspace(workspaceId),
      ]);

      await this.workspaceRepo.updateOnboarding(workspaceId, {
        onboardingStep: STEP_INDEX.business_discovery,
        onboardingStatus: 'IN_PROGRESS',
        setupData: serializeSetup(setup),
      });

      return this.getState(workspaceId);
    }

    if (stepIndex <= 0) {
      return this.getState(workspaceId);
    }

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: stepIndex - 1,
      onboardingStatus: 'IN_PROGRESS',
      setupData: serializeSetup(setup),
    });

    return this.getState(workspaceId);
  }

  /**
   * Legacy preparation endpoint — journey no longer has a preparation step.
   * Ensures defaults and moves straight to ready.
   */
  async runPreparation(workspaceId: WorkspaceId): Promise<SetupStateResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const setup = this.mergeSetupData(workspace);

    if (workspace.onboardingStep >= STEP_INDEX.ready) {
      return this.getState(workspaceId);
    }

    setup.modules ??= this.progressService.defaultModules();
    setup.ai ??= this.progressService.defaultAi();
    setup.discoveryFindings ??=
      this.progressService.buildDiscoveryFindings(setup);
    setup.setupJourneyVersion = SETUP_JOURNEY_VERSION;

    await this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStep: STEP_INDEX.ready,
      onboardingStatus: 'IN_PROGRESS',
      setupData: serializeSetup(setup),
    });

    return this.getState(workspaceId);
  }

  /** Worker/API entry — no-op when already past setup; otherwise jump to ready. */
  async processPreparationJob(workspaceId: WorkspaceId): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.onboardingStatus === 'COMPLETED') {
      return;
    }
    if (workspace.onboardingStep >= STEP_INDEX.ready) {
      return;
    }

    await this.runPreparation(workspaceId);
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
    const trimmedUrl = websiteUrl.trim();
    if (!trimmedUrl) {
      return this.getState(workspaceId);
    }

    const existingUrl =
      setup.earlyDiscovery?.websiteUrl ?? setup.business?.websiteUrl;
    const sameDomain =
      !!existingUrl && domainsMatch(existingUrl, trimmedUrl);
    if (
      sameDomain &&
      setup.discovered?.status === 'running' &&
      setup.businessReport?.status === 'running'
    ) {
      // Already in flight (e.g. early discovery from identity step).
      return this.getState(workspaceId);
    }

    const domainChanged = !!existingUrl && !sameDomain;
    const discoveryTargetUrl = trimmedUrl;

    setup.discovered = { status: 'running' };
    setup.business = {
      ...setup.business,
      websiteUrl: trimmedUrl,
      // Prior facts belonged to the email/old domain — start clean.
      ...(domainChanged
        ? { socials: undefined, industry: undefined }
        : {}),
    };
    if (domainChanged) {
      delete setup.confirmedProfile;
    }
    if (!setup.earlyDiscovery || domainChanged) {
      setup.earlyDiscovery = buildEarlyDiscoveryState(trimmedUrl);
    } else {
      setup.earlyDiscovery = {
        ...setup.earlyDiscovery,
        websiteUrl: trimmedUrl,
        sources: patchEarlySource(
          setup.earlyDiscovery.sources,
          'website',
          { status: 'running', url: trimmedUrl },
        ),
      };
    }

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
      websiteUrl: trimmedUrl,
      setupData: serializeSetup(setup),
    });

    try {
      const analysis = await this.discoveryService.discover(
        trimmedUrl,
        setup.business?.name ?? workspace.name,
        workspaceId,
        this.createDiscoveryPublisher(workspaceId, discoveryTargetUrl),
      );

      // Another domain change may have superseded this run while we were away.
      const latestWorkspace = await this.requireWorkspace(workspaceId);
      const latestSetup = this.mergeSetupData(latestWorkspace);
      const currentTarget =
        latestSetup.earlyDiscovery?.websiteUrl ??
        latestSetup.business?.websiteUrl;
      if (!currentTarget || !domainsMatch(currentTarget, discoveryTargetUrl)) {
        return this.getState(workspaceId);
      }

      latestSetup.discovered = analysis.discovered;
      latestSetup.businessReport = analysis.report;
      latestSetup.business = {
        ...latestSetup.business,
        websiteUrl: discoveryTargetUrl,
      };

      if (
        analysis.discovered.businessName?.value &&
        (domainChanged || !latestSetup.business?.name?.trim())
      ) {
        latestSetup.business = {
          ...latestSetup.business,
          name: analysis.discovered.businessName.value,
        };
      }
      if (
        analysis.discovered.industry?.value &&
        (domainChanged || !latestSetup.business?.industry?.trim())
      ) {
        latestSetup.business = {
          ...latestSetup.business,
          industry: analysis.discovered.industry.value,
        };
      }

      latestSetup.confirmedProfile = buildProfileDraftFromReport(
        analysis.report,
        analysis.discovered,
      );

      if (latestSetup.earlyDiscovery) {
        latestSetup.earlyDiscovery = syncEarlyDiscoveryFromSocials(
          {
            ...latestSetup.earlyDiscovery,
            websiteUrl: discoveryTargetUrl,
          },
          analysis.discovered.socialProfiles?.value,
          analysis.discovered.status,
        );
      }

      const updated = await this.workspaceRepo.updateOnboarding(workspaceId, {
        name: latestSetup.business?.name ?? latestWorkspace.name,
        industry: latestSetup.business?.industry ?? null,
        websiteUrl: discoveryTargetUrl,
        setupData: serializeSetup(latestSetup),
      });

      await this.eventBus.emit({
        type: EVENT_TYPES.WORKSPACE_UPDATED,
        workspaceId,
        payload: { websiteUrl: discoveryTargetUrl, discovered: true },
      });

      return {
        ...(await this.getState(workspaceId)),
        workspace: updated,
      };
    } catch {
      const latestWorkspace = await this.requireWorkspace(workspaceId);
      const latestSetup = this.mergeSetupData(latestWorkspace);
      const currentTarget =
        latestSetup.earlyDiscovery?.websiteUrl ??
        latestSetup.business?.websiteUrl;
      if (!currentTarget || !domainsMatch(currentTarget, discoveryTargetUrl)) {
        return this.getState(workspaceId);
      }

      latestSetup.discovered = { status: 'failed' };
      latestSetup.businessReport = {
        ...(latestSetup.businessReport ?? {
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
      latestSetup.confirmedProfile = buildProfileDraftFromSetup(latestSetup);
      if (latestSetup.earlyDiscovery) {
        latestSetup.earlyDiscovery = syncEarlyDiscoveryFromSocials(
          latestSetup.earlyDiscovery,
          undefined,
          'failed',
        );
      }

      const updated = await this.workspaceRepo.updateOnboarding(workspaceId, {
        websiteUrl: discoveryTargetUrl,
        setupData: serializeSetup(latestSetup),
      });

      return {
        ...(await this.getState(workspaceId)),
        workspace: updated,
      };
    }
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
      setupJourneyVersion: setup.setupJourneyVersion ?? SETUP_JOURNEY_VERSION,
      identityMode: setup.identityMode,
      business: setup.business,
      businessApproved: setup.businessApproved,
      identityComplete: setup.identityComplete,
      earlyDiscovery: setup.earlyDiscovery,
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
    targetWebsiteUrl: string,
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

        if (
          event.type === 'asset.discovered' ||
          event.type === 'asset.processed'
        ) {
          const assetStatus =
            event.type === 'asset.processed'
              ? event.payload.asset.status
              : undefined;
          const earlyStatus =
            event.type === 'asset.discovered'
              ? 'running'
              : assetStatus === 'failed'
                ? 'failed'
                : 'found';

          await this.markEarlyDiscoveryAsset(
            workspaceId,
            event.payload.asset.type,
            event.payload.asset.url,
            earlyStatus,
            targetWebsiteUrl,
          );
        }

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

  private async markEarlyDiscoveryAsset(
    workspaceId: WorkspaceId,
    assetType: string,
    url: string,
    status: 'running' | 'found' | 'failed',
    targetWebsiteUrl?: string,
  ): Promise<void> {
    const sourceId = ASSET_TYPE_TO_EARLY_SOURCE[assetType];
    if (!sourceId) return;

    try {
      const workspace = await this.requireWorkspace(workspaceId);
      const setup = this.mergeSetupData(workspace);
      if (!setup.earlyDiscovery) return;

      if (
        targetWebsiteUrl &&
        !domainsMatch(setup.earlyDiscovery.websiteUrl, targetWebsiteUrl)
      ) {
        // Stale publisher from a previous domain — ignore.
        return;
      }

      const current = setup.earlyDiscovery.sources.find((s) => s.id === sourceId);
      if (current?.status === 'found') return;

      setup.earlyDiscovery = {
        ...setup.earlyDiscovery,
        sources: patchEarlySource(setup.earlyDiscovery.sources, sourceId, {
          status,
          url,
        }),
      };

      await this.workspaceRepo.updateOnboarding(workspaceId, {
        setupData: serializeSetup(setup),
      });
    } catch {
      // Progress updates are best-effort
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
      business: {
        ...current.business,
        ...data.business,
        socials: {
          ...current.business?.socials,
          ...data.business?.socials,
        },
      },
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

  /** Persist stage-2 business details onto the profile draft. */
  private applyBusinessDetailsToProfile(setup: WorkspaceSetupData): void {
    const business = setup.business;
    if (!business) return;

    const socialProfiles = Object.values(business.socials ?? {})
      .map((url) => url?.trim())
      .filter((url): url is string => !!url);

    const addresses = business.address?.trim()
      ? [business.address.trim()]
      : (setup.confirmedProfile?.addresses ?? []);

    setup.confirmedProfile = {
      ...(setup.confirmedProfile ?? {
        businessName: business.name ?? '',
        emails: [],
        phones: [],
        addresses: [],
        socialProfiles: [],
        services: [],
        products: [],
        fieldStatus: {},
      }),
      businessName: business.name?.trim() || setup.confirmedProfile?.businessName || '',
      website: business.websiteUrl?.trim() || setup.confirmedProfile?.website,
      addresses,
      socialProfiles,
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
