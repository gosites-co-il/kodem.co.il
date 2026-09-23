import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@kodem/design-system/lib/utils';
import { AuthBrandLogo } from './auth-brand-logo';
import { AuthVisualPanel } from './auth-visual-panel';

/**
 * Signup10-style chrome: form column + full-height visual on large screens.
 * Image column hides on small screens; form stays centered.
 */
export function AuthSplitFrame({
  children,
  marketingReturnHref,
  onMarketingReturn,
}: {
  children: ReactNode;
  /** Optional exit back to marketing (shown under the logo). */
  marketingReturnHref?: string | null;
  onMarketingReturn?: () => void;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <AuthBrandLogo />
          {marketingReturnHref ? (
            <a
              href={marketingReturnHref}
              onClick={onMarketingReturn}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-medium',
                'text-muted-foreground transition-colors hover:text-foreground',
              )}
            >
              <ArrowRight className="size-3.5" aria-hidden />
              חזרה לאתר
            </a>
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <AuthVisualPanel />
    </div>
  );
}
