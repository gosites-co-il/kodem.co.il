'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { ArrowLeft, RotateCcw, type LucideIcon } from 'lucide-react';
import { cn } from '@kodem/design-system/lib/utils';

type StartOverContextValue = {
  onStartOver?: () => void;
  disabled?: boolean;
};

const SetupStartOverContext = createContext<StartOverContextValue>({});

export function SetupStartOverProvider({
  onStartOver,
  disabled,
  children,
}: StartOverContextValue & { children: ReactNode }) {
  return (
    <SetupStartOverContext.Provider value={{ onStartOver, disabled }}>
      {children}
    </SetupStartOverContext.Provider>
  );
}

export function SetupStartOverButton({ className }: { className?: string }) {
  const { onStartOver, disabled } = useContext(SetupStartOverContext);
  if (!onStartOver) return null;

  return (
    <button
      type="button"
      onClick={onStartOver}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5',
        'text-xs font-medium text-muted-foreground',
        'transition-colors hover:bg-muted hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <RotateCcw className="size-3.5" aria-hidden />
      התחל מחדש
    </button>
  );
}

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
  compact,
}: {
  title: string;
  subtitle?: string;
  /** Tighter title block for dense Operate steps (e.g. discovery). */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'text-start',
        compact ? 'mb-5 space-y-1.5' : 'mb-8 space-y-2',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h1
          className={cn(
            'min-w-0 font-extrabold leading-tight tracking-tight',
            compact
              ? 'text-2xl sm:text-3xl'
              : 'text-3xl sm:text-4xl',
          )}
        >
          {title}
        </h1>
        <SetupStartOverButton className="mt-1.5" />
      </div>
      {subtitle ? (
        <p
          className={cn(
            'text-muted-foreground',
            compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function SetupPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button',
  className,
  icon: Icon,
  iconClassName,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 w-auto min-w-32 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <span>{children}</span>
      {Icon ? (
        <Icon className={cn('size-4 shrink-0', iconClassName)} aria-hidden />
      ) : null}
    </button>
  );
}

export function SetupSecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 w-auto min-w-28 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Shared wizard footer: primary (+ optional secondary) on the left, back on the right. */
export function SetupNavButtons({
  onContinue,
  onBack,
  continueLabel = 'המשך',
  backLabel = 'חזרה',
  continueDisabled,
  backDisabled,
  showBack = true,
  continueIcon = ArrowLeft,
  continueIconClassName,
  secondary,
  className,
}: {
  onContinue: () => void;
  onBack?: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  backDisabled?: boolean;
  showBack?: boolean;
  continueIcon?: LucideIcon;
  continueIconClassName?: string;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <div
      dir="ltr"
      className={cn(
        'mt-auto flex flex-wrap items-center justify-between gap-4 pt-8',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <SetupPrimaryButton
          disabled={continueDisabled}
          onClick={onContinue}
          icon={continueIcon}
          iconClassName={continueIconClassName}
        >
          {continueLabel}
        </SetupPrimaryButton>
        {secondary}
      </div>
      {showBack && onBack ? (
        <button
          type="button"
          disabled={backDisabled}
          onClick={onBack}
          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          {backLabel}
        </button>
      ) : null}
    </div>
  );
}
