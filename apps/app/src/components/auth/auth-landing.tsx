'use client';

import { Separator } from '@kodem/design-system/components/ui/separator';
import { MotionProvider, m } from '../../lib/auth/motion-provider';
import { fadeUp, usePrefersReducedMotion } from '../../lib/auth/motion';
import { AuthFooter } from './auth-footer';
import { AuthHero } from './auth-hero';
import { EmailContinueButton } from './email-continue-button';
import { OAuthButtons } from './oauth-buttons';

function AuthLandingContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="auth-canvas-gradient pointer-events-none absolute inset-0"
      />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="flex w-full max-w-sm flex-col items-center">
          <m.div
            className="mb-16 w-full sm:mb-20"
            initial={prefersReducedMotion ? false : fadeUp.hidden}
            animate={prefersReducedMotion ? undefined : fadeUp.visible}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <AuthHero />
          </m.div>

          <div className="w-full space-y-5">
            <OAuthButtons />

            <div className="relative py-1">
              <Separator />
              <span className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                או
              </span>
            </div>

            <EmailContinueButton />
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-10 pt-4">
        <AuthFooter />
      </footer>
    </div>
  );
}

export function AuthLanding() {
  return (
    <MotionProvider>
      <AuthLandingContent />
    </MotionProvider>
  );
}
