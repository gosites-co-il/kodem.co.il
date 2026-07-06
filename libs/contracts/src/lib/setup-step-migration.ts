import type { SetupStepId, WorkspaceSetupData } from './workspace-setup';
import { SETUP_STEPS } from './workspace-setup';

const LEGACY_STEP_ALIASES: Record<string, SetupStepId> = {
  business: 'business_discovery',
  discovery: 'ready',
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
 * Map stored onboardingStep index from the legacy 8-step journey
 * to the current 10-step journey when needed.
 */
export function migrateLegacyStepIndex(
  index: number,
  setup: WorkspaceSetupData,
): number {
  const raw = Math.max(0, index);

  if (setup.confirmedProfile?.businessName) {
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
      1: hasOldBusiness ? 2 : 1,
      2: 4,
      3: 5,
      4: 6,
      5: 7,
      6: 8,
      7: 8,
    };
    if (legacyToNew[raw] !== undefined) {
      return legacyToNew[raw];
    }
  }

  return Math.min(raw, SETUP_STEPS.length - 1);
}
