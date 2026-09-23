'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SetupStateResponse, SetupStepId } from '@kodem/contracts';
import { resolveSetupStepId } from '@kodem/contracts';
import { api, isApiError } from '../../lib/api';
import { clearToken, getToken } from '../../lib/auth/storage';
import {
  clearGuestClaim,
  readGuestClaim,
  storeGuestClaim,
} from '../../lib/auth/guest-claim';
import { ROUTES } from '../../lib/constants';
import {
  isSetupStartOverPath,
  setupHrefForState,
  setupStartOverHref,
  setupStepHref,
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

function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function SetupJourney() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [state, setState] = useState<SetupStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Bumps on start-over so IdentityScreen remounts even if URL stays /setup/welcome. */
  const [identityEpoch, setIdentityEpoch] = useState(0);
  const loadGeneration = useRef(0);
  const guestBootstrapDone = useRef(false);

  const clearWebsiteUrlQuery = useCallback(() => {
    if (!searchParams.get('websiteUrl')) return;
    router.replace(pathname);
  }, [pathname, router, searchParams]);

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

  // Guest / websiteUrl bootstrap from marketing hero.
  useEffect(() => {
    if (guestBootstrapDone.current) return;
    const rawUrl = searchParams.get('websiteUrl');
    if (!rawUrl?.trim()) {
      void load();
      return;
    }

    guestBootstrapDone.current = true;
    const websiteUrl = normalizeWebsiteUrl(rawUrl);

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (token) {
          try {
            const existing = await api.getSetup();
            if (existing.setup.guest) {
              storeGuestClaim({
                workspaceId: existing.workspace.id,
                claimSecret:
                  readGuestClaim()?.claimSecret ??
                  (await api.getGuestClaimSecret()).claimSecret,
              });
              const next = await api.discoverWebsite(websiteUrl);
              setState(next);
              clearWebsiteUrlQuery();
              return;
            }
            // Logged-in non-guest: seed URL into current incomplete setup.
            if (existing.workspace.onboardingStatus !== 'COMPLETED') {
              const next = await api.discoverWebsite(websiteUrl);
              setState(next);
              clearWebsiteUrlQuery();
              return;
            }
          } catch {
            // Fall through to create a fresh guest session.
          }
        }

        const guest = await api.createGuestSetup(websiteUrl);
        storeGuestClaim({
          workspaceId: guest.workspace.id,
          claimSecret: guest.claimSecret,
        });
        setSession({
          user: guest.user,
          workspace: guest.workspace,
          role: guest.role,
          token: guest.accessToken ?? guest.token,
        });
        setState(guest.setup);
        clearWebsiteUrlQuery();
      } catch (err) {
        setError(
          isApiError(err)
            ? err.message
            : 'לא ניתן להתחיל הגדרה כאורח. נסו שוב.',
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [searchParams, load, clearWebsiteUrlQuery, setSession]);

  // Visiting /setup/start-over ensures a manual identity reset.
  useEffect(() => {
    if (!state || isLoading || isSubmitting) return;
    if (!isSetupStartOverPath(pathname)) return;
    if (state.setup.guest) return;
    // Already past identity — sync will leave start-over; do not wipe again.
    if (state.setup.identityComplete) return;
    if (
      resolveSetupStepId(state.step) === 'welcome' &&
      state.setup.identityMode === 'manual'
    ) {
      return;
    }
    void startOver();
  }, [pathname, state, isLoading, isSubmitting]);

  // Keep the URL in sync with the server-authoritative setup step.
  useEffect(() => {
    if (!state) return;

    const step = resolveSetupStepId(state.step);

    // Guests never see identity / start-over.
    if (state.setup.guest && (step === 'welcome' || isSetupStartOverPath(pathname))) {
      router.replace(setupStepHref('business_discovery'));
      return;
    }

    // While start-over is still resetting into manual welcome, don't yank the URL.
    const awaitingManualWelcome =
      isSetupStartOverPath(pathname) &&
      !state.setup.identityComplete &&
      (step !== 'welcome' || state.setup.identityMode !== 'manual');

    if (awaitingManualWelcome) {
      return;
    }

    const href = setupHrefForState(step, state.setup);
    if (pathname !== href && !searchParams.get('websiteUrl')) {
      router.replace(href);
    }
  }, [state, pathname, router, searchParams]);

  // Guests who somehow land on connections/ready must authenticate first.
  useEffect(() => {
    if (!state?.setup.guest) return;
    const step = resolveSetupStepId(state.step);
    if (step !== 'connections' && step !== 'ready') return;
    void beginGuestAuthHandoff();
  }, [state]);

  async function beginGuestAuthHandoff() {
    try {
      let claim = readGuestClaim();
      if (!claim?.claimSecret) {
        const secret = await api.getGuestClaimSecret();
        claim = secret;
        storeGuestClaim(secret);
      } else {
        storeGuestClaim(claim);
      }
    } catch {
      // Claim cookie may already be set from bootstrap.
    }
    clearToken();
    const next = encodeURIComponent(setupStepHref('connections'));
    window.location.assign(
      `${ROUTES.register}?next=${next}&guestClaim=1`,
    );
  }

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
      if (step === 'business_understanding' && (state?.setup.guest || next.setup.guest)) {
        await beginGuestAuthHandoff();
        return null;
      }
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
    if (state?.setup.guest) return null;
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
      clearGuestClaim();
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

  const isGuest = Boolean(state?.setup.guest);

  function frame(activeStepId: string, children: ReactNode) {
    const brand = SETUP_BRAND_COPY[activeStepId] ?? SETUP_BRAND_COPY.welcome;
    return (
      <SetupFrame
        steps={SETUP_STEPPER_STEPS}
        activeStepId={activeStepId}
        brandTitle={brand.title}
        brandSubtitle={brand.subtitle}
        onStartOver={isGuest ? undefined : () => void startOver()}
        startOverDisabled={isSubmitting || isLoading || isGuest}
        hideWorkspaceSelect={isGuest}
      >
        {children}
      </SetupFrame>
    );
  }

  if (isLoading) {
    return frame(
      'business_discovery',
      <SetupShell centered>
        <p className="text-center text-sm text-muted-foreground">טוען…</p>
      </SetupShell>,
    );
  }

  if (error && !state) {
    return frame(
      'business_discovery',
      <SetupShell centered>
        <p className="text-center text-sm text-destructive">{error}</p>
      </SetupShell>,
    );
  }

  if (!state) {
    return frame(
      'business_discovery',
      <SetupShell centered>
        <p className="text-center text-sm text-muted-foreground">
          לא ניתן לטעון את ההגדרה.
        </p>
      </SetupShell>,
    );
  }

  const step = resolveSetupStepId(state.step);

  // Guests who somehow land on connections/ready must authenticate first.
  if (
    state.setup.guest &&
    (step === 'connections' || step === 'ready')
  ) {
    return frame(
      'business_understanding',
      <SetupShell centered>
        <p className="text-center text-sm text-muted-foreground">
          מעבירים להרשמה…
        </p>
      </SetupShell>,
    );
  }

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
      if (state.setup.guest) {
        return frame(
          'business_discovery',
          <BusinessDiscoveryScreen {...screenProps} />,
        );
      }
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
