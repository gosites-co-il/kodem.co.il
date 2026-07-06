import { ENTRY_ROUTES } from './entry-routes';
import type {
  EntryContext,
  EntryPhase,
  EntryResolution,
} from './onboarding';
import { resolveWorkspaceRoute } from './onboarding';
import type { Workspace } from './workspace';

/**
 * Central entry-flow state machine.
 * Pure logic — no I/O. Used by API and client.
 */
export class EntryFlowService {
  resolve(context: EntryContext): EntryResolution {
    if (!context.isAuthenticated || !context.user) {
      return this.phase('unauthenticated', ENTRY_ROUTES.login);
    }

    if (context.memberships.length === 0) {
      return {
        phase: 'error',
        route: `${ENTRY_ROUTES.login}?error=no_workspace`,
        error: {
          code: 'NO_WORKSPACE',
          message: 'No workspace found for this account.',
        },
      };
    }

    if (context.memberships.length > 1 && !context.workspaceSelected) {
      return this.phase('workspace_select', ENTRY_ROUTES.workspaceSelect);
    }

    const active = this.resolveActiveWorkspace(context);
    if (!active) {
      return this.phase('workspace_select', ENTRY_ROUTES.workspaceSelect);
    }

    return this.resolveForWorkspace(active);
  }

  resolveForWorkspace(workspace: Workspace): EntryResolution {
    const route = resolveWorkspaceRoute(workspace);

    if (route === ENTRY_ROUTES.dashboard) {
      return {
        phase: 'dashboard',
        route,
        workspace,
      };
    }

    return {
      phase: 'onboarding',
      route,
      workspace,
      onboardingStep: workspace.onboardingStep,
    };
  }

  private resolveActiveWorkspace(
    context: EntryContext,
  ): Workspace | undefined {
    if (context.activeWorkspace) {
      const isMember = context.memberships.some(
        (m) => m.workspace.id === context.activeWorkspace!.id,
      );
      if (isMember) {
        return context.activeWorkspace;
      }
    }

    if (context.memberships.length === 1) {
      return context.memberships[0].workspace;
    }

    return undefined;
  }

  private phase(phase: EntryPhase, route: string): EntryResolution {
    return { phase, route };
  }
}
