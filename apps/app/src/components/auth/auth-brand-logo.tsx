import Link from 'next/link';
import { cn } from '@kodem/design-system/lib/utils';
import { ROUTES } from '../../lib/constants';

/** Compact brand mark + wordmark for auth / setup surfaces. */
export function AuthBrandLogo({
  href = ROUTES.login,
  inverted = false,
}: {
  href?: string | null;
  inverted?: boolean;
}) {
  const className = cn(
    'inline-flex items-center gap-2 font-semibold tracking-tight',
    inverted ? 'text-primary-foreground' : 'text-foreground',
  );

  const mark = (
    <>
      <span
        className={cn(
          'flex size-8 items-center justify-center rounded-md',
          inverted
            ? 'bg-primary-foreground/15 text-primary-foreground'
            : 'bg-primary text-primary-foreground',
        )}
      >
        <KodemGlyph className="size-4" />
      </span>
      <span>Kodem</span>
    </>
  );

  if (href === null) {
    return <span className={className}>{mark}</span>;
  }

  return (
    <Link href={href} className={className}>
      {mark}
    </Link>
  );
}

function KodemGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M4 16.5 L12 20.5 L20 16.5 V7.5 L12 3.5 L4 7.5 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 3.5 V20.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M4 7.5 L12 11.5 L20 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
