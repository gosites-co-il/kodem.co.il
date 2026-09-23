import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { cn } from '@kodem/design-system/lib/utils';
import { SITE_CONFIG } from '../../lib/site-config';

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
  return target.toString();
}

/** Reusable business-link connect pill + optional proof row. */
export function BusinessLinkConnect({
  active = true,
  className,
  showProofs = true,
  proofs = DEFAULT_PROOFS,
  ctaLabel = 'קודם נתחבר',
  hint = 'הדבק לינק לאתר, לאינסטגרם או לפייסבוק של העסק',
  placeholder = 'instagram.com/העסק-שלך',
}: Props) {
  const [url, setUrl] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    window.location.assign(buildDiscoveryUrl(url));
  }

  return (
    <div className={cn('w-full max-w-xl', className)}>
      <form onSubmit={onSubmit} aria-label="התחברות עם לינק לעסק">
        <p className="mb-2 text-sm text-muted-foreground">{hint}</p>
        <div className="flex flex-col gap-2 rounded-full border border-border bg-card p-1.5 shadow-card sm:flex-row sm:items-center">
          <Input
            type="text"
            name="websiteUrl"
            inputMode="url"
            autoComplete="url"
            placeholder={placeholder}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            tabIndex={active ? 0 : -1}
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:flex-1"
            dir="ltr"
          />
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
        <ul className="mt-8 flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6">
          {proofs.map((label) => (
            <li key={label} className="inline-flex items-center gap-2">
              <Check className="size-4 shrink-0 text-cta" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
