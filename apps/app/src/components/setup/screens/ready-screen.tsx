'use client';

import { Check, Loader2 } from 'lucide-react';
import {
  SetupHeadline,
  SetupPrimaryButton,
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

const BACKGROUND_TASKS = [
  'סריקת אתר',
  'ניתוח עסקי',
  'מנוע המלצות',
];

export function ReadyScreen({
  isSubmitting,
  error,
  onComplete,
}: SetupScreenProps & { onComplete: () => void }) {
  return (
    <SetupShell>
      <SetupHeadline
        title="🎉 העסק שלך מוכן."
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

        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            ממשיך ברקע
          </p>
          <ul className="space-y-2">
            {BACKGROUND_TASKS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <SetupPrimaryButton disabled={isSubmitting} onClick={onComplete}>
        {isSubmitting ? 'נכנסים…' : 'כניסה לסביבת העבודה'}
      </SetupPrimaryButton>
    </SetupShell>
  );
}
