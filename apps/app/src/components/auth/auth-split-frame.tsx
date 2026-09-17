import type { ReactNode } from 'react';
import { AuthBrandLogo } from './auth-brand-logo';
import { AuthVisualPanel } from './auth-visual-panel';

/**
 * Signup10-style chrome: form column + full-height visual on large screens.
 * Image column hides on small screens; form stays centered.
 */
export function AuthSplitFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <AuthBrandLogo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <AuthVisualPanel />
    </div>
  );
}
