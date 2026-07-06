import Link from 'next/link';
import { AUTH_HERO_TITLE } from '../../lib/auth/subtitles';
import { DynamicSubtitle } from './dynamic-subtitle';

export function AuthHero() {
  return (
    <div className="space-y-6 text-center">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity hover:opacity-80"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          K
        </span>
        Kodem
      </Link>

      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {AUTH_HERO_TITLE}
        </h1>
        <DynamicSubtitle />
      </div>
    </div>
  );
}
