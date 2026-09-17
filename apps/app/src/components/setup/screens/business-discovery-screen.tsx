'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type {
  EarlyDiscoverySource,
  SetupSocialChannel,
} from '@kodem/contracts';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import { cn } from '@kodem/design-system/lib/utils';
import { api } from '../../../lib/api';
import {
  SetupHeadline,
  SetupNavButtons,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';
import { SOCIAL_ICONS } from '../social-icons';

const SOCIAL_FIELDS: {
  id: SetupSocialChannel;
  label: string;
  placeholder: string;
}[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/your-page',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/your-handle',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@your-handle',
  },
  {
    id: 'google_business',
    label: 'Google Business',
    placeholder: 'https://maps.google.com/...',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/...',
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    placeholder: 'https://x.com/your-handle',
  },
];

type SocialValues = Partial<Record<SetupSocialChannel, string>>;

function normalizeComparableUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '') || '';
    return `${host}${path}`;
  } catch {
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');
  }
}

/** Registrable host for comparing email-seeded vs typed website domains. */
function extractHostname(url: string): string | null {
  try {
    let candidate = url.trim();
    if (!candidate) return null;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    return new URL(candidate).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function domainsMatch(a: string, b: string): boolean {
  const hostA = extractHostname(a);
  const hostB = extractHostname(b);
  if (hostA && hostB) return hostA === hostB;
  return normalizeComparableUrl(a) === normalizeComparableUrl(b);
}

function isSourceActive(status: EarlyDiscoverySource['status']): boolean {
  return status === 'pending' || status === 'running';
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

function FieldHint({
  source,
}: {
  source?: EarlyDiscoverySource;
}) {
  if (!source) return null;

  if (source.status === 'found') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
        <Check className="size-3" aria-hidden />
        נמצא
      </span>
    );
  }

  if (isSourceActive(source.status)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        מחפש…
      </span>
    );
  }

  if (source.status === 'not_found' || source.status === 'failed') {
    return (
      <span className="text-xs text-muted-foreground">לא נמצא — אפשר להוסיף ידנית</span>
    );
  }

  return null;
}

