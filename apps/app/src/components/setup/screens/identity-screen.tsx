'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api } from '../../../lib/api';
import { SetupPrimaryButton } from '../setup-shell';
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
  }) => Promise<void>;
}) {
  const initialBusiness =
    state.setup.business?.name?.trim() || state.workspace.name || '';
  const [businessName, setBusinessName] = useState(initialBusiness);
  const [workspaceName, setWorkspaceName] = useState(
    state.workspace.name || initialBusiness,
  );
  const [slug, setSlug] = useState(
    state.workspace.slug || suggestSlug(initialBusiness),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [availability, setAvailability] = useState<Availability>({
    status: 'idle',
  });

  useEffect(() => {
    if (!slugTouched) {
      setSlug(suggestSlug(workspaceName || businessName));
    }
  }, [businessName, workspaceName, slugTouched]);

  useEffect(() => {
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
  }, [slug]);

  const canContinue =
    businessName.trim().length > 0 &&
    workspaceName.trim().length > 0 &&
    suggestSlug(slug).length >= 2 &&
    availability.status === 'ready' &&
    availability.available &&
    !isSubmitting;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 space-y-2 text-start">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
          שם העסק וסביבת העבודה
        </h1>
        <p className="text-base text-muted-foreground">
          בחרו שם ברור וכתובת ייחודית לסביבה.
        </p>
      </div>

      <div className="space-y-5 text-start">
        <div className="space-y-2">
          <Label htmlFor="setup-business-name">שם העסק</Label>
          <Input
            id="setup-business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="לדוגמה: סחבק"
            autoComplete="organization"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-workspace-name">שם סביבת העבודה</Label>
          <Input
            id="setup-workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="לדוגמה: סחבק — לקוח"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="setup-slug">כתובת הסביבה</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="setup-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              className="font-mono text-sm"
              dir="ltr"
              disabled={isSubmitting}
              aria-describedby="setup-slug-status"
            />
            <span
              className="shrink-0 text-sm text-muted-foreground"
              dir="ltr"
            >
              {SUBDOMAIN_SUFFIX}
            </span>
          </div>
          <p
            id="setup-slug-status"
            className="flex min-h-5 items-center gap-1.5 text-sm"
            dir="ltr"
          >
            {availability.status === 'checking' ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">בודקים זמינות…</span>
              </>
            ) : null}
            {availability.status === 'ready' && availability.available ? (
              <>
                <Check className="size-3.5 text-secondary" aria-hidden />
                <span className="text-secondary">
                  {availability.hostname} פנוי
                  {!availability.dnsChecked ? ' (מקומי)' : ''}
                </span>
              </>
            ) : null}
            {availability.status === 'ready' && !availability.available ? (
              <>
                <X className="size-3.5 text-destructive" aria-hidden />
                <span className="text-destructive">
                  {availability.reason === 'invalid'
                    ? 'כתובת לא תקינה'
                    : `${availability.hostname} תפוס`}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-auto pt-8">
        <SetupPrimaryButton
          disabled={!canContinue}
          onClick={() =>
            void onIdentitySaved({
              businessName: businessName.trim(),
              workspaceName: workspaceName.trim(),
              slug: suggestSlug(slug),
            })
          }
        >
          {isSubmitting ? 'שומרים…' : 'המשך'}
        </SetupPrimaryButton>
      </div>
    </div>
  );
}
