'use client';

import { cn } from '@kodem/design-system/lib/utils';

export type SetupStepperStep = {
  id: string;
  label: string;
};

export function SetupStepper({
  steps,
  activeStepId,
}: {
  steps: readonly SetupStepperStep[];
  activeStepId: string;
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStepId),
  );

  return (
    <nav aria-label="שלבי הגדרה" className="w-full">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors duration-300',
                  done || active ? 'bg-primary' : 'bg-muted',
                )}
              />
              <span
                className={cn(
                  'truncate text-xs font-semibold',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
