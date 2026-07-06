import type { Workspace } from '@kodem/contracts';
import { ENTRY_ROUTES, requiresOnboarding } from '@kodem/contracts';

export { ENTRY_ROUTES };

/** Re-export from contracts for app convenience. */
export { requiresOnboarding };

export function isAppShellRoute(pathname: string): boolean {
  return (
    pathname.startsWith(ENTRY_ROUTES.dashboard) ||
    pathname.startsWith(ENTRY_ROUTES.setup) ||
    pathname.startsWith(ENTRY_ROUTES.onboarding)
  );
}

export function isEntryPublicRoute(pathname: string): boolean {
  return (
    pathname === ENTRY_ROUTES.login ||
    pathname.startsWith(`${ENTRY_ROUTES.login}/`) ||
    pathname === ENTRY_ROUTES.register ||
    pathname === ENTRY_ROUTES.callback ||
    pathname === ENTRY_ROUTES.terms ||
    pathname === ENTRY_ROUTES.privacy
  );
}

export function guardRouteForWorkspace(
  pathname: string,
  workspace: Workspace | null,
): string | null {
  if (!workspace) return null;

  const needsOnboarding = requiresOnboarding(workspace);
  const onSetup =
    pathname.startsWith(ENTRY_ROUTES.setup) ||
    pathname.startsWith(ENTRY_ROUTES.onboarding);
  const onDashboard = pathname.startsWith(ENTRY_ROUTES.dashboard);

  if (needsOnboarding && onDashboard) {
    return ENTRY_ROUTES.setup;
  }

  if (!needsOnboarding && onSetup) {
    return ENTRY_ROUTES.dashboard;
  }

  return null;
}
