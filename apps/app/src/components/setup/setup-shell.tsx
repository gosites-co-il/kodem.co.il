'use client';

import type { ReactNode } from 'react';
import { cn } from '@kodem/design-system/lib/utils';

export function SetupShell({
  children,
  className,
  centered = true,
}: {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="auth-canvas-gradient pointer-events-none absolute inset-0"
      />
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-lg px-4 py-12 sm:py-16',
          centered && 'flex min-h-screen flex-col justify-center',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SetupHeadline({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 space-y-3 text-center">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function SetupPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SetupSecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}
