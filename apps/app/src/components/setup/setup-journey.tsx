'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { SetupStateResponse, SetupStepId } from '@kodem/contracts';
import { resolveSetupStepId } from '@kodem/contracts';
import { api, isApiError } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { SetupShell } from './setup-shell';
import { SetupFrame } from './setup-frame';
import type { SetupStepperStep } from './setup-stepper';
import { IdentityScreen } from './screens/identity-screen';
import { BusinessDiscoveryScreen } from './screens/business-discovery-screen';
import { BusinessUnderstandingScreen } from './screens/business-understanding-screen';
import { WorkspaceCreationScreen } from './screens/workspace-creation-screen';
import { ConnectionsScreen } from './screens/connections-screen';
import { ModulesScreen } from './screens/modules-screen';
import { AiScreen } from './screens/ai-screen';
import { PreparationScreen } from './screens/preparation-screen';
import { ReadyScreen } from './screens/ready-screen';

/** Provisional labels for the horizontal stepper (steps 2+ still evolving). */
const SETUP_STEPPER_STEPS: readonly SetupStepperStep[] = [
  { id: 'welcome', label: 'זהות' },
  { id: 'business_discovery', label: 'גילוי' },
  { id: 'business_understanding', label: 'פרופיל' },
  { id: 'workspace_creation', label: 'סביבה' },
  { id: 'connections', label: 'חיבורים' },
  { id: 'modules', label: 'מודולים' },
  { id: 'ai', label: 'AI' },
  { id: 'preparation', label: 'הכנה' },
  { id: 'ready', label: 'מוכן' },
];

export function SetupJourney() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [state, setState] = useState<SetupStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await api.getSetup();
      setState(next);
      setError(null);
    } catch (err) {
      setError(
        isApiError(err) ? err.message : 'לא ניתן לטעון את ההגדרה.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance(
    step: SetupStepId,
    data?: SetupStateResponse['setup'],
  ) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.advanceSetupStep({ step, data });
      setState(next);
      return next;
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לשמור.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveIdentity(payload: {
    businessName: string;
    workspaceName: string;
    slug: string;
  }) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.saveSetupIdentity(payload);
      setState(next);
      return next;
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לשמור את הזהות.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function restartDiscovery() {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.restartDiscovery();
      setState(next);
      return next;
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לחזור לשלב הקודם.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retryDiscovery(websiteUrl: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.discoverWebsite(websiteUrl);
      setState(next);
      return next;
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : 'הגילוי נכשל. ודאו שה-API פועל (localhost:3333).',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      await api.completeSetup();
      const me = await api.me();
      setSession({
        user: me.user,
        workspace: me.workspace,
        role: me.role,
      });
      router.replace(ROUTES.dashboard);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן להשלים.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function frame(activeStepId: string, children: ReactNode) {
    return (
      <SetupFrame steps={SETUP_STEPPER_STEPS} activeStepId={activeStepId}>
        {children}
      </SetupFrame>
    );
  }

  if (isLoading) {
    return frame(
      'welcome',
      <SetupShell centered>
        <p className="text-center text-sm text-muted-foreground">טוען…</p>
      </SetupShell>,
    );
  }

  if (error && !state) {
    return frame(
      'welcome',
      <SetupShell centered>
        <p className="text-center text-sm text-destructive">{error}</p>
      </SetupShell>,
    );
  }

  if (!state) {
    return frame(
      'welcome',
      <SetupShell centered>
        <p className="text-center text-sm text-muted-foreground">
          לא ניתן לטעון את ההגדרה.
        </p>
      </SetupShell>,
    );
  }

  const step = resolveSetupStepId(state.step);

  const screenProps = {
    state,
    error,
    isSubmitting,
    advance,
    onRefresh: load,
    restartDiscovery,
    retryDiscovery,
  };

  switch (step) {
    case 'welcome':
      return frame(
        'welcome',
        <IdentityScreen
          {...screenProps}
          onIdentitySaved={async (payload) => {
            await saveIdentity(payload);
          }}
        />,
      );
    case 'business_discovery':
      return frame(
        'business_discovery',
        <BusinessDiscoveryScreen {...screenProps} />,
      );
    case 'business_understanding':
      return frame(
        'business_understanding',
        <BusinessUnderstandingScreen {...screenProps} />,
      );
    case 'workspace_creation':
      return frame(
        'workspace_creation',
        <WorkspaceCreationScreen {...screenProps} />,
      );
    case 'connections':
      return frame('connections', <ConnectionsScreen {...screenProps} />);
    case 'modules':
      return frame('modules', <ModulesScreen {...screenProps} />);
    case 'ai':
      return frame('ai', <AiScreen {...screenProps} />);
    case 'preparation':
      return frame('preparation', <PreparationScreen {...screenProps} />);
    case 'ready':
      return frame(
        'ready',
        <ReadyScreen
          {...screenProps}
          onComplete={() => void handleComplete()}
        />,
      );
    default:
      return frame(
        'welcome',
        <SetupShell centered>
          <p className="text-center text-sm text-muted-foreground">
            שלב לא מוכר ({String(state.step)}).{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void load()}
            >
              נסו שוב
            </button>
          </p>
        </SetupShell>,
      );
  }
}

export type SetupScreenProps = {
  state: SetupStateResponse;
  error: string | null;
  isSubmitting: boolean;
  advance: (
    step: SetupStepId,
    data?: SetupStateResponse['setup'],
  ) => Promise<SetupStateResponse | null>;
  onRefresh: () => Promise<void>;
  restartDiscovery: () => Promise<SetupStateResponse | null>;
  retryDiscovery: (websiteUrl: string) => Promise<SetupStateResponse | null>;
};
