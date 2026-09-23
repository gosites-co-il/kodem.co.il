import { useMemo, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { cn } from '@kodem/design-system/lib/utils';
import { SITE_CONFIG } from '../../lib/site-config';
import { detectNetwork, NETWORK_LABELS } from '../../lib/detect-network';
import { NetworkIcon } from './NetworkIcon';

const DEFAULT_PROOFS = [
  'בלי כרטיס אשראי להתחלה',
  'בלי ידע טכני',
  'הקמה מלווה תוך 30 דקות',
] as const;

type Props = {
  /** When false, disable interactive controls (e.g. off-screen carousel slide). */
  active?: boolean;
  className?: string;
  /** Hide the proof checklist under the form. */
  showProofs?: boolean;
  proofs?: readonly string[];
  ctaLabel?: string;
  hint?: string;
  placeholder?: string;
  /** Lighter secondary text when the form sits on a dark section. */
  onDark?: boolean;
};

function buildDiscoveryUrl(websiteUrl: string): string {
  const target = new URL(
    `${SITE_CONFIG.appUrl.replace(/\/$/, '')}/setup/business-discovery`,
  );
  const trimmed = websiteUrl.trim();
  if (trimmed) {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    target.searchParams.set('websiteUrl', withScheme);
  }
  // So the app can send the guest back to this marketing page (not only home).
  if (typeof window !== 'undefined') {
    target.searchParams.set('returnTo', window.location.href);
  }
  return target.toString();
}

/** Reusable business-link connect pill + optional proof row. */
export function BusinessLinkConnect({
  active = true,
  className,
  showProofs = true,
  proofs = DEFAULT_PROOFS,
  ctaLabel = 'קודם נתחבר',
  hint = 'הדבק לינק לאתר, לאינסטגרם, לפייסבוק, לטיקטוק או לרשת אחרת',
  placeholder = 'instagram.com/העסק-שלך',
  onDark = false,
}: Props) {
  const [url, setUrl] = useState('');
  const network = useMemo(() => detectNetwork(url), [url]);
  const muted = onDark ? 'text-white/85' : 'text-muted-foreground';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    window.location.assign(buildDiscoveryUrl(trimmed));
  }

  return (
    <div className={cn('w-full max-w-xl', className)}>
      <form onSubmit={onSubmit} aria-label="התחברות עם לינק לעסק">
        <p className={cn('mb-2 text-sm', muted)}>{hint}</p>
        <div className="flex flex-col gap-2 rounded-full border border-border bg-card p-1.5 text-card-foreground shadow-card sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1" dir="ltr">
            <Input
              type="text"
              name="websiteUrl"
              inputMode="url"
              autoComplete="url"
              placeholder={placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              tabIndex={active ? 0 : -1}
              required
              className={cn(
                'h-11 border-0 bg-transparent text-base text-foreground shadow-none',
                'placeholder:text-muted-foreground focus-visible:ring-0',
                network && 'pe-10',
              )}
              aria-describedby={network ? 'business-link-network' : undefined}
            />
            {network ? (
              <span
                id="business-link-network"
                className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 text-foreground"
                title={NETWORK_LABELS[network]}
                aria-label={NETWORK_LABELS[network]}
              >
                <NetworkIcon network={network} />
              </span>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            tabIndex={active ? 0 : -1}
            className="h-11 w-full shrink-0 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90 sm:w-auto"
          >
            {ctaLabel}
          </Button>
        </div>
      </form>

      {showProofs ? (
        <ul
          className={cn(
            'mt-8 flex flex-col items-center gap-3 text-sm sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6',
            muted,
          )}
        >
          {proofs.map((label) => (
            <li key={label} className={cn('inline-flex items-center gap-2', muted)}>
              <Check
                className={cn('size-4 shrink-0', onDark ? 'text-[hsl(var(--spark))]' : 'text-cta')}
                aria-hidden
              />
              <span className={muted}>{label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
