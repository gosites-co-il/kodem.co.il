'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import {
  SetupHeadline,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

const CREATION_STEPS = [
  'יוצרים את סביבת העבודה',
  'מגדירים הרשאות ובעלות',
  'שומרים את פרופיל העסק',
  'מפעילים מודולים ברירת מחדל',
  'מכינים תצורת AI',
];

export function WorkspaceCreationScreen({
  advance,
  onRefresh,
  isSubmitting,
  error,
}: SetupScreenProps) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      await advance('workspace_creation');
      await onRefresh();
    })();
  }, [advance, onRefresh]);

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="בונים את סביבת העבודה"
        subtitle="מבוסס על פרופיל העסק שאישרתם."
      />

      <ul className="space-y-3">
        {CREATION_STEPS.map((label) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
          >
            <Loader2
              className="size-4 shrink-0 animate-spin text-primary"
              aria-hidden
            />
            {label}
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {isSubmitting ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          מסיימים…
        </p>
      ) : null}
    </SetupShell>
  );
}
