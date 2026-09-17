import type { SetupStepId, WorkspaceSetupData } from './workspace-setup';
import { SETUP_JOURNEY_VERSION, SETUP_STEPS } from './workspace-setup';

const BUSINESS_DISCOVERY_INDEX = SETUP_STEPS.indexOf('business_discovery');
const BUSINESS_UNDERSTANDING_INDEX = SETUP_STEPS.indexOf(
  'business_understanding',
);
const CONNECTIONS_INDEX = SETUP_STEPS.indexOf('connections');
const READY_INDEX = SETUP_STEPS.indexOf('ready');

/** Old index of workspace_creation before it was removed (9-step → 8-step). */
const LEGACY_WORKSPACE_CREATION_INDEX = 3;

function hasBusinessReport(setup: WorkspaceSetupData): boolean {
  return Boolean(setup.businessReport);
}

function isDiscoveryRunning(setup: WorkspaceSetupData): boolean {
  return (
    setup.businessReport?.status === 'running' ||
    setup.discovered?.status === 'running'
  );
}

const LEGACY_STEP_ALIASES: Record<string, SetupStepId> = {
  business: 'business_discovery',
  discovery: 'ready',
  business_confirmation: 'business_understanding',
  workspace_creation: 'connections',
  modules: 'ready',
  ai: 'ready',
  preparation: 'ready',
};

/** Normalize API step id (handles legacy step names from older builds). */
export function resolveSetupStepId(step: string | undefined): SetupStepId {
  if (step && (SETUP_STEPS as readonly string[]).includes(step)) {
    return step as SetupStepId;
  }
  if (step && LEGACY_STEP_ALIASES[step]) {
    return LEGACY_STEP_ALIASES[step];
  }
  return 'welcome';
}

/**
 * Remap stored onboardingStep across journey version bumps.
 * v1 (9): … workspace_creation(3), connections(4), modules(5), ai(6), prep(7), ready(8)
 * v2 (8): … connections(3), modules(4), ai(5), prep(6), ready(7)
 * v3 (5): … connections(3), ready(4)
 */
function remapJourneyIndex(raw: number, fromVersion: number): number {
  let index = Math.max(0, raw);

  if (fromVersion < 2) {
    if (index === LEGACY_WORKSPACE_CREATION_INDEX) {
      index = CONNECTIONS_INDEX;
    } else if (index > LEGACY_WORKSPACE_CREATION_INDEX) {
      index -= 1;
    }
  }

  if (fromVersion < 3) {
    // Collapse modules / ai / preparation / ready → ready
    if (index >= 4) {
      index = READY_INDEX;
    }
  }

  return index;
}

/**
 * Map stored onboardingStep index from older journeys to the current one.
 */
export function migrateLegacyStepIndex(
  index: number,
  setup: WorkspaceSetupData,
): number {
  const fromVersion = setup.setupJourneyVersion ?? 1;
  let raw = remapJourneyIndex(Math.max(0, index), fromVersion);

  // Step 1 (identity) is required before any later questionnaire step.
  if (!setup.identityComplete) {
    return 0;
  }

  // Explicit approval flag — skip ahead to connections (post-profile).
  if (setup.businessApproved) {
    return Math.max(raw, CONNECTIONS_INDEX);
  }

  // Understanding requires a report — otherwise stay on (or return to) discovery.
  if (
    raw >= BUSINESS_UNDERSTANDING_INDEX &&
    !hasBusinessReport(setup) &&
    !isDiscoveryRunning(setup)
  ) {
    return BUSINESS_DISCOVERY_INDEX;
  }

  if (hasBusinessReport(setup)) {
    return Math.min(raw, SETUP_STEPS.length - 1);
  }

  const hasOldBusiness = Boolean(
    setup.business?.industry || setup.business?.businessSize,
  );
  const hasConnections =
    (setup.connections?.connected?.length ?? 0) > 0 ||
    (setup.connections?.skipped?.length ?? 0) > 0;

  if (hasOldBusiness || hasConnections) {
    const legacyToNew: Record<number, number> = {
      0: 0,
      1: hasOldBusiness && hasBusinessReport(setup) ? 2 : 1,
      2: CONNECTIONS_INDEX,
      3: CONNECTIONS_INDEX,
      4: READY_INDEX,
      5: READY_INDEX,
      6: READY_INDEX,
      7: READY_INDEX,
    };
    if (legacyToNew[raw] !== undefined) {
      return legacyToNew[raw];
    }
  }

  return Math.min(raw, SETUP_STEPS.length - 1);
}
