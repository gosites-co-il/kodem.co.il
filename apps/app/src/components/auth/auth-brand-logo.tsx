import Link from 'next/link';
import { ROUTES } from '../../lib/constants';

/** Compact brand mark + wordmark for auth surfaces. */
export function AuthBrandLogo({ href = ROUTES.login }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-foreground"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <KodemGlyph className="size-4" />
      </span>
      <span>Kodem</span>
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
