import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const statusVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        online:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        offline:
          'border-border bg-muted text-muted-foreground',
        degraded:
          'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        maintenance:
          'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        error:
          'border-destructive/30 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      status: 'offline',
    },
  },
);

const statusDotVariants = cva('size-1.5 shrink-0 rounded-full', {
  variants: {
    status: {
      online: 'bg-emerald-500',
      offline: 'bg-muted-foreground/50',
      degraded: 'bg-amber-500',
      maintenance: 'bg-sky-500',
      error: 'bg-destructive',
    },
  },
  defaultVariants: {
    status: 'offline',
  },
});

export type StatusVariant = NonNullable<
  VariantProps<typeof statusVariants>['status']
>;

const DEFAULT_LABELS: Record<StatusVariant, string> = {
  online: 'פעיל',
  offline: 'לא פעיל',
  degraded: 'מוגבל',
  maintenance: 'תחזוקה',
  error: 'שגיאה',
};

export interface StatusProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {
  label?: React.ReactNode;
}

function Status({
  className,
  status = 'offline',
  label,
  ...props
}: StatusProps) {
  const variant = status ?? 'offline';
  return (
    <span
      data-slot="status"
      className={cn(statusVariants({ status: variant }), className)}
      {...props}
    >
      <span
        data-slot="status-indicator"
        className={cn(statusDotVariants({ status: variant }))}
        aria-hidden
      />
      <span data-slot="status-label">
        {label ?? DEFAULT_LABELS[variant]}
      </span>
    </span>
  );
}

export { Status, statusVariants };
