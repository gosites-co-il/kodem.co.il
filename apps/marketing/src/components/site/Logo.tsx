import { cn } from '@kodem/design-system/lib/utils';
import { SITE_CONFIG } from '../../lib/site-config';

type Props = {
  className?: string;
  markOnly?: boolean;
};

export function Logo({ className, markOnly }: Props) {
  return (
    <a
      href="/"
      className={cn(
        'group inline-flex items-center gap-2.5 text-foreground',
        className,
      )}
      aria-label={`${SITE_CONFIG.name} — דף הבית`}
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[hsl(var(--surface-dark))] shadow-soft ring-1 ring-white/10">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(199_89%_48%/0.55),transparent_55%)]" />
        <span className="relative text-sm font-extrabold tracking-tight text-white">
          K
        </span>
      </span>
      {markOnly ? null : (
        <span className="text-lg font-extrabold tracking-tight transition-colors group-hover:text-cta">
          {SITE_CONFIG.name}
        </span>
      )}
    </a>
  );
}
