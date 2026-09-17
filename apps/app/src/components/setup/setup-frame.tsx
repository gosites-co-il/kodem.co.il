'use client';

import type { ReactNode } from 'react';
import { cn } from '@kodem/design-system/lib/utils';
import { AuthBrandLogo } from '../auth/auth-brand-logo';
import { SetupStepper, type SetupStepperStep } from './setup-stepper';

/**
 * A’s end-dock sheet (~5/8) + C’s brand panel (~3/8).
 * RTL: brand on start (right), sheet docked on end (left).
 */
export function SetupFrame({
  children,
  steps,
  activeStepId,
  brandTitle = 'בונים את סביבת העבודה',
  brandSubtitle = 'שם העסק, שם הסביבה, וכתובת ייחודית — ואפשר להמשיך.',
  className,
}: {
  children: ReactNode;
  steps: readonly SetupStepperStep[];
  activeStepId: string;
  brandTitle?: string;
  brandSubtitle?: string;
  className?: string;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        'relative flex min-h-screen w-full flex-col bg-muted/40 lg:flex-row',
        className,
      )}
    >
      {/* Brand first → RTL start (right) */}
      <aside
        className={cn(
          'relative flex w-full flex-col justify-between overflow-hidden',
          'bg-primary px-6 py-8 text-primary-foreground',
          'lg:w-[37.5%] lg:min-h-screen lg:px-10 lg:py-12',
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, color-mix(in oklab, #73D2DE 35%, transparent), transparent 55%), radial-gradient(ellipse at 80% 80%, color-mix(in oklab, #8F2D56 55%, transparent), transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <AuthBrandLogo href={null} inverted />
        </div>
        <div className="relative z-10 mt-8 space-y-3 lg:mt-0 lg:max-w-sm">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {brandTitle}
          </h2>
          <p className="text-base text-primary-foreground/85 sm:text-lg">
            {brandSubtitle}
          </p>
        </div>
        <p className="relative z-10 mt-8 text-xs text-primary-foreground/70 lg:mt-0">
          kodem.co.il
        </p>
      </aside>

      {/* Sheet second → RTL end (left), docked against brand */}
      <section
        className={cn(
          'relative z-10 flex w-full flex-1 flex-col bg-card',
          'min-h-[70vh] shadow-xl',
          'lg:w-[62.5%] lg:min-h-screen lg:rounded-s-[2rem]',
          'lg:shadow-[24px_0_60px_rgba(11,17,30,0.18)]',
        )}
      >
        <div className="border-b border-border px-5 py-4 sm:px-8">
          <SetupStepper steps={steps} activeStepId={activeStepId} />
        </div>
        <div className="flex flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
