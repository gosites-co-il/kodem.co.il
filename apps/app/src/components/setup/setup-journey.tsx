'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SetupStateResponse, SetupStepId } from '@kodem/contracts';
import { resolveSetupStepId } from '@kodem/contracts';
import { api, isApiError } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import {
  isSetupStartOverPath,
  setupHrefForState,
  setupStartOverHref,
} from '../../lib/setup/routes';
import { useAuth } from '../../providers/auth-provider';
import { SetupShell } from './setup-shell';
import { SetupFrame } from './setup-frame';
import type { SetupStepperStep } from './setup-stepper';
import { IdentityScreen } from './screens/identity-screen';
import { BusinessDiscoveryScreen } from './screens/business-discovery-screen';
import { BusinessUnderstandingScreen } from './screens/business-understanding-screen';
import { ConnectionsScreen } from './screens/connections-screen';
import { ReadyScreen } from './screens/ready-screen';

/** Provisional labels for the horizontal stepper. */
const SETUP_STEPPER_STEPS: readonly SetupStepperStep[] = [
  { id: 'welcome', label: 'זהות' },
  { id: 'business_discovery', label: 'פרטים' },
  { id: 'business_understanding', label: 'פרופיל' },
  { id: 'connections', label: 'חיבורים' },
  { id: 'ready', label: 'מתחילים לעבוד' },
];

/** Brand panel copy per setup step (right/start panel). */
const SETUP_BRAND_COPY: Record<
  string,
  { title: string; subtitle: string }
> = {
  welcome: {
    title: 'בונים את סביבת העבודה',
    subtitle: 'שם הסביבה וכתובת ייחודית — ואפשר להמשיך.',
  },
  business_discovery: {
    title: 'מזהים את העסק',
    subtitle: 'סורקים את האתר והנוכחות הדיגיטלית — וממלאים את הפרטים בשבילכם.',
  },
  business_understanding: {
    title: 'מבינים את העסק',
    subtitle: 'מרכיבים תמונה ברורה מהמידע שנאסף — לבדיקה ולאישור שלכם.',
  },
  connections: {
    title: 'מחברים כלים',
    subtitle: 'חברו מערכות שכבר עובדים איתן — או דלגו והמשיכו.',
  },
  ready: {
    title: 'מתחילים לעבוד',
    subtitle: 'מסיימים לחשב ומיד אפשר להיכנס לסביבת העבודה.',
  },
};

export function SetupJourney() {
  const router = useRouter();
  const pathname = usePathname();
  const { setSession } = useAuth();
  const [state, setState] = useState<SetupStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Bumps on start-over so IdentityScreen remounts even if URL stays /setup/welcome. */
  const [identityEpoch, setIdentityEpoch] = useState(0);
  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    try {
      const next = await api.getSetup();
      if (generation !== loadGeneration.current) return;
      setState(next);
      setError(null);
    } catch (err) {
      if (generation !== loadGeneration.current) return;
      setError(
        isApiError(err) ? err.message : 'לא ניתן לטעון את ההגדרה.',
      );
    } finally {
      if (generation === loadGeneration.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Visiting /setup/start-over ensures a manual identity reset.
  useEffect(() => {
    if (!state || isLoading || isSubmitting) return;
    if (!isSetupStartOverPath(pathname)) return;
    // Already past identity — sync will leave start-over; do not wipe again.
    if (state.setup.identityComplete) return;
    if (
      resolveSetupStepId(state.step) === 'welcome' &&
      state.setup.identityMode === 'manual'
    ) {
      return;
    }
    void startOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startOver closes over latest setters
  }, [pathname, state, isLoading, isSubmitting]);

  // Keep the URL in sync with the server-authoritative setup step.
  useEffect(() => {
    if (!state) return;

    const step = resolveSetupStepId(state.step);
    // While start-over is still resetting into manual welcome, don't yank the URL.
    const awaitingManualWelcome =
      isSetupStartOverPath(pathname) &&
      !state.setup.identityComplete &&
      (step !== 'welcome' || state.setup.identityMode !== 'manual');

    if (awaitingManualWelcome) {
      return;
    }

    const href = setupHrefForState(step, state.setup);
    if (pathname !== href) {
      router.replace(href);
    }
  }, [state, pathname, router]);

  function applyState(next: SetupStateResponse | null) {
    if (!next) return null;
    setState(next);
    router.replace(
      setupHrefForState(resolveSetupStepId(next.step), next.setup),
    );
    return next;
  }

  async function advance(
    step: SetupStepId,
    data?: SetupStateResponse['setup'],
  ) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.advanceSetupStep({ step, data });
      return applyState(next);
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
    websiteUrl?: string;
  }) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.saveSetupIdentity(payload);
      return applyState(next);
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
      return applyState(next);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לחזור לשלב הקודם.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goBack(fromStep: SetupStepId) {
    setIsSubmitting(true);
    setError(null);
    try {
      const next = await api.goBackSetup(fromStep);
      return applyState(next);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן לחזור אחורה.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startOver() {
    setIsSubmitting(true);
    setError(null);
    // Drop any in-flight getSetup() so it cannot overwrite the reset.
    loadGeneration.current += 1;
    try {
      const next = await api.startOverSetup();
      try {
        const me = await api.me();
        setSession({
          user: me.user,
          workspace: me.workspace,
          role: me.role,
        });
      } catch {
        // Session refresh is best-effort; setup state still applies.
      }
      if (!next) return null;
      setIdentityEpoch((n) => n + 1);
      setState(next);
      router.replace(setupStartOverHref());
      return next;
    } catch (err) {
      setError(isApiError(err) ? err.message : 'לא ניתן להתחיל מחדש.');
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
      return applyState(next);
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
    const brand = SETUP_BRAND_COPY[activeStepId] ?? SETUP_BRAND_COPY.welcome;
    return (
      <SetupFrame
        steps={SETUP_STEPPER_STEPS}
        activeStepId={activeStepId}
        brandTitle={brand.title}
        brandSubtitle={brand.subtitle}
        onStartOver={() => void startOver()}
        startOverDisabled={isSubmitting || isLoading}
      >
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
    goBack,
  };

  switch (step) {
    case 'welcome':
      return frame(
        'welcome',
        <IdentityScreen
          key={`identity-${state.workspace.id}-${identityEpoch}-${state.setup.identityMode ?? 'email'}-${state.workspace.slug}`}
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
    case 'connections':
      return frame('connections', <ConnectionsScreen {...screenProps} />);
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
  goBack: (fromStep: SetupStepId) => Promise<SetupStateResponse | null>;
};
