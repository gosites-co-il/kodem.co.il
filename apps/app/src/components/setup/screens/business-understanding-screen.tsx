'use client';

import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react';
import Image from 'next/image';
import { Check, Globe, Loader2 } from 'lucide-react';
import { Progress } from '@kodem/design-system/components/ui/progress';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import type {
  BusinessProfileDraft,
  BusinessReportDraft,
  DiscoveredBusinessInfo,
  EarlyDiscoverySource,
  EarlyDiscoverySourceId,
  SetupSocialChannel,
} from '@kodem/contracts';
import { cn } from '@kodem/design-system/lib/utils';
import {
  SetupNavButtons,
  SetupSecondaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';
import { SOCIAL_ICONS } from '../social-icons';

const SOCIAL_LABELS: Record<SetupSocialChannel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google_business: 'Google Business',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
};

const SOURCE_ICONS: Record<
  EarlyDiscoverySourceId,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  website: Globe,
  ...SOCIAL_ICONS,
};

function isSourceActive(status: EarlyDiscoverySource['status']): boolean {
  return status === 'pending' || status === 'running';
}

function isSourceDone(status: EarlyDiscoverySource['status']): boolean {
  return status === 'found' || status === 'not_found' || status === 'failed';
}

function isDiscoveryRunning(
  report?: BusinessReportDraft,
  discovered?: DiscoveredBusinessInfo,
  sources: EarlyDiscoverySource[] = [],
): boolean {
  return (
    report?.status === 'running' ||
    discovered?.status === 'running' ||
    sources.some((s) => isSourceActive(s.status))
  );
}

function isDiscoveryFailed(
  report?: BusinessReportDraft,
  discovered?: DiscoveredBusinessInfo,
): boolean {
  return report?.status === 'failed' || discovered?.status === 'failed';
}

