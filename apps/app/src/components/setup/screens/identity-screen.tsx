'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import { cn } from '@kodem/design-system/lib/utils';
import { api } from '../../../lib/api';
import { useAuth } from '../../../providers/auth-provider';
import { SetupNavButtons, SetupStartOverButton } from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

const SUBDOMAIN_SUFFIX = '.app.kodem.co.il';

function suggestSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function looksLikeDefaultWorkspaceName(name: string): boolean {
  return /'s Workspace$/i.test(name.trim()) || /Workspace$/i.test(name.trim());
}

type Availability =
  | { status: 'idle' }
  | { status: 'checking' }
  | {
      status: 'ready';
      available: boolean;
      hostname: string;
      reason?: string;
      dnsChecked: boolean;
    };

function IdentityFormSkeleton() {
  return (
    <div className="space-y-5 text-start" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

export function IdentityScreen({
  state,
  isSubmitting,
  error,
  onIdentitySaved,
}: SetupScreenProps & {
  onIdentitySaved: (payload: {
    businessName: string;
    workspaceName: string;
    slug: string;
    websiteUrl?: string;
  }) => Promise<void>;
}) {
  const { user } = useAuth();
  const manualIdentity = state.setup.identityMode === 'manual';
  const initialName = manualIdentity
    ? ''
    : state.setup.business?.name?.trim() || state.workspace.name || '';
  const [workspaceName, setWorkspaceName] = useState(
    manualIdentity ? '' : state.workspace.name || initialName,
  );
  const [slug, setSlug] = useState(
    manualIdentity ? '' : state.workspace.slug || suggestSlug(initialName),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugFromEmail, setSlugFromEmail] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(
    manualIdentity ? '' : state.setup.business?.websiteUrl?.trim() || '',
  );
  const [hintStatus, setHintStatus] = useState<'loading' | 'ready' | 'none'>(
    manualIdentity ? 'none' : 'loading',
  );
  const [availability, setAvailability] = useState<Availability>({
    status: 'idle',
  });
  const hintsLoaded = useRef(manualIdentity);

  useEffect(() => {
    if (hintsLoaded.current) return;
    hintsLoaded.current = true;

    void api
      .suggestSetupIdentity()
      .then((hint) => {
        if (hint.source !== 'corporate_email' || !hint.slug) {
          setHintStatus('none');
          return;
        }

        if (!slugTouched) {
          setSlug(hint.slug);
          setSlugFromEmail(true);
        }

        if (hint.websiteUrl) {
          setWebsiteUrl(hint.websiteUrl);
        }

        if (hint.businessName) {
          setWorkspaceName((current) =>
            !current.trim() || looksLikeDefaultWorkspaceName(current)
              ? hint.businessName!
              : current,
          );
        }

        setHintStatus('ready');
      })
      .catch(() => {
        setHintStatus('none');
      });
  }, [slugTouched]);

  useEffect(() => {
    if (hintStatus === 'loading') return;
    if (!slugTouched && !slugFromEmail) {
      setSlug(suggestSlug(workspaceName));
    }
  }, [workspaceName, slugTouched, slugFromEmail, hintStatus]);

  useEffect(() => {
    if (hintStatus === 'loading') return;

    const normalized = suggestSlug(slug);
    if (!normalized) {
      setAvailability({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setAvailability({ status: 'checking' });
    const timer = setTimeout(() => {
      void api
        .checkSetupSlug(normalized)
        .then((result) => {
          if (cancelled) return;
          setAvailability({
            status: 'ready',
            available: result.available,
            hostname: result.hostname,
            reason: result.reason,
            dnsChecked: result.dnsChecked,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setAvailability({
            status: 'ready',
            available: false,
            hostname: `${normalized}${SUBDOMAIN_SUFFIX}`,
            reason: 'invalid',
            dnsChecked: false,
          });
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, hintStatus]);

  const hintsLoading = hintStatus === 'loading';
  const name = workspaceName.trim();

  const canContinue =
    !hintsLoading &&
    name.length > 0 &&
    suggestSlug(slug).length >= 2 &&
    availability.status === 'ready' &&
    availability.available &&
    !isSubmitting;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 space-y-2 text-start">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-3xl font-extrabold leading-tight tracking-tight">
            סביבת העבודה
          </h1>
          <SetupStartOverButton className="mt-1.5" />
        </div>
        <p className="text-base text-muted-foreground">
          {manualIdentity
            ? 'הזינו שם וכתובת ייחודית לסביבה — בלי הצעות אוטומטיות מהמייל.'
            : 'בחרו שם ברור וכתובת ייחודית לסביבה.'}
        </p>
        {hintsLoading ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            מזהים פרטים מהמייל
            {user?.email ? ` (${user.email})` : ''}…
          </p>
        ) : null}
        {hintStatus === 'ready' && websiteUrl ? (
          <p className="text-sm text-muted-foreground" dir="ltr">
            זוהה דומיין עסקי — {websiteUrl}
          </p>
        ) : null}
      </div>

      {hintsLoading ? (
        <IdentityFormSkeleton />
      ) : (
        <div className="space-y-5 text-start">
          <div className="space-y-2">
            <Label htmlFor="setup-workspace-name">שם סביבת העבודה</Label>
            <Input
              id="setup-workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="לדוגמה: סחבק"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-slug">כתובת הסביבה</Label>
            <div
              dir="ltr"
              className={cn(
                'flex items-stretch overflow-hidden rounded-lg border border-input bg-background',
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              )}
            >
              <Input
                id="setup-slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlugFromEmail(false);
                  setSlug(e.target.value.toLowerCase());
                }}
                className="rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                dir="ltr"
                disabled={isSubmitting}
                aria-describedby="setup-slug-status"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <span
                className="flex shrink-0 items-center border-s border-input bg-muted px-3 font-mono text-sm text-muted-foreground"
                dir="ltr"
              >
                {SUBDOMAIN_SUFFIX}
              </span>
            </div>
            <div id="setup-slug-status" className="min-h-5 space-y-1 text-sm">
              {availability.status === 'checking' ? (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  בודקים זמינות…
                </p>
              ) : null}
              {availability.status === 'ready' && availability.available ? (
                <p className="flex flex-wrap items-center gap-1.5 text-foreground">
                  <Check
                    className="size-3.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>
                    הכתובת{' '}
                    <span
                      className="font-mono font-semibold text-primary"
                      dir="ltr"
                    >
                      {availability.hostname}
                    </span>{' '}
                    פנויה לשימוש
                  </span>
                </p>
              ) : null}
              {availability.status === 'ready' && !availability.available ? (
                <p className="flex flex-wrap items-center gap-1.5 text-destructive">
                  <X className="size-3.5 shrink-0" aria-hidden />
                  {availability.reason === 'invalid' ? (
                    <span>כתובת לא תקינה</span>
                  ) : (
                    <span>
                      הכתובת{' '}
                      <span className="font-mono font-semibold" dir="ltr">
                        {availability.hostname}
                      </span>{' '}
                      תפוסה
                    </span>
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-auto pt-8">
        {hintsLoading ? (
          <Skeleton className="h-11 w-32 rounded-xl" />
        ) : (
          <SetupNavButtons
            className="pt-0"
            showBack={false}
            continueDisabled={!canContinue}
            continueLabel={isSubmitting ? 'שומרים…' : 'המשך'}
            onContinue={() =>
              void onIdentitySaved({
                businessName: name,
                workspaceName: name,
                slug: suggestSlug(slug),
                websiteUrl: websiteUrl.trim() || undefined,
              })
            }
          />
        )}
      </div>
    </div>
  );
}
