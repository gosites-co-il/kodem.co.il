'use client';

import { useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { SetupHeadline, SetupShell } from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function PreparationScreen({ state, onRefresh }: SetupScreenProps) {
  const started = useRef(false);
  const tasks = state.setup.preparationTasks ?? [];
  const step = state.step;

  useEffect(() => {
    if (started.current) return;
    if (step !== 'preparation') return;
    started.current = true;

    void api.runSetupPreparation().then(() => onRefresh());
  }, [onRefresh, step]);

  useEffect(() => {
    if (step !== 'preparation') return;
    const timer = setInterval(() => void onRefresh(), 800);
    return () => clearInterval(timer);
  }, [step, onRefresh]);

  return (
    <SetupShell>
      <SetupHeadline
        title="מכינים את סביבת העבודה"
        subtitle="Kodem כבר עובד בשבילך."
      />

      <ul className="space-y-3">
        {(tasks.length > 0
          ? tasks
          : [
              { id: '1', label: 'יוצרים סביבת עבודה', status: 'running' as const },
            ]
        ).map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-sm"
          >
            {task.status === 'completed' ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : task.status === 'running' ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
            ) : (
              <span className="size-4 rounded-full border" aria-hidden />
            )}
            <span
              className={
                task.status === 'pending' ? 'text-muted-foreground' : undefined
              }
            >
              {task.label}
            </span>
          </li>
        ))}
      </ul>
    </SetupShell>
  );
}