function classifySocialUrl(url: string): SetupSocialChannel | null {
  const lower = url.toLowerCase();
  if (/(^|\.)facebook\.com\//.test(lower)) return 'facebook';
  if (/(^|\.)instagram\.com\//.test(lower)) return 'instagram';
  if (/(^|\.)tiktok\.com\/@/.test(lower)) return 'tiktok';
  if (/(^|\.)google\.com\/maps|(^|\.)business\.google\.com/.test(lower)) {
    return 'google_business';
  }
  if (/(^|\.)linkedin\.com\/(company|school|showcase)\//.test(lower)) {
    return 'linkedin';
  }
  if (/(^|\.)(?:twitter|x)\.com\//.test(lower)) return 'twitter';
  return null;
}

/** Drop tracking / system mailboxes from the compact preview. */
function isDisplayEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return !lower.includes('sentry') && !lower.endsWith('.wixpress.com');
}

function computeProgress(
  sources: EarlyDiscoverySource[],
  discovered?: DiscoveredBusinessInfo,
  report?: BusinessReportDraft,
): { value: number; label: string } {
  const total = Math.max(sources.length, 1);
  const done = sources.filter((s) => isSourceDone(s.status)).length;
  const runningSource = sources.find((s) => s.status === 'running');

  let value = Math.round((done / total) * 70);
  if (discovered?.status === 'running') value = Math.max(value, 45);
  if (discovered?.status === 'completed' || discovered?.status === 'partial') {
    value = Math.max(value, 78);
  }
  if (report?.status === 'running') value = Math.max(value, 88);
  if (report?.status === 'completed' || report?.status === 'partial') {
    value = 100;
  }
  value = Math.min(100, value);

  let label = 'סורקים מקורות…';
  if (runningSource) {
    label =
      runningSource.id === 'website'
        ? 'סורקים את האתר…'
        : `בודקים את ${runningSource.label}…`;
  } else if (discovered?.status === 'running' || report?.status === 'running') {
    label = 'מנתחים את המידע…';
  } else if (done > 0) {
    label = `${done}/${total} מקורות`;
  }

  return { value, label };
}

export function BusinessUnderstandingScreen({
  state,
  advance,
  isSubmitting,
  error,
  onRefresh,
  restartDiscovery,
  retryDiscovery,
  goBack,
}: SetupScreenProps) {
  const report = state.setup.businessReport;
  const discovered = state.setup.discovered;
  const early = state.setup.earlyDiscovery;
  const business = state.setup.business;
  const sources = early?.sources ?? [];

  const [draft, setDraft] = useState<BusinessReportDraft | null>(report ?? null);
  const [profileDraft, setProfileDraft] = useState<BusinessProfileDraft | null>(
    state.setup.confirmedProfile ?? null,
  );
  const [retrying, setRetrying] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  const websiteUrl =
    business?.websiteUrl?.trim() ||
    early?.websiteUrl?.trim() ||
    discovered?.website?.value?.trim();
  const businessName =
    business?.name?.trim() ||
    discovered?.businessName?.value?.trim() ||
    state.workspace.name;
  const logoUrl =
    profileDraft?.logo?.trim() ||
    discovered?.logo?.value?.trim() ||
    discovered?.logoUrl?.trim() ||
    '';

  const running = isDiscoveryRunning(report, discovered, sources);
  const failed = isDiscoveryFailed(report, discovered);
  const progress = useMemo(
    () => computeProgress(sources, discovered, report),
    [sources, discovered, report],
  );

  useEffect(() => {
    setDraft(state.setup.businessReport ?? null);
    setProfileDraft(state.setup.confirmedProfile ?? null);
  }, [state.setup.businessReport, state.setup.confirmedProfile]);

  useEffect(() => {
    setLogoBroken(false);
  }, [logoUrl]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void onRefresh(), 2000);
    return () => clearInterval(timer);
  }, [running, onRefresh]);

  const facts = useMemo(() => {
    const email =
      discovered?.emails?.value?.find((e) => isDisplayEmail(e.trim()))?.trim() ||
      '';
    const phone = discovered?.phones?.value?.[0]?.trim() || '';
    const industry =
      discovered?.industry?.value?.trim() || business?.industry?.trim() || '';
    const description = discovered?.description?.value?.trim() || '';
    const name =
      discovered?.businessName?.value?.trim() || business?.name?.trim() || '';

    return [
      { key: 'name', label: 'שם', value: name },
      { key: 'industry', label: 'תחום', value: industry },
      {
        key: 'website',
        label: 'אתר',
        value: websiteUrl ?? '',
        dir: 'ltr' as const,
      },
      { key: 'phone', label: 'טלפון', value: phone, dir: 'ltr' as const },
      { key: 'email', label: 'אימייל', value: email, dir: 'ltr' as const },
      {
        key: 'description',
        label: 'תיאור',
        value: description,
        wide: true,
      },
    ].filter((f) => f.value);
  }, [discovered, business, websiteUrl]);

  const foundSocials = useMemo(() => {
    const byChannel = new Map<SetupSocialChannel, string>();

    for (const source of sources) {
      if (source.id === 'website') continue;
      if (source.status === 'found' && source.url) {
        byChannel.set(source.id, source.url);
      }
    }
    for (const [id, url] of Object.entries(business?.socials ?? {}) as [
      SetupSocialChannel,
      string,
    ][]) {
      if (url?.trim()) byChannel.set(id, url.trim());
    }
    for (const url of discovered?.socialProfiles?.value ?? []) {
      const id = classifySocialUrl(url);
      if (id) byChannel.set(id, url);
    }

    return (Object.keys(SOCIAL_LABELS) as SetupSocialChannel[])
      .filter((id) => byChannel.has(id))
      .map((id) => ({
        id,
        label: SOCIAL_LABELS[id],
        url: byChannel.get(id)!,
      }));
  }, [business?.socials, discovered?.socialProfiles?.value, sources]);

  function buildProfileDraft(): BusinessProfileDraft {
    const base: BusinessProfileDraft = profileDraft ?? {
      businessName: businessName || '',
      emails: discovered?.emails?.value ?? [],
      phones: discovered?.phones?.value ?? [],
      addresses: discovered?.addresses?.value ?? [],
      socialProfiles: discovered?.socialProfiles?.value ?? [],
      services: discovered?.services?.value ?? [],
      products: discovered?.products?.value ?? [],
      fieldStatus: {},
      website: websiteUrl,
      industry: business?.industry ?? discovered?.industry?.value,
      description: discovered?.description?.value,
      logo: logoUrl || undefined,
    };

    const withName: BusinessProfileDraft = base.businessName.trim()
      ? base
      : { ...base, businessName: businessName || base.businessName };

    if (!withName.logo && logoUrl) {
      return { ...withName, logo: logoUrl };
    }
    return withName;
  }

  async function continueManually() {
    await advance('business_understanding', {
      confirmedProfile: buildProfileDraft(),
      businessReport: draft ? { ...draft, status: 'completed' } : undefined,
    });
  }

  function confirmAndContinue() {
    void advance('business_understanding', {
      businessReport: draft ?? undefined,
      confirmedProfile: buildProfileDraft(),
    });
  }

  if (failed && !running && !draft) {
    return (
      <SetupShell>
        <header className="mb-6 space-y-1 text-start">
          <h1 className="text-2xl font-extrabold tracking-tight">גילוי העסק</h1>
          <p className="text-sm text-muted-foreground">
            לא הצלחנו לנתח את האתר. אפשר לנסות שוב או להמשיך ידנית.
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <SetupSecondaryButton
            disabled={isSubmitting || retrying}
            onClick={() => void goBack('business_understanding')}
          >
            חזרה
          </SetupSecondaryButton>
          <SetupSecondaryButton
            disabled={isSubmitting || retrying}
            onClick={() => void restartDiscovery()}
          >
            חזרה לגילוי
          </SetupSecondaryButton>
          {websiteUrl ? (
            <SetupSecondaryButton
              disabled={isSubmitting || retrying}
              onClick={() => {
                setRetrying(true);
                void retryDiscovery(websiteUrl).finally(() => setRetrying(false));
              }}
            >
              {retrying ? 'מריצים…' : 'נסו שוב'}
            </SetupSecondaryButton>
          ) : null}
        </div>
        <SetupNavButtons
          continueDisabled={isSubmitting || retrying || !businessName.trim()}
          continueLabel={isSubmitting ? 'שומר…' : 'המשך ידנית'}
          onContinue={() => void continueManually()}
          showBack={false}
        />
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </SetupShell>
    );
  }

  return (
    <SetupShell centered={false}>
      <header className="mb-5 flex items-start gap-3 text-start">
        {logoUrl && !logoBroken ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border bg-muted/40 sm:size-16">
            <Image
              src={logoUrl}
              alt={businessName ? `לוגו ${businessName}` : 'לוגו העסק'}
              fill
              unoptimized
              className="object-contain p-1.5"
              onError={() => setLogoBroken(true)}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {running ? 'אוספים נתוני עסק' : 'נתוני העסק'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {running
              ? 'תצוגה ראשונית מהאתר ומהרשתות — מתעדכנת בזמן אמת.'
              : 'סיכום הגילוי הראשוני. אשרו והמשיכו.'}
          </p>
        </div>
      </header>

      <div className="mb-5 space-y-2.5">
        {running ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                {progress.label}
              </span>
              <span className="tabular-nums">{progress.value}%</span>
            </div>
            <Progress
              value={progress.value}
              className="h-1.5"
              dir="ltr"
              aria-label={progress.label}
            />
          </div>
        ) : null}

        {sources.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {sources.map((source) => {
              const Icon = SOURCE_ICONS[source.id];
              return (
                <li
                  key={source.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                    source.status === 'found' &&
                      'border-emerald-200 bg-emerald-50 text-emerald-800',
                    isSourceActive(source.status) &&
                      'border-border bg-muted/60 text-muted-foreground',
                    (source.status === 'not_found' ||
                      source.status === 'failed') &&
                      'border-border/70 text-muted-foreground/80',
                  )}
                >
                  <Icon className="size-3 shrink-0" aria-hidden />
                  <span>{source.label}</span>
                  {isSourceActive(source.status) ? (
                    <Loader2 className="size-2.5 animate-spin" aria-hidden />
                  ) : source.status === 'found' ? (
                    <Check className="size-2.5 shrink-0" aria-hidden />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {running ? (
        <CompactSkeleton />
      ) : (
        <div className="space-y-4 text-start">
          {facts.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map((field) => (
                <div
                  key={field.key}
                  className={cn(
                    'min-w-0 space-y-0.5',
                    field.wide && 'sm:col-span-2',
                  )}
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd
                    className={cn(
                      'text-sm text-foreground',
                      field.wide && 'leading-relaxed text-muted-foreground',
                    )}
                    dir={'dir' in field ? field.dir : undefined}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              לא נמצאו נתונים ראשוניים עדיין.
            </p>
          )}

          <div className="space-y-2 border-t border-border/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              נוכחות דיגיטלית
            </p>
            {foundSocials.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {foundSocials.map((row) => {
                  const Icon = SOCIAL_ICONS[row.id];
                  return (
                    <li key={row.id}>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        title={row.url}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {row.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">לא נמצאו רשתות</p>
            )}
          </div>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <SetupNavButtons
        continueDisabled={isSubmitting || running}
        continueLabel={
          isSubmitting ? 'שומר…' : running ? 'אוספים…' : 'מאשרים וממשיכים'
        }
        continueIcon={running ? Loader2 : undefined}
        continueIconClassName={running ? 'animate-spin' : undefined}
        onContinue={confirmAndContinue}
        onBack={() => void goBack('business_understanding')}
        backDisabled={isSubmitting}
      />
    </SetupShell>
  );
}

function CompactSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-full max-w-[11rem]" />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 max-w-md" />
        </div>
      </div>
      <div className="space-y-2 border-t border-border/70 pt-3">
        <Skeleton className="h-2.5 w-24" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