export function BusinessDiscoveryScreen({
  state,
  advance,
  isSubmitting,
  error,
  onRefresh,
  goBack,
}: SetupScreenProps) {
  const early = state.setup.earlyDiscovery;
  const business = state.setup.business;
  const discovered = state.setup.discovered;
  const profile = state.setup.confirmedProfile;

  const [name, setName] = useState(business?.name ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(
    business?.websiteUrl ?? early?.websiteUrl ?? '',
  );
  const [socials, setSocials] = useState<SocialValues>(
    () => business?.socials ?? {},
  );
  const editedFields = useRef(new Set<string>());
  const lastKickedDomainRef = useRef<string | null>(null);
  const [rediscovering, setRediscovering] = useState(false);

  const earlySources = early?.sources ?? [];
  const websiteSource = earlySources.find((s) => s.id === 'website');
  const sourceById = Object.fromEntries(
    earlySources.map((s) => [s.id, s]),
  ) as Partial<Record<EarlyDiscoverySource['id'], EarlyDiscoverySource>>;

  const sameDomainAsEarly =
    !!early?.websiteUrl &&
    !!websiteUrl.trim() &&
    domainsMatch(early.websiteUrl, websiteUrl);

  const waitingForWebsite =
    (!!early &&
      !!websiteSource &&
      isSourceActive(websiteSource.status) &&
      sameDomainAsEarly) ||
    rediscovering;

  const backgroundStillRunning =
    discovered?.status === 'running' ||
    earlySources.some((s) => isSourceActive(s.status)) ||
    rediscovering;

  // Prefill name / website from discovery without clobbering edits.
  useEffect(() => {
    if (!sameDomainAsEarly) return;
    if (!editedFields.current.has('name')) {
      const next =
        business?.name?.trim() ||
        discovered?.businessName?.value?.trim() ||
        profile?.businessName?.trim();
      if (next) setName(next);
    }
  }, [
    business?.name,
    discovered?.businessName?.value,
    profile?.businessName,
    sameDomainAsEarly,
  ]);

  useEffect(() => {
    if (!editedFields.current.has('website')) {
      const next =
        business?.websiteUrl?.trim() ||
        early?.websiteUrl?.trim() ||
        websiteSource?.url?.trim();
      if (next) setWebsiteUrl(next);
    }
  }, [business?.websiteUrl, early?.websiteUrl, websiteSource?.url]);

  // Prefill socials from earlyDiscovery + discovered profiles (same domain only).
  useEffect(() => {
    if (!sameDomainAsEarly) return;

    setSocials((prev) => {
      const next: SocialValues = { ...prev };
      let changed = false;

      for (const field of SOCIAL_FIELDS) {
        if (editedFields.current.has(field.id)) continue;

        const fromBusiness = business?.socials?.[field.id]?.trim();
        const source = early?.sources?.find((s) => s.id === field.id);
        const fromSource =
          source?.status === 'found' ? source.url?.trim() : undefined;
        const candidate = fromBusiness || fromSource;
        if (candidate && next[field.id] !== candidate) {
          next[field.id] = candidate;
          changed = true;
        }
      }

      for (const url of discovered?.socialProfiles?.value ?? []) {
        const channel = classifySocialUrl(url);
        if (!channel || editedFields.current.has(channel)) continue;
        if (!next[channel]?.trim()) {
          next[channel] = url;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [
    business?.socials,
    early?.sources,
    discovered?.socialProfiles?.value,
    sameDomainAsEarly,
  ]);

  useEffect(() => {
    if (sameDomainAsEarly) setRediscovering(false);
  }, [sameDomainAsEarly]);

  // Kick discovery for a new URL, or restart when the domain differs from
  // the email-seeded early discovery.
  useEffect(() => {
    const url = websiteUrl.trim();
    if (!url || url.length < 4) return;

    const host = extractHostname(url);
    if (!host) return;

    if (sameDomainAsEarly) {
      lastKickedDomainRef.current = host;
      return;
    }

    if (lastKickedDomainRef.current === host) return;

    const timer = setTimeout(() => {
      lastKickedDomainRef.current = host;
      setRediscovering(true);

      // Drop business name / socials from the previous domain unless edited.
      if (!editedFields.current.has('name')) {
        setName('');
      }
      setSocials((prev) => {
        const next: SocialValues = { ...prev };
        let changed = false;
        for (const field of SOCIAL_FIELDS) {
          if (editedFields.current.has(field.id)) continue;
          if (next[field.id]) {
            delete next[field.id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });

      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      void api
        .discoverWebsite(normalized)
        .then(() => onRefresh?.())
        .catch(() => {
          lastKickedDomainRef.current = null;
          setRediscovering(false);
        });
    }, 700);

    return () => clearTimeout(timer);
  }, [websiteUrl, sameDomainAsEarly, onRefresh]);

  useEffect(() => {
    if (!backgroundStillRunning && !waitingForWebsite) return;

    const timer = setInterval(() => {
      void onRefresh?.();
    }, 1500);

    return () => clearInterval(timer);
  }, [backgroundStillRunning, waitingForWebsite, onRefresh]);

  function markEdited(field: string) {
    editedFields.current.add(field);
  }

  function setSocial(id: SetupSocialChannel, value: string) {
    markEdited(id);
    setSocials((prev) => ({ ...prev, [id]: value }));
  }

  if (waitingForWebsite) {
    return (
      <SetupShell centered={false}>
        <SetupHeadline
          title={rediscovering ? 'מעדכנים לפי האתר החדש' : 'מזהים את האתר שלכם'}
          subtitle={
            rediscovering
              ? 'אוספים מחדש פרטי עסק ורשתות לפי הדומיין שעודכן.'
              : 'ברגע שהאתר מוכן נציג את פרטי העסק — שאר המקורות ימשיכו ברקע.'
          }
        />
        <DiscoveryFormSkeleton websiteUrl={websiteUrl.trim() || early?.websiteUrl} />
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        <SetupNavButtons
          continueDisabled
          continueLabel={rediscovering ? 'מעדכנים…' : 'מזהים…'}
          continueIcon={Loader2}
          continueIconClassName="animate-spin"
          onContinue={() => undefined}
          onBack={() => void goBack('business_discovery')}
          backDisabled={isSubmitting}
        />
      </SetupShell>
    );
  }

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="פרטי העסק"
        subtitle={
          backgroundStillRunning
            ? 'בדקו והשלימו את הפרטים — ממשיכים לגלות מקורות ברקע.'
            : 'בדקו את הפרטים שנמצאו, השלימו מה שחסר, והמשיכו.'
        }
      />

      <div className="space-y-5 text-start">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="business-name">שם העסק</Label>
            <FieldHint source={websiteSource} />
          </div>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => {
              markEdited('name');
              setName(e.target.value);
            }}
            placeholder="לדוגמה: קודם בע״מ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">אתר</Label>
          <Input
            id="website"
            dir="ltr"
            className="text-start"
            value={websiteUrl}
            onChange={(e) => {
              markEdited('website');
              lastKickedDomainRef.current = null;
              setWebsiteUrl(e.target.value);
            }}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">נוכחות דיגיטלית</p>
            {backgroundStillRunning ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                ממשיכים לחפש
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            {SOCIAL_FIELDS.map((field) => {
              const source = sourceById[field.id];
              const Icon = SOCIAL_ICONS[field.id];
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`social-${field.id}`}>{field.label}</Label>
                    <FieldHint source={source} />
                  </div>
                  <div
                    dir="ltr"
                    className={cn(
                      'flex items-stretch overflow-hidden rounded-lg border border-input bg-background',
                      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    )}
                  >
                    <span className="flex shrink-0 items-center border-e border-input bg-muted/40 px-3 text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <Input
                      id={`social-${field.id}`}
                      dir="ltr"
                      className="rounded-none border-0 text-start shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={socials[field.id] ?? ''}
                      onChange={(e) => setSocial(field.id, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <SetupNavButtons
          continueDisabled={isSubmitting || !name.trim()}
          continueLabel={isSubmitting ? 'שומר…' : 'המשך'}
          onContinue={() => {
            const cleanedSocials = Object.fromEntries(
              SOCIAL_FIELDS.map((field) => [
                field.id,
                (socials[field.id] ?? '').trim(),
              ]).filter(([, value]) => value),
            ) as SocialValues;

            void advance('business_discovery', {
              business: {
                name: name.trim(),
                websiteUrl: websiteUrl.trim(),
                socials: cleanedSocials,
              },
            });
          }}
          onBack={() => void goBack('business_discovery')}
          backDisabled={isSubmitting}
        />
      </div>
    </SetupShell>
  );
}

function DiscoveryFormSkeleton({ websiteUrl }: { websiteUrl?: string }) {
  return (
    <div className="space-y-5 text-start" aria-busy aria-live="polite">
      {websiteUrl ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          <span dir="ltr" className="min-w-0 truncate">
            {websiteUrl}
          </span>
        </p>
      ) : null}

      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {SOCIAL_FIELDS.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <div className="flex items-stretch overflow-hidden rounded-lg border border-input">
              <span className="flex shrink-0 items-center border-e border-input bg-muted/40 px-3">
                <Skeleton className="size-4 rounded-sm" />
              </span>
              <Skeleton className="h-10 flex-1 rounded-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
