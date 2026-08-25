import type { Workspace } from '@kodem/contracts';
import { ENTRY_ROUTES, resolveWorkspaceRoute } from '@kodem/contracts';

export { ENTRY_ROUTES, requiresOnboarding } from '@kodem/contracts';

function isSetupPath(pathname: string): boolean {
  return (
    pathname.startsWith(ENTRY_ROUTES.setup) ||
    pathname.startsWith(ENTRY_ROUTES.onboarding)
  );
}

/**
 * Enforce setup ↔ dashboard using the same destination helper as EntryFlowService.
 * Returns a redirect path, or null when the current route is allowed.
 */
export function guardRouteForWorkspace(
  pathname: string,
  workspace: Workspace | null,
): string | null {
  if (!workspace) return null;

  const destination = resolveWorkspaceRoute(workspace);
  const onSetup = isSetupPath(pathname);
  const onDashboard = pathname.startsWith(ENTRY_ROUTES.dashboard);

  if (destination === ENTRY_ROUTES.setup && onDashboard) {
    return ENTRY_ROUTES.setup;
  }

  if (destination === ENTRY_ROUTES.dashboard && onSetup) {
    return ENTRY_ROUTES.dashboard;
  }

  return null;
}
