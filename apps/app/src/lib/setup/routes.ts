import { SETUP_STEPS, type SetupStepId, type WorkspaceSetupData } from '@kodem/contracts';
import { ROUTES } from '../constants';

/** Manual identity / start-over entry (same step as welcome, no email peek). */
export const SETUP_START_OVER_SLUG = 'start-over';

export function setupStartOverHref(): string {
  return `${ROUTES.setup}/${SETUP_START_OVER_SLUG}`;
}

/** URL slug for a setup step (`business_discovery` → `business-discovery`). */
export function setupStepToSlug(step: SetupStepId): string {
  return step.replaceAll('_', '-');
}

const LEGACY_SLUGS: Record<string, SetupStepId> = {
  workspace_creation: 'connections',
  modules: 'ready',
  ai: 'ready',
  preparation: 'ready',
  /** Alias — start-over is welcome with identityMode=manual. */
  start_over: 'welcome',
};

/** Parse a setup URL slug back to a step id. */
export function setupSlugToStep(slug: string): SetupStepId | null {
  const normalized = slug.trim().toLowerCase().replaceAll('-', '_');
  if ((SETUP_STEPS as readonly string[]).includes(normalized)) {
    return normalized as SetupStepId;
  }
  return LEGACY_SLUGS[normalized] ?? null;
}

/** Absolute path for a setup step, e.g. `/setup/business-discovery`. */
export function setupStepHref(step: SetupStepId): string {
  return `${ROUTES.setup}/${setupStepToSlug(step)}`;
}

/** Public URL for the current setup state (manual welcome → `/setup/start-over`). */
export function setupHrefForState(step: SetupStepId, setup: WorkspaceSetupData): string {
  if (step === 'welcome' && setup.identityMode === 'manual') {
    return setupStartOverHref();
  }
  return setupStepHref(step);
}

export function isSetupStartOverPath(pathname: string): boolean {
  return (
    pathname === setupStartOverHref() ||
    pathname.endsWith(`/${SETUP_START_OVER_SLUG}`)
  );
}
