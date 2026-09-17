'use client';

import type { ReactNode } from 'react';
import { cn } from '@kodem/design-system/lib/utils';

/** Content wrapper inside SetupFrame — no full-page chrome. */
export function SetupShell({
  children,
  className,
  centered = false,
}: {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col',
        centered && 'justify-center',
        className,
      )}
    >
      {children}
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
    <div className="mb-8 space-y-2 text-start">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
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
