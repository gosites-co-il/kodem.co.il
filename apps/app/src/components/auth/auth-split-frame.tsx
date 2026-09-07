import type { ReactNode } from 'react';
import { AuthFooter } from './auth-footer';
import { AuthVisualPanel } from './auth-visual-panel';

/** Shared split-card chrome for login and signup surfaces. */
export function AuthSplitFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="auth-canvas-gradient pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="auth-dot-grid pointer-events-none absolute inset-0 opacity-60"
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
            {children}
          </div>
          <div className="border-t border-border/60 lg:border-s lg:border-t-0">
            <AuthVisualPanel />
          </div>
        </div>
      </main>

      <div className="relative z-10 pb-8">
        <AuthFooter />
      </div>
    </div>
  );
}
