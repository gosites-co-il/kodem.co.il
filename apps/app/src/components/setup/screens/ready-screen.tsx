'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Skeleton } from '@kodem/design-system/components/ui/skeleton';
import {
  SetupHeadline,
  SetupNavButtons,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

const READY_ITEMS = [
  'פרופיל עסק מאושר',
  'סביבת עבודה מוכנה',
  'CRM מוכן',
  'בסיס ידע מחובר לפרופיל',
  'AI מוגדר',
];

function ReadyCalculatingSkeleton() {
  return (
    <div className="space-y-6 text-start" aria-busy aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-40 max-w-[70%]" />
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 max-w-[60%]" />
          </div>
        ))}
      </div>

      <Skeleton className="h-11 w-32 rounded-xl" />
    </div>
  );
}

export function ReadyScreen({
  isSubmitting,
  error,
  onComplete,
  goBack,
  onRefresh,
}: SetupScreenProps & { onComplete: () => void }) {
  const [calculating, setCalculating] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await onRefresh?.();
      } finally {
        // Brief settle so skeleton is visible while final prefs land.
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (!cancelled) setCalculating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onRefresh]);

  const showSkeleton = calculating || isSubmitting;

  if (showSkeleton) {
    return (
      <SetupShell>
        <SetupHeadline
          title="מתחילים לעבוד"
          subtitle={
            isSubmitting
              ? 'מכינים את הכניסה לסביבת העבודה…'
              : 'מחשבים את ההגדרות האחרונות…'
          }
        />
        <ReadyCalculatingSkeleton />
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </SetupShell>
    );
  }

  return (
    <SetupShell>
      <SetupHeadline
        title="מתחילים לעבוד"
        subtitle="הכול מוכן. אפשר להיכנס לסביבת העבודה."
      />

      <div className="mb-8 space-y-6">
        <ul className="space-y-2">
          {READY_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm">
              <Check className="size-4 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <SetupNavButtons
        continueDisabled={isSubmitting}
        continueLabel={isSubmitting ? 'נכנסים…' : 'כניסה לסביבת העבודה'}
        onContinue={onComplete}
        onBack={() => void goBack('ready')}
        backDisabled={isSubmitting}
      />
    </SetupShell>
  );
}
