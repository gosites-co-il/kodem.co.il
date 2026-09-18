'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { cn } from '@kodem/design-system/lib/utils';

export function CrmLoading({ label = 'טוען...' }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function CrmError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          נסו שוב
        </Button>
      ) : null}
    </div>
  );
}

export function CrmEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed px-4 py-8">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CrmStatusBadge({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'muted' | 'primary' | 'secondary' | 'success';
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 font-medium',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        tone === 'primary' &&
          'border-primary/20 bg-primary/10 text-primary',
        tone === 'secondary' &&
          'border-secondary/20 bg-secondary/10 text-secondary',
        tone === 'success' &&
          'border-secondary/30 bg-secondary/10 text-secondary',
      )}
    >
      {children}
    </Badge>
  );
}

export function CrmListRow({
  href,
  title,
  subtitle,
  meta,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-medium">{title}</p>
        {subtitle ? (
          <p className="truncate text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </Link>
  );
}

export function CrmSubmitButton({
  saving,
  idleLabel,
  savingLabel = 'שומר...',
  disabled,
  className,
}: {
  saving: boolean;
  idleLabel: string;
  savingLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || saving}
      className={className}
      aria-busy={saving}
    >
      {saving ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {savingLabel}
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
